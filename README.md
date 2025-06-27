# 🧪 Image Upload Testing Application

A testing application for image upload and delete functionality with IP whitelisting, deployed on Vercel.

## 🎯 Purpose
This application is built **for testing purposes only** to demonstrate:
- Image upload functionality
- Image deletion capabilities  
- IP address whitelisting (20.218.226.24)
- Vercel serverless deployment

## ⚡ Quick Deploy to Vercel

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit: Testing image upload app"
git remote add origin https://github.com/yourusername/image-upload-app.git
git push -u origin main
```

### Step 2: Deploy on Vercel
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import from GitHub
4. Select this repository
5. Configure:
   - **Framework Preset**: Other
   - **Build Command**: `npm run build`
   - **Output Directory**: `public`
   - **Install Command**: `npm install`
6. Click "Deploy"

### Step 3: Access Your App
- **URL**: `https://your-app-name.vercel.app`
- **Access**: Only from IP `20.218.226.24`

## 🔧 Testing Features

### Upload Testing
- ✅ Drag & drop multiple images
- ✅ File type validation (JPEG, PNG, GIF, WebP)
- ✅ File size limit (5MB per image)
- ✅ Maximum 5 files per upload
- ✅ Real-time progress feedback

### Delete Testing  
- ✅ Individual image deletion
- ✅ Confirmation prompts
- ✅ Real-time UI updates

### Security Testing
- ✅ IP whitelisting (20.218.226.24 only)
- ✅ File type restrictions
- ✅ Size limitations
- ✅ CORS protection

## 🏗️ Project Structure
```
image-upload-app/
├── server.js              # Main serverless function
├── package.json           # Dependencies  
├── vercel.json            # Vercel configuration
├── .gitignore             # Git ignore rules
├── README.md              # This file
└── public/
    └── index.html         # Frontend application
```

## 📋 Testing Limitations

⚠️ **Important Testing Notes:**
- Images stored in **memory only** (lost on server restart)
- **No persistent storage** (this is intentional for testing)
- **5MB max** file size per image
- **5 files max** per upload session
- Access restricted to **single IP address**

## 🔒 IP Whitelisting

Only the following IP can access the application:
- **Whitelisted IP**: `20.218.226.24`
- **Local Development**: `127.0.0.1` (development only)
- **Other IPs**: Blocked with 403 Forbidden

## 🚀 Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Server runs on http://localhost:3000
```

## 📊 API Endpoints

| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/` | Main application | Restricted |
| GET | `/health` | Health check | Public |
| GET | `/api/images` | List all images | Restricted |
| POST | `/api/upload` | Upload images | Restricted |
| DELETE | `/api/images/:id` | Delete image | Restricted |

## 🧪 Testing Scenarios

### Basic Upload Test
1. Access application from whitelisted IP
2. Select 1-5 image files (under 5MB each)
3. Verify upload success message
4. Check images appear in gallery

### Validation Testing
1. Try uploading non-image files → Should be rejected
2. Try uploading files over 5MB → Should be rejected  
3. Try uploading more than 5 files → Should be rejected

### Delete Testing
1. Upload test images
2. Click delete button on any image
3. Confirm deletion in popup
4. Verify image is removed from gallery

### Security Testing
1. Access from non-whitelisted IP → Should get 403 Forbidden
2. Check API endpoints are protected
3. Verify file type restrictions work

## 🔧 Troubleshooting

### Common Issues:

**403 Forbidden Error**
- Verify you're accessing from IP: 20.218.226.24
- Check browser console for IP information

**Upload Fails**
- Ensure files are images (JPEG, PNG, GIF, WebP)
- Check file size is under 5MB
- Maximum 5 files per upload

**Images Don't Load**
- Images are stored in memory only
- They'll be lost when server restarts
- This is expected behavior for testing

**Server Not Responding**
- Check Vercel deployment status
- View deployment logs in Vercel dashboard
- Ensure all files are properly committed to GitHub

## 📝 Testing Checklist

- [ ] Successfully deploy to Vercel
- [ ] Access application from whitelisted IP
- [ ] Upload single image file
- [ ] Upload multiple image files
- [ ] Test file size validation
- [ ] Test file type validation
- [ ] Delete uploaded images
- [ ] Verify IP blocking works
- [ ] Check all error messages
- [ ] Test drag & drop functionality

## ⚙️ Environment Variables

No environment variables required for basic testing.

Optional (in Vercel dashboard):
```
NODE_ENV=production
VERCEL_ENV=production
```

## 📞 Support

This is a testing application. For issues:
1. Check Vercel deployment logs
2. Verify file structure matches documentation
3. Ensure GitHub repository is properly configured
4. Test locally first with `npm run dev`

---

**Note**: This application is designed for testing purposes only and uses temporary memory storage. Images will not persist between server restarts.