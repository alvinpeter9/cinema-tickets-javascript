# Cinema Tickets JavaScript

A JavaScript application for managing cinema ticket purchases with validation, payment processing, and seat reservation.

## Features

- 🎫 Ticket purchase management (Adult, Child, Infant)
- 💳 Payment processing integration
- 🪑 Seat reservation system
- ✅ Comprehensive input validation
- 📝 Structured logging with Winston
- 🧪 Unit tests with Vitest
- 🔍 ESLint code quality checks
- 🔒 Branch protection with automated PR checks

## Requirements

- **Node.js**: 20.x or higher

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cinema-tickets-javascript.git
cd cinema-tickets-javascript

# Install dependencies
npm install
```

## Usage

```javascript
import TicketService from "./src/pairtest/TicketService.js";
import TicketTypeRequest from "./src/pairtest/lib/TicketTypeRequest.js";

const ticketService = new TicketService();

try {
  const ticketRequests = [
    new TicketTypeRequest("ADULT", 2),
    new TicketTypeRequest("CHILD", 1),
  ];

  ticketService.purchaseTickets(123, ...ticketRequests);
  console.log("Purchase successful!");
} catch (error) {
  console.error("Purchase failed:", error.message);
}
```

## API

### TicketService

#### `purchaseTickets(accountId, ...ticketTypeRequests)`

Processes a ticket purchase request.

**Parameters:**

- `accountId` (number): Valid account ID (> 0)
- `ticketTypeRequests` (TicketTypeRequest[]): Array of ticket requests

**Throws:**

- `InvalidPurchaseException`: If validation fails

**Business Rules:**

- Maximum 25 tickets per purchase
- Child and Infant tickets require at least one Adult ticket
- Infants don't require seats

**Pricing:**

- Adult: £25
- Child: £15
- Infant: Free

### TicketTypeRequest

```javascript
new TicketTypeRequest(type, quantity);
```

**Parameters:**

- `type` (string): `'ADULT'`, `'CHILD'`, or `'INFANT'`
- `quantity` (number): Number of tickets (> 0)

## Scripts

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run ESLint
npm run lint

# Fix ESLint issues
npm run lint:fix
```

## Project Structure

```
src/
├── pairtest/
│   ├── TicketService.js          # Main service class
│   ├── lib/
│   │   ├── TicketTypeRequest.js   # Request model
│   │   └── InvalidPurchaseException.js  # Custom exception
│   └── util/
│       └── logger.js              # Winston logger setup
└── thirdparty/
    ├── paymentgateway/
    │   └── TicketPaymentService.js
    └── seatbooking/
        └── SeatReservationService.js
```

## Error Handling

The service throws `InvalidPurchaseException` with appropriate HTTP status codes:

- **400**: Invalid input (accountId, ticket types)
- **402**: Payment processing failed
- **409**: Seat reservation conflict
- **500**: General server error

## Logging

Logs are written to:

- **Console**: Real-time output with color formatting
- **`logs/combined.log`**: All log levels
- **`logs/error.log`**: Errors only

Control log level:

```bash
LOG_LEVEL=debug npm start
```

## Testing

Tests are written with [Vitest](https://vitest.dev/):

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm run test:coverage
```

## CI/CD

This project uses GitHub Actions for automated testing and code quality checks on every PR to `master`.

**Checks include:**

- ✅ Unit tests (Node 20.x, 22.x)
- ✅ Code coverage
- ✅ ESLint validation
- ✅ Security audit
- ✅ Console statement detection

Branch protection rules enforce passing all checks before merge.

## Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/your-feature`
4. Open a PR to `master`
5. All checks must pass before merging