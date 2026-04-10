export default class InvalidPurchaseException extends Error {
  constructor(
    message = "Invalid ticket purchase request",
    statusCode = 500,
    isOperational = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}
