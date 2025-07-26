import Joi from 'joi';

export const tenantIdParamSchema = {
  params: Joi.object({
    tenantId: Joi.string().uuid().required().label('Tenant ID').messages({
      'any.required': 'Tenant ID is required',
      'string.uuid': 'Tenant ID must be a valid UUID',
    }),
  }),
};
