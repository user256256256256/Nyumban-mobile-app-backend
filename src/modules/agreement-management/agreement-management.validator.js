import Joi from 'joi';

export const agreementActionSchema = {
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID'),
  }),
}

export const batchAgreementSchema = {
  body: Joi.object({
    agreementIds: Joi.array()
      .items(Joi.string().uuid().label('Agreement ID'))
      .min(1)
      .required()
      .label('Agreement IDs'),
  }),
};


export const propertyAgreementSchema = {
  params: Joi.object({
    propertyId: Joi.string().uuid().required().label('Property ID'),
  }),
};

