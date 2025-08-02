import prisma from '../../prisma-client.js';
import { NotFoundError } from '../../common/services/errors-builder.service.js';
import dayjs from 'dayjs';

// ✅ Helper function to fetch landlord properties
const fetchLandlordProperties = async (landlordId) => {
  const properties = await prisma.properties.findMany({
    where: { owner_id: landlordId, is_deleted: false },
    select: { id: true }
  });

  if (!properties.length) {
    throw new NotFoundError('No properties found', { field: 'Landlord ID' });
  }

  return properties.map(p => p.id);
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
      tour_requests: true,
    },
  });

  if (!properties.length) {
    throw new NotFoundError('No valid properties found for analytics', { field: 'Property IDs' });
  }

  return properties.map(p => ({
    property_id: p.id,
    property_name: p.property_name,
    thumbnail: p.thumbnail_image_path,
    likes: p.likes || 0,
    saves: p.saves || 0,
    application_requests: p.application_requests || 0,
    tour_requests: p.tour_requests || 0,
  }));
};

// ✅ User Analytics
export const getUserAnalytics = async () => {
  const totalUsers = await prisma.users.count({ where: { is_deleted: false } });
  const landlordUsers = await prisma.user_role_assignments.count({
    where: { user_roles: { role: 'landlord' }, users: { is_deleted: false } },
  });
  const tenantUsers = await prisma.user_role_assignments.count({
    where: { user_roles: { role: 'tenant' }, users: { is_deleted: false } },
  });

  return { total_users: totalUsers, landlord_users: landlordUsers, tenant_users: tenantUsers };
};

// ✅ Landlord Property Performance
export const getLandlordPropertyPerformance = async (landlordId) => {
  const properties = await prisma.properties.findMany({
    where: { owner_id: landlordId, is_deleted: false },
    select: {
      id: true,
      price: true,
      status: true,
      likes: true,
      saves: true,
      application_requests: true,
      tour_requests: true,
      has_units: true,
      property_units: { select: { status: true, price: true } }
    }
  });

  if (!properties.length) {
    throw new NotFoundError('No properties found for landlord analytics', { field: 'Landlord ID' });
  }

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
    total_tour_requests: totalTours,
  };
};

// ✅ Landlord Tenant Insights
export const getLandlordTenantInsights = async (landlordId) => {
  const propertyIds = await fetchLandlordProperties(landlordId);

  const totalTenants = await prisma.rental_agreements.count({ where: { property_id: { in: propertyIds }, is_deleted: false } });
  const latePayments = await prisma.rent_payments.count({ where: { property_id: { in: propertyIds }, is_deleted: false, payment_status: 'late' } });
  const expiringLeases = await prisma.rental_agreements.count({
    where: { property_id: { in: propertyIds }, is_deleted: false, end_date: { lte: dayjs().add(30, 'day').toDate() } }
  });

  return { total_tenants: totalTenants, tenants_with_late_payments: latePayments, lease_agreements_expiring_soon: expiringLeases };
};

// ✅ Financial Metrics
export const getLandlordFinancialMetrics = async (landlordId) => {
  const propertyIds = await fetchLandlordProperties(landlordId);
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

// ✅ Engagement Metrics
export const getLandlordEngagementMetrics = async (landlordId) => {
  const propertyIds = await fetchLandlordProperties(landlordId);

  const engagementData = await prisma.property_engagements.groupBy({
    by: ['property_id'],
    _sum: { views: true, likes: true, saves: true },
    where: { property_id: { in: propertyIds } }
  });

  const applicationsCount = await prisma.property_applications.count({ where: { property_id: { in: propertyIds }, is_deleted: false } });
  const tourRequestsCount = await prisma.property_tour_requests.count({ where: { property_id: { in: propertyIds }, is_deleted: false } });

  return {
    property_engagements: engagementData.map(e => ({
      property_id: e.property_id,
      views: e._sum.views || 0,
      likes: e._sum.likes || 0,
      saves: e._sum.saves || 0
    })),
    applications_received: applicationsCount,
    tour_requests: tourRequestsCount,
  };
};

// ✅ Growth Trends
export const getLandlordGrowthTrends = async (landlordId) => {
  const propertyIds = await fetchLandlordProperties(landlordId);
  const last30Days = dayjs().subtract(30, 'day').toDate();
  const last90Days = dayjs().subtract(90, 'day').toDate();

  const newTenantsLast30 = await prisma.rental_agreements.count({ where: { property_id: { in: propertyIds }, is_deleted: false, start_date: { gte: last30Days } } });
  const newTenantsLast90 = await prisma.rental_agreements.count({ where: { property_id: { in: propertyIds }, is_deleted: false, start_date: { gte: last90Days } } });
  const onTimePayments = await prisma.rent_payments.count({ where: { property_id: { in: propertyIds }, is_deleted: false, payment_status: 'paid' } });
  const latePayments = await prisma.rent_payments.count({ where: { property_id: { in: propertyIds }, is_deleted: false, payment_status: 'late' } });

  return {
    new_tenants_last_30_days: newTenantsLast30,
    new_tenants_last_90_days: newTenantsLast90,
    rent_payment_trends: { on_time: onTimePayments, late: latePayments }
  };
};

export default {
  getPropertyAnalytics,
  getUserAnalytics,
  getLandlordPropertyPerformance,
  getLandlordTenantInsights,
  getLandlordFinancialMetrics,
  getLandlordEngagementMetrics,
  getLandlordGrowthTrends,
};
