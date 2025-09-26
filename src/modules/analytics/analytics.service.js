import prisma from '../../prisma-client.js';
import { NotFoundError } from '../../common/services/errors-builder.service.js';
import dayjs from 'dayjs';

export const fetchLandlordProperties = async (landlordId, propertyId) => {
  const whereClause = { owner_id: landlordId, is_deleted: false };
  if (propertyId) whereClause.id = propertyId;

  const properties = await prisma.properties.findMany({
    where: whereClause,
    select: { id: true }
  });

  if (!properties.length) {
    throw new NotFoundError('No properties found', { field: 'Landlord ID / Property ID' });
  }

  return properties.map(p => p.id);
};

// ✅ Financial Summary
export const getFinancialSummary = async (userId, propertyId) => {
  const propertyIds = await fetchLandlordProperties(userId, propertyId);

  const agreements = await prisma.rental_agreements.findMany({
    where: { property_id: { in: propertyIds }, is_deleted: false },
    select: { id: true }
  });

  if (!agreements.length) return { expected: 0, collected: 0, overdue: 0, breakdown: {} };

  const agreementIds = agreements.map(a => a.id);
  const payments = await prisma.rent_payments.findMany({
    where: { rental_agreement_id: { in: agreementIds }, is_deleted: false, status: { not: 'cancelled' } },
    select: { due_amount: true, amount_paid: true, status: true, due_date: true }
  });

  let expected = 0, collected = 0, overdue = 0;
  const breakdown = { pending: 0, completed: 0, partial: 0, overdued: 0 };
  const today = new Date();

  payments.forEach(p => {
    const due = parseFloat(p.due_amount || 0);
    const paid = parseFloat(p.amount_paid || 0);
    expected += due;
    collected += paid;

    // status breakdown
    if (p.status === 'completed') breakdown.completed += 1;
    if (p.status === 'pending') breakdown.pending += 1;
    if (p.status === 'partial') breakdown.partial += 1;
    if (p.status === 'overdued') breakdown.overdued += 1;

    if ((p.status === 'overdued' || p.status === 'partial' || p.status === 'pending') && paid < due && new Date(p.due_date) < today) {
      overdue += (due - paid);
    }
  });

  return { expected, collected, overdue, breakdown };
};

// ✅ Security Deposit Overview
export const getSecurityDepositOverview = async (userId, propertyId) => {
  const propertyIds = await fetchLandlordProperties(userId, propertyId);

  const agreements = await prisma.rental_agreements.findMany({
    where: { property_id: { in: propertyIds }, is_deleted: false },
    select: { id: true }
  });
  if (!agreements.length) return { total: 0, held: 0, refunded: 0 };

  const agreementIds = agreements.map(a => a.id);
  const deposits = await prisma.security_deposits.findMany({
    where: { rental_agreement_id: { in: agreementIds }, is_deleted: false },
    select: { amount: true, status: true }
  });

  let total = 0, held = 0, refunded = 0, forfeited = 0;
  deposits.forEach(d => {
    const amt = parseFloat(d.amount || 0);
    total += amt;
    if (d.status === 'held') held += amt;
    if (d.status === 'refunded') refunded += amt;
    if (d.status === 'forfeited')  forfeited += amt;
  });

  return { total, held, refunded, forfeited };
};

// ✅ Property Analytics
export const getPropertyAnalytics = async (propertyIds) => {
  const properties = await prisma.properties.findMany({
    where: { id: { in: propertyIds }, is_deleted: false },
    select: {
      id: true,
      property_name: true,
      thumbnail_image_path: true,
      owner_id: true,
      likes: true,
      saves: true,
      application_requests: true,
      tour_requests: true
    },
  });

  if (!properties.length) throw new NotFoundError('No valid properties found for analytics', { field: 'Property IDs' });

  return properties.map(p => ({
    property_id: p.id,
    property_name: p.property_name,
    thumbnail: p.thumbnail_image_path,
    likes: p.likes || 0,
    saves: p.saves || 0,
    application_requests: p.application_requests || 0,
    tour_requests: p.tour_requests || 0
  }));
};

// ✅ User Analytics
export const getUserAnalytics = async () => {
  const totalUsers = await prisma.users.count({ where: { is_deleted: false } });
  const landlordUsers = await prisma.user_role_assignments.count({ where: { user_roles: { role: 'landlord' }, users: { is_deleted: false } } });
  const tenantUsers = await prisma.user_role_assignments.count({ where: { user_roles: { role: 'tenant' }, users: { is_deleted: false } } });

  return { total_users: totalUsers, landlord_users: landlordUsers, tenant_users: tenantUsers };
};

