import Joi from 'joi';

export const updateLandlordProfileSchema = Joi.object({
  full_names: Joi.string().min(2).max(100)
}).min(1); // Ensure at least one field is provided
