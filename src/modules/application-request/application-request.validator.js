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

export const cancelApplicationBatchSchema = {
  body: Joi.object({
    application_ids: Joi.array().items(Joi.string().uuid()).min(1).required().label('Application IDs').messages({
      'array.base': 'Application IDs must be an array',
      'array.min': 'At least one application ID is required',
      'string.uuid': 'Each Application ID must be a valid UUID',
    }),
  }),
};

export const deleteApplicationBatchSchema = {
  body: Joi.object({
    application_ids: Joi.array().items(Joi.string().uuid()).min(1).required().label('Application IDs').messages({
      'array.base': 'Application IDs must be an array',
      'array.min': 'At least one application ID is required',
      'string.uuid': 'Each Application ID must be a valid UUID',
    }),
  }),
};
