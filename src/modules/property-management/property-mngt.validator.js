import Joi from 'joi';

export const landlordPropertyQuerySchema = Joi.object({
    sort_by: Joi.string()
      .valid('date', 'likes', 'saves', 'applications', 'tours', 'title')
      .default('date'),
      
    order: Joi.string().valid('asc', 'desc').default('desc'),
  
    filter_status: Joi.string().valid('verified', 'with_units', 'pending_verification').optional(),
});
  
export const getPropertyDetailsSchema = Joi.object({
  propertyId: Joi.string().uuid().required().label('Property ID')
});

export const editPropertySchema = Joi.object({
  property_name: Joi.string().min(3).max(100).optional(),
  property_type: Joi.string().valid('apartment', 'house', 'condo', 'studio', 'duplex').optional(),
  price: Joi.number().positive().optional(),
  currency: Joi.string().valid('UGX', 'USD', 'KES', 'TZS').optional(),
  address: Joi.string().min(5).max(200).optional(),
  country: Joi.string().optional(),

  property_website: Joi.string().uri().optional().allow(null, ''),
  status: Joi.string().valid('available', 'occupied', 'archived').optional(),

  bedrooms: Joi.number().integer().min(0).optional(),
  bathrooms: Joi.number().integer().min(0).optional(),
  year_built: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional(),
  parking_spaces: Joi.number().integer().min(0).optional(),
  energy_efficiency_features: Joi.array().items(Joi.string()).optional(),
  amenities: Joi.array().items(Joi.string().min(2)).optional(),
  open_house_dates: Joi.array().items(Joi.string()).optional(),
  description: Joi.string().max(1000).optional().allow(null, ''),
  pet_policy: Joi.string().max(100).optional().allow(null, ''),
  smoking_policy: Joi.string().max(100).optional().allow(null, '')
});

export const editpropertyUnitSchema = Joi.object({
  unit_number: Joi.string().optional().label('Unit Number'),
  price: Joi.number().optional().label('Price'),
  status: Joi.string().valid('available', 'occupied', 'under_maintenance').optional().label('Status'),
  bedrooms: Joi.number().integer().min(0).optional().label('Bedrooms'),
  bathrooms: Joi.number().integer().min(0).optional().label('Bathrooms'),
  description: Joi.string().optional().label('Description'),
});

// Thumbnail
export const propertyThumbnailSchema = Joi.object({
  property_id: Joi.string().uuid().required(),
  thumbnail: Joi.any()
    .required()
    .meta({ fileField: true })
    .label('Thumbnail Image'),
});

// Images
export const propertyImagesSchema = Joi.object({
  property_id: Joi.string().uuid().required(),
  images: Joi.any()
    .required()
    .meta({ fileField: true })
    .label('Property Images'),
});

// 3D Tour
export const property3DTourSchema = Joi.object({
  property_id: Joi.string().uuid().required(),
  tour_3d: Joi.any()
    .optional()
    .meta({ fileField: true })
    .label('3D Virtual Tour'),
});

export const updatePropertyStatusSchema = Joi.object({
  status: Joi.string().valid('available', 'occupied', 'archived').required().label('Status'),
});

export const updateUnitStatusSchema = Joi.object({
  status: Joi.string().valid('available', 'occupied').required().label('Status'),
});
