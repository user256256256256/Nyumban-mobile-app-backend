import Joi from 'joi';

export const AgreementActionSchema = {
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID'),
  }),
}