// ✅ Landlord Property Performance
export const getLandlordPropertyPerformance = async (landlordId, propertyId) => {
  const propertyIds = await fetchLandlordProperties(landlordId, propertyId);

  const properties = await prisma.properties.findMany({
    where: { id: { in: propertyIds }, is_deleted: false },
    select: { id: true, price: true, status: true, likes: true, saves: true, application_requests: true, tour_requests: true, has_units: true, property_units: { select: { status: true, price: true } } }
  });

  let occupied = 0, vacant = 0, totalRent = 0, totalLikes = 0, totalSaves = 0, totalApplications = 0, totalTours = 0;

  properties.forEach(property => {
    if (property.has_units) {
      property.property_units.forEach(unit => {
        unit.status === 'occupied' ? occupied++ : vacant++;
        totalRent += parseFloat(unit.price || 0);
      });
    } else {
      property.status === 'occupied' ? occupied++ : vacant++;
      totalRent += parseFloat(property.price || 0);
    }
    totalLikes += property.likes || 0;
    totalSaves += property.saves || 0;
    totalApplications += property.application_requests || 0;
    totalTours += property.tour_requests || 0;
  });

  const totalProperties = properties.length;
  const avgRent = totalProperties > 0 ? totalRent / totalProperties : 0;
  const occupancyRate = totalProperties > 0 ? (occupied / (occupied + vacant)) * 100 : 0;

  return {
    total_properties: totalProperties,
    occupied_properties: occupied,
    vacant_properties: vacant,
    average_rental_price: avgRent,
    total_monthly_potential_rent: totalRent,
    occupancy_rate: occupancyRate,
    total_likes: totalLikes,
    total_saves: totalSaves,
    total_application_requests: totalApplications,
    total_tour_requests: totalTours
  };
};

// ✅ Engagement Metrics
export const getLandlordEngagementMetrics = async (landlordId, propertyId) => {
  const propertyIds = await fetchLandlordProperties(landlordId, propertyId);

  // Group by property_id and sum views, likes, saves
  const engagementData = await prisma.property_engagements.groupBy({
    by: ['property_id'],
    _sum: {
      views: true, // sum of all views
    },
    _count: {
      liked: true,
      saved: true,
    },
    where: {
      property_id: { in: propertyIds },
    },
  });

  const applicationsCount = await prisma.property_applications.count({
    where: { property_id: { in: propertyIds }, is_deleted: false },
  });

  const tourRequestsCount = await prisma.property_tour_requests.count({
    where: { property_id: { in: propertyIds }, is_deleted: false },
  });

  return {
    property_engagements: engagementData.map(e => ({
      property_id: e.property_id,
      views: e._sum.views || 0,     // add views
      likes: e._count.liked || 0,
      saves: e._count.saved || 0,
    })),
    applications_received: applicationsCount,
    tour_requests: tourRequestsCount,
  };
};


// ✅ Growth Trends
export const getLandlordGrowthTrends = async (landlordId, propertyId) => {
  const propertyIds = await fetchLandlordProperties(landlordId, propertyId);
  const last30Days = dayjs().subtract(30, 'day').toDate();
  const last90Days = dayjs().subtract(90, 'day').toDate();

  const newTenantsLast30 = await prisma.rental_agreements.count({ where: { property_id: { in: propertyIds }, is_deleted: false, start_date: { gte: last30Days } } });
  const newTenantsLast90 = await prisma.rental_agreements.count({ where: { property_id: { in: propertyIds }, is_deleted: false, start_date: { gte: last90Days } } });
  const onTimePayments = await prisma.rent_payments.count({ where: { property_id: { in: propertyIds }, is_deleted: false, status: 'completed' } });
  const latePayments = await prisma.rent_payments.count({ where: { property_id: { in: propertyIds }, is_deleted: false, status: 'overdued' } });

  return { new_tenants_last_30_days: newTenantsLast30, new_tenants_last_90_days: newTenantsLast90, rent_payment_trends: { on_time: onTimePayments, late: latePayments } };
};

// ✅ Portfolio Summary
export const getPortfolioSummary = async (userId, propertyId) => {
  const propertyIds = await fetchLandlordProperties(userId, propertyId);
  const properties = await prisma.properties.findMany({ where: { id: { in: propertyIds }, is_deleted: false }, select: { id: true, is_verified: true, is_promoted: true } });
  const units = await prisma.property_units.findMany({ where: { property_id: { in: propertyIds }, is_deleted: false }, select: { status: true } });
  const agreements = await prisma.rental_agreements.findMany({ where: { property_id: { in: propertyIds }, is_deleted: false }, select: { id: true, status: true } });

  return {
    total_properties: properties.length,
    verified_properties: properties.filter(p => p.is_verified).length,
    promoted_properties: properties.filter(p => p.is_promoted).length,
    total_units: units.length,
    available_units: units.filter(u => u.status === 'available').length,
    rented_units: units.filter(u => u.status === 'rented').length,
    total_agreements: agreements.length
  };
};

