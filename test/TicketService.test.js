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

  it("returns correct receipt for valid purchase", () => {
    const receipt = service.purchaseTickets(
      1,
      new TicketTypeRequest("ADULT", 2),
      new TicketTypeRequest("CHILD", 1),
      new TicketTypeRequest("INFANT", 1),
    );

    expect(receipt).toEqual({
      totalAmount: 65, // (2 * 25) + (1 * 15)
      totalSeats: 3, // 2 adults + 1 child
      breakdown: { adult: 2, child: 1, infant: 1 },
    });
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
    const receipt = service.purchaseTickets(
      1,
      new TicketTypeRequest("ADULT", 1),
      new TicketTypeRequest("CHILD", 1),
      new TicketTypeRequest("INFANT", 1),
    );

    expect(receipt.totalAmount).toBe(40);
    expect(receipt.totalSeats).toBe(2);
    expect(receipt.breakdown).toEqual({ adult: 1, child: 1, infant: 1 });
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

  it("rejects more infants than adults", () => {
    expect(() =>
      service.purchaseTickets(
        1,
        new TicketTypeRequest("ADULT", 1),
        new TicketTypeRequest("INFANT", 2),
      ),
    ).toThrow();
  });

  it("allows equal number of infants and adults", () => {
    expect(() =>
      service.purchaseTickets(
        1,
        new TicketTypeRequest("ADULT", 2),
        new TicketTypeRequest("INFANT", 2),
      ),
    ).not.toThrow();

    expect(makePaymentMock).toHaveBeenCalledWith(1, 50); // 2 * 25
    expect(reserveSeatMock).toHaveBeenCalledWith(1, 2); // Only 2 adults
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

  it("rejects negative ticket quantity", () => {
    expect(() =>
      service.purchaseTickets(
        1,
        new TicketTypeRequest("ADULT", 3),
        new TicketTypeRequest("INFANT", -2),
      ),
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
