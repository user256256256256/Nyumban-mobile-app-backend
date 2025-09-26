import { ensureProfileIsComplete } from '../../common/services/user-validation.service.js';
import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors-builder.service.js';

export const tourRequest = async (requesterId, propertyId, message) => {

  const user = await prisma.users.findUnique({ where: { id: requesterId } }); // fixed param name

  if (!user) throw new ValidationError('User not found', { field: 'User ID' });
  
  await ensureProfileIsComplete(user.email || user.phone_number);

  const property = await prisma.properties.findFirst({
    where: { id: propertyId, is_deleted: false },
    select: { owner_id: true, property_name: true, thumbnail_image_path: true },
  });

  if (!property) throw new NotFoundError('Property not found', { field: 'Property ID' });
  
  const existingTour = await prisma.property_tour_requests.findFirst({
    where: {
      property_id: propertyId,
      requester_id: requesterId,
      is_deleted: false,
      status: 'pending', 
    },
  });   

  if (existingTour) throw new ForbiddenError('You already requested a tour for this property.');

  const tour = await prisma.property_tour_requests.create({
    data: {
      id: uuidv4(),
      property_id: propertyId,
      owner_id: property.owner_id,
      requester_id: requesterId,
      message,
      status: 'pending',
      created_at: new Date(),
    }
  });

  await prisma.properties.update({
    where: { id: propertyId },
    data: { tour_requests: { increment: 1 } },
  });

  // 🔔 Notify landlord of new tour request
  void (async () => {
    try {
      await triggerNotification(
        property.owner_id,
        'TOUR_REQUEST_SUBMITTED',
        'New Tour Request',
        `A new tour request was submitted for your property: ${property.property_name || 'Property'}.`
      );
    } catch (err) {
      console.error(`Failed to send tour request notification for property ${propertyId}:`, err);
    }
  })();

  return {
    tour_id: tour.id,
    status: tour.status,
    message: tour.message,
    requested_date: tour.created_at,
    property_name: property.property_name,
    property_thumbnail: property.thumbnail_image_path,
  };
};

export const getTourRequests = async (userId, { status, cursor, limit = 20 }) => {
  const where = {
    requester_id: userId,
    is_deleted: false,
    ...(status && { status }) // Apply status filter if provided
  };

  const tours = await prisma.property_tour_requests.findMany({
    where,
    orderBy: { created_at: 'desc' },
    take: Number(limit) + 1, // Fetch one extra record for pagination
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: {
      id: true,
      property_id: true,
      status: true,
      created_at: true,
      message: true,
      declined_reason: true,
      properties: {
        select: {
          property_name: true,
          thumbnail_image_path: true,
          users: {
            select: {
              phone_number: true,
              email: true,
            },
          },
        },
      },
    },
  });

  const data = tours.slice(0, limit).map((t) => ({
    tour_id: t.id,
    property_id: t.property_id,
    property: {
      property_name: t.properties?.property_name || null,
      thumbnail_url: t.properties?.thumbnail_image_path || null,
      landlord_contact: t.properties?.users?.phone_number || t.properties?.users?.email || null,
    },
    status: t.status,
    requested_date: t.created_at,
    message: t.message,
    declined_reason: t.status === 'declined' ? t.declined_reason : undefined,
  }));
  

  const nextCursor = tours.length > limit ? tours[limit].id : null;

  return {
    results: data,
    nextCursor,
    hasMore: Boolean(nextCursor),
  };
};

export const cancelTourRequests = async (userId, tourIds = []) => {
  const updates = [];

  for (const tourId of tourIds) {
    const tour = await prisma.property_tour_requests.findFirst({
      where: { id: tourId, requester_id: userId, is_deleted: false },
    });

    if (!tour || tour.status !== 'pending') continue;

    updates.push(
      prisma.property_tour_requests.update({
        where: { id: tourId },
        data: { status: 'cancelled' },
      })
    );
  }

  const results = await prisma.$transaction(updates);
  const cancelled = results.map(t => ({ tour_id: t.id, status: t.status }));

  return {
    cancelled,
    message: `${cancelled.length} tour request(s) cancelled`,
  };
};

export const deleteTourRequests = async (userId, tourIds = []) => {
  const deletions = [];

  for (const tourId of tourIds) {
    const tour = await prisma.property_tour_requests.findFirst({
      where: { id: tourId, requester_id: userId, is_deleted: false },
    });

    if (!tour || tour.status !== 'pending') continue;

    deletions.push(
      prisma.property_tour_requests.delete({ where: { id: tourId } })
    );
  }

  const results = await prisma.$transaction(deletions);
  const deleted = results.map(t => ({ tour_id: t.id }));

  return {
    deleted,
    message: `${deleted.length} tour request(s) permanently deleted`,
  };
};



export default {
  tourRequest,
  getTourRequests,
  cancelTourRequests,
  deleteTourRequests,
}