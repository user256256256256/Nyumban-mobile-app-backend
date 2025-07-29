import prisma from '../../prisma-client.js';
import { NotFoundError, AuthError } from '../../common/services/errors-builder.service.js';

export const getPropertyAnalytics = async (propertyIds) => {
  const properties = await prisma.properties.findMany({
    where: {
      id: { in: propertyIds },
      is_deleted: false
    },
    select: {
      id: true,
      property_name: true,
      thumbnail_image_path: true,
      owner_id: true,
      likes: true,
      saves: true,
      application_requests: true,
      tour_requests: true,
    }
  });

  if (!properties.length) {
    throw new NotFoundError('No valid properties found for analytics', { field: 'Property IDs' });
  }

  return properties.map(p => ({
    property_id: p.id,
    property_name: p.property_name,
    thumbnail: p.thumbnail_image_path,
    likes: p.likes || 0,
    saves: p.saves || 0,
    application_requests: p.application_requests || 0,
    tour_requests: p.tour_requests || 0,
  }));
};

export default {
  getPropertyAnalytics,
}