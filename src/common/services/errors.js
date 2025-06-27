export class ValidationError extends Error {
    constructor(message, details = {}) {
      super(message);
      this.name = 'ValidationError';
      this.code = 'FORM_400_VALIDATION_FAILED';
      this.details = details;
    }
  }
  
  export class NotFoundError extends Error {
    constructor(message, details = {}) {
      super(message);
      this.name = 'NotFoundError';
      this.code = 'NOT_FOUND_404';
      this.details = details;
    }
  }
  
  export class AuthError extends Error {
    constructor(message, details = {}) {
      super(message);
      this.name = 'AuthError';
      this.code = 'AUTH_401_UNAUTHORIZED';
      this.details = details;
    }
  }
  
  export class ForbiddenError extends Error {
    constructor(message, details = {}) {
      super(message);
      this.name = 'ForbiddenError';
      this.code = 'ACCESS_403_FORBIDDEN';
      this.details = details;
    }
  }
  
  export class ServerError extends Error {
    constructor(message = 'Internal Server Error', details = {}) {
      super(message);
      this.name = 'ServerError';
      this.code = 'SERVER_ERROR';
      this.details = details;
    }
  }
  