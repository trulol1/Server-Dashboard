#!/bin/bash

# Render Deployment Setup Script
# This script creates the Render services using the Render API

RENDER_API_KEY="rnd_gLs25SFdgEE9jE7LOMiVeF7pV6Vh"
GITHUB_REPO="https://github.com/trulol1/Server-Dashboard"

echo "🚀 Setting up Render deployment..."

# Create Auth Server (Node.js)
echo "Creating Auth Server service..."
curl -X POST https://api.render.com/v1/services \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "web_service",
    "name": "server-dashboard-auth",
    "repo": "'$GITHUB_REPO'",
    "autoDeploy": true,
    "branch": "main",
    "buildCommand": "cd auth-server && npm install",
    "startCommand": "cd auth-server && node server.js",
    "envVars": [
      {
        "key": "NODE_ENV",
        "value": "production"
      },
      {
        "key": "PORT",
        "value": "3000"
      },
      {
        "key": "JWT_SECRET",
        "generateValue": true
      },
      {
        "key": "TOTP_SECRET",
        "value": "JBSWY3DPEHPK3PXP"
      }
    ],
    "serviceDetails": {
      "env": "node",
      "region": "oregon",
      "plan": "starter",
      "healthCheckPath": "/health"
    }
  }'

echo ""
echo "Creating Static Site (Dashboard)..."
curl -X POST https://api.render.com/v1/services \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "static_site",
    "name": "server-dashboard",
    "repo": "'$GITHUB_REPO'",
    "autoDeploy": true,
    "branch": "main",
    "buildCommand": "echo No build needed",
    "staticPublishPath": ".",
    "serviceDetails": {
      "region": "oregon"
    }
  }'

echo ""
echo "✅ Deployment setup complete!"
echo "📝 Next steps:"
echo "1. Go to https://dashboard.render.com to view your services"
echo "2. Update TOTP_SECRET in the auth server environment variables"
echo "3. Update AUTH_API_URL in your frontend code to point to your auth server URL"
