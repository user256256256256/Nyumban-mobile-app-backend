import AuthService from './auth.service.js'

export const requestOtpHandler = async (req, res) => {
    try {
      const { identifier } = req.body;
      const result = await AuthService.handleOtpRequest(identifier);
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error in requestOtpHandler:', error);
      return res.status(500).json({ message: 'Internal Server Error' });
    }
  };
  
export const verifyOtpHandler = async (req, res) => {
    const { identifier, otp } = req.body
    const result = await AuthService.verifyOtp(identifier, otp)
    return res.status(result.status || 200).json(result);
}

export const submitRoleHandler = async (req, res) => {
    const userId = req.user?.id
    const { role } = req.body
    const result = await AuthService.setUserRole(userId, role);
    return res.status(200).json(result)
}