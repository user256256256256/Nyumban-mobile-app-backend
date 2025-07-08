import multer from 'multer';

// Use memory storage
const storage = multer.memoryStorage();

// 📸 Image filter (JPEG, PNG)
const imageFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Unsupported image format. Only JPEG and PNG are allowed.'));
};

// 🎥 3D Tour filter (MP4, OBJ stream)
const tourFilter = (req, file, cb) => {
  const allowedTypes = ['video/mp4', 'application/octet-stream'];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Unsupported 3D tour format. Only MP4 or OBJ streams allowed.'));
};

// 📄 Proof of ownership filter (PDF, Word, Images)
const proofDocFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png'
  ];
  if (allowedTypes.includes(file.mimetype)) cb(null, true);
  else cb(new Error('Unsupported document format. Allowed: PDF, Word, JPEG, PNG.'));
};

// Exported upload handlers
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

export const uploadProofDocument = multer({
  storage,
  fileFilter: proofDocFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max for ownership proof
});
