import Joi from 'joi';

export const propertyIdParamSchema = Joi.object({
  propertyId: Joi.string().uuid().required().label('Property ID')
});

export const paginationSchema = Joi.object({
  offset: Joi.number().min(0).default(0),
  limit: Joi.number().min(1).max(100).default(10)
});

export const distanceSchema = Joi.object({
  property_id: Joi.string().uuid().required(),
  user_latitude: Joi.number().required(),
  user_longitude: Joi.number().required()
});