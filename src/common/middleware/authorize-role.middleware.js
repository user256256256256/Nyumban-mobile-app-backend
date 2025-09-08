import { VALID_ROLES } from '../constants/roles.constants.js';
import { ForbiddenError, AuthError } from '../services/errors-builder.service.js';

/**
 * Middleware to authorize access based on user roles.
 * @param  {...string} allowedRoles - List of roles allowed to access the route.
 */
export const authorizeRoles = (...allowedRoles) => {
  // Validate the input roles
  const invalidRoles = allowedRoles.filter(role => !VALID_ROLES.includes(role));
  if (invalidRoles.length > 0) {
    throw new Error(`authorizeRoles(): Invalid role(s) specified → [${invalidRoles.join(', ')}]`);
  }

  return (req, res, next) => {
    const user = req.user;

    // Ensure authentication happened before role validation
    if (!user || !user.role) {
      return next(new AuthError('User is not authenticated or role missing from token.'));
    }
    const userRole = user.role;

    // Guard against unexpected/unknown roles in the token
    if (!VALID_ROLES.includes(userRole)) {
      return next(new ForbiddenError(`User role "${userRole}" is not recognized.`));
    }

    // Check if the user's role is allowed
    if (!allowedRoles.includes(userRole)) {
      return next(new ForbiddenError(`Access denied. Required roles: ${allowedRoles.join(', ')}`));
    }

    next(); // ✅ Role is authorized
  };
};
