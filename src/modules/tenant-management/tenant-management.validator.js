import Joi from 'joi';

export const tenantIdParamSchema = {
  params: Joi.object({
    tenantId: Joi.string().uuid().required().label('Tenant ID').messages({
      'any.required': 'Tenant ID is required',
      'string.uuid': 'Tenant ID must be a valid UUID',
    }),
  }),
};

export const remindTenantRentSchema = {
  body: Joi.object({
    tenantIds: Joi.array()
      .items(Joi.string().uuid().required())
      .min(1)
      .required()
      .label('Tenant IDs'),
  }),
};
