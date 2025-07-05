import multer from 'multer';

// Common memory storage
const storage = multer.memoryStorage();

// 🎨 Image File Filter
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Unsupported image format. Only JPEG and PNG are allowed.'));
};

// 📹 3D Tour File Filter
const tourFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'application/octet-stream']; // adjust as per your 3D file types
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Unsupported 3D tour format. Only MP4 or OBJ streams allowed.'));
};

// Exports for use in routes
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

export const upload3DTour = multer({
  storage,
  fileFilter: tourFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});
