import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

export const uploadToStorage = async (fileBuffer, originalName) => {
    const ext = path.extname(originalName);
    const fileName = `${Date.now()}-${randomUUID()}${ext}`;
    const uploadDir = path.resolve('uploads'); // ensure absolute path
    const localPath = path.join(uploadDir, fileName);

    // ✅ Ensure uploads folder exists
    try {
        await fs.mkdir(uploadDir, { recursive: true });
    } catch (err) {
        console.error('Failed to create uploads directory:', err);
        throw err;
    }

    // Write file locally
    await fs.writeFile(localPath, fileBuffer);

    // ✅ Correct variable name
    const url = `https://mock-storage.local/${fileName}`;
    console.log(`✅ YOUR UPLOADED FILE URL IS: ${url}`);
    return url;
};


// Upload multiple images
export const uploadMultipleImages = async (files) => {
    const uploadPromises = files.map(file => uploadToStorage(file.buffer, file.originalname));
    return Promise.all(uploadPromises);
};
  
// Upload single 3D tour
export const upload3DTourFile = async (file) => {
    return uploadToStorage(file.buffer, file.originalname);
};
  
// 🔥 Simulate deletion of a file from local mock storage
export const deleteFromStorage = async (fileUrl) => {
    try {
      const url = new URL(fileUrl);
      const fileName = path.basename(url.pathname);
      const filePath = path.join('uploads', fileName);
  
      await fs.unlink(filePath);
      console.log(`🗑️  Deleted local file: ${filePath}`);
    } catch (err) {
      console.warn(`⚠️  Failed to delete file from storage: ${err.message}`);
      // Allow non-blocking failure
    }
};