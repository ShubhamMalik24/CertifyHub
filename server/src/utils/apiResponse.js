/**
 * Standardized API Response Utility
 * Provides consistent response format across all endpoints
 */

/**
 * Success response for single items
 * @param {Object} res - Express response object
 * @param {*} data - Data to send
 * @param {String} message - Success message
 * @param {Number} statusCode - HTTP status code
 */
const sendSuccess = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Success response for lists with pagination
 * @param {Object} res - Express response object
 * @param {Array} data - Array of data
 * @param {Object} meta - Pagination metadata
 * @param {String} message - Success message
 * @param {Number} statusCode - HTTP status code
 */
const sendSuccessList = (res, data, meta = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta: {
      page: meta.page || 1,
      pageSize: meta.pageSize || data.length,
      total: meta.total || data.length,
      totalPages: meta.totalPages || 1,
      hasNextPage: meta.hasNextPage || false,
      hasPrevPage: meta.hasPrevPage || false,
      ...meta
    }
  });
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code
 * @param {*} error - Additional error details
 */
const sendError = (res, message = 'Server error', statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
    error: process.env.NODE_ENV === 'development' ? error : undefined
  };

  return res.status(statusCode).json(response);
};

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 * @param {String} message - Error message
 */
const sendValidationError = (res, errors, message = 'Validation failed') => {
  return res.status(400).json({
    success: false,
    message,
    errors
  });
};

/**
 * Not found error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const sendNotFound = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    message
  });
};

/**
 * Unauthorized error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const sendUnauthorized = (res, message = 'Unauthorized') => {
  return res.status(401).json({
    success: false,
    message
  });
};

/**
 * Forbidden error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const sendForbidden = (res, message = 'Forbidden') => {
  return res.status(403).json({
    success: false,
    message
  });
};

/**
 * Conflict error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 */
const sendConflict = (res, message = 'Conflict') => {
  return res.status(409).json({
    success: false,
    message
  });
};

module.exports = {
  sendSuccess,
  sendSuccessList,
  sendError,
  sendValidationError,
  sendNotFound,
  sendUnauthorized,
  sendForbidden,
  sendConflict
};