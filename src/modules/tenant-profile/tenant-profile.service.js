import prisma from '../../prisma-client.js';
import { 
    NotFoundError, 
    ForbiddenError,
    AuthError, 
    ServerError
} from '../../common/services/errors.js';

export const getTenantProfile = async (userId) => {
    const profile = await prisma.tenant_profiles.findUnique({ where: { user_id: userId } })
    
    if (!profile) throw new NotFoundError('Tenant profile not found', { field: 'User ID'})
    
    return profile;
}

export const updateTenantProfile = async (userId, data) => {
    const existing = await prisma.tenant_profiles.findUnique({ where: { user_id: userId } })

    if (!existing) throw new NotFoundError('Tenant profile not found', { field: 'User ID'})
    
    const updated = await prisma.tenant_profiles.update({
        where: { user_id: userId },
        data: {
            ...data,
            updated_at: new Date(),
        },
    });

    return { updated };
}

export default {
    getTenantProfile,
    updateTenantProfile,
}