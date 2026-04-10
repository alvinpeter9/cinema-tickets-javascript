import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";
import { logger } from "./util/logger.js";

export default class TicketService {
  static PRICES = {
    ADULT: 25,
    CHILD: 15,
    INFANT: 0,
  };

  static MAX_TICKETS = 25;

  constructor(
    paymentService = new TicketPaymentService(),
    seatService = new SeatReservationService(),
  ) {
    this.paymentService = paymentService;
    this.seatService = seatService;
  }

  purchaseTickets(accountId, ...ticketTypeRequests) {
    // Step 1: Validate basic input
    if (!ticketTypeRequests || ticketTypeRequests.length === 0) {
      logger.error("No ticket requests provided");
      throw new InvalidPurchaseException("No ticket requests provided");
    }

    // Step 2: Aggregate requests
    const summary = this.#aggregateTicketRequest(ticketTypeRequests);

    // Step 3: Validate business rules
    this.#validateBookingDetails(accountId, summary);

    // Step 4: Calculate totals
    const totalAmount = this.#calculateAmount(summary);
    const totalSeats = this.#calculateSeats(summary);

    // Step 5: External services (make payment and reserve seats)
    try {
      logger.info("Processing payment", { accountId, totalAmount });
      this.paymentService.makePayment(accountId, totalAmount);
    } catch (error) {
      logger.error("Payment failed", {
        accountId,
        totalAmount,
        error: error.message,
      });
      throw new InvalidPurchaseException(
        `Payment processing failed: ${error.message}`,
        402,
      );
    }

    try {
      logger.info("Reserving seat", { accountId, totalSeats });
      this.seatService.reserveSeat(accountId, totalSeats);
    } catch (error) {
      logger.error("Seat reservation failed", {
        accountId,
        totalSeats,
        error: error.message,
      });
      throw new InvalidPurchaseException(
        `Seat reservation failed: ${error.message}`,
        409,
      );
    }

    logger.info("Ticket purchase completed successfully", { accountId });
  }

  #aggregateTicketRequest(requests) {
    const summary = {
      ADULT: 0,
      CHILD: 0,
      INFANT: 0,
      total: 0,
    };

    for (const req of requests) {
      if (!(req instanceof TicketTypeRequest)) {
        logger.error("Invalid ticket request object", { req });
        throw new InvalidPurchaseException("Invalid ticket request object");
      }

      const type = req.getTicketType();
      const quantity = req.getNoOfTickets();

      summary[type] += quantity;
      summary.total += quantity;
    }

    return summary;
  }

  #validateBookingDetails(accountId, summary) {
    if (!accountId || accountId <= 0) {
      logger.warn("Invalid accountId", { accountId });
      throw new InvalidPurchaseException("Invalid accountId");
    }

    if (summary.total === 0) {
      logger.warn("No tickets requested");
      throw new InvalidPurchaseException("No tickets requested");
    }

    if (summary.total > TicketService.MAX_TICKETS) {
      logger.warn("Ticket limit exceeded", {
        requested: summary.total,
        max: TicketService.MAX_TICKETS,
      });
      throw new InvalidPurchaseException(
        `Cannot purchase more than ${TicketService.MAX_TICKETS} tickets`,
      );
    }

    if ((summary.CHILD > 0 || summary.INFANT > 0) && summary.ADULT === 0) {
      logger.warn("Child/Infant without Adult", { summary });
      throw new InvalidPurchaseException(
        "Child and Infant tickets require at least one Adult ticket",
      );
    }
  }

  #calculateAmount(summary) {
    return (
      summary.ADULT * TicketService.PRICES.ADULT +
      summary.CHILD * TicketService.PRICES.CHILD +
      summary.INFANT * TicketService.PRICES.INFANT
    );
  }

  #calculateSeats(summary) {
    return summary.ADULT + summary.CHILD;
  }
}
