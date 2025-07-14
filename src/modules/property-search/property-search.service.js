import prisma from '../../prisma-client.js';
import {scoreProperty} from './score-calculation.service.js'

export const searchProperties = async (filters) => {
    const {
      q,
      min_price,
      max_price,
      bedrooms,
      bathrooms,
      property_type,
      district,
      offset = 0,
      limit = 20,
    } = filters;
  
    const where = {
      is_deleted: false,
      status: 'available',
      ...(q && {
        OR: [
          { property_name: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
          { property_type: { contains: q, mode: 'insensitive' } },
        ],
      }),
      ...(min_price && { price: { gte: Number(min_price) } }),
      ...(max_price && { price: { lte: Number(max_price) } }),
      ...(bedrooms && { bedrooms: Number(bedrooms) }),
      ...(bathrooms && { bathrooms: Number(bathrooms) }),
      ...(property_type && { property_type }),
      ...(district && { district: { contains: district, mode: 'insensitive' } }),
    };
  
    const properties = await prisma.properties.findMany({
      where,
      select: propertySelect,
    });
  
    const ranked = properties
      .map(p => ({ ...p, _score: scoreProperty(p) }))
      .sort((a, b) => b._score - a._score)
      .slice(offset, offset + limit);
  
    const total = properties.length;
  
    return {
      results: ranked,
      total,
      offset: Number(offset),
      limit: Number(limit),
    };
};

export const fetchRankedProperties = async ({ offset = 0, limit = 20 }) => {
    const baseWhere = {
      is_deleted: false,
      status: 'available',
    };
  
    const properties = await prisma.properties.findMany({
      where: baseWhere,
      select: propertySelect,
    });
  
    const ranked = properties
      .map(p => ({ ...p, _score: scoreProperty(p) }))
      .sort((a, b) => b._score - a._score)
      .slice(offset, offset + limit);
  
    const total = properties.length;
  
    return {
      results: ranked,
      total,
      offset: Number(offset),
      limit: Number(limit),
    };
};
  
export default {
    searchProperties,
    fetchRankedProperties,
};
  

const propertySelect = {
    id: true,
    property_name: true,
    property_type: true,
    price: true,
    currency: true,
    bedrooms: true,
    bathrooms: true,
    year_built: true,
    address: true,
    is_verified: true,
    has_units: true,
    likes: true,
    saves: true,
    status: true,
    is_promoted: true,
    created_at: true,
    property_images: {
      take: 1,
      orderBy: { created_at: 'asc' },
      select: { id: true, image_url: true, caption: true },
    },
    users: {
      select: {
        email: true,
        phone_number: true,
      },
    },
};
  