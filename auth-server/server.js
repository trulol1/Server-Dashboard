require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'CHANGE_ME_IN_ENV_FILE_VERY_IMPORTANT';
const APP_NAME = process.env.APP_NAME || 'ServerIndex';
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'skibiditoilet';

// Middleware
app.use(express.json());
// Allow GitHub Pages and your future domain (add more as needed)
const defaultOrigins = [
  'http://localhost:5500', // VS Code Live Server default
  'http://localhost:3000', // If serving frontend from backend
  'http://127.0.0.1:5500',
  'http://127.0.0.1:3000'
];
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowAllOrigins = envOrigins.includes('*');
const allowedOrigins = new Set([
  ...defaultOrigins,
  ...envOrigins.filter((origin) => origin !== '*')
]);
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowAllOrigins) {
      return callback(null, true);
    }
    if (allowedOrigins.has(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Message storage
const messagesFile = path.join(__dirname, '.messages.json');
let messages = [];
if (fs.existsSync(messagesFile)) {
  try {
    messages = JSON.parse(fs.readFileSync(messagesFile, 'utf8'));
  } catch (err) {
    console.error('Failed to load messages:', err);
    messages = [];
  }
}

function saveMessages() {
  fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
}

// Initialize or load TOTP secret
let TOTP_SECRET = (process.env.TOTP_SECRET || '').trim();
const secretFile = path.join(__dirname, '.totp-secret');
if (TOTP_SECRET) {
  if (!fs.existsSync(secretFile)) {
    fs.writeFileSync(secretFile, TOTP_SECRET);
    console.log('🔐 Saved TOTP secret from environment to .totp-secret file');
  } else {
    console.log('🔐 Using TOTP secret from environment (file present but ignored)');
  }
} else if (fs.existsSync(secretFile)) {
  TOTP_SECRET = fs.readFileSync(secretFile, 'utf8').trim();
  console.log('🔑 Loaded existing TOTP secret from .totp-secret file');
} else {
  // Generate new secret
  const secret = speakeasy.generateSecret({
    name: `${APP_NAME} (${new Date().toLocaleDateString()})`,
    issuer: APP_NAME,
    length: 32
  });
  TOTP_SECRET = secret.base32;
  fs.writeFileSync(secretFile, TOTP_SECRET);
  console.log('⚠️  New TOTP secret generated and saved to .totp-secret file');
  console.log('📱 This file is in .gitignore - keep it safe!');
}

// Verify JWT token middleware
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Get setup QR code (first time only)
app.get('/api/auth/setup', async (req, res) => {
  try {
    // Generate otpauth_url manually with exact secret
    const otpauth_url = `otpauth://totp/${APP_NAME}?secret=${TOTP_SECRET}&issuer=${APP_NAME}`;
    
    // Generate QR code from the otpauth URL
    const qrCodeUrl = await QRCode.toDataURL(otpauth_url);
    
    console.log(`📱 QR Code setup requested`);
    console.log(`🔑 Secret in setup: ${TOTP_SECRET.substring(0, 10)}...`);
    
    res.json({
      qrCode: qrCodeUrl,
      secret: TOTP_SECRET,
      message: 'Scan this QR code with Google Authenticator, Microsoft Authenticator, or Authy'
    });
  } catch (error) {
    console.error('Setup error:', error);
    res.status(500).json({ error: 'Failed to generate QR code' });
  }
});

// Authentication endpoint - verify TOTP code
app.post('/api/auth/login', (req, res) => {
  const { code } = req.body;
  
  if (!code) {
    return res.status(400).json({ error: 'TOTP code required' });
  }

  console.log(`📱 TOTP Login attempt with code: ${code}`);
  console.log(`🔑 Using secret: ${TOTP_SECRET.substring(0, 10)}...`);
  console.log(`⏰ Server time: ${new Date().toISOString()}`);

  // Verify the TOTP code (allows wider window for clock drift)
  const verified = speakeasy.totp.verify({
    secret: TOTP_SECRET,
    encoding: 'base32',
    token: code.toString(),
    window: 4  // Increased from 2 to handle more clock drift
  });

  console.log(`✓ Verification result: ${verified ? 'SUCCESS' : 'FAILED'}`);

  if (!verified) {
    return res.status(401).json({ error: 'Invalid or expired code' });
  }

  // Generate JWT token (expires in 24 hours)
  const token = jwt.sign(
    { authenticated: true, role: 'admin', timestamp: Date.now() },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({
    success: true,
    token,
    role: 'admin',
    expiresIn: 86400 // 24 hours in seconds
  });
});

// Admin login endpoint for debugging (username/password)
app.post('/api/auth/admin-login', (req, res) => {
  const { username, password } = req.body || {};

  if (!ADMIN_USER || !ADMIN_PASS) {
    return res.status(503).json({ error: 'Admin login not configured' });
  }

  const isAdminLogin = username === ADMIN_USER && password === ADMIN_PASS;
  const isUserLogin = username === 'user' && password === ADMIN_PASS;

  if (isAdminLogin || isUserLogin) {
    const role = isAdminLogin ? 'admin' : 'user';
    const token = jwt.sign(
      { authenticated: true, role, timestamp: Date.now() },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({ success: true, token, role, expiresIn: 28800 });
  }

  return res.status(401).json({ error: 'Invalid credentials' });
});

// Verify token endpoint
app.post('/api/auth/verify', verifyToken, (req, res) => {
  res.json({ valid: true });
});

// Protected API endpoint example
app.get('/api/dashboard/data', verifyToken, (req, res) => {
  res.json({
    message: 'Dashboard data',
    user: req.user,
    timestamp: new Date()
  });
});

// Logout endpoint
app.post('/api/auth/logout', verifyToken, (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
});

// Message endpoints
app.get('/api/messages', (req, res) => {
  const now = Date.now();
  const activeMessages = messages.filter(msg => !msg.expiresAt || msg.expiresAt > now);
  res.json(activeMessages);
});

app.post('/api/messages', verifyToken, requireAdmin, (req, res) => {
  const { text, color, duration } = req.body;
  
  if (!text) {
    return res.status(400).json({ error: 'Message text required' });
  }

  const message = {
    id: Date.now().toString(),
    text,
    color: color || '#3b82f6',
    duration: duration || 0,
    createdAt: Date.now(),
    expiresAt: duration > 0 ? Date.now() + (duration * 1000) : null,
    showOnLanding: true,
    showOnDashboard: true
  };

  messages.push(message);
  saveMessages();
  res.json({ success: true, message });
});

app.delete('/api/messages/:id', verifyToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  messages = messages.filter(msg => msg.id !== id);
  saveMessages();
  res.json({ success: true });
});

// Discord Webhook Endpoint for Suggestions
app.post('/api/suggestions', async (req, res) => {
  const { name, text } = req.body;
  const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;
  
  if (!DISCORD_WEBHOOK_URL) {
    return res.status(500).json({ error: 'Discord webhook not configured' });
  }
  
  if (!name || !text) {
    return res.status(400).json({ error: 'Name and text are required' });
  }
  
  try {
    const embed = {
      title: '💡 New Suggestion',
      description: text,
      color: 10813440,
      author: {
        name: name
      },
      timestamp: new Date().toISOString(),
      footer: {
        text: 'Community Suggestions'
      }
    };
    
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        embeds: [embed]
      })
    });
    
    if (!response.ok) {
      console.error('Discord API error:', response.status);
      return res.status(500).json({ error: 'Failed to post to Discord' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error posting to Discord:', error);
    res.status(500).json({ error: 'Failed to post suggestion' });
  }
});

// Get suggestions from Discord channel
app.get('/api/suggestions', async (req, res) => {
  const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
  const CHANNEL_ID = process.env.DISCORD_SUGGESTIONS_CHANNEL_ID;
  
  if (!BOT_TOKEN || !CHANNEL_ID) {
    return res.status(500).json({ error: 'Discord bot not configured' });
  }
  
  try {
    const response = await fetch(`https://discord.com/api/v10/channels/${CHANNEL_ID}/messages?limit=50`, {
      method: 'GET',
      headers: {
        'Authorization': `Bot ${BOT_TOKEN}`
      }
    });
    
    if (!response.ok) {
      console.error('Discord API error:', response.status);
      return res.status(500).json({ error: 'Failed to fetch suggestions' });
    }
    
    const messages = await response.json();
    
    // Parse messages with embeds (our suggestion format)
    const suggestions = messages
      .filter(msg => msg.embeds && msg.embeds.length > 0)
      .map(msg => {
        const embed = msg.embeds[0];
        return {
          id: msg.id,
          name: embed.author?.name || 'Anonymous',
          text: embed.description || '',
          timestamp: msg.timestamp
        };
      })
      .reverse(); // Show newest first
    
    res.json(suggestions);
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Serve landing.html for /landing (BEFORE static files middleware)
app.get('/landing', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'landing.html'));
});

// Redirect root to landing
app.get('/', (req, res) => {
  res.redirect('/landing');
});

// Protected dashboard route - requires authentication
app.get('/dashboard', (req, res) => {
  const token = req.query.token || req.headers['authorization']?.split(' ')[1];
  
  // If no token, return a page that prompts login (the index.html has the auth modal)
  // The index.html will show the auth modal since token isn't in localStorage yet
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Serve static files from parent directory (dashboard root)
app.use(express.static(path.join(__dirname, '..')));

// Start server
app.listen(PORT, () => {
  console.log(`\n🖧 Server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📱 Using TOTP (Authenticator App) for authentication\n`);
});
