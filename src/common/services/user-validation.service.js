import prisma from '../../prisma-client.js';
import { ValidationError, ForbiddenError } from './errors-builder.service.js';
import { isEmail } from '../utils/check-user-identifier.utiil.js'
import Joi from 'joi';

export const ensureProfileIsComplete = async (contact) => {
  if (!contact) {
    throw new ForbiddenError('Missing contact identifier (email or phone)', { field: 'Contact' });
  }

  const where = isEmail(contact)
    ? { email: contact }
    : { phone_number: contact };

  const user = await prisma.users.findUnique({
    where,
    select: {
      id: true,
      is_profile_complete: true,
    }
  });

  if (!user) {
    throw new ForbiddenError('User not found', { field: 'Contact' });
  }

  if (!user.is_profile_complete) {
    throw new ForbiddenError('Profile must be completed to perform this action', {
      field: 'Is profile complete', next_step: 'Fill up missing credentials in user profile'
    });
  }

  return user;
};

export const validateUsername = async (username) => {
  const schema = Joi.string()
    .alphanum()
    .min(3)
    .max(30)
    .required()
    .label('Username');

  const { error } = schema.validate(username);
  if (error) {
    throw new ValidationError(error.message, { field: 'username' });
  }

  const exists = await prisma.users.findFirst({ where: { username } });
  if (exists) {
    throw new ValidationError('Username is already taken', { field: 'username' });
  }

  return true;
};

export const validateEmail = async (email) => {
  const schema = Joi.string().email().required().label('Email');

  const { error } = schema.validate(email);
  if (error) {
    throw new ValidationError(error.message, { field: 'Email' });
  }

  const exists = await prisma.users.findUnique({ where: { email } });
  if (exists) {
    throw new ValidationError('Email already exists', { field: 'Email' });
  }

  return true;
};

export const validatePhoneNumber = async (phone_number) => {
  const schema = Joi.string()
    .pattern(/^\+?\d{9,15}$/)
    .required()
    .label('Phone number');

  const { error } = schema.validate(phone_number);
  if (error) {
    throw new ValidationError('Invalid phone number format', { field: 'Phone number' });
  }

  const exists = await prisma.users.findUnique({ where: { phone_number } });
  if (exists) {
    throw new ValidationError('Phone number already exists', { field: 'Phone number' });
  }

  return true;
};
