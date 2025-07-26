import Joi from 'joi';

export const getLeaseAgreementSchema = {
  params: Joi.object({
    propertyId: Joi.string().uuid().required().label('Property ID'),
  }),
};

export const cancelAgreementSchema = {
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID'),
  }),
};
