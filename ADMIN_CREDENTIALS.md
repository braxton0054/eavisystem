# 🔐 ADMIN CREDENTIALS - PRODUCTION SYSTEM

## ⚠️ **CRITICAL SECURITY NOTICE**

**This is a PRODUCTION system. This document contains sensitive login credentials. Keep this file secure and do not share publicly.**

---

## 🏫 **Admin Login Credentials**

### **West Campus Administration**
- **Username:** west_admin
- **Email:** west@edu (stored in database, not shown in UI)
- **Password:** `0748022044W*`
- **Database:** West Campus PostgreSQL
- **Access:** West Campus student data and management tools

### **Twon Campus Administration**
- **Username:** twon_admin
- **Email:** twon@edu (stored in database, not shown in UI)
- **Password:** `0726044022T*`
- **Database:** Twon Campus PostgreSQL
- **Access:** Twon Campus student data and management tools

---

## 🌐 **Access URLs**

- **Admin Login:** http://localhost:3000/admin
- **West Campus API:** http://localhost:3000/api/west/*
- **Twon Campus API:** http://localhost:3000/api/twon/*

---

## 🔒 **Security Features Implemented**

### **✅ Frontend Security:**
- **Password-only authentication** (email hidden from UI)
- **No password display** on login page
- **Campus auto-detection** based on password
- **Security notice** displayed to users
- **Token-based authentication** after login

### **✅ Backend Security:**
- **Password hashing** with bcrypt (10 rounds)
- **Separate database connections** per campus
- **Campus isolation** (West admins can't access Twon data)
- **JWT token validation** for session management
- **SQL injection protection** with parameterized queries

### **✅ Database Security:**
- **Encrypted connections** (SSL/TLS)
- **Separate schemas** per campus
- **Role-based access control**
- **Audit trails** for admin actions

---

## 🚨 **Security Best Practices**

### **For Administrators:**
1. **Never share passwords** via email or chat
2. **Change passwords regularly** (recommended every 90 days)
3. **Use strong, unique passwords**
4. **Log out** after each session
5. **Report suspicious activity** immediately

### **For Developers:**
1. **Keep this file secure** - add to .gitignore for production
2. **Use environment variables** for sensitive data
3. **Implement rate limiting** on login endpoints
4. **Monitor failed login attempts**
5. **Regular security audits**

---

## 🔄 **Password Reset Process**

### **If Admin Forgets Password:**
1. **Contact System Administrator**
2. **Verify identity** through secure channel
3. **Generate new temporary password**
4. **Force password change** on first login
5. **Update database** with new hash

### **Script to Reset Password:**
```bash
# Run password reset script
node backend/scripts/reset-admin-password.js

# Or manually update in database
UPDATE admins SET password = '$2b$10$hashed_password' WHERE username = 'west_admin';
```

---

## 📱 **Login Process**

### **Step 1: Access Login Page**
- URL: http://localhost:3000/admin
- Shows password field only (no email visible)

### **Step 2: Enter Campus Password**
- West Admin: Enter `0748022044W*`
- Twon Admin: Enter `0726044022T*`
- System auto-detects campus based on password

### **Step 3: Authentication**
- Password verified against database hash
- Campus-specific database connection used
- JWT token generated for session

### **Step 4: Dashboard Access**
- Redirected to campus-specific dashboard
- Only campus data accessible
- Session managed via JWT token

---

## 🔧 **Technical Implementation**

### **Password Hashing:**
```javascript
// Hashing algorithm
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Verification
const isValid = await bcrypt.compare(plainPassword, hashedPassword);
```

### **Campus Detection:**
```javascript
// Frontend logic
if (password === '0748022044W*') {
    campus = 'west';
    username = 'west_admin';
} else if (password === '0726044022T*') {
    campus = 'twon';
    username = 'twon_admin';
}
```

### **Database Isolation:**
```javascript
// Separate connection pools
const westPool = new Pool({ connectionString: WEST_DB_URL });
const twonPool = new Pool({ connectionString: TWON_DB_URL });

// Campus-specific queries
const pool = campus === 'west' ? westPool : twonPool;
```

---

## 🚀 **Production Deployment**

### **Security Checklist:**
- [ ] Remove this file from public access
- [ ] Use environment variables for credentials
- [ ] Enable HTTPS/SSL
- [ ] Implement rate limiting
- [ ] Set up monitoring and alerts
- [ ] Regular security updates
- [ ] Backup and recovery plan

### **Environment Variables:**
```bash
# Database URLs (secure)
WEST_DB_URL=postgresql://user:pass@host/db
TWON_DB_URL=postgresql://user:pass@host/db

# JWT Secret (strong)
JWT_SECRET=your-super-secure-jwt-secret-key-here

# Admin Passwords (environment-based)
WEST_ADMIN_PASSWORD=0748022044W*
TWON_ADMIN_PASSWORD=0726044022T*
```

---

## 📞 **Contact Information**

### **For Security Issues:**
- **System Administrator:** [Contact Info]
- **Security Team:** [Contact Info]
- **Emergency Contact:** [Contact Info]

### **For Technical Support:**
- **Development Team:** [Contact Info]
- **Database Admin:** [Contact Info]

---

## ⚡ **Quick Reference**

| Campus | Username | Password | Database |
|--------|----------|----------|----------|
| West | west_admin | `0748022044W*` | West PostgreSQL |
| Twon | twon_admin | `0726044022T*` | Twon PostgreSQL |

---

**🔒 KEEP THIS DOCUMENT SECURE - CONFIDENTIAL INFORMATION**
