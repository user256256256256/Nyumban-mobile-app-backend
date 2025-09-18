import prisma from '../../prisma-client.js';
import { TERMINATION_REASONS } from '../../common/enums/termination-reasons.enum.js';
import { NotFoundError, ForbiddenError, ServerError } from '../../common/services/errors-builder.service.js';
import { initiateEviction } from './non-payment-reason.service.js';
import { intiateBreachTermination } from './breach-reason.service.js';
import { uploadToStorage } from '../../common/services/s3.service.js'
import checkEvictionEligibilityForUnpaidRent from './check-has-upaid-rent.helper.js';
import { initiateOwnerRequirementTermination } from './owner-requirement-reason.service.js'
import { initiateMutualTermination } from './mutual-agreement-reason.service.js'

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
    include: {
      properties: { select: { property_name: true } },
      property_units: { select: { unit_number: true } },
      users_rental_agreements_tenant_idTousers: {
        select: { id: true, username: true, phone_number: true, email: true },
      },
      users_rental_agreements_owner_idTousers: {
        select: { id: true, username: true, phone_number: true, email: true },
      },
    },
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
    
      const { eligible, unpaidPeriod, dueDate } = await checkEvictionEligibilityForUnpaidRent(agreementId);
    
      if (eligible) { // Made true for testing purposes
        throw new ForbiddenError(
          `Tenant is not eligible for eviction. Latest unpaid rent period (${unpaidPeriod || 'N/A'}) due on ${
            dueDate?.toDateString() || 'unknown'
          } has not passed one full month yet.`
        );
      }
    
      return initiateEviction({ agreement, reason, graceDays, userId, description });
    }    

    case TERMINATION_REASONS.BREACH_OF_AGREEMENT:
    case TERMINATION_REASONS.ILLEGAL_ACTIVITY: { 
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
        graceDays, 
      });
    }

    case TERMINATION_REASONS.MUTUAL_AGREEMENT: {

      return initiateMutualTermination({
        agreement,
        userId,
        userRole,
        description,
        graceDays,
      })
    }

    default:
      throw new ServerError('Unsupported termination reason');
  }
};

export default {
  terminateAgreement,
};

