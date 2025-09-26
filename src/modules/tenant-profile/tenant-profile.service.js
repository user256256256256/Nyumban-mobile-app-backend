import { generateUniqueTenantCode } from '../../common/utils/user-code-generator.util.js';
import prisma from '../../prisma-client.js';
import { v4 as uuidv4 } from 'uuid';
import { 
    NotFoundError, 
    ServerError
} from '../../common/services/errors-builder.service.js';

export const getTenantProfile = async (userId) => {
    const profile = await prisma.tenant_profiles.findUnique({ where: { user_id: userId } });
    if (!profile) throw new NotFoundError('Tenant profile not found', { field: 'User ID' });
    return profile;
};

export const updateTenantProfile = async (userId, data) => {
    if (!userId) throw new ServerError('Invalid user ID', { field: 'User ID' });

    try {
        // Check if tenant profile exists
        const existingProfile = await prisma.tenant_profiles.findUnique({
            where: { user_id: userId }
        });

        if (existingProfile) {
            // Update existing profile
            return await prisma.tenant_profiles.update({
                where: { user_id: userId },
                data: { ...data, updated_at: new Date() },
            });
        } else {
            // Create new profile safely
            const newProfile = await prisma.tenant_profiles.create({
                data: {
                    id: uuidv4(),
                    user_id: userId,
                    tenant_code: await generateUniqueTenantCode(),
                    ...data,
                    created_at: new Date(),
                },
            });
            return newProfile;
        }
    } catch (error) {
        console.error('Error updating tenant profile:', error);
        throw new ServerError('Failed to upsert tenant profile', { field: 'User ID' });
    }
};

export default {
    getTenantProfile,
    updateTenantProfile,
};
