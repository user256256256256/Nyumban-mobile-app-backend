import Joi from 'joi';

export const evictTenantSchema = {
  params: Joi.object({
    tenantId: Joi.string().uuid().required().label('Tenant ID'),
  }),
  body: Joi.object({
    property_id: Joi.string().uuid().required(),
    property_unit_id: Joi.string().uuid().optional(),
    reason: Joi.string().max(500).optional(),
  }),
};

export const finalizeEvictionSchema = {
  params: Joi.object({
    evictionLogId: Joi.string().uuid().required().label('Eviction Log ID'),
  }),
};
