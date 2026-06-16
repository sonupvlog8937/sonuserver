import fs from 'fs';
import path from 'path';

/**
 * Get the upload directory path based on environment
 * Vercel: /tmp (writable in serverless)
 * Local: uploads (project directory)
 */
export const getUploadDir = () => {
    return process.env.VERCEL ? '/tmp' : 'uploads';
};

/**
 * Get full file path in upload directory
 * @param {string} filename - The filename
 * @returns {string} Full path to file
 */
export const getUploadPath = (filename) => {
    const uploadDir = getUploadDir();
    return path.join(uploadDir, filename);
};

/**
 * Safely delete uploaded file
 * @param {string} filepath - Path to file or just filename
 */
export const deleteUploadedFile = (filepath) => {
    try {
        // If only filename provided, prepend upload directory
        const fullPath = filepath.includes('/') || filepath.includes('\\') 
            ? filepath 
            : getUploadPath(filepath);
        
        if (fs.existsSync(fullPath)) {
            fs.unlinkSync(fullPath);
            console.log(`✅ Deleted file: ${fullPath}`);
        } else {
            console.log(`⚠️ File not found: ${fullPath}`);
        }
    } catch (error) {
        console.error(`❌ Failed to delete file ${filepath}:`, error.message);
    }
};

/**
 * Check if running on Vercel
 * @returns {boolean}
 */
export const isVercel = () => {
    return !!process.env.VERCEL;
};
