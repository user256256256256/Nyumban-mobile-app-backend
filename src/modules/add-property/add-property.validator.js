import Joi from 'joi';

// Ownership & Basic Info
export const propertyOwnershipSchema = Joi.object({
  property_name: Joi.string().min(3).max(100).required(),
  property_type: Joi.string().valid('apartment', 'house', 'condo', 'studio', 'duplex').required(),
  price: Joi.number().positive().required(),
  currency: Joi.string().valid('UGX', 'USD', 'KES', 'TZS').default('UGX'),
  address: Joi.string().min(5).max(200).required(),
  country: Joi.string().default('Uganda'),
  property_website: Joi.string().uri().optional().allow(null, ''),
  status: Joi.string().valid('available', 'occupied', 'archived').default('available'), 
});

// Physical Attributes
export const propertyPhysicalAttrSchema = Joi.object({
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
});

// Thumbnail Upload Schema (single file)
export const propertyThumbnailSchema = Joi.object({
   property_id: Joi.string().uuid().required(),
    thumbnail: Joi.any()
      .required()
      .meta({ fileField: true })
      .label('Thumbnail Image'),
});
  
// Images Upload Schema (multiple files)
export const propertyImagesSchema = Joi.object({
  property_id: Joi.string().uuid().required(),
  images: Joi.any()
      .required()
      .meta({ fileField: true })
      .label('Property Images'),
});

// 3D Tour Upload Schema (single file OR optional)
export const property3DTourSchema = Joi.object({
  property_id: Joi.string().uuid().required(),
  tour_3d: Joi.any()
      .optional()
      .meta({ fileField: true })
      .label('3D Virtual Tour'),
});

export const propertyUnitSchema = Joi.object({
  unit_number: Joi.string().required().label('Unit Number'),
  price: Joi.number().required().label('Price'),
  status: Joi.string().valid('available', 'occupied', 'under_maintenance').optional().label('Status'),
  bedrooms: Joi.number().integer().min(0).optional().label('Bedrooms'),
  bathrooms: Joi.number().integer().min(0).optional().label('Bathrooms'),
  description: Joi.string().optional().label('Description'),
});
