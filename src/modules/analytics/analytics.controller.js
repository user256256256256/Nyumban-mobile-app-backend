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
    const { propertyId } = req.query; 
    const data = await AnalyticsService.getLandlordPropertyPerformance(landlordId, propertyId);
    return success(res, data, 'Landlord property performance fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'FETCH_PROPERTY_PERFORMANCE_ERROR', 'Failed to fetch landlord property performance');
  }
};

// Landlord tenant insights
export const getLandlordTenantInsightsHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { propertyId } = req.query; 
    const data = await AnalyticsService.getLandlordTenantInsights(landlordId, propertyId);
    return success(res, data, 'Tenant insights fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'FETCH_TENANT_INSIGHTS_ERROR', 'Failed to fetch tenant insights');
  }
};

// Financial metrics
export const getLandlordFinancialMetricsHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { propertyId } = req.query; 
    const data = await AnalyticsService.getLandlordFinancialMetrics(landlordId, propertyId);
    return success(res, data, 'Financial metrics fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'FETCH_FINANCIAL_METRICS_ERROR', 'Failed to fetch financial metrics');
  }
};

// Engagement metrics
export const getLandlordEngagementMetricsHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { propertyId } = req.query; 
    const data = await AnalyticsService.getLandlordEngagementMetrics(landlordId, propertyId);
    return success(res, data, 'Engagement metrics fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'FETCH_ENGAGEMENT_METRICS_ERROR', 'Failed to fetch engagement metrics');
  }
};

export const getLandlordGrowthTrendsHandler = async (req, res) => {
  try {
    const landlordId = req.user.id;
    const { propertyId } = req.query; 
    const data = await AnalyticsService.getLandlordGrowthTrends(landlordId, propertyId);
    return success(res, data, 'Growth trends fetched successfully');
  } catch (error) {
    return handleControllerError(res, error, 'FETCH_GROWTH_TRENDS_ERROR', 'Failed to fetch growth trends');
  }
};

export const getPortfolioSummaryHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.query; 
    const result = await AnalyticsService.getPortfolioSummary(userId, propertyId);
    return success(res, result, 'Portfolio summary retrieved successfully');
  } catch (error) {
    return handleControllerError(res, error, 'GET_PORTFOLIO_SUMMARY_FAILED', 'Failed to fetch portfolio summary');
  }
};

// Applications & tours
export const getApplicationsAndToursHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.query; 
    const result = await AnalyticsService.getApplicationsAndTours(userId, propertyId);
    return success(res, result, 'Applications & Tours statuses retrieved successfully');
  } catch (error) {
    return handleControllerError(res, error, 'GET_APPLICATIONS_TOURS_FAILED', 'Failed to fetch applications & tours statuses');
  }
};

export const getFinancialSummaryHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.query; 
    const data = await AnalyticsService.getFinancialSummary(userId, propertyId);
    return success(res, data, 'Financial summary retrieved successfully');
  } catch (error) {
    return handleControllerError(res, error, 'GET_FINANCIAL_SUMMARY_FAILED', 'Failed to fetch financial summary');
  }
};

export const getSecurityDepositOverviewHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.query; 
    const data = await AnalyticsService.getSecurityDepositOverview(userId, propertyId);
    return success(res, data, 'Security deposit overview retrieved successfully');
  } catch (error) {
    return handleControllerError(res, error, 'GET_SECURITY_DEPOSIT_FAILED', 'Failed to fetch security deposit overview');
  }
};

export const getTopPerformingPropertiesHandler = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await AnalyticsService.getTopPerformingProperties(userId);
    return success(res, data, 'Top performing properties retrieved successfully');
  } catch (error) {
    return handleControllerError(res, error, 'GET_TOP_PERFORMING_PROPERTIES_FAILED', 'Failed to fetch top performing properties');
  }
};
