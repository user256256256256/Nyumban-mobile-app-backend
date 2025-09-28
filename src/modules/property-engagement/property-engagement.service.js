import prisma from '../../prisma-client.js';
import { calculateDistaceService } from './calculate-distance.service.js';
import { AuthError, NotFoundError } from '../../common/services/errors-builder.service.js';
import { triggerNotification } from '../notifications/notification.service.js';

const getPropertyOrThrow = async (propertyId) => {
  const property = await prisma.properties.findUnique({ where: { id: propertyId } });
  if (!property) throw new NotFoundError('Property not found', { field: 'Property ID' });
  return property;
};

const deleteEngagementIfEmpty = async (userId, propertyId) => {
  const engagement = await prisma.property_engagements.findUnique({
    where: { user_id_property_id: { user_id: userId, property_id: propertyId } },
    select: { liked: true, saved: true, }
  });

  if (engagement && !engagement.liked && !engagement.saved && (engagement.views || 0) === 0) {
    await prisma.property_engagements.delete({
      where: { user_id_property_id: { user_id: userId, property_id: propertyId } }
    });
  }
};

export const likeProperty = async (userId, propertyId) => {
  const property = await getPropertyOrThrow(propertyId);

  const existing = await prisma.property_engagements.findUnique({
    where: { user_id_property_id: { user_id: userId, property_id: propertyId } }
  });

  if (existing?.liked) return existing;

  const result = await prisma.$transaction([
    prisma.property_engagements.upsert({
      where: { user_id_property_id: { user_id: userId, property_id: propertyId } },
      update: { liked: true },
      create: { user_id: userId, property_id: propertyId, liked: true }
    }),
    prisma.properties.update({
      where: { id: propertyId },
      data: { likes: { increment: 1 } }
    })
  ]);

  // 🔔 Notify landlord about the like
  void (async () => {
    try {
      await triggerNotification(
        property.owner_id,
        'user',
        'Your property was liked',
        `A tenant liked your property: ${property.title || 'Property'}`
      );
    } catch (err) {
      console.error(`Failed to send like notification for property ${propertyId}:`, err);
    }
  })();

  return result[0];
};

export const unlikeProperty = async (userId, propertyId) => {
  const property = await getPropertyOrThrow(propertyId);

  const existing = await prisma.property_engagements.findUnique({
    where: { user_id_property_id: { user_id: userId, property_id: propertyId } }
  });

  if (!existing || !existing.liked) throw new AuthError('Property is not liked yet');

  const result = await prisma.$transaction([
    prisma.property_engagements.update({
      where: { user_id_property_id: { user_id: userId, property_id: propertyId } },
      data: { liked: false }
    }),
    property.likes > 0
      ? prisma.properties.update({
          where: { id: propertyId },
          data: { likes: { decrement: 1 } }
        })
      : Promise.resolve()
  ]);

  await deleteEngagementIfEmpty(userId, propertyId);
  return result[0];
};

export const saveProperty = async (userId, propertyId) => {
  const property = await getPropertyOrThrow(propertyId);

  const existing = await prisma.property_engagements.findUnique({
    where: { user_id_property_id: { user_id: userId, property_id: propertyId } }
  });

  if (existing?.saved) return existing;

  const [engagement] = await prisma.$transaction([
    prisma.property_engagements.upsert({
      where: { user_id_property_id: { user_id: userId, property_id: propertyId } },
      update: { saved: true },
      create: { user_id: userId, property_id: propertyId, saved: true }
    }),
    prisma.properties.update({
      where: { id: propertyId },
      data: { saves: { increment: 1 } }
    })
  ]);

  return engagement;
};

export const unsaveProperty = async (userId, propertyId) => {
  const property = await getPropertyOrThrow(propertyId);

  const existing = await prisma.property_engagements.findUnique({
    where: { user_id_property_id: { user_id: userId, property_id: propertyId } }
  });

  if (!existing || !existing.saved) throw new AuthError('Property is not saved yet');

  const result = await prisma.$transaction([
    prisma.property_engagements.update({
      where: { user_id_property_id: { user_id: userId, property_id: propertyId } },
      data: { saved: false }
    }),
    property.saves > 0
      ? prisma.properties.update({
          where: { id: propertyId },
          data: { saves: { decrement: 1 } }
        })
      : Promise.resolve()
  ]);

  await deleteEngagementIfEmpty(userId, propertyId);
  return result[0];
};


export const viewProperty = async (userId, propertyId) => {
  const property = await getPropertyOrThrow(propertyId);

  // Check if the user has already viewed the property
  const existingEngagement = await prisma.property_engagements.findUnique({
    where: { user_id_property_id: { user_id: userId, property_id: propertyId } },
  });

  if (existingEngagement) {
    // User already viewed; just return current views
    return { views: property.views ?? 0 };
  }

  // Otherwise, create engagement and increment views
  await prisma.$transaction([
    prisma.property_engagements.create({
      data: { user_id: userId, property_id: propertyId, liked: false, saved: false },
    }),
    prisma.properties.update({
      where: { id: propertyId },
      data: { views: { increment: 1 } },
    }),
  ]);

  // Return the updated views
  const updatedProperty = await prisma.properties.findUnique({ where: { id: propertyId } });
  return { views: updatedProperty?.views ?? 0 };
};


/* 
* POSTPONED TO V2 
* Distance features and geolocation are part of the upcoming 
* version once structured data is guaranteed.
* Use Open Cage Node.js with
* Google Places Autocomplete API in UI → save full address + lat/long during entry → avoid fake inputs.
*/
export const getDistanceToProperty = async (propertyId, userLat, userLon) => {
  const property = await prisma.properties.findUnique({
    where: { id: propertyId },
    select: {
      id: true,
      // latitude: true,
      // longitude: true
    }
  });

  if (!property) throw new NotFoundError('Property not found', { field: 'Property ID'})
  
  // if (!property.latitude || !property.longitude) {
  //   throw new NotFoundError('Property location not available');
  // }

  // ⛳ Temporary fallback coordinates (e.g., Nairobi CBD)
  const fallbackLat = -1.28333;
  const fallbackLon = 36.81667;

  const propertyLat = property.latitude ?? fallbackLat;
  const propertyLon = property.longitude ?? fallbackLon;

  const distanceKm = calculateDistaceService(
    userLat, userLon,
    propertyLat, propertyLon
  );

  return {
    property_id: propertyId,
    distance_km: parseFloat(distanceKm.toFixed(2)),
    formatted: `${distanceKm.toFixed(1)} km away from your current location`
  };
}

export default {
  likeProperty,
  unlikeProperty,
  saveProperty,
  unsaveProperty,
  viewProperty, 
  getDistanceToProperty,
};
