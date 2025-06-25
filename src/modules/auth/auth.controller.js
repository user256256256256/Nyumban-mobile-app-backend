import AuthService from './auth.service.js'
import prisma from '../../prisma-client.js';

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
  try {
    const { identifier, otp } = req.body
    const result = await AuthService.verifyOtp(identifier, otp)
    return res.status(result.status || 200).json(result);
  } catch (error) {
    console.error('Error in verifyOtpHandler:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }

}

export const submitRoleHandler = async (req, res) => {
  try {
    const userId = req.user?.id; 
    const { role } = req.body;

    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user ID from token' });
    }

    const result = await AuthService.setUserRole(userId, role);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in submitRoleHandler:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const checkProfileStatusHandler = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.users.findUnique({
      where: {id: userId},
      select: { is_profile_complete: true},
    });
  
    if (!user) {
      return res.status(404).json({ message: 'User not found'})
    }
  
    return res.json({ profile_complete: user.is_profile_complete});
  } catch (error) {
    console.error('Error in checkProfileStatusHandler:', error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
}

export const completeProfileHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { user_name } = req.body;

    if (!user_name) {
      return res.status(400).json({
        code: 'FORM_400_VALIDATION_FAILED',
        message: 'Name is required',
        details: { field: 'user_name', help_url: '' },
      });
    }

    const result = await AuthService.completeProfile(userId, user_name, req.file);
    return res.json(result);
  } catch (error) {
    return res.status(400).json({
      code: 'FORM_400_VALIDATION_FAILED',
      message: error.message || 'Failed to complete profile',
      details: { field: 'profile_picture', help_url: '' },
    });
  }
}

export const getSliderHandler = async (req, res) => {
  try {
    const userRole = req.user.role // assume JWT decoded user role is here
    const slides = await AuthService.getSlidesByRole(userRole);

    return res.json({ slides });
  } catch (error) {
    return res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Failed to retrieve onboarding slides',
    });
  }
}

export const completeOnboardingHandler = async (req, res) => {
  try {
    const userId = req.user.id;

    const completed = await AuthService.hasCompletedOnboarding(userId);
    if (completed) {
      return res.status(400).json({
        code: 'FORM_400_VALIDATION_FAILED',
        message: 'Onboarding already marked as complete',
        details: { field: 'user_state' },
      });
    }

    const role = await AuthService.completeOnboarding(userId);
    return res.json({
      message: 'Onboarding completed successfully',
      redirect_to: `/dashboard/${role}`,
    })

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      code: 'SERVER_ERROR',
      message: 'Failed to complete onboarding',
    });
  }
}