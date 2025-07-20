import Joi from 'joi';

export const shareAgreementSchema = {
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID')
  })
};

export const terminateAgreementSchema = {
  body: Joi.object({
    reason: Joi.string().max(500).optional()
  }),
};
