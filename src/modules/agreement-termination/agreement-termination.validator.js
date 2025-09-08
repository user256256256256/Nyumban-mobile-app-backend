import Joi from 'joi';
import { TERMINATION_REASONS } from '../../common/enums/termination-reasons.enum.js';

/**
 * Validation Schemas (Embedded)
 */
export const terminateAgreementSchema = {
    params: Joi.object({
      agreementId: Joi.string().uuid().required().label('Agreement ID'),
    }),
    body: Joi.object({
      reason: Joi.string()
        .valid(...Object.values(TERMINATION_REASONS))
        .required()
        .label('Termination Reason'),
      description: Joi.string().max(500).optional().messages({
        'string.max': 'Termination description must not exceed 500 characters',
      }),
      file: Joi.any().optional().label('Evidence File'), 
      noticePeriod: Joi.number().integer().min(0).optional().label('Notice Period (days)'),
    }),
};

export const cancelEvictionSchema = {
  params: Joi.object({
    evictionId: Joi.string().uuid().required().label('Eviction ID'),
  }),
  body: Joi.object({
    reason: Joi.string().max(500).optional().label('Cancel Reason'),
  }),
};

export const confirmEvictionSchema = {
  body: Joi.object({
    evictionIds: Joi.array()
      .items(Joi.string().uuid().required())
      .min(1)
      .required()
      .label('Eviction IDs'),
  }),
};

export const acceptMutualTerminationSchema = {
    params: Joi.object({
      agreementId: Joi.string().uuid().required().label('Agreement ID'),
    }),
    body: Joi.object({
      accept: Joi.boolean().required().label('Accept Termination'),
    }),
};

export const breachAdminReviewSchema = {
  params: Joi.object({
    breachLogId: Joi.string().uuid().required().label('Breach Log ID'),
  }),
  body: Joi.object({
    outcome: Joi.string()
      .valid('warning', 'pending_remedy', 'resolved', 'eviction_recommended')
      .required()
      .label('Admin Review Outcome'),
    remedyDeadline: Joi.date().optional().label('Remedy Deadline'),
  }),
};

export const confirmBreachEvictionSchema = {
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID'),
  }),
};