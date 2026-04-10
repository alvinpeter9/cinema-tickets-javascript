import { describe, it, expect, vi, beforeEach } from "vitest";

import TicketService from "../src/pairtest/TicketService.js";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest.js";

// Mock third-party services
const makePaymentMock = vi.fn();
const reserveSeatMock = vi.fn();

vi.mock("../src/thirdparty/paymentgateway/TicketPaymentService.js", () => {
  return {
    default: class TicketPaymentService {
      makePayment = makePaymentMock;
    },
  };
});

vi.mock("../src/thirdparty/seatbooking/SeatReservationService.js", () => {
  return {
    default: class SeatReservationService {
      reserveSeat = reserveSeatMock;
    },
  };
});

describe("TicketService", () => {
  let service;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new TicketService();
  });

  it("processes valid purchase correctly", () => {
    expect(() =>
      service.purchaseTickets(
        1,
        new TicketTypeRequest("ADULT", 2),
        new TicketTypeRequest("CHILD", 1),
      ),
    ).not.toThrow();

    expect(makePaymentMock).toHaveBeenCalled();
    expect(reserveSeatMock).toHaveBeenCalled();
  });

  it("does not allocate seats for infants", () => {
    service.purchaseTickets(
      1,
      new TicketTypeRequest("ADULT", 2),
      new TicketTypeRequest("INFANT", 2),
    );

    expect(reserveSeatMock).toHaveBeenCalledWith(1, 2);
    expect(makePaymentMock).toHaveBeenCalledWith(1, 50);
  });

  it("handles adult + child + infant correctly", () => {
    service.purchaseTickets(
      1,
      new TicketTypeRequest("ADULT", 1),
      new TicketTypeRequest("CHILD", 1),
      new TicketTypeRequest("INFANT", 1),
    );

    // 1 adult + 1 child = 2 seats
    expect(reserveSeatMock).toHaveBeenCalledWith(1, 2);

    // 25 + 15 = 40
    expect(makePaymentMock).toHaveBeenCalledWith(1, 40);
  });

  it("correctly aggregates multiple ticket requests of same type", () => {
    service.purchaseTickets(
      1,
      new TicketTypeRequest("ADULT", 2),
      new TicketTypeRequest("ADULT", 3),
    );

    expect(makePaymentMock).toHaveBeenCalledWith(1, 125); // 5 * 25
  });

  it("allows exactly 25 tickets", () => {
    expect(() =>
      service.purchaseTickets(1, new TicketTypeRequest("ADULT", 25)),
    ).not.toThrow();

    expect(makePaymentMock).toHaveBeenCalledWith(1, 625);
  });

  it("rejects purchase without adult", () => {
    expect(() =>
      service.purchaseTickets(1, new TicketTypeRequest("CHILD", 1)),
    ).toThrow();
  });

  it("rejects more than 25 tickets", () => {
    expect(() =>
      service.purchaseTickets(1, new TicketTypeRequest("ADULT", 26)),
    ).toThrow();
  });

  it("rejects empty ticket request", () => {
    expect(() => service.purchaseTickets(1)).toThrow();
  });

  it("rejects invalid accountId (0)", () => {
    expect(() =>
      service.purchaseTickets(0, new TicketTypeRequest("ADULT", 1)),
    ).toThrow();
  });

  it("rejects negative accountId", () => {
    expect(() =>
      service.purchaseTickets(-5, new TicketTypeRequest("ADULT", 1)),
    ).toThrow();
  });

  it("rejects invalid ticket type", () => {
    expect(() => new TicketTypeRequest("SENIOR", 1)).toThrow();
  });

  it("rejects 26 tickets boundary", () => {
    expect(() =>
      service.purchaseTickets(1, new TicketTypeRequest("ADULT", 26)),
    ).toThrow();
  });

  it("does not call payment or seat service on failure", () => {
    expect(() =>
      service.purchaseTickets(1, new TicketTypeRequest("CHILD", 1)),
    ).toThrow();

    expect(makePaymentMock).not.toHaveBeenCalled();
    expect(reserveSeatMock).not.toHaveBeenCalled();
  });
});
