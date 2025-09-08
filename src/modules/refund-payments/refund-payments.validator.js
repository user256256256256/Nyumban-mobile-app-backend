import Joi from 'joi';
import { REFUND_REASONS } from '../../common/constants/refund-reasons.constants.js';

export const refundSchema = {
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID'),
  }),
  body: Joi.object({
    landlordPhone: Joi.string().required().label('Landlord Phone Number'),
    reason: Joi.string()
      .valid(...Object.values(REFUND_REASONS))
      .required()
      .label('Refund Reason'),
    description: Joi.string().max(500).optional().label('Refund Description'),
  }),
};
