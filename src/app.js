import TicketService from "./pairtest/TicketService.js";
import TicketTypeRequest from "./pairtest/lib/TicketTypeRequest.js";

const ticketService = new TicketService();

try {
  const ticketRequests = [
    new TicketTypeRequest("ADULT", 2),
    new TicketTypeRequest("CHILD", 1),
  ];

  const receipt = ticketService.purchaseTickets(123, ...ticketRequests);
  console.log("Purchase successful!", receipt);
} catch (error) {
  console.error("Purchase failed:", error.message);
}
