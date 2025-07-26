import Joi from 'joi';

export const shareAgreementSchema = {
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID'),
  }),
};

export const terminateAgreementSchema = {
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID'),
  }),
  body: Joi.object({
    reason: Joi.string().max(500).optional().messages({
      'string.max': 'Termination reason must not exceed 500 characters',
    }),
  }),
};

export const downloadAgreementSchema = {
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID'),
  }),
};
