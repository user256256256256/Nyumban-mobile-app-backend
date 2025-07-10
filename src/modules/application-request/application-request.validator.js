import Joi from 'joi';

export const applicationRequestSchema = Joi.object({
  propertyId: Joi.string().uuid().required().label('Property ID'),
  unitId: Joi.string().label('Unit Id').optional(),
  employmentStatus: Joi.string().label('Employment Status').optional(),
  occupation: Joi.string().label('Occupation').optional(),
  emergencyContactPhone: Joi.string().label('Emergency Contact Phone').optional(),
  emergencyContactName: Joi.string().label('Emergency Contact Name').optional(),
  monthlyIncome: Joi.string().label('Monthly Income').optional(),
  tenantMessage: Joi.string().label('Tenant message').optional().max(255)
})

export const cancelApplicationSchema = Joi.object({
  applicationId: Joi.string().uuid().required().label('Application ID'),
});