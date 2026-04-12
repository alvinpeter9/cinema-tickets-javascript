import TicketTypeRequest from "./lib/TicketTypeRequest.js";
import InvalidPurchaseException from "./lib/InvalidPurchaseException.js";
import TicketPaymentService from "../thirdparty/paymentgateway/TicketPaymentService.js";
import SeatReservationService from "../thirdparty/seatbooking/SeatReservationService.js";
import { logger } from "./util/logger.js";

export default class TicketService {
  // Maximum tickets allowed per transaction as per business rules
  static #MAX_TICKETS = 25;

  static #TICKET_TYPES = Object.freeze({
    ADULT: "ADULT",
    CHILD: "CHILD",
    INFANT: "INFANT",
  });

  // Ticket prices as per business rules
  static #PRICES = Object.freeze({
    ADULT: 25,
    CHILD: 15,
    INFANT: 0, // Infants are free as they sit on an adult's lap
  });

  constructor(
    paymentService = new TicketPaymentService(),
    seatService = new SeatReservationService(),
  ) {
    this.paymentService = paymentService;
    this.seatService = seatService;
  }

  /**
   * Validates, charges, and reserves seats for the given ticket requests.
   *
   * @param {number} accountId - Must be a positive integer greater than 0
   * @param {...TicketTypeRequest} ticketTypeRequests
   * @returns {{ totalAmount: number, totalSeats: number, breakdown: { adult: number, child: number, infant: number } }}
   * @throws {InvalidPurchaseException} if validation fails or a service call errors
   */
  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#validateAccountId(accountId);
    this.#validateRequestsProvided(ticketTypeRequests);

    const summary = this.#aggregateTicketRequests(ticketTypeRequests);
    this.#validateBookingRules(summary);

    const totalAmount = this.#calculateAmount(summary);
    const totalSeats = this.#calculateSeats(summary);

    this.#processPayment(accountId, totalAmount);
    this.#reserveSeats(accountId, totalSeats);

    logger.info("Ticket purchase completed successfully", { accountId });

    return {
      totalAmount,
      totalSeats,
      breakdown: {
        adult: summary.ADULT,
        child: summary.CHILD,
        infant: summary.INFANT,
      },
    };
  }

  // ### Input Validation 

  #validateAccountId(accountId) {
    // Ensure accountId is a positive integer greater than 0
    if (!Number.isInteger(accountId) || accountId <= 0) {
      logger.warn("Invalid accountId", { accountId });
      throw new InvalidPurchaseException("Invalid accountId");
    }
  }

  #validateRequestsProvided(requests) {
    if (!requests || requests.length === 0) {
      logger.error("No ticket requests provided");
      throw new InvalidPurchaseException("No ticket requests provided");
    }
  }

  // ### Aggregation

  #aggregateTicketRequests(requests) {
    const summary = { ADULT: 0, CHILD: 0, INFANT: 0, total: 0 };

    for (const req of requests) {
      // Guard against null/undefined entries in addition to wrong types
      if (!req || !(req instanceof TicketTypeRequest)) {
        logger.error("Invalid ticket request object", { req });
        throw new InvalidPurchaseException(
          `Invalid ticket request: expected a TicketTypeRequest instance, got ${typeof req}`,
        );
      }

      const type = req.getTicketType();
      const quantity = req.getNoOfTickets();

      summary[type] += quantity;
      summary.total += quantity;
    }

    return summary;
  }

  // ### Business Rule Validation

  #validateBookingRules(summary) {
    this.#validateTicketLimit(summary.total);
    this.#validateAdultPresent(summary);
    this.#validateInfantAdultRatio(summary);
  }

  #validateTicketLimit(total) {
    if (total > TicketService.#MAX_TICKETS) {
      logger.warn("Ticket limit exceeded", {
        requested: total,
        max: TicketService.#MAX_TICKETS,
      });
      throw new InvalidPurchaseException(
        `Cannot purchase more than ${TicketService.#MAX_TICKETS} tickets`,
      );
    }
  }

  #validateAdultPresent(summary) {
    // Children and infants cannot attend unaccompanied — at least one adult required
    const hasChildOrInfant = summary.CHILD > 0 || summary.INFANT > 0;
    if (hasChildOrInfant && summary.ADULT === 0) {
      logger.warn("Attempting to book child/Infant ticket without an Adult", {
        summary,
      });
      throw new InvalidPurchaseException(
        "Child and Infant tickets require at least one Adult ticket",
      );
    }
  }

  #validateInfantAdultRatio(summary) {
    // Each infant must be seated on an adult's lap, so infants cannot outnumber adults
    if (summary.INFANT > summary.ADULT) {
      logger.warn("More Infants than Adults", { summary });
      throw new InvalidPurchaseException(
        "Number of Infant tickets cannot exceed number of Adult tickets",
      );
    }
  }

  // ### Calculations

  #calculateAmount(summary) {
    const { ADULT, CHILD, INFANT } = TicketService.#TICKET_TYPES;
    return (
      summary[ADULT] * TicketService.#PRICES[ADULT] +
      summary[CHILD] * TicketService.#PRICES[CHILD] +
      summary[INFANT] * TicketService.#PRICES[INFANT]
    );
  }

  #calculateSeats(summary) {
    // Infants sit on an adult's lap so no seat is reserved for them
    return summary.ADULT + summary.CHILD;
  }

  // ### External Services Integration 

  #processPayment(accountId, totalAmount) {
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
  }

  #reserveSeats(accountId, totalSeats) {
    try {
      logger.info("Reserving seats", { accountId, totalSeats });
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
  }
}
