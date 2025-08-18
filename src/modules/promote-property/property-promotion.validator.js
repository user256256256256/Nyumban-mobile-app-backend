import Joi from 'joi';

export const promotionRequestSchema = {
  body: Joi.object({
    planId: Joi.string().required().label('Promotion Plan ID').messages({
      'any.required': 'Promotion plan ID is required',
    }),
    phoneNumber: Joi.string()
      .pattern(/^(\+\d{9,15})$/)
      .required()
      .label('Phone Number')
      .messages({
        'string.pattern.base': 'Phone number must be in international format (e.g. +2567xxxxxxx)',
        'any.required': 'Phone number is required',
    }),
  }),
  params: Joi.object({
    propertyId: Joi.string().uuid().required().label('Property ID').messages({
      'string.uuid': 'Property ID must be a valid UUID',
      'any.required': 'Property ID is required',
    }),
  }),
};
  
export const propertyParamSchema = {
  params: Joi.object({
    propertyId: Joi.string().uuid().required().label('Property ID').messages({
      'string.uuid': 'Property ID must be a valid UUID',
      'any.required': 'Property ID is required',
    }),
  }),
};

