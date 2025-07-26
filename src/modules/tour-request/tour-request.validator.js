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
  
  export const cancelTourSchema = {
    body: Joi.object({
      tour_id: Joi.string().uuid().required().label('Tour ID').messages({
        'string.uuid': 'Tour ID must be a valid UUID',
        'any.required': 'Tour ID is required',
      }),
    }),
  };
  
