import TicketController from "./controllers/TicketController.js";

try {
  const response = TicketController.purchase({
    accountId: 1,
    tickets: [
      { type: "ADULT", quantity: 2 },
      { type: "CHILD", quantity: 1 },
      { type: "INFANT", quantity: 1 },
    ],
  });

  console.log(response);
} catch (err) {
  console.error(err.name, err.message);
}
