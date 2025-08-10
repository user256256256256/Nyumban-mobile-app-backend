import express from 'express';
import { authenticate } from '../auth/auth.middleware.js';
import { uploadImage, upload3DTour } from '../../common/middleware/upload.middleware.js';
import { authorizeRoles } from '../../common/middleware/authorize-role.middleware.js';
import { validate } from '../../common/middleware/validate.middleware.js';

import {
  getLandlordPropertiesHandler,
  getPropertyDetailsHandler,
  updatePropertyHandler,
  updatePropertyThumbnailHandler,
  updatePropertyImagesHandler,
  updatePropertyTourHandler,
  updatePropertyUnitHandler,
  deletePropertyUnitHandler,
  updatePropertyStatusHandler,
  updatePropertyUnitStatusHandler,
  generateShareLinkHandler,
  confirmOtpAndDeletePropertyHandler,
  permanentlyDeletePropertyHandler,
  permanentlyDeleteAllArchivedPropertiesHandler,
  deletePropertyImagesHandler,
  deleteSelectedPropertyUnitsHandler,
  permanentlyDeleteSelectedUnitsHandler,
  permanentlyDeleteAllArchivedUnitsHandler,
  recoverPropertiesHandler,
  recoverUnitsHandler,
  deleteProperty3DTourHandler,
  deletePropertyThumbnailHandler,
  getPropertyUnitsHandler,
  getPropertyUnitHandler,
} from './property-mngt.controller.js';

import {
  landlordPropertySchema,
  recoverUnitsSchema,
  deleteUnitsBatchSchema,
  deletePropertiesSchema,
  propertyParamSchema,
  editPropertySchema,
  unitParamSchema,
  propertyThumbnailSchema,
  propertyImagesSchema,
  property3DTourSchema,
  editpropertyUnitSchema,
  updatePropertyStatusSchema,
  updateUnitStatusSchema,
  recoverPropertiesSchema
} from './property-mngt.validator.js';

const router = express.Router();

/* =========================
   📌 PROPERTY RETRIEVAL
   ========================= */
router.get('/:landlordId/properties', authenticate, authorizeRoles('landlord'), validate(landlordPropertySchema), getLandlordPropertiesHandler);
router.get('/:propertyId/details', authenticate, authorizeRoles('landlord'), validate(propertyParamSchema), getPropertyDetailsHandler);
router.get('/:propertyId/units', authenticate, authorizeRoles('landlord'), validate(propertyParamSchema), getPropertyUnitsHandler);
router.get('/units/:unitId/details', authenticate, authorizeRoles('landlord'), validate(unitParamSchema), getPropertyUnitHandler);

/* =========================
   ✏️ PROPERTY & UNIT UPDATES
   ========================= */
router.put('/:propertyId/edit', authenticate, authorizeRoles('landlord'), validate(editPropertySchema), updatePropertyHandler);
router.put('/unit/:unitId/edit', authenticate, authorizeRoles('landlord'), validate(editpropertyUnitSchema), updatePropertyUnitHandler);

/* =========================
   🖼 MEDIA UPLOADS
   ========================= */
router.put('/media/thumbnail', authenticate, authorizeRoles('landlord'), uploadImage.single('thumbnail'), validate(propertyThumbnailSchema), updatePropertyThumbnailHandler);
router.put('/media/images', authenticate, authorizeRoles('landlord'), uploadImage.array('images', 5), validate(propertyImagesSchema), updatePropertyImagesHandler);
router.put('/media/3d-tour', authenticate, authorizeRoles('landlord'), uploadImage.single('tour_3d'), validate(property3DTourSchema), updatePropertyTourHandler);

/* =========================
   📌 STATUS UPDATES
   ========================= */
router.patch('/:propertyId/status', authenticate, authorizeRoles('landlord'), validate(updatePropertyStatusSchema), updatePropertyStatusHandler);
router.patch('/unit/:unitId/status', authenticate, authorizeRoles('landlord'), validate(updateUnitStatusSchema), updatePropertyUnitStatusHandler);

/* =========================
   🔗 SHARE LINKS 
   ========================= */
router.get('/:propertyId/share-link', authenticate, authorizeRoles('landlord'), validate(propertyParamSchema), generateShareLinkHandler);

/* =========================
   🗑 PROPERTY & UNIT REMOVALS
   ========================= */
router.delete('/unit/:unitId/remove', authenticate, authorizeRoles('landlord'), validate(unitParamSchema), deletePropertyUnitHandler);
router.delete('/remove', authenticate, authorizeRoles('landlord'), confirmOtpAndDeletePropertyHandler);
router.delete('/permanent', authenticate, authorizeRoles('landlord'), validate(deletePropertiesSchema), permanentlyDeletePropertyHandler);
router.delete('/archived/delete-all', authenticate, authorizeRoles('landlord'), permanentlyDeleteAllArchivedPropertiesHandler);
router.delete('/unit/delete', authenticate, authorizeRoles('landlord'), validate(deleteUnitsBatchSchema), deleteSelectedPropertyUnitsHandler);
router.delete('/unit/permanent', authenticate, authorizeRoles('landlord'), validate(deleteUnitsBatchSchema), permanentlyDeleteSelectedUnitsHandler);
router.delete('/unit/archived/delete-all', authenticate, authorizeRoles('landlord'), permanentlyDeleteAllArchivedUnitsHandler);

/* =========================
   🖼 MEDIA DELETIONS
   ========================= */
router.delete('/media/images/delete', authenticate, authorizeRoles('landlord'), deletePropertyImagesHandler);
router.delete('/:propertyId/media/3d-tour', authenticate, authorizeRoles('landlord'), validate(propertyParamSchema), deleteProperty3DTourHandler);
router.delete('/:propertyId/media/thumbnail', authenticate, authorizeRoles('landlord'), validate(propertyParamSchema), deletePropertyThumbnailHandler);

/* =========================
   ♻️ RECOVERY
   ========================= */
router.post('/recover', authenticate, authorizeRoles('landlord'), validate(recoverPropertiesSchema), recoverPropertiesHandler);
router.post('/recover-units', authenticate, authorizeRoles('landlord'), validate(recoverUnitsSchema), recoverUnitsHandler);

export default router;
