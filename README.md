# College Admission System

A unified college admission system with dual campus support (Twon & West) serving both frontend and backend on a single port.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Visit http://localhost:3000
```

## 📁 Project Structure

```
admission-system/
├── server.js              # Main unified server
├── package.json           # Dependencies and scripts
├── vercel.json           # Vercel deployment config
├── .env                  # Environment variables
├── public/               # Frontend static files
│   ├── index.html       # Home page
│   ├── student/         # Student application
│   ├── admin/           # Admin dashboard
│   └── assets/          # CSS, images, JS
└── backend/             # Backend source code
    ├── src/             # Routes, models, controllers
    ├── scripts/         # Database setup scripts
    └── sql/             # Database schemas
```

## 🌐 Access URLs

- **Home:** http://localhost:3000/
- **Student Application:** http://localhost:3000/student
- **Admin Login:** http://localhost:3000/admin
- **API Base:** http://localhost:3000/api/
- **Health Check:** http://localhost:3000/health

## � Features

- ✅ **Unified Port 3000:** Frontend + backend on single port
- ✅ **Dual Campus Support:** Twon & West campuses
- ✅ **Automatic Admission Numbers:** Campus-specific generation
- ✅ **Student Registration:** Complete application workflow
- ✅ **Admin Dashboard:** Student management system
- ✅ **Vercel Ready:** Optimized for deployment
- ✅ **No CORS Issues:** Same origin architecture

## �️ Database Setup

```bash
# Setup Twon campus
node backend/scripts/setup-twon-campus.js

# Setup West campus  
node backend/scripts/setup-west-campus.js
```

## 🌍 Deployment

### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Environment Variables
Set these in your deployment platform:
- `PORT=3000`
- `WEST_DB_URL=your-west-neon-db-url`
- `TWON_DB_URL=your-twon-neon-db-url`
- `JWT_SECRET=your-production-secret`

## 📋 Campus Information

| Campus | Admission Format | Database |
|--------|------------------|----------|
| Twon   | TWON-2025-{seq}  | Neon PostgreSQL |
| West   | WEST-2025-{seq}  | Neon PostgreSQL |

## 🎯 API Endpoints

### Student Registration
- `POST /api/twon/registration/register`
- `POST /api/west/registration/register`

### Admin Management
- `POST /api/{campus}/admin/login`
- `GET /api/{campus}/students`
- `PUT /api/{campus}/students/{id}/status`

### System
- `GET /health` - Health check
- `GET /api/{campus}/courses` - Course list
- `GET /api/{campus}/departments` - Department list

## 🚨 Troubleshooting

**Server won't start?**
```bash
# Check if port 3000 is free
netstat -an | grep 3000
```

**Frontend not loading?**
- Verify `/public` directory exists
- Check `public/index.html` is present

**API errors?**
- Test with `/health` endpoint first
- Check environment variables
- Verify database connections

---

**Ready for production deployment on Vercel!** 🎉
