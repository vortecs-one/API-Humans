const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ensure directories exist
['uploads/files', 'uploads/facial'].forEach(dir => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const fileStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/files/');
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
    }
});

const facialStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/facial/');
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, file.fieldname + '-' + unique + path.extname(file.originalname));
    }
});

const commonFilter = (req, file, cb) => {
    const allowed = [
        'image/jpeg', 'image/png', 'application/pdf',
        'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska'
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Invalid file type'));
};

const uploadFile = multer({
    storage: fileStorage,
    limits: { fileSize: 1024 * 1024 * 200 },
    fileFilter: commonFilter
});

const uploadFacial = multer({
    storage: facialStorage,
    limits: { fileSize: 1024 * 1024 * 10 }, // facial images smaller
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png'];
        if (allowed.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Invalid facial image type'));
    }
});

module.exports = {
    uploadFile,
    uploadFacial
};

