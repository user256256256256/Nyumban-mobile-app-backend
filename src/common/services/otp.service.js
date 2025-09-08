import { otpStore } from '../utils/memory-store.util.js';
import { ValidationError, ServerError } from './errors-builder.service.js';

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const sendOtp = async (identifier) => {
  try {
    const otp = generateOtp();
    otpStore.set(identifier, {
      code: otp,
      expires: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    console.log(`[DEBUG] OTP for ${identifier}: ${otp}`);

    // TODO: Integrate email/SMS service here
    // await sendOtpViaEmailOrSms(identifier, otp);

    return { message: 'OTP generated and sent successfully' };
  } catch (error) {
    console.error('Failed to send OTP:', error);
    throw new ServerError('Failed to send OTP');
  }
};

const verifyOtp = async (identifier, otp) => {
  const record = otpStore.get(identifier);

  if (!record) {
    throw new ValidationError('No OTP found for this identifier', { field: 'otp' });
  }

  const { code, expires } = record;

  if (Date.now() > expires) {
    otpStore.delete(identifier);
    throw new ValidationError('OTP has expired', { field: 'otp' });
  }

  if (code !== otp) {
    throw new ValidationError('Invalid OTP code', { field: 'otp' });
  }

  otpStore.delete(identifier);
  return true;
};

export default {
  sendOtp,
  verifyOtp,
};
