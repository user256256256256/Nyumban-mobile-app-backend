import Joi from 'joi';

export const updateTenantProfileSchema = {
  body: Joi.object({
    full_names: Joi.string().min(2).max(100).optional().label('Full Names'),
    employment_status: Joi.string().valid('employed', 'unemployed', 'student').optional().label('Employment Status'), 
    occupation: Joi.string().min(2).max(100).optional().label('Occupation'),
    emergency_contact_name: Joi.string().min(2).max(100).optional().label('Emergency Contact Name'),
    emergency_contact_phone: Joi.string().min(5).max(20).optional().label('Emergency Contact Phone'),
    monthly_income: Joi.string()
      .pattern(/^\d+\s*ugx$/i)
      .optional()
      .label('Monthly Income')
      .messages({
        'string.pattern.base': 'Monthly income must be a valid amount e.g. "85000 ugx"',
      }),
  }).min(1).messages({
    'object.min': 'At least one field must be provided to update',
  }),
};
