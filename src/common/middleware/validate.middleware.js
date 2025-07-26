import { error } from '../utils/responseBuilder.js';

export const validate = (schemas) => {
  return (req, res, next) => {
    try {
      for (const key of ['body', 'params', 'query']) {
        if (schemas[key]) {
          const { error: validationError } = schemas[key].validate(req[key], { abortEarly: false });

          if (validationError) {
            const first = validationError.details[0];
            return error(res, 'FORM_400_VALIDATION_FAILED', first.message, {
              field: first.context.key,
              help_url: ''
            });
          }
        }
      }

      next();
    } catch (err) {
      next(err);
    }
  };
};
