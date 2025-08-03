import { Prisma } from '@prisma/client';
import prisma from '../../prisma-client.js';
import { scoreProperty } from './score-calculation.service.js'

export const searchProperties = async (filters) => {
  const {
    q,
    min_price,
    max_price,
    bedrooms,
    bathrooms,
    property_type,
    district,
    cursor,
    limit = 20,
  } = filters;

  const take = Math.min(Number(limit) || 20, 100); // enforce a safe max limit

  const conditions = [Prisma.sql`p.is_deleted = false`, Prisma.sql`p.status = 'available'`];

  // Dynamic filters
  if (min_price) conditions.push(Prisma.sql`p.price >= ${Number(min_price)}`);
  if (max_price) conditions.push(Prisma.sql`p.price <= ${Number(max_price)}`);
  if (bedrooms) conditions.push(Prisma.sql`p.bedrooms = ${Number(bedrooms)}`);
  if (bathrooms) conditions.push(Prisma.sql`p.bathrooms = ${Number(bathrooms)}`);
  if (property_type) conditions.push(Prisma.sql`p.property_type = ${property_type}`);
  if (district) conditions.push(Prisma.sql`p.district ILIKE ${`%${district}%`}`);
  if (cursor) conditions.push(Prisma.sql`p.id > ${cursor}`);

  // Base query
  let query;
  if (q) {
    // Full-text search with filters
    query = Prisma.sql`
      SELECT p.*, ts_rank_cd(p.search_vector, plainto_tsquery('english', ${q})) AS rank
      FROM properties p
      WHERE ${Prisma.join(conditions, ' AND ')}
        AND p.search_vector @@ plainto_tsquery('english', ${q})
      ORDER BY rank DESC
      LIMIT ${take + 1}
    `;
  } else {
    // Filters only (no search term), no DB-side ordering by created_at; just fetch raw data
    query = Prisma.sql`
      SELECT p.*
      FROM properties p
      WHERE ${Prisma.join(conditions, ' AND ')}
      LIMIT ${take + 1}
    `;
  }

  // Execute query
  const properties = await prisma.$queryRaw(query);

  // Apply combined ranking for both search and no-search cases
  const ranked = properties
    .map((p) => {
      const customScore = scoreProperty(p);
      const combinedScore = (p.rank || 0) * 10 + customScore; // weight text search rank higher
      return { ...p, _score: combinedScore };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, take);

  // Pagination cursor
  const nextCursor = ranked.length > 0 ? ranked[ranked.length - 1].id : null;

  return {
    results: ranked,
    nextCursor,
    hasMore: Boolean(nextCursor),
  };
};


export const fetchRankedProperties = async ({ cursor = null, limit = 20 }) => {
  const baseWhere = {
    is_deleted: false,
    status: 'available',
  };

  const properties = await prisma.properties.findMany({
    where: baseWhere,
    select: propertySelect,
    orderBy: { created_at: 'desc' }, // Base ordering (fallback for DB)
    take: limit + 1, // Fetch one extra to check if more data exists
    ...(cursor && { cursor: { id: cursor }, skip: 1 }), // Skip current cursor
  });

  // Rank only the current batch
  const ranked = properties
    .map(p => ({ ...p, _score: scoreProperty(p) }))
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);

  const nextCursor = ranked.length ? ranked[ranked.length - 1].id : null;

  return {
    results: ranked,
    nextCursor,
    hasMore: Boolean(nextCursor),
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
  