import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors.js';

export const tourRequest = async (requesterId, propertyId, message) => {
    const property = await prisma.properties.findFirst({
        where: { id: propertyId, is_deleted: false },
        select: { owner_id: true,  property_name: true, thumbnail_image_path: true },
    });

    if (!property) throw new NotFoundError('Property not found')
    
    const existingTour = await prisma.property_tour_requests.findFirst({
        where: {
            property_id: propertyId,
            requester_id: requesterId,
            is_deleted: false,
            status: 'pending', 
        },
    });   

    if (existingTour) throw new ForbiddenError('You already requested a tour for this property.')

    const tour = await prisma.property_tour_requests.create({
        data: {
            id: uuidv4(),
            property_id: propertyId, // Re-test
            owner_id: property.owner_id,
            requester_id: requesterId,
            message,
            status: 'pending',
            created_at: new Date(),
        }
    })

    return { tour_id: tour.id, status: tour.status, message: tour.message, requested_date: tour.created_at, property_name: property.property_name, property_thumbnail: property.thumbnail_image_path }
}

export const getTourRequests = async (userId) => {
    const tours = await prisma.property_tour_requests.findMany({
      where: {
        requester_id: userId,
        is_deleted: false
      },
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        property_id: true,
        status: true,
        created_at: true,
        message: true,
        properties: {
          select: {
            property_name: true,
            thumbnail_image_path: true,
            users: {
              select: {
                phone_number: true,
                email: true
              }
            }
          }
        }
      }
    });
  
    return tours.map(t => ({
        tour_id: t.id,
        property_id: t.property_id,
        property: {
          property_name: t.properties?.property_name || null,
          thumbnail_url: t.properties?.thumbnail_image_path || null,
          landlord_contact: t.properties?.users?.phone_number || t.properties?.users?.email || null,
        },
        status: t.status,
        requested_date: t.created_at,
        message: ['accepted', 'declined'].includes(t.status) ? t.message : undefined
    }));

};

export const cancelTourRequest = async (userId, tourId) => {

  const tour = await prisma.property_tour_requests.findFirst({
    where: {
      id: tourId,
      requester_id: userId,
      is_deleted: false,
    },
  });

  if (!tour)  throw new NotFoundError('Tour request not found');

  if (tour.status !== 'pending') {
    throw new ForbiddenError('Only pending tour requests can be cancelled', { field: 'tour_id', help_url: '', } );    
  }

  const updated = await prisma.property_tour_requests.update({
    where: { id: tourId },
    data: { status: 'cancelled', updated_at: new Date(), is_deleted: true, deleted_at: new Date(), },
  });

  return {
    tour_id: updated.id,
    status: updated.status,
    message: 'Tour request cancelled and removed',
  };

}

export default {
  tourRequest,
  getTourRequests,
  cancelTourRequest
}