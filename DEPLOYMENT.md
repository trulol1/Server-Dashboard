# Render Deployment Setup

## Automated Deployment Setup Complete! 🚀

Your Server Dashboard is now configured for automatic deployment to Render.

### What I've Set Up:

1. **render.yaml** - Blueprint configuration for Render services
2. **GitHub Actions Workflow** - Auto-deploys on push to main branch
3. **Health check endpoint** - Added to auth server for monitoring

### Next Steps:

#### 1. Add GitHub Secret (REQUIRED)
Go to: https://github.com/trulol1/Server-Dashboard/settings/secrets/actions

- Click "New repository secret"
- Name: `RENDER_API_KEY`
- Value: `rnd_gLs25SFdgEE9jE7LOMiVeF7pV6Vh`
- Click "Add secret"

#### 2. Create Render Services (Choose ONE method):

**Method A: Using Render Dashboard (Recommended)**
1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect your GitHub repo: `trulol1/Server-Dashboard`
4. Render will auto-detect the `render.yaml` file
5. Click "Apply" to create both services

**Method B: Using the deployment script**
```bash
bash deploy-to-render.sh
```

#### 3. Configure Environment Variables

After services are created, update these in Render Dashboard:

**For `server-dashboard-auth` service:**
- `JWT_SECRET` - Auto-generated (keep it)
- `TOTP_SECRET` - Use your existing secret or generate a new one
- `ALLOWED_ORIGINS` - Add your dashboard URL

**For `server-dashboard` static site:**
- `AUTH_API_URL` - Set to your auth server URL (e.g., `https://server-dashboard-auth.onrender.com`)

#### 4. Update Frontend Configuration

Update [auth-api.js](auth-api.js) with your auth server URL:
```javascript
const AUTH_API_BASE = 'https://server-dashboard-auth.onrender.com/api';
```

### How It Works:

1. Push code to GitHub main branch
2. GitHub Actions automatically triggers
3. Render API deploys both services
4. Your dashboard is live!

### Deployment URLs:
- **Auth Server**: `https://server-dashboard-auth.onrender.com`
- **Dashboard**: `https://server-dashboard.onrender.com`

### Testing Deployment:

```bash
# Test auth server health
curl https://server-dashboard-auth.onrender.com/health

# Test dashboard
curl https://server-dashboard.onrender.com
```

### Troubleshooting:

- **Deployment fails**: Check logs at https://dashboard.render.com
- **Auth not working**: Verify TOTP_SECRET matches your authenticator app
- **CORS errors**: Add dashboard URL to ALLOWED_ORIGINS in auth server
