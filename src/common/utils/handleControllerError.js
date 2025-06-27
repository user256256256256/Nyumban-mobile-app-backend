import { error as errorResponse } from './response.js';

/**
 * Centralized error handler for controllers.
 *
 * @param {object} res - Express response object
 * @param {Error} err - Error object (custom or default)
 * @param {string} fallbackCode - Fallback error code if `err.code` is missing
 * @param {string} fallbackMessage - Fallback message if `err.message` is missing
 * @param {number} fallbackStatus - Default status code (default is 500)
 * @returns {Response}
 */
export const handleControllerError = (res, err, fallbackCode, fallbackMessage, fallbackStatus = 500) => {
  console.error('Controller Error:', err);

  return errorResponse(res, {
    code: err.code || fallbackCode,
    message: err.message || fallbackMessage,
    status: err.status || fallbackStatus,
    details: err.details || undefined,
  });
};
