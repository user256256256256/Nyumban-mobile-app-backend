import Joi from 'joi';

export const updateLandlordProfileSchema = {
  body: Joi.object({
    full_names: Joi.string().min(2).max(100),
  }).min(1),
};
