/**
 * Immutable Object.
 */

import InvalidPurchaseException from "./InvalidPurchaseException.js";

export default class TicketTypeRequest {
  #type;

  #noOfTickets;

  constructor(type, noOfTickets) {
    if (!this.#Type.includes(type)) {
      throw new InvalidPurchaseException(
        `type must be ${this.#Type.slice(0, -1).join(", ")}, or ${this.#Type.slice(-1)}`,
      );
    }

    if (!Number.isInteger(noOfTickets)) {
      throw new InvalidPurchaseException("noOfTickets must be an integer");
    }

    this.#type = type;
    this.#noOfTickets = noOfTickets;
  }

  getNoOfTickets() {
    return this.#noOfTickets;
  }

  getTicketType() {
    return this.#type;
  }

  #Type = ["ADULT", "CHILD", "INFANT"];
}
