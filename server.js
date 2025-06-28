const express = require('express');
const multer  = require('multer');
const path    = require('path');
const cors    = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// In‐memory storage for testing
const uploadedFiles = new Map();

// Whitelisted IPs
const ipWhitelist = ['20.218.226.24'];

// ------------------------------------------------------------------
// 1) Define your IP‐check middleware exactly once:
const checkIP = (req, res, next) => {
  const clientIP = (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.ip
  ).replace('::ffff:', '');

  const isLocalhost = ['127.0.0.1','::1','localhost','::ffff:127.0.0.1'].includes(clientIP);
  const allowed = ipWhitelist.includes(clientIP) || (process.env.NODE_ENV !== 'production' && isLocalhost);

  console.log(`${allowed ? '✅' : '❌'} [${clientIP}] ${req.method} ${req.originalUrl}`);

  if (allowed) {
    return next();
  }

  // If the client expects HTML, send a custom error page:
  if (req.accepts('html')) {
    return res.status(403)
      .sendFile(path.join(__dirname, 'public', '403.html'));
  }

  // Otherwise, send JSON:
  res.status(403).json({
    error: 'Access Denied',
    message: 'Your IP is not authorized',
    yourIP: clientIP,
    allowedIPs: ipWhitelist,
    timestamp: new Date().toISOString()
  });
};

// ------------------------------------------------------------------
// 2) Set up middleware (only /health is public)
app.set('trust proxy', true);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Public health‐check (no IP restriction)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    totalImages: uploadedFiles.size
  });
});

// Apply IP check to *everything else*
app.use(checkIP);

// Now serve your front‐end **after** the IP check
app.use(express.static(path.join(__dirname, 'public')));

// Multer setup
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp/.test(path.extname(file.originalname).toLowerCase());
    allowed ? cb(null, true) : cb(new Error('Only JPEG/PNG/GIF/WebP allowed'));
  }
});

// API Routes (all already behind `checkIP`)
app.get('/api/images', (req, res) => {
  const images = Array.from(uploadedFiles.values()).map(f => ({
    id:         f.id,
    name:       f.originalName,
    size:       f.size,
    uploadedAt: f.uploadDate,
    url:        `/api/image/${f.id}`
  }));
  res.json({ success: true, images });
});

app.get('/api/image/:id', (req, res) => {
  const file = uploadedFiles.get(+req.params.id);
  if (!file) return res.status(404).json({ error:'Not found' });
  res.type(file.mimetype).send(file.buffer);
});

app.post('/api/upload', upload.array('images', 5), (req, res) => {
  if (!req.files?.length) {
    return res.status(400).json({ error:'No files uploaded' });
  }
  const saved = req.files.map(f => {
    const record = {
      id:         Date.now() + Math.random(),
      originalName: f.originalname,
      size:       f.size,
      uploadDate: new Date().toISOString(),
      buffer:     f.buffer,
      mimetype:   f.mimetype
    };
    uploadedFiles.set(record.id, record);
    return {
      id: record.id,
      name: record.originalName,
      url:  `/api/image/${record.id}`
    };
  });
  res.json({ success:true, files: saved });
});

app.delete('/api/images/:id', (req, res) => {
  const id = +req.params.id;
  if (!uploadedFiles.delete(id)) {
    return res.status(404).json({ error:'Not found' });
  }
  res.json({ success:true, remaining: uploadedFiles.size });
});

// Multer & 404 error handlers
app.use((err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error:'File too large (max 5MB)' });
  }
  if (err.code === 'LIMIT_FILE_COUNT') {
    return res.status(400).json({ error:'Too many files (max 5)' });
  }
  res.status(500).json({ error: err.message });
});

app.use((req, res) => {
  res.status(404).json({ error:'Endpoint not found' });
});

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server listening on ${PORT} — IP whitelist: ${ipWhitelist}`);
  });
}

module.exports = app;
