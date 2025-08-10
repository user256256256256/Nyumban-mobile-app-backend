import Joi from 'joi';

// Ownership & Basic Info
export const propertyOwnershipSchema = {
  body: Joi.object({
    property_name: Joi.string().min(3).max(100).required(),
    property_type: Joi.string().valid('apartment', 'house', 'condo', 'studio', 'duplex').required(),
    price: Joi.number().positive().required(),
    currency: Joi.string().valid('UGX', 'USD', 'KES', 'TZS').default('UGX'),
    address: Joi.string().min(5).max(200).required(),
    country: Joi.string().default('Uganda'),
    property_website: Joi.string().uri().optional().allow(null, ''),
    status: Joi.string().valid('available', 'occupied', 'archived').default('available'),
  }),
};

export const propertyPhysicalAttrSchema = {
  body: Joi.object({
    property_id: Joi.string().uuid().required(),
    bedrooms: Joi.number().integer().min(0).required(),
    bathrooms: Joi.number().integer().min(0).required(),
    year_built: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
    parking_spaces: Joi.number().integer().min(0).optional(),
    energy_efficiency_features: Joi.array().max(200).optional().allow(null, ''),
    amenities: Joi.array().items(Joi.string().min(2)).optional().allow(null),
    open_house_dates: Joi.array().max(150).optional().allow(null, ''),
    description: Joi.string().max(1000).optional().allow(null, ''),
    pet_policy: Joi.string().max(100).optional().allow(null, ''),
    smoking_policy: Joi.string().max(100).optional().allow(null, ''),
  }),
};

export const propertyThumbnailSchema = {
  body: Joi.object({
    property_id: Joi.string().uuid().required(),
  }),
};

export const propertyImagesSchema = {
  body: Joi.object({
    property_id: Joi.string().uuid().required(),
  }),
};

export const property3DTourSchema = {
  body: Joi.object({
    property_id: Joi.string().uuid().required(),
    tour_3d: Joi.any().optional().meta({ fileField: true }).label('3D Virtual Tour'),
  }),
};

export const propertyUnitSchema = {
  params: Joi.object({
    propertyId: Joi.string().uuid().required().messages({
      'string.uuid': 'Property ID must be a valid UUID',
      'any.required': 'Property ID is required',
    }),
  }),
  body: Joi.object({
    unit_number: Joi.string().required().messages({
      'string.empty': 'Unit number is required',
    }),
    price: Joi.number().required().messages({
      'number.base': 'Price must be a number',
      'any.required': 'Price is required',
    }),
    status: Joi.string().valid('available', 'occupied', 'under_maintenance').optional(),
    bedrooms: Joi.number().integer().min(0).optional(),
    bathrooms: Joi.number().integer().min(0).optional(),
    description: Joi.string().optional(),
  }),
};