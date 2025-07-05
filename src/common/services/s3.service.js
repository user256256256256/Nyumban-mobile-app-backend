import path from 'path'
import fs from 'fs/promises'
import { randomUUID } from 'crypto'

export const uploadToStorage = async (fileBuffer, originalName) => {
    const ext = path.extname(originalName);
    const fileName = `${Date.now()}-${randomUUID()}${ext}`;
    const localPath = path.join('uploads', fileName) // simulate cloud path

    // Simulate upload by writing file locally
    await fs.writeFile(localPath, fileBuffer);

    // Simulate S3 URL
    const url = `https://mock-storage.local/${filename}`;
    console.log(`YOUR UPLOADED FILE URL IS: ${url}`);
    return url;

    /* NOTES
    When you're ready to move to real AWS S3, you'll only replace this part inside s3.service.js:
    await fs.writeFile(localPath, fileBuffer); // 🔄 replace with S3.upload()
    const url = `https://mock-storage.local/${filename}`; // 🔄 replace with S3 URL
    */
}

// Upload multiple images
export const uploadMultipleImages = async (files) => {
    const uploadPromises = files.map(file => uploadToStorage(file.buffer, file.originalname));
    return Promise.all(uploadPromises);
};
  
// Upload single 3D tour
export const upload3DTourFile = async (file) => {
    return uploadToStorage(file.buffer, file.originalname);
};
  