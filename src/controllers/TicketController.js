import TicketTypeRequest from "../pairtest/lib/TicketTypeRequest.js";
import TicketService from "../pairtest/TicketService.js";

const ticketService = new TicketService();

export default class TicketController {
  static purchase(reqBody) {
    const { accountId, tickets } = reqBody;

    const requests = tickets.map(
      (t) => new TicketTypeRequest(t.type, t.quantity),
    );

    ticketService.purchaseTickets(accountId, ...requests);

    return {
      success: true,
      message: "Tickets purchased successfully",
    };
  }
}
