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

const proofDocFilter = (req, file, cb) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword', // .doc
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    'application/vnd.ms-word.document.macroEnabled.12', // some systems report this for .docx
    'application/octet-stream', // fallback when mimetype is missing
    'image/jpeg',
    'image/png',
    'text/plain',
  ];

  console.log('Uploaded file type:', file.mimetype, 'name:', file.originalname);


  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Unsupported document format. Allowed: PDF, Word (.doc/.docx), JPEG, PNG, TXT.'
      )
    );
  }
};


// Exported upload handlers
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const upload3DTour = multer({
  storage,
  fileFilter: tourFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

export const uploadProofDocument = multer({
  storage,
  fileFilter: proofDocFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max for ownership proof
});
