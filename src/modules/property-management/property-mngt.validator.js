import Joi from 'joi';

// 🧾 Query: Landlord property filters
export const landlordPropertySchema = {
  query: Joi.object({
    sort_by: Joi.string().valid('date', 'likes', 'saves', 'applications', 'tours', 'title').default('date'),
    order: Joi.string().valid('asc', 'desc').default('desc'),
    filter_status: Joi.string().valid('verified', 'with_units', 'pending_verification').optional(),
  }),
  params: Joi.object({
    landlordId: Joi.string().uuid().required().label('Landlord ID'),
  }),
  

};

// 📄 Params: Property ID
export const propertyParamSchema = {
  params: Joi.object({
    propertyId: Joi.string().uuid().required().label('Property ID').messages({
      'string.uuid': 'Property ID must be a valid UUID',
      'any.required': 'Property ID is required',
    }),
  }),
};

export const deletePropertiesSchema = {
  body: Joi.object({
    property_ids: Joi.array().items(Joi.string().uuid()).min(1).required().label('Property IDs').messages({
      'array.base': 'Property IDs must be an array',
      'array.min': 'At least one property ID is required',
      'string.uuid': 'Each Property ID must be a valid UUID',
    }),
  }),
};


// ✏️ Body: Edit Property
export const editPropertySchema = {
  body: Joi.object({
    property_name: Joi.string().min(3).max(100).optional().label('Property Name'),
    property_type: Joi.string().valid('apartment', 'house', 'condo', 'studio', 'duplex').optional().label('Property Type'),
    price: Joi.number().positive().optional().label('Price'),
    currency: Joi.string().valid('UGX', 'USD', 'KES', 'TZS').optional().label('Currency'),
    address: Joi.string().min(5).max(200).optional().label('Address'),
    country: Joi.string().optional().label('Country'),

    property_website: Joi.string().uri().optional().allow('', null).label('Property Website'),
    status: Joi.string().valid('available', 'occupied', 'archived').optional().label('Status'),

    bedrooms: Joi.number().integer().min(0).optional().label('Bedrooms'),
    bathrooms: Joi.number().integer().min(0).optional().label('Bathrooms'),
    year_built: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional().label('Year Built'),
    parking_spaces: Joi.number().integer().min(0).optional().label('Parking Spaces'),

    energy_efficiency_features: Joi.array().items(Joi.string()).optional().label('Energy Features'),
    amenities: Joi.array().items(Joi.string().min(2)).optional().label('Amenities'),
    open_house_dates: Joi.array().items(Joi.string()).optional().label('Open House Dates'),

    description: Joi.string().max(1000).optional().allow('', null).label('Description'),
    pet_policy: Joi.string().max(100).optional().allow('', null).label('Pet Policy'),
    smoking_policy: Joi.string().max(100).optional().allow('', null).label('Smoking Policy'),
  }),
  params: Joi.object({
    propertyId: Joi.string().uuid().required().label('Property ID').messages({
      'string.uuid': 'Property ID must be a valid UUID',
      'any.required': 'Property ID is required',
    }),
  }),
};

// 🛠️ Body: Edit Property Unit
export const editpropertyUnitSchema = {
  body: Joi.object({
    unit_number: Joi.string().optional().label('Unit Number'),
    price: Joi.number().optional().label('Price'),
    status: Joi.string().valid('available', 'occupied', 'under_maintenance').optional().label('Status'),
    bedrooms: Joi.number().integer().min(0).optional().label('Bedrooms'),
    bathrooms: Joi.number().integer().min(0).optional().label('Bathrooms'),
    description: Joi.string().optional().label('Description'),
  }),
  params: Joi.object({
    unitId: Joi.string().uuid().required().label('Unit ID').messages({
      'string.uuid': 'Unit ID must be a valid UUID',
      'any.required': 'Unit ID is required',
    }),
  }),
};

// 🖼️ File: Thumbnail Upload
export const propertyThumbnailSchema = {
  body: Joi.object({
    property_id: Joi.string().uuid().required().label('Property ID'),
    thumbnail: Joi.any().required().meta({ fileField: true }).label('Thumbnail Image'),
  }),
};

// 🖼️ File: Property Images Upload
export const propertyImagesSchema = {
  body: Joi.object({
    property_id: Joi.string().uuid().required().label('Property ID'),
    images: Joi.any().required().meta({ fileField: true }).label('Property Images'),
  }),
};

// 🌀 File: 3D Virtual Tour
export const property3DTourSchema = {
  body: Joi.object({
    property_id: Joi.string().uuid().required().label('Property ID'),
    tour_3d: Joi.any().optional().meta({ fileField: true }).label('3D Virtual Tour'),
  }),
};

// 📌 Update Property Status
export const updatePropertyStatusSchema = {
  body: Joi.object({
    status: Joi.string().valid('available', 'occupied', 'archived').required().label('Property Status'),
  }),
  params: Joi.object({
    propertyId: Joi.string().uuid().required().label('Property ID').messages({
      'string.uuid': 'Property ID must be a valid UUID',
      'any.required': 'Property ID is required',
    }),
  }),
};

// 📌 Update Unit Status
export const updateUnitStatusSchema = {
  body: Joi.object({
    status: Joi.string().valid('available', 'occupied').required().label('Unit Status'),
  }),
  params: Joi.object({
    unitId: Joi.string().uuid().required().label('Unit ID').messages({
      'string.uuid': 'Unit ID must be a valid UUID',
      'any.required': 'Unit ID is required',
    }),
  }),
};

export const unitParamSchema = {
  params: Joi.object({
    unitId: Joi.string().uuid().required().label('Unit ID').messages({
      'string.uuid': 'Unit ID must be a valid UUID',
      'any.required': 'Unit ID is required',
    }),
  }),
};

export const deleteUnitsBatchSchema = Joi.object({
  unitIds: Joi.array().items(Joi.string().uuid()).min(1).required(),
});

export const recoverPropertiesSchema = {
  body: Joi.object({
    property_ids: Joi.array()
      .items(Joi.string().uuid())
      .min(1)
      .required()
      .label('Property IDs')
      .messages({
        'array.base': 'Property IDs must be an array',
        'array.min': 'At least one property ID is required',
        'string.uuid': 'Each Property ID must be a valid UUID',
      }),
  }),
};


export const recoverUnitsSchema = {
  body: Joi.object({
    unit_ids: Joi.array()
      .items(Joi.string().uuid())
      .min(1)
      .required()
      .label('Unit IDs')
      .messages({
        'array.base': 'Unit IDs must be an array',
        'array.min': 'At least one Unit ID is required',
        'string.uuid': 'Each Unit ID must be a valid UUID',
      }),
  }),
};
