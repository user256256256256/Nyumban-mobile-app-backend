import Joi from 'joi';

export const tourRequestSchema = {
    body: Joi.object({
      propertyId: Joi.string().uuid().required().label('Property ID').messages({
        'string.uuid': 'Property ID must be a valid UUID',
        'any.required': 'Property ID is required',
      }),
      message: Joi.string().max(255).optional().label('Message'),
    }),
  };
  
  export const cancelTourBatchSchema = {
    body: Joi.object({
      tour_ids: Joi.array().items(Joi.string().uuid()).min(1).required().label('Tour IDs').messages({
        'array.base': 'Tour IDs must be an array',
        'array.min': 'At least one tour ID is required',
        'string.uuid': 'Each Tour ID must be a valid UUID',
      }),
    }),
  };
  
  export const deleteTourBatchSchema = {
    body: Joi.object({
      tour_ids: Joi.array().items(Joi.string().uuid()).min(1).required().label('Tour IDs').messages({
        'array.base': 'Tour IDs must be an array',
        'array.min': 'At least one tour ID is required',
        'string.uuid': 'Each Tour ID must be a valid UUID',
      }),
    }),
  };