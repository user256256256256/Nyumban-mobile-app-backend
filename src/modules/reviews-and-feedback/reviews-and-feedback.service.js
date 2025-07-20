import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';

export const submitReview = async ({
  user_id,
  rating,
  review_type,
  target_id,
  target_type,
  comment,
  created_at,
}) => {
  await prisma.reviews.create({
    data: {
      id: uuidv4(),
      user_id,
      rating,
      review_type,
      target_id,
      target_type,
      comment,
      created_at: created_at ? new Date(created_at) : new Date(),
      is_deleted: false,
    },
  });

  return { success: true };
};

export default { 
    submitReview 
};
