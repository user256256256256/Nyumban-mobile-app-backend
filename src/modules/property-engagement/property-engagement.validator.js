import Joi from 'joi';

export const propertyIdParamSchema = {
  params: Joi.object({
    propertyId: Joi.string().uuid().required().label('Property ID').messages({
      'any.required': 'Property ID is required',
      'string.uuid': 'Property ID must be a valid UUID',
    }),
  }),
};

export const paginationSchema = {
  query: Joi.object({
    offset: Joi.number().min(0).default(0).label('Offset'),
    limit: Joi.number().min(1).max(100).default(10).label('Limit'),
  }),
};

export const distanceSchema = {
  body: Joi.object({
    property_id: Joi.string().uuid().required().label('Property ID').messages({
      'string.uuid': 'Property ID must be a valid UUID',
    }),
    user_latitude: Joi.number().required().label('Latitude').messages({
      'any.required': 'User latitude is required',
    }),
    user_longitude: Joi.number().required().label('Longitude').messages({
      'any.required': 'User longitude is required',
    }),
  }),
};