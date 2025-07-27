import { generateUniqueTenantCode } from '../../common/utils/user-code-generator.util.js';
import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import { 
    NotFoundError, 
    ForbiddenError,
    AuthError, 
    ServerError
} from '../../common/services/errors-builder.service.js';

export const getTenantProfile = async (userId) => {
    const profile = await prisma.tenant_profiles.findUnique({ where: { user_id: userId } })
    
    if (!profile) throw new NotFoundError('Tenant profile not found', { field: 'User ID'})
    
    return profile;
}

export const updateTenantProfile = async (userId, data) => {
    try {
      const profile = await prisma.tenant_profiles.upsert({
        where: { user_id: userId },
        update: {
          ...data,
          updated_at: new Date(),
        },
        create: {
          id: uuidv4(),
          ...data,
          user_id: userId,
          tenant_code: await generateUniqueTenantCode(),
          created_at: new Date(),
        },
      });
  
      return { profile };
    } catch (error) {
      throw new ServerError('Failed to upsert tenant profile', { field: 'User ID' });
    }
  };

export default {
    getTenantProfile,
    updateTenantProfile,
}