import { error } from '../utils/response-builder.util.js';

export const validate = (schemas) => {
  return (req, res, next) => {
    try {
      for (const key of ['body', 'params', 'query']) {
        if (schemas[key]) {
          const { error: validationError } = schemas[key].validate(req[key], { abortEarly: false });

          if (validationError) {
            const first = validationError.details[0];
            console.log('Validation failed:', first.message); // ✅ confirm it hits here

            return error(res, {
              code: 'FORM_400_VALIDATION_FAILED',
              message: first.message,
              status: 400,
              details: {
                field: first.context.key,
                help_url: ''
              }
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
