import Joi from 'joi';

export const reviewSchema = {
  body: Joi.object({
    rating: Joi.number().min(1).max(5).required().label('Rating'),
    review_type: Joi.string().valid('system', 'property', 'user').required().label('Review Type'),
    target_id: Joi.string().uuid().required().label('Target ID'),
    target_type: Joi.string().valid('system', 'property', 'unit', 'user').required().label('Target Type'),
    comment: Joi.string().max(1000).optional().allow('', null).label('Comment'),
    created_at: Joi.date().iso().optional().label('Created At'),
  }),
};
