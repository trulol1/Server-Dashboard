#!/bin/bash
# VPS Setup Script for Node.js Auth Server
# Usage: bash vps-setup.sh <your-git-repo-url>

set -e

# 1. Update and install essentials
sudo apt update && sudo apt upgrade -y
sudo apt install -y nodejs npm git ufw

# 2. Clone your project
if [ -z "$1" ]; then
  echo "Usage: bash vps-setup.sh <your-git-repo-url>"
  exit 1
fi
GIT_REPO="$1"
git clone "$GIT_REPO" project
cd project/auth-server

# 3. Install dependencies
npm install

# 4. Create .env file (edit this after script runs!)
cat <<EOT > .env
JWT_SECRET=your_strong_secret
TOTP_SECRET=your_totp_secret
APP_NAME=YourAppName
EOT

echo "Edit .env with your real secrets before running the server!"

# 5. Start the server with PM2
sudo npm install -g pm2
pm2 start server.js --name auth-server
pm2 startup
pm2 save

# 6. Open firewall ports
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3000
sudo ufw --force enable

echo "\nVPS setup complete! Edit .env, set up your domain, and configure HTTPS/reverse proxy as needed."
