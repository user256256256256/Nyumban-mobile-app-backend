import prisma from '../../prisma-client.js';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors.js';

export const getLandlordTourRequests = async (landlordId, status) => {
    const whereClause = { owner_id: landlordId, is_deleted: false }
    if (status) whereClause.status = status

    const requests = await prisma.property_tour_requests.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          message: true,
          status: true,
          created_at: true,
          properties: {
            select: {
              id: true,
              property_name: true,
              thumbnail_image_path: true,
            },
          },
          users_property_tour_requests_requester_idTousers: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      });
    
      return requests.map((req) => ({
        request_id: req.id,
        property: {
          property_id: req.properties?.id,
          property_name: req.properties?.property_name,
          thumbnail_url: req.properties?.thumbnail_image_path || null,
        },
        tenant_info: req.users_property_tour_requests_requester_idTousers,
        tenant_message: req.message,
        status: req.status,
        requested_datetime: req.requested_datetime,
        created_at: req.created_at,
      }));
}

export const resolveTourRequest = async (landlordId, requestId, action, reason) => {
  const request = await prisma.property_tour_requests.findUnique({ where: { id: requestId } })
  if (!request) throw new NotFoundError('Tour request not found', { field: requestId })
  if (request.owner_id !== landlordId) throw new ForbiddenError('You are not authorized to resolve this request', { field: 'Landlord ID' })
  if (request.status !== 'pending') throw new ServerError('Tour request has already been resolved and cannot be modified', { field: 'Action' })
  
  const updated = await prisma.property_tour_requests.update({
    where: { id: requestId },
    data: {
      status: action,
      updated_at: new Date(),
      message: action === 'declined' && reason ? reason : request.message,
    }
  })

  // Send notification to the tenant

  return updated
}

export default {
    getLandlordTourRequests,
    resolveTourRequest
}
