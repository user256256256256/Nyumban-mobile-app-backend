import Joi from 'joi';

export const propertyAgreementSchema = {
  params: Joi.object({
    propertyId: Joi.string().uuid().required().label('Property ID'),
  }),
};

export const cancelAgreementSchema = {
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID'),
  }),
};

export const acceptAgreementSchema = {
  params: Joi.object({ agreementId: Joi.string().uuid().required().label('Agreement ID') }),
  body: Joi.object({ status: Joi.string().required().label('Status') }),
};
