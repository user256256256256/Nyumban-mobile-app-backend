import Joi from 'joi';

export const reviewSchema = {
  body: Joi.object({
    rating: Joi.number().min(1).max(5).required(),
    review_type: Joi.string().valid('system', 'property', 'user').required(),
    target_id: Joi.string().uuid().required(),
    target_type: Joi.string().valid('system', 'property', 'unit', 'user').required(),
    comment: Joi.string().optional(),
    created_at: Joi.date().iso().optional()
  }),
};
