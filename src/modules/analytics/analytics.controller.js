import { success } from '../../common/utils/response-builder.util.js';
import AnalyticsService from './analytics.service.js';
import { handleControllerError } from '../../common/utils/handle-controller-error.util.js';

export const getPropertyAnalyticsHandler = async (req, res) => {
  try {
    const { propertyIds } = req.body;
    const data = await AnalyticsService.getPropertyAnalytics(propertyIds);
    return success(res, data, 'Property analytics fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'FETCH_ANALYTICS_ERROR', 'Failed to fetch property analytics');
  }
};

export const getUserAnalyticsHandler = async (req, res) => {
  try {
    const data = await AnalyticsService.getUserAnalytics();
    return success(res, data, 'User analytics fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'FETCH_USER_ANALYTICS_ERROR', 'Failed to fetch user analytics');
  }
};

export const getLandlordPropertyPerformanceHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const data = await AnalyticsService.getLandlordPropertyPerformance(landlordId);
    return success(res, data, 'Landlord property performance fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'FETCH_PROPERTY_PERFORMANCE_ERROR', 'Failed to fetch landlord property performance');
  }
};

export const getLandlordTenantInsightsHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const data = await AnalyticsService.getLandlordTenantInsights(landlordId);
    return success(res, data, 'Tenant insights fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'FETCH_TENANT_INSIGHTS_ERROR', 'Failed to fetch tenant insights');
  }
};

export const getLandlordFinancialMetricsHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const data = await AnalyticsService.getLandlordFinancialMetrics(landlordId);
    return success(res, data, 'Financial metrics fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'FETCH_FINANCIAL_METRICS_ERROR', 'Failed to fetch financial metrics');
  }
};

export const getLandlordEngagementMetricsHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const data = await AnalyticsService.getLandlordEngagementMetrics(landlordId);
    return success(res, data, 'Engagement metrics fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'FETCH_ENGAGEMENT_METRICS_ERROR', 'Failed to fetch engagement metrics');
  }
};

export const getLandlordGrowthTrendsHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const data = await AnalyticsService.getLandlordGrowthTrends(landlordId);
    return success(res, data, 'Growth trends fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'FETCH_GROWTH_TRENDS_ERROR', 'Failed to fetch growth trends');
  }
};