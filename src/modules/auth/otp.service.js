import { otpStore } from '../../common/utils/memoryStore.js'

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString()

const sendOtp = async (identifier) => {
    try {
      const otp = generateOtp();
      otpStore.set(identifier, { code: otp, expires: Date.now() + 5 * 60000 });
      console.log(`[DEBUG] OTP for ${identifier} is ${otp}`);
      // Call your SMS/Email API here and handle errors properly
    } catch (error) {
      console.error('Error sending OTP:', error);
      throw error;  // Make sure this propagates so caller knows
    }
  };
  

const verifyOtp = async (identifier, otp) => {
    const record = otpStore.get(identifier);
    if (!record) return false;
    const { code, expires } = record;

    if (Date.now() > expires || code !== otp ) return false;
    otpStore.delete(identifier);
    return true;
}

export default { sendOtp, verifyOtp }