import Joi from 'joi';

export const propertyParamSchema = {
  params: Joi.object({
    propertyId: Joi.string().uuid().required().label('Property ID').messages({
      'string.uuid': 'Property ID must be a valid UUID',
      'any.required': 'Property ID is required',
    }),
  }),
};

