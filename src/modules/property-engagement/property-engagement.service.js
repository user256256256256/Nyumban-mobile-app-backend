import prisma from '../../prisma-client.js';
import { NotFoundError, ValidationError } from '../../common/services/errors.js';

const getPropertyOrThrow = async (propertyId) => {
  const property = await prisma.properties.findUnique({ where: { id: propertyId } });
  if (!property) throw new NotFoundError('Property not found');
  return property;
};

const deleteEngagementIfEmpty = async (userId, propertyId) => {
  const engagement = await prisma.property_engagements.findUnique({
    where: { user_id_property_id: { user_id: userId, property_id: propertyId } },
    select: { liked: true, saved: true }
  });

  if (engagement && !engagement.liked && !engagement.saved) {
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

  return result[0]; 
};

export const unlikeProperty = async (userId, propertyId) => {
  const property = await getPropertyOrThrow(propertyId);

  const existing = await prisma.property_engagements.findUnique({
    where: { user_id_property_id: { user_id: userId, property_id: propertyId } }
  });

  if (!existing || !existing.liked) throw new ValidationError('Property is not liked yet');

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

  if (!existing || !existing.saved) throw new ValidationError('Property is not saved yet');

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

export const getUserEngagedProperties = async (userId, type, offset, limit) => {
  const filter = type === 'liked' ? { liked: true } : { saved: true };

  const engagements = await prisma.property_engagements.findMany({
    where: { user_id: userId, ...filter },
    skip: offset,
    take: limit,
    include: {
      property: {
        select: {
          id: true,
          property_name: true,
          property_type: true,
          price: true,
          currency: true,
          bedrooms: true,
          bathrooms: true,
          year_built: true,
          address: true,
          is_verified: true,
          has_units: true,
          likes: true,
          saves: true,
          status: true,
          is_promoted: true,
          created_at: true,
          property_images: {
            take: 1,
            orderBy: { created_at: 'asc' },
            select: { id: true, image_url: true, caption: true },
          },
          users: {
            select: {
              email: true,
              phone_number: true,
            },
          },
        }
      }
    }
  });

  return engagements.map(e => e.property);
};

export default {
  likeProperty,
  unlikeProperty,
  saveProperty,
  unsaveProperty,
  getUserEngagedProperties
};
