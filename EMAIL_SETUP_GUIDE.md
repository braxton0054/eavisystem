# Email Configuration Guide

## Current Issue
The email service is configured but the Gmail credentials are being rejected. This is likely because:

1. **App Password is incorrect or expired**
2. **2-Step Verification is not enabled** on the Gmail account
3. **Less secure app access** needs to be configured

## ✅ Solution: Set Up Gmail App Password

### Step 1: Enable 2-Step Verification
1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left menu
3. Under "Signing in to Google", click on **2-Step Verification**
4. Follow the steps to enable it

### Step 2: Generate App Password
1. Go to: https://myaccount.google.com/apppasswords
2. Select app: **Mail**
3. Select device: **Other (Custom name)** → Enter "Admission System"
4. Click **Generate**
5. Copy the 16-character password (it will look like: `xxxx xxxx xxxx xxxx`)

### Step 3: Update .env File
Replace the current `EMAIL_PASS` in your `.env` file with the new app password:

```env
EMAIL_PASS=your-16-character-app-password-here
```

**Note:** Remove any spaces from the app password when pasting it.

## Current Configuration

Your `.env` file currently has:
- **EMAIL_USER**: eastafricavision1@gmail.com
- **EMAIL_PASS**: nlmehufrpoqelet (appears to be invalid)

## Testing Email

After updating the password, run:
```bash
node test_email.js
```

## Email Features

The system automatically sends emails when:
- ✅ A student registers (at `/api/:campus/registration/register`)
- ✅ Email includes:
  - Beautiful HTML template with school branding
  - Admission letter PDF attachment
  - Fee structure PDF attachment
  - Student details (admission number, course, campus)
  - Next steps instructions

## Email Template Preview

The email includes:
- 🎓 Professional header with gradient
- 📋 Student information box
- ✅ List of attached documents
- 📌 Next steps checklist
- 💼 School contact information

## Alternative: Use Different Email Provider

If you prefer not to use Gmail, you can use other providers:

### Outlook/Hotmail
```env
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-password
```

### Yahoo
```env
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
EMAIL_USER=your-email@yahoo.com
EMAIL_PASS=your-app-password
```

### Custom SMTP
```env
EMAIL_HOST=your-smtp-server.com
EMAIL_PORT=587
EMAIL_USER=your-email@domain.com
EMAIL_PASS=your-password
```

## Troubleshooting

### Error: "Invalid login"
- Generate a new App Password
- Make sure 2-Step Verification is enabled
- Check that EMAIL_USER matches the Gmail account

### Error: "Connection timeout"
- Check your internet connection
- Verify EMAIL_HOST and EMAIL_PORT are correct
- Check if your firewall is blocking port 587

### Emails not being received
- Check spam/junk folder
- Verify the student email address is correct
- Check Gmail sent folder to confirm email was sent

## Need Help?

If you continue to have issues:
1. Try generating a fresh App Password
2. Make sure you're using the correct Gmail account
3. Check Google Account security settings
4. Consider using a different email provider
