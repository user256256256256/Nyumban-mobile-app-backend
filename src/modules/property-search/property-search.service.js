import prisma from '../../prisma-client.js';
import { scoreProperty } from './score-calculation.service.js'

/* 

**✅ Strengths of searchProperties FUNC:**

* Supports dynamic filters (price, bedrooms, bathrooms, type, district).
* Cursor-based pagination (efficient for large datasets).
* Optional full-text search via ILIKE .
* Ranking/scoring mechanism for custom property ordering.
* Debug logging makes it easier to trace behavior.

**⚠️ Limitations / Next-level improvements:**

1. **Full-text search:** Using ILIKE is fine for small to medium datasets, but for large datasets, consider PostgreSQL full-text search with `tsvector`/`tsquery` or Elasticsearch for speed and relevance.
2. **Scoring/ranking:** Currently just a custom score — you might want to integrate multiple signals like views, likes, saves, and recency more formally.
3. **Performance:** As your database grows (>100k properties), `findMany` with multiple filters and sorting can become slow. Indexing the fields used in filters (`price`, `bedrooms`, `property_type`, `address`) is important.
4. **Aggregations:** Right now, `_score` is computed in Node.js. For very large datasets, pre-computed engagement metrics in the DB might help.
5. **Full-text across multiple fields:** Currently only searches `property_name`; consider `description` or `district` for more comprehensive search.

**Bottom line:** ✅ Works well for now, professional enough for a medium-scale app. For **enterprise-level, large datasets, or very heavy search usage**, you’d want to move to a dedicated search solution (PostgreSQL full-text indexing or a search engine).


*/
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

  const take = Math.min(Number(limit) || 20, 100);
  const where = {
    is_deleted: false,
    status: 'available',
  };

  // Apply dynamic filters
  if (min_price) where.price = { ...where.price, gte: Number(min_price) };
  if (max_price) where.price = { ...where.price, lte: Number(max_price) };
  if (bedrooms) where.bedrooms = Number(bedrooms);
  if (bathrooms) where.bathrooms = Number(bathrooms);
  if (property_type) where.property_type = property_type;
  if (district) where.address = { contains: district, mode: 'insensitive' };

  // Cursor pagination
  const findManyArgs = {
    where,
    select: propertySelect,
    take: take + 1,
    orderBy: { created_at: 'desc' },
  };
  if (cursor) findManyArgs.cursor = { id: cursor }, findManyArgs.skip = 1;

  // Full-text search 
  if (q) {
    // Multi-field search using Prisma "OR"
    where.OR = [
      { property_name: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
      { address: { contains: q, mode: 'insensitive' } },
      { pet_policy: { contains: q, mode: 'insensitive' } },
      { smoking_policy: { contains: q, mode: 'insensitive' } },
    ];
  }

  console.log('🔍 Search filters applied:', { where, cursor, take });

  const properties = await prisma.properties.findMany(findManyArgs);

  // Compute combined score
  const ranked = properties
    .map((p) => {
      const customScore = scoreProperty(p);
      const combinedScore = customScore; // weight higher if you want full-text rank
      return { ...p, _score: combinedScore };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, take);

  const nextCursor = ranked.length > 0 ? ranked[ranked.length - 1].id : null;

  console.log(`✅ Found ${ranked.length} properties, nextCursor:`, nextCursor);

  return {
    results: ranked,
    nextCursor,
    hasMore: Boolean(nextCursor),
  };
};

export const fetchRankedProperties = async ({ cursor = null, limit = 20 }) => {
  console.log('🔎 Fetching ranked properties with:', { cursor, limit });

  const baseWhere = {
    is_deleted: false,
    status: 'available',
  };

  const properties = await prisma.properties.findMany({
    where: baseWhere,
    select: propertySelect,
    orderBy: { created_at: 'desc' },
    take: limit + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
  });

  console.log(`📊 Retrieved ${properties.length} properties from DB (before ranking)`);

  const ranked = properties
    .map(p => {
      // use views directly from property
      const score = scoreProperty(p);

      console.log(`🏠 Property ${p.id} scored: ${score}`, {
        is_promoted: p.is_promoted,
        is_verified: p.is_verified,
        likes: p.likes,
        saves: p.saves,
        views: p.views,
        rating: p.rating,
        created_at: p.created_at,
      });

      return { ...p, _score: score };
    })
    .sort((a, b) => b._score - a._score)
    .slice(0, limit);

  const nextCursor = ranked.length ? ranked[ranked.length - 1].id : null;

  console.log('✅ Ranking complete:', {
    topScore: ranked[0]?._score,
    lowestScore: ranked[ranked.length - 1]?._score,
    nextCursor,
    hasMore: Boolean(nextCursor),
  });

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
  views: true, // direct column on property
  property_images: {
    take: 1,
    orderBy: { created_at: 'asc' },
    select: { id: true, image_url: true, caption: true },
  },
  users: {
    select: {
      email: true,
      phone_number: true,
      email: true
    },
  },
  _count: {
    select: { property_engagements: true },
  },
};



