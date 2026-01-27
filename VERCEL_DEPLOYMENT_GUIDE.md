# 🚀 Vercel Deployment Guide

I have prepared your project for deployment on Vercel. Here are the steps to get it live:

---

## 1️⃣ Prerequisites
- A [Vercel](https://vercel.com) account.
- The [Vercel CLI](https://vercel.com/download) installed (optional but recommended).
- Your code pushed to a GitHub repository.

---

## 2️⃣ Important Configuration Changes
I have made several changes to ensure compatibility with Vercel's serverless environment:
- **`vercel.json`**: Added a configuration file to handle routing and serverless function setup.
- **`.gitignore`**: Added a ignore file to prevent sensitive and temporary files from being uploaded.
- **Ephemeral Storage**: Modified the system to use the `/tmp` directory for PDF generation and file uploads. 
  > [!WARNING]
  > Files stored in `/tmp` are ephemeral and will be deleted periodically or when the serverless function cold-starts. For permanent storage, consider using **Vercel Blob** or **AWS S3**.
- **Env Variables**: Database connections are now correctly read from environment variables.

---

## 3️⃣ Deployment Steps

### Method A: Connect your GitHub Repo (Recommended)
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **"Add New"** -> **"Project"**.
3. Import your repository.
4. In the **Environment Variables** section, copy and paste everything from your local `.env` file.
   - `WEST_DB_URL`
   - `TWON_DB_URL`
   - `JWT_SECRET`
   - `EMAIL_USER`
   - `EMAIL_PASS`
   - (and others...)
5. Click **"Deploy"**.

### Method B: Using Vercel CLI
Run the following command in your terminal:
```bash
vercel --prod
```

---

## 4️⃣ Required Environment Variables
Make sure to set these in the Vercel Dashboard:

| Variable | Description |
|----------|-------------|
| `WEST_DB_URL` | Neon DB URL for West Campus |
| `TWON_DB_URL` | Neon DB URL for Twon Campus |
| `JWT_SECRET` | A secure random string for tokens |
| `EMAIL_USER` | Your Gmail address (`eastafricavision1@gmail.com`) |
| `EMAIL_PASS` | Your Gmail App Password (`wkksevpvzajotqeu`) |
| `NODE_ENV` | Set to `production` |

---

## 🛠️ Post-Deployment Check
Once deployed, verify:
1. ✅ **API Working**: Visit `https://your-project.vercel.app/api/test`
2. ✅ **Admin Login**: Log into the admin panel.
3. ✅ **PDF Generation**: Try manually adding a student and downloading the PDF.
4. ✅ **Email Sending**: Check if emails are still being delivered correctly.

---

## ⚠️ Notes for Production
- **Database Access**: Ensure your Neon DB allows connections from all IP addresses (standard for serverless) or is configured for Vercel integration.
- **PDF persistence**: Since Vercel is serverless, admission letters generated today might not be there tomorrow. The system will try to re-generate them if they are missing, but for best performance, an external storage solution is recommended.

**Congratulations! Your system is now cloud-ready!** 🚀
