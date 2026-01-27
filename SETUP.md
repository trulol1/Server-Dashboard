# Setup Instructions - Secure Backend Authentication

## What Changed

Your dashboard now has:
- ✅ **Secure backend authentication** - Password checked server-side, not in frontend
- ✅ **JWT token-based sessions** - Tokens expire after 24 hours
- ✅ **Environment variables** - Sensitive data kept out of code
- ✅ **Protected files** - `.env` and `node_modules` excluded from git

## Quick Start

### 1. Install Node.js
Download from https://nodejs.org (LTS version)

### 2. Install Dependencies
Open PowerShell in your project folder and run:
```powershell
npm install
```

### 3. Create Environment File
Copy `.env.example` to `.env`:
```powershell
cp .env.example .env
```

### 4. Edit `.env` with Your Settings
Open `.env` in a text editor and change:
```
ADMIN_PASSWORD=your_secure_password_here
JWT_SECRET=create_a_random_string_here_123abc
```

Generate a random JWT_SECRET:
```powershell
# Run this in PowerShell to generate random string
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).Guid + (New-Guid).Guid))
```

### 5. Run the Server
```powershell
npm start
```

Server will be at: `http://localhost:3000`

### 6. Login
- Username: (not used)
- Password: Whatever you set in `ADMIN_PASSWORD`

## For GitHub

### Setup GitHub
1. Initialize git:
```powershell
git init
git config user.name "Your Name"
git config user.email "your@email.com"
```

2. Create repository on github.com

3. Push code:
```powershell
git remote add origin https://github.com/YOUR-USERNAME/serverindex.git
git add .
git commit -m "Add secure backend authentication"
git branch -M main
git push -u origin main
```

### Deployment Options

**Option A: Deploy Backend on Render (Free Tier)**
1. Go to https://render.com
2. Create new Web Service
3. Connect your GitHub repo
4. Set environment variables in Render dashboard
5. Deploy

Then update `API_BASE_URL` in `auth-api.js` to your Render URL

**Option B: Deploy on Your Own Server**
1. SSH into your server
2. Clone repository
3. Install Node and dependencies
4. Set environment variables
5. Run with PM2 for persistence:
```bash
npm install -g pm2
pm2 start server.js --name serverindex
pm2 startup
pm2 save
```

**Option C: Keep Backend Local**
Access from your local network at:
`http://your-computer-ip:3000`

## What's in Each File

| File | Purpose |
|------|---------|
| `server.js` | Express backend with authentication |
| `auth-api.js` | Frontend API communication |
| `script.js` | Dashboard logic (updated for backend) |
| `.env` | Secrets (NOT in git) |
| `.env.example` | Template for `.env` |
| `.gitignore` | Tells git what to exclude |
| `package.json` | Node dependencies |

## Security Checklist

- [ ] Created `.env` file from `.env.example`
- [ ] Set `ADMIN_PASSWORD` to something secure
- [ ] Generated random `JWT_SECRET`
- [ ] `.env` is in `.gitignore`
- [ ] Never commit `.env` to git
- [ ] Changed default port if needed
- [ ] Set `NODE_ENV=production` for production use

## Troubleshooting

**"Command not found: npm"**
- Install Node.js from https://nodejs.org

**"Port 3000 already in use"**
- Change PORT in `.env` to 3001, 3002, etc.

**"Cannot find module"**
- Run `npm install` again

**"Login not working"**
- Check `.env` password matches what you entered
- Check server is running (`npm start`)
- Check browser console for errors (F12)

## Next Steps

1. Test locally: `npm start` → `http://localhost:3000`
2. Push to GitHub
3. Deploy backend (Render, Railway, or your own server)
4. Update API URL if using cloud deployment
5. Share the URL with your team!

Questions? Check README.md or contact your administrator.
