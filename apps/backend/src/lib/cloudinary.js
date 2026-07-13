const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Cloudinary SDK automatically picks up CLOUDINARY_URL from process.env
if (process.env.CLOUDINARY_URL) {
  cloudinary.config();
} else {
  console.warn('⚠️ CLOUDINARY_URL is not set in environment variables');
}

/**
 * Uploads a local file to Cloudinary and returns the secure URL.
 * @param {string} filePath - Path to the local file.
 * @param {string} folder - Folder name in Cloudinary.
 * @returns {Promise<{url: string, publicId: string}>}
 */
const uploadToCloudinary = async (filePath, folder = 'bm-booking') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto', // Auto-detects image or video
    });
    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error('[CLOUDINARY] Upload failed:', error);
    throw error;
  }
};

/**
 * Uploads a file to Cloudinary and deletes the local temp file after completion.
 * @param {Express.Multer.File} file - Multer file object.
 * @param {string} folder - Target Cloudinary folder name.
 * @returns {Promise<string|null>} Secure URL of the uploaded asset or null.
 */
const handleCloudinaryUpload = async (file, folder = 'bm-booking') => {
  if (!file) return null;
  try {
    const uploadResult = await uploadToCloudinary(file.path, folder);
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return uploadResult.url;
  } catch (error) {
    if (fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    throw error;
  }
};

module.exports = {
  cloudinary,
  uploadToCloudinary,
  handleCloudinaryUpload,
};
