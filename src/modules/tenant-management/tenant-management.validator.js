import Joi from 'joi';

export const tenantIdParamSchema = {
  params: Joi.object({
    tenantId: Joi.string().uuid().required().label('Tenant ID').messages({
      'any.required': 'Tenant ID is required',
      'string.uuid': 'Tenant ID must be a valid UUID',
    }),
  }),
};

export const agreementIdParamSchema = {
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreemment ID').messages({
      'any.required': 'Agreemment ID is required',
      'string.uuid': 'Agreemment ID must be a valid UUID',
    }),
  }),
}

export const propertyIdParamSchema = {
  params: Joi.object({
    propertyId: Joi.string().uuid().required().label('Property ID').messages({
      'any.required': 'Property ID is required',
      'string.uuid': 'Property ID must be a valid UUID',
    }),
  }),
}

export const securityDepositIdParamSchema = {
  params: Joi.object({
    securityDepositId: Joi.string().uuid().required().label('Security ID').messages({
      'any.required': 'Security ID is required',
      'string.uuid': 'Security ID must be a valid UUID',
    }),
  }),
}

export const paymentIdParamSchema = {
  params: Joi.object({
    paymentId: Joi.string().uuid().required().label('Payment ID').messages({
      'any.required': 'Payment ID is required',
      'string.uuid': 'Payment ID must be a valid UUID',
    }),
  }),
}

export const remindTenantRentSchema = {
  body: Joi.object({
    tenantIds: Joi.array()
      .items(Joi.string().uuid().required())
      .min(1)
      .required()
      .label('Tenant IDs'),
  }),
};

