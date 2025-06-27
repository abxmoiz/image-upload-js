// server.js - Complete Working Server with IP Whitelisting
const express = require('express');
const multer = require('multer');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for testing (images will be lost on restart)
const uploadedFiles = new Map();

// IP Whitelisting Configuration
const ipWhitelist = ['20.218.226.24//']; // Your specified VPN IP

// IP Checking Middleware - DEFINED HERE
const checkIP = (req, res, next) => {
    // Get client IP address with multiple fallbacks
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                    req.headers['x-real-ip'] ||
                    req.headers['cf-connecting-ip'] ||
                    req.connection.remoteAddress ||
                    req.socket.remoteAddress ||
                    req.ip;
    
    // Clean IPv6 mapped IPv4 addresses
    const cleanIP = clientIP?.replace('::ffff:', '') || 'unknown';
    
    console.log(`🔍 Access attempt from IP: ${cleanIP}`);
    console.log(`📋 Request: ${req.method} ${req.path}`);
    
    // Check if IP is localhost (for development)
    const isLocalhost = cleanIP === '127.0.0.1' || 
                       cleanIP === '::1' || 
                       cleanIP === 'localhost' ||
                       cleanIP === '::ffff:127.0.0.1';
    
    // Allow access if IP is whitelisted OR localhost in development
    if (ipWhitelist.includes(cleanIP) || (process.env.NODE_ENV !== 'production' && isLocalhost)) {
        console.log(`✅ Access granted to IP: ${cleanIP}`);
        next();
    } else {
        console.log(`❌ Access denied to IP: ${cleanIP}`);
        res.status(403).json({ 
            error: 'Access Denied', 
            message: 'Your IP address is not whitelisted',
            yourIP: cleanIP,
            allowedIPs: ipWhitelist,
            timestamp: new Date().toISOString(),
            note: 'This application is restricted to authorized IP addresses only'
        });
    }
};

// Middleware Setup
app.set('trust proxy', true); // Trust proxy for correct IP detection
app.use(cors({
    origin: true,
    credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Apply IP checking to protected routes
app.use('/api', checkIP);  // Protect all API routes

// Also protect the main page
app.use('/', (req, res, next) => {
    if (req.path === '/' || req.path === '/index.html') {
        checkIP(req, res, next);
    } else {
        next();
    }
});

// Configure multer for memory storage (Vercel compatible)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit for testing
        files: 5 // Max 5 files for testing
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Testing: Only image files allowed (JPEG, PNG, GIF, WebP)'));
        }
    }
});

// ROUTES

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Health check endpoint (no IP restriction for monitoring)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK',
        message: 'Testing server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        ipWhitelist: ipWhitelist,
        totalImages: uploadedFiles.size
    });
});

// Get all uploaded images
app.get('/api/images', (req, res) => {
    try {
        const images = Array.from(uploadedFiles.values()).map(file => ({
            id: file.id,
            originalName: file.originalName,
            size: file.size,
            uploadDate: file.uploadDate,
            url: `/api/image/${file.id}`
        }));
        
        res.json({ 
            success: true, 
            images,
            total: images.length,
            note: 'Testing mode: Images stored in memory only'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Serve individual image
app.get('/api/image/:id', (req, res) => {
    try {
        const imageId = parseFloat(req.params.id);
        const file = uploadedFiles.get(imageId);
        
        if (!file) {
            return res.status(404).json({ 
                success: false, 
                error: 'Image not found',
                note: 'Testing mode: Image may have been cleared from memory'
            });
        }

        res.set({
            'Content-Type': file.mimetype,
            'Content-Length': file.buffer.length,
            'Cache-Control': 'no-cache' // No caching for testing
        });
        
        res.send(file.buffer);
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Upload images
app.post('/api/upload', upload.array('images', 5), (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'No files uploaded',
                note: 'Testing: Please select image files to upload'
            });
        }

        const uploadedImages = req.files.map(file => {
            const fileData = {
                id: Date.now() + Math.random(),
                originalName: file.originalname,
                size: file.size,
                uploadDate: new Date().toISOString(),
                buffer: file.buffer,
                mimetype: file.mimetype
            };
            
            // Store in memory
            uploadedFiles.set(fileData.id, fileData);
            return fileData;
        });

        console.log(`📤 Uploaded ${uploadedImages.length} files. Total stored: ${uploadedFiles.size}`);

        res.json({ 
            success: true, 
            message: `Testing: ${uploadedImages.length} file(s) uploaded successfully`,
            files: uploadedImages.map(f => ({
                id: f.id,
                originalName: f.originalName,
                size: f.size,
                uploadDate: f.uploadDate,
                url: `/api/image/${f.id}`
            })),
            note: 'Images stored in memory for testing - will be lost on server restart'
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete image
app.delete('/api/images/:id', (req, res) => {
    try {
        const imageId = parseFloat(req.params.id);
        
        if (!uploadedFiles.has(imageId)) {
            return res.status(404).json({ 
                success: false, 
                error: 'Image not found for deletion',
                note: 'Testing: Image may have already been deleted'
            });
        }

        // Remove from memory storage
        uploadedFiles.delete(imageId);
        
        console.log(`🗑️ Deleted image ${imageId}. Remaining: ${uploadedFiles.size}`);

        res.json({ 
            success: true, 
            message: 'Testing: Image deleted successfully',
            remainingImages: uploadedFiles.size
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ 
                success: false, 
                error: 'Testing: File too large. Maximum 5MB per file.' 
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ 
                success: false, 
                error: 'Testing: Too many files. Maximum 5 files allowed.' 
            });
        }
    }
    res.status(500).json({ success: false, error: error.message });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ 
        success: false, 
        error: 'Endpoint not found',
        availableEndpoints: [
            'GET /',
            'GET /health',
            'GET /api/images',
            'POST /api/upload',
            'DELETE /api/images/:id'
        ]
    });
});

// Start server for local development
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`🧪 Testing Server running on port ${PORT}`);
        console.log(`🔒 IP Whitelist: ${ipWhitelist.join(', ')}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`📝 Note: This is for testing purposes only`);
        console.log(`🖥️  Local URL: http://localhost:${PORT}`);
        console.log(`📁 Storage: Memory only (temporary)`);
    });
}

// Export for Vercel
module.exports = app;