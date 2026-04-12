export default class InvalidPurchaseException extends Error {
  /**
   * @param {string} message
   * @param {number} statusCode - HTTP status code
   * @param {boolean} isOperational - true = expected business error; false = unexpected crash
   */

  constructor(
    message = "Invalid ticket purchase request",
    statusCode = 400,
    isOperational = true,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;

    // Maintains proper stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}