// ✅ Top Performing Properties
export const getTopPerformingProperties = async (userId, propertyId) => {
  const propertyIds = await fetchLandlordProperties(userId, propertyId);
  if (!propertyIds.length) return [];

  const properties = await prisma.properties.findMany({ where: { id: { in: propertyIds }, is_deleted: false }, select: { id: true, property_name: true } });
  const tourCounts = await prisma.property_tour_requests.groupBy({ by: ['property_id'], where: { property_id: { in: propertyIds }, is_deleted: false }, _count: { id: true } });
  const applicationCounts = await prisma.property_applications.groupBy({ by: ['property_id'], where: { property_id: { in: propertyIds }, is_deleted: false }, _count: { id: true } });
  const engagementCounts = await prisma.property_engagements.groupBy({ by: ['property_id'], where: { property_id: { in: propertyIds }, liked: true }, _count: { id: true } });

  const performanceMap = {};
  properties.forEach(p => performanceMap[p.id] = { property_id: p.id, name: p.property_name, tours: 0, applications: 0, likes: 0, score: 0 });
  tourCounts.forEach(t => performanceMap[t.property_id].tours = t._count.id);
  applicationCounts.forEach(a => performanceMap[a.property_id].applications = a._count.id);
  engagementCounts.forEach(e => performanceMap[e.property_id].likes = e._count.id);

  const weights = { tours: 1, applications: 2, likes: 1 };
  Object.values(performanceMap).forEach(p => p.score = (p.tours * weights.tours) + (p.applications * weights.applications) + (p.likes * weights.likes));

  return Object.values(performanceMap).sort((a, b) => b.score - a.score);
};

// ✅ Applications & Tours
export const getApplicationsAndTours = async (userId, propertyId) => {
  const propertyIds = await fetchLandlordProperties(userId, propertyId);
  const applications = await prisma.property_applications.groupBy({ by: ['status'], where: { property_id: { in: propertyIds }, is_deleted: false }, _count: { id: true } });
  const applicationSummary = { pending: 0, approved: 0, rejected: 0 };
  applications.forEach(a => applicationSummary[a.status] = a._count.id);

  const tours = await prisma.property_tour_requests.groupBy({ by: ['status'], where: { property_id: { in: propertyIds }, is_deleted: false }, _count: { id: true } });
  const tourSummary = { pending: 0, accepted: 0, declined: 0, cancelled: 0 };
  tours.forEach(t => tourSummary[t.status] = t._count.id);

  return { applications: applicationSummary, tours: tourSummary };
};

export const getLandlordFinancialMetrics = async (landlordId, propertyId) => {
  const propertyIds = await fetchLandlordProperties(landlordId, propertyId);
  const monthStart = dayjs().startOf('month').toDate();
  const yearStart = dayjs().startOf('year').toDate();

  const collectedMonth = await prisma.rent_payments.aggregate({ _sum: { amount_paid: true }, where: { property_id: { in: propertyIds }, is_deleted: false, payment_date: { gte: monthStart } } });
  const collectedYear = await prisma.rent_payments.aggregate({ _sum: { amount_paid: true }, where: { property_id: { in: propertyIds }, is_deleted: false, payment_date: { gte: yearStart } } });
  const outstandingBalance = await prisma.rent_payments.aggregate({ _sum: { due_amount: true }, where: { property_id: { in: propertyIds }, is_deleted: false } });
  const averageRent = await prisma.rent_payments.aggregate({ _avg: { amount_paid: true }, where: { property_id: { in: propertyIds }, is_deleted: false } });

  return {
    total_collected_rent: { month_to_date: collectedMonth._sum.amount_paid || 0, year_to_date: collectedYear._sum.amount_paid || 0 },
    outstanding_rent_balance: outstandingBalance._sum.due_amount || 0,
    average_rent: averageRent._avg.amount_paid || 0,
  };
};

export default {
  getFinancialSummary,
  getSecurityDepositOverview,
  getPropertyAnalytics,
  getUserAnalytics,
  getLandlordPropertyPerformance,
  getLandlordFinancialMetrics,
  getLandlordEngagementMetrics,
  getLandlordGrowthTrends,
  getPortfolioSummary,
  getTopPerformingProperties,
  getApplicationsAndTours
};
