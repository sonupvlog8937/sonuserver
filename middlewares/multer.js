import multer from 'multer';
import fs from 'fs';
import path from 'path';

// For Vercel serverless: use /tmp directory which is writable
const uploadDir = process.env.VERCEL ? '/tmp' : 'uploads';

// Create uploads directory if it doesn't exist (local only)
if (!process.env.VERCEL) {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        console.log("📁 Saving file:", file.originalname);
        const uniqueName = `${Date.now()}_${file.originalname}`;
        cb(null, uniqueName);
    },
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        // Accept images only
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Only image files are allowed!'), false);
        }
        cb(null, true);
    }
});

export default upload;