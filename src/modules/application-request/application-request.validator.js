import Joi from 'joi';

export const applicationRequestSchema = {
  body: Joi.object({
    propertyId: Joi.string().uuid().required(),
    unitId: Joi.string().optional(),
    employmentStatus: Joi.string().optional(),
    occupation: Joi.string().optional(),
    emergencyContactPhone: Joi.string().optional(),
    emergencyContactName: Joi.string().optional(),
    monthlyIncome: Joi.string().optional(),
    tenantMessage: Joi.string().max(255).optional(),
  }),
};

export const cancelApplicationSchema = {
  body: Joi.object({
    applicationId: Joi.string().uuid().required(),
  }),
};
