import Joi from 'joi';
import { error } from '../utils/responseBuilder.js'; 

export const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error: validationError } = schema.validate(req[property], { abortEarly: false });
    if (validationError) {
      const first = validationError.details[0];
      return error(res, 'FORM_400_VALIDATION_FAILED', first.message, {
        field: first.context.key,
        help_url: ''
      });
    }
    next();
  };
};
