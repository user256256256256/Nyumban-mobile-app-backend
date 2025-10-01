import Joi from 'joi';

export const registerTenantManuallySchema = {
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID'),
    tenantId: Joi.string().uuid().required().label('Tenant ID'),
  }),
};
