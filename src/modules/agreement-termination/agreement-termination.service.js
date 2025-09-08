import prisma from '../../prisma-client.js';
import { TERMINATION_REASONS } from '../../common/enums/termination-reasons.enum.js';
import { NotFoundError, ForbiddenError, ServerError } from '../../common/services/errors-builder.service.js';
import { initiateEviction } from './non-payment-reason.service.js';
import { intiateBreachTermination } from './breach-reason.service.js';
import { uploadToStorage } from '../../common/services/s3.service.js'
import checkHasUpaidRentHelper from './check-has-upaid-rent.helper.js';
import { initiateOwnerRequirementTermination } from './owner-requirement-reason.service.js'
import { initateMutualTermination } from './mutual-agreement-reason.service.js'
export const terminateAgreement = async ({
  agreementId,
  userId,
  userRole,
  reason,
  description,
  graceDays,
  file,
}) => {
  // 1️⃣ Load agreement
  const agreement = await prisma.rental_agreements.findUnique({
    where: { id: agreementId },
    include: { tenant: true, landlord: true, property: true, unit: true, rent_payments: true },
  });

  if (!agreement) throw new NotFoundError('Rental agreement not found');
  if (agreement.status !== 'active') {
    throw new ForbiddenError('Agreement is not active for termination');
  }

  switch (reason) {
    case TERMINATION_REASONS.NON_PAYMENT: {
      if (userRole !== 'landlord') {
        throw new ForbiddenError('Only landlord can initiate non-payment eviction');
      }

      const unpaid = await checkHasUpaidRentHelper(agreementId);
      if (!unpaid) {
        throw new ForbiddenError('Tenant has no unpaid rent, eviction not allowed.');
      }
      return initiateEviction({ agreement, reason, initiatedBy: userId, description, graceDays });
    }

    case TERMINATION_REASONS.BREACH_OF_AGREEMENT:
    case TERMINATION_REASONS.ILLEGAL_ACTIVITY:
    case TERMINATION_REASONS.PROPERTY_DAMAGE: {
      if (userRole !== 'landlord') {
        throw new ForbiddenError('Only landlord can initiate breach termination', { field: 'User ID' });
      }
      if (!file) throw new NotFoundError('Proof document is required', { field: 'File' });
      const filePath = await uploadToStorage(file.buffer, file.originalname);
      return intiateBreachTermination({ agreement, userId, reason, description, filePath });
    }

    case TERMINATION_REASONS.OWNER_REQUIREMENT: {
      if (userRole !== 'landlord') {
        throw new ForbiddenError('Only landlord can initiate owner requirement termination');
      }
      // 🔁 Delegate everything else (refund checks, grace logic, scheduling/finalization)
      return initiateOwnerRequirementTermination({
        agreement,
        initiatedBy: userId,
        description,
        graceDays, // handler will default if not provided
      });
    }

    case TERMINATION_REASONS.MUTUAL_AGREEMENT: {
      return initateMutualTermination({
        agreement,
        initiatedBy: userId,
        reason,
        description,
        graceDays,
        file,
      })
    }

    default:
      throw new ServerError('Unsupported termination reason');
  }
};

export default {
  terminateAgreement,
};

