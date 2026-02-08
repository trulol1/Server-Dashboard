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

## Exposing Jellyfin with Cloudflare Tunnel (Free!)

### Why Cloudflare Tunnel?
- ✅ **100% FREE** - No cost for tunneling
- ✅ **No port forwarding** - No need to open router ports
- ✅ **Hides your IP** - Your public IP stays private
- ✅ **SSL included** - Free HTTPS certificate
- ✅ **Easy setup** - Just install and run

### Prerequisites
1. Free Cloudflare account at https://cloudflare.com
2. A domain name (can use a free one from Freenom, or buy cheap from Namecheap/Porkbun)
3. Domain added to Cloudflare (use their nameservers)

### Setup Steps

**1. Install cloudflared on Your Jellyfin Server**

Windows (PowerShell as Admin):
```powershell
# Download cloudflared
Invoke-WebRequest -Uri "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe" -OutFile "$env:ProgramFiles\cloudflared.exe"

# Verify installation
& "$env:ProgramFiles\cloudflared.exe" --version
```

Linux:
```bash
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

**2. Login to Cloudflare**
```powershell
cloudflared tunnel login
```
This opens a browser - select your domain.

**3. Create a Tunnel**
```powershell
cloudflared tunnel create jellyfin
```
Save the tunnel ID that's displayed!

**4. Create Configuration File**

Create `config.yml` in:
- Windows: `C:\Users\YourUsername\.cloudflared\config.yml`
- Linux: `~/.cloudflared/config.yml`

```yaml
tunnel: YOUR-TUNNEL-ID-HERE
credentials-file: C:\Users\YourUsername\.cloudflared\YOUR-TUNNEL-ID.json

ingress:
  - hostname: jellyfin.yourdomain.com
    service: http://localhost:8096
  - service: http_status:404
```

**5. Create DNS Record**
```powershell
cloudflared tunnel route dns jellyfin jellyfin.yourdomain.com
```

**6. Run the Tunnel**

Test it:
```powershell
cloudflared tunnel run jellyfin
```

**7. Install as Windows Service (Persistent)**
```powershell
cloudflared service install
cloudflared service start
```

Linux (systemd):
```bash
sudo cloudflared service install
sudo systemctl start cloudflared
sudo systemctl enable cloudflared
```

### Add to Your Dashboard

In your `index.html` or wherever you have server cards, add a Jellyfin button:

```html
<div class="card jellyfin-card">
  <img src="assets/icons/jellyfin.png" alt="Jellyfin">
  <h2>Jellyfin Media Server</h2>
  <button onclick="window.open('https://jellyfin.yourdomain.com', '_blank')">
    Open Jellyfin
  </button>
</div>
```

### Cost Breakdown
- Cloudflare Tunnel: **$0/month** ✅
- Cloudflare account: **$0/month** ✅
- SSL certificate: **$0/month** (included) ✅
- Domain: **~$10/year** (or free from Freenom)

### Troubleshooting

**Tunnel won't start**
- Check Jellyfin is running on port 8096
- Verify config.yml paths are correct
- Run `cloudflared tunnel info jellyfin` to check status

**Can't access via domain**
- Wait 2-5 minutes for DNS propagation
- Check DNS with: `nslookup jellyfin.yourdomain.com`
- Verify tunnel is running: `cloudflared tunnel list`

**SSL errors**
- Cloudflare handles SSL automatically
- Make sure Jellyfin internal URL is `http://` not `https://`

## Next Steps

1. Test locally: `npm start` → `http://localhost:3000`
2. Push to GitHub
3. Deploy backend (Render, Railway, or your own server)
4. Update API URL if using cloud deployment
5. Set up Cloudflare Tunnel for Jellyfin (optional)
6. Share the URL with your team!

Questions? Check README.md or contact your administrator.
