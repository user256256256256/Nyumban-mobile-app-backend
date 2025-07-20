import { success } from '../../common/utils/responseBuilder.js';
import ReviewService from './reviews-and-feedback.service.js';
import { handleControllerError } from '../../common/utils/handleControllerError.js';

export const submitReviewHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await ReviewService.submitReview({ ...req.body, user_id: userId });
    return success(res, result, 'Feedback submitted successfully');
  } catch (error) {
    return handleControllerError(res, error, 'REVIEW_SUBMISSION_ERROR', 'Failed to submit review');
  }
};
