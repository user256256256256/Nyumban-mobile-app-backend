import Joi from 'joi';

export const updateTenantProfileSchema = Joi.object({
  full_names: Joi.string().min(2).max(100),
  employment_status: Joi.string().valid('Employed', 'Unemployed', 'Self-Employed'),
  occupation: Joi.string().min(2).max(100),
  emergency_contact_name: Joi.string().min(2).max(100),
  emergency_contact_phone: Joi.string().min(5).max(20),
  monthly_income: Joi.string()
    .pattern(/^\d+\s*ugx$/)
    .message('monthly_income must be a valid amount e.g. "85000 ugx"'),
}).min(1); // At least one field must be present
