import prisma from '../../prisma-client.js';

import {
    ValidationError,
    NotFoundError,
    AuthError,
    ForbiddenError,
    ServerError,
} from '../../common/services/errors-builder.service.js';

export const getLandlordTourRequests = async (landlordId, { status, cursor, limit = 20 }) => {
  const whereClause = { owner_id: landlordId, is_deleted: false };
  if (status) whereClause.status = status;

  const requests = await prisma.property_tour_requests.findMany({
    where: whereClause,
    orderBy: { created_at: 'desc' },
    take: Number(limit) + 1, // fetch one extra record for pagination
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: {
      id: true,
      message: true,
      status: true,
      created_at: true,
      requested_datetime: true,
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

  const data = requests.slice(0, limit).map((req) => ({
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

  const nextCursor = requests.length > limit ? requests[limit].id : null;

  return {
    results: data,
    nextCursor,
    hasMore: Boolean(nextCursor),
  };
};

export const resolveTourRequest = async (landlordId, requestId, action, reason) => {
  const request = await prisma.property_tour_requests.findUnique({ where: { id: requestId } });
  if (!request) throw new NotFoundError('Tour request not found', { field: requestId });
  if (request.owner_id !== landlordId) throw new ForbiddenError('You are not authorized to resolve this request', { field: 'Landlord ID' });
  if (request.status !== 'pending') throw new ServerError('Tour request has already been resolved and cannot be modified', { field: 'Action' });
  
  const updated = await prisma.property_tour_requests.update({
    where: { id: requestId },
    data: {
      status: action,
      updated_at: new Date(),
      message: action === 'declined' && reason ? reason : request.message,
    }
  });

  // 🔔 Notify tenant/requester about the resolution
  void (async () => {
    try {
      await triggerNotification(
        request.requester_id,
        'TOUR_REQUEST_RESOLVED',
        'Tour Request Update',
        `Your tour request for property ${request.property_id} has been ${action}.` + (action === 'declined' && reason ? ` Reason: ${reason}` : '')
      );
    } catch (err) {
      console.error(`Failed to send tour request resolution notification for request ${requestId}:`, err);
    }
  })();

  return updated;
};


export default {
    getLandlordTourRequests,
    resolveTourRequest
}
