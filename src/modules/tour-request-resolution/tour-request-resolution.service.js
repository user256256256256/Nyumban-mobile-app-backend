import prisma from '../../prisma-client.js';
import { triggerNotification } from '../notifications/notification.service.js'

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
    take: Number(limit) + 1, 
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
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
          phone_number: true,
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
    requested_datetime: req.created_at, // ✅ map created_at to requested_datetime
    approved_date: req.updated_at
  }));

  const nextCursor = requests.length > limit ? requests[limit].id : null;

  return {
    results: data,
    nextCursor,
    hasMore: Boolean(nextCursor),
  };
};

export const resolveTourRequest = async (landlordId, requestId, action, reason) => {
  const request = await prisma.property_tour_requests.findUnique({
    where: { id: requestId },
    include: {
      properties: {
        select: {
          id: true,
          property_name: true,
        },
      },
    },
  });

  if (!request) throw new NotFoundError('Tour request not found', { field: 'Request Id' });
  if (request.owner_id !== landlordId) throw new ForbiddenError('You are not authorized to resolve this request', { field: 'Landlord ID' });
  if (request.status !== 'pending') throw new ServerError('Tour request has already been resolved and cannot be modified', { field: 'Action' });

  const updated = await prisma.property_tour_requests.update({
    where: { id: requestId },
    data: {
      status: action,
      updated_at: new Date(),
      message: action === 'declined' && reason ? reason : request.message,
    },
    include: {
      properties: { select: { property_name: true } }, 
    },
  });

  // 🔔 Notify tenant/requester about the resolution
  void (async () => {
    try {
      await triggerNotification(
        request.requester_id,
        'user',
        'Tour Request Resolved',
        `Your tour request for property ${request.properties?.property_name ?? 'Unknown Property'} has been ${action}.`
        + (action === 'declined' && reason ? ` Reason: ${reason}` : '')
      );
    } catch (err) {
      console.error(`Failed to send tour request resolution notification for request ${requestId}:`, err);
    }
  })();

  return updated;
};

export const deleteTourRequests = async (landlordId, requestIds = []) => {
  const updates = [];
  const notifications = [];

  for (const requestId of requestIds) {
    const tour = await prisma.property_tour_requests.findUnique({
      where: { id: requestId },
      include: {
        properties: {
          select: {
            property_name: true,
          },
        },
      },
    });

    if (!tour) continue;
    if (tour.owner_id !== landlordId) continue; // landlord not authorized for this request

    // If still pending, decline first and notify tenant
    if (tour.status === 'pending') {
      updates.push(
        prisma.property_tour_requests.update({
          where: { id: requestId },
          data: {
            status: 'declined',
            is_deleted_by_landlord: true,
            updated_at: new Date(),
          },
        })
      );

      // Queue up notification to tenant
      notifications.push(
        triggerNotification(
          tour.requester_id,
          'user',
          'Tour Request Declined',
          `Your tour request for property ${tour.properties?.property_name ?? 'Unknown Property'} has been declined.`
        ).catch((err) => {
          console.error(
            `Failed to send notification for declined & deleted request ${requestId}:`,
            err
          );
        })
      );
    } else {
      // Already resolved → just mark as deleted (no notification needed)
      updates.push(
        prisma.property_tour_requests.update({
          where: { id: requestId },
          data: {
            is_deleted_by_landlord: true,
            updated_at: new Date(),
          },
        })
      );
    }
  }

  // Run DB updates in transaction
  const results = await prisma.$transaction(updates);

  // Fire notifications asynchronously (don't block response)
  void (async () => {
    await Promise.all(notifications);
  })();

  return {
    deleted: results.map((r) => ({
      request_id: r.id,
      status: r.status,
      is_deleted_by_landlord: r.is_deleted_by_landlord,
    })),
    message: `${results.length} tour request(s) marked as deleted`,
  };
};



export default {
    getLandlordTourRequests,
    resolveTourRequest,
    deleteTourRequests
}
