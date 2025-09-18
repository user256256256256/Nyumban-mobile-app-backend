import Joi from 'joi';
import { TERMINATION_REASONS } from '../../common/enums/termination-reasons.enum.js';

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
      graceDays: Joi.number().integer().min(0).optional().label('Grace Period (days)'),
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
  params: Joi.object({
    evictionId: Joi.string().uuid().required().label('Eviction ID'),
  }),
};

export const acceptMutualTerminationSchema = {
    params: Joi.object({
      agreementId: Joi.string().uuid().required().label('Agreement ID'),
    }),
    body: Joi.object({
      accept: Joi.boolean().required().label('Accept Termination'),
      graceDays: Joi.number().integer().min(0).optional().label('Grace Period (days)'),
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
    remedyDays: Joi.number().integer().min(0).optional().label('Grace Period (days)'),
  }),
};

export const resolveBreachEvictionSchema = {
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID'),
  }),
};

export const cancelOwnerRequirementTerminationSchema = {
  params: Joi.object({
    agreementId: Joi.string().uuid().required().label('Agreement ID'),
  }),
  body: Joi.object({
    accept: Joi.boolean().required().label('Accept Termination'),
  }),
};