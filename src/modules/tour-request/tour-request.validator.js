import Joi from 'joi';

export const tourRequestSchema = Joi.object({
    propertyId: Joi.string().uuid().required().label('Property ID'),
    message: Joi.string().max(255).optional().label('Message'),
});

export const cancelTourSchema = Joi.object({
    tour_id: Joi.string().uuid().required().label('Tour ID'),
})

