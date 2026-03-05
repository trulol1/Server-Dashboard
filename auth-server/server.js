require('dotenv').config({ path: require('path').join(__dirname, '.env') });
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
const SPOTIFY_CLIENT_ID = (process.env.SPOTIFY_CLIENT_ID || '').trim();
const SPOTIFY_CLIENT_SECRET = (process.env.SPOTIFY_CLIENT_SECRET || '').trim();

let spotifyTokenCache = {
  accessToken: null,
  expiresAt: 0
};

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

// Suggestions storage (local, replaces Discord integration)
const suggestionsFile = path.join(__dirname, '.suggestions.json');
let suggestions = [];
if (fs.existsSync(suggestionsFile)) {
  try {
    suggestions = JSON.parse(fs.readFileSync(suggestionsFile, 'utf8'));
  } catch (err) {
    console.error('Failed to load suggestions:', err);
    suggestions = [];
  }
}

function saveSuggestions() {
  fs.writeFileSync(suggestionsFile, JSON.stringify(suggestions, null, 2));
}

async function getSpotifyAccessToken() {
  const now = Date.now();
  if (spotifyTokenCache.accessToken && spotifyTokenCache.expiresAt > now + 30000) {
    return spotifyTokenCache.accessToken;
  }

  if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
    const error = new Error('Spotify API credentials are not configured on the server.');
    error.statusCode = 503;
    throw error;
  }

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64')}`
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }).toString()
  });

  if (!tokenResponse.ok) {
    const details = await tokenResponse.text();
    const error = new Error(`Spotify token request failed (${tokenResponse.status}): ${details}`);
    error.statusCode = 502;
    throw error;
  }

  const tokenData = await tokenResponse.json();
  spotifyTokenCache = {
    accessToken: tokenData.access_token,
    expiresAt: now + ((tokenData.expires_in || 3600) * 1000)
  };

  return spotifyTokenCache.accessToken;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function toSuggestionResponse(suggestion) {
  return {
    id: suggestion.id,
    name: suggestion.name,
    text: suggestion.text,
    createdAt: suggestion.createdAt,
    status: suggestion.status,
    votes: suggestion.votes
  };
}

function getDiscordConfig() {
  const unquote = (value) => value.replace(/^['\"]|['\"]$/g, '').trim();

  const webhookUrl = unquote((process.env.DISCORD_SUGGESTIONS_WEBHOOK_URL || '').trim());
  const botTokenRaw = unquote((process.env.DISCORD_BOT_TOKEN || '').trim());
  const channelId = unquote((process.env.DISCORD_SUGGESTIONS_CHANNEL_ID || '').trim());
  const mentionUserIdRaw = unquote((process.env.DISCORD_MENTION_USER_ID || '').trim()).replace(/[<@!>]/g, '').trim();

  const botToken = botTokenRaw.replace(/^Bot\s+/i, '').trim();
  const mentionUserId = /^\d{17,20}$/.test(mentionUserIdRaw) ? mentionUserIdRaw : '';

  return {
    webhookUrl,
    botToken,
    channelId,
    mentionUserId
  };
}

function getDiscordMentionPayload() {
  const { mentionUserId } = getDiscordConfig();

  if (!mentionUserId) {
    return {
      allowed_mentions: { parse: [] }
    };
  }

  return {
    content: `<@${mentionUserId}>`,
    allowed_mentions: {
      parse: [],
      users: [mentionUserId]
    }
  };
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

  // Generate JWT token (expires in 24 hours) - TOTP users get 'user' role
  const token = jwt.sign(
    { authenticated: true, role: 'user', timestamp: Date.now() },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
  
  res.json({
    success: true,
    token,
    role: 'user',
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

// Discord Bot Endpoint for Suggestions (posts directly to server-suggestions channel)
app.post('/api/suggestions', async (req, res) => {
  const { name, text } = req.body;

  if (!name || !text) {
    return res.status(400).json({ error: 'Name and text are required' });
  }

  const suggestion = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: name.toString().trim(),
    text: text.toString().trim(),
    createdAt: Date.now(),
    status: 'pending',
    votes: { up: 0, down: 0 },
    voters: {}
  };

  suggestions.unshift(suggestion);
  saveSuggestions();

  const { webhookUrl: WEBHOOK_URL, botToken: BOT_TOKEN, channelId: CHANNEL_ID } = getDiscordConfig();
  let discordPosted = false;
  let discordError = null;

  if (WEBHOOK_URL || (BOT_TOKEN && CHANNEL_ID)) {
    const payload = {
      ...getDiscordMentionPayload(),
      embeds: [
        {
          title: '💡 New Suggestion',
          description: suggestion.text,
          color: 10813440,
          author: { name: suggestion.name },
          fields: [
            { name: 'Status', value: 'Pending', inline: true },
            { name: 'ID', value: suggestion.id, inline: true }
          ],
          timestamp: new Date(suggestion.createdAt).toISOString(),
          footer: { text: 'Community Suggestions' }
        }
      ]
    };

    try {
      const url = WEBHOOK_URL || `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`;
      const headers = WEBHOOK_URL
        ? { 'Content-Type': 'application/json' }
        : {
          'Authorization': `Bot ${BOT_TOKEN}`,
          'Content-Type': 'application/json'
        };

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const details = await response.text();
        discordError = `Discord API error ${response.status}: ${details}`;
        console.error('Error posting suggestion to Discord:', discordError);
      } else {
        discordPosted = true;
      }
    } catch (error) {
      discordError = error?.message || 'Unknown Discord error';
      console.error('Error posting suggestion to Discord:', error);
    }
  } else {
    discordError = 'Discord webhook or bot not configured';
  }

  res.json({
    success: true,
    suggestion: toSuggestionResponse(suggestion),
    discordPosted,
    discordError
  });
});

app.get('/api/suggestions', (req, res) => {
  const response = suggestions
    .filter((item) => item.status !== 'resolved')
    .map(toSuggestionResponse);
  res.json(response);
});

app.get('/api/suggestions/health', (req, res) => {
  const { webhookUrl: WEBHOOK_URL, botToken: BOT_TOKEN, channelId: CHANNEL_ID, mentionUserId } = getDiscordConfig();

  res.json({
    status: 'ok',
    suggestionsCount: suggestions.length,
    discordConfigured: Boolean(WEBHOOK_URL || (BOT_TOKEN && CHANNEL_ID)),
    discordWebhookSet: Boolean(WEBHOOK_URL),
    discordBotTokenSet: Boolean(BOT_TOKEN),
    discordChannelIdSet: Boolean(CHANNEL_ID),
    discordMentionUserSet: Boolean(mentionUserId)
  });
});

app.post('/api/suggestions/:id/vote', (req, res) => {
  const { id } = req.params;
  const { direction, voterId } = req.body || {};

  if (!voterId || !direction) {
    return res.status(400).json({ error: 'Voter ID and direction are required' });
  }

  if (!['up', 'down'].includes(direction)) {
    return res.status(400).json({ error: 'Invalid vote direction' });
  }

  const suggestion = suggestions.find((item) => item.id === id);
  if (!suggestion) {
    return res.status(404).json({ error: 'Suggestion not found' });
  }

  const previousVote = suggestion.voters[voterId];
  if (previousVote === direction) {
    return res.json({ success: true, suggestion: toSuggestionResponse(suggestion) });
  }

  if (previousVote === 'up') suggestion.votes.up = Math.max(0, suggestion.votes.up - 1);
  if (previousVote === 'down') suggestion.votes.down = Math.max(0, suggestion.votes.down - 1);

  suggestion.voters[voterId] = direction;
  if (direction === 'up') suggestion.votes.up += 1;
  if (direction === 'down') suggestion.votes.down += 1;

  saveSuggestions();
  res.json({ success: true, suggestion: toSuggestionResponse(suggestion) });
});

app.post('/api/suggestions/:id/status', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const allowedStatuses = ['pending', 'planned', 'approved', 'rejected', 'resolved'];

  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const suggestion = suggestions.find((item) => item.id === id);
  if (!suggestion) {
    return res.status(404).json({ error: 'Suggestion not found' });
  }

  const oldStatus = suggestion.status;
  suggestion.status = status;
  saveSuggestions();

  // Post status update to Discord if configured
  if (oldStatus !== status) {
    postDiscordStatusUpdate(suggestion).catch((err) => {
      console.error('Error posting status update to Discord:', err);
    });
  }

  res.json({ success: true, suggestion: toSuggestionResponse(suggestion) });
});

app.delete('/api/suggestions/:id', verifyToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const beforeCount = suggestions.length;
  suggestions = suggestions.filter((item) => item.id !== id);
  if (suggestions.length === beforeCount) {
    return res.status(404).json({ error: 'Suggestion not found' });
  }
  saveSuggestions();
  res.json({ success: true });
});

async function postDiscordStatusUpdate(suggestion) {
  const { webhookUrl: WEBHOOK_URL, botToken: BOT_TOKEN, channelId: CHANNEL_ID } = getDiscordConfig();

  if (!WEBHOOK_URL && !(BOT_TOKEN && CHANNEL_ID)) {
    return;
  }

  const statusColors = {
    pending: 0xA0A0A0,
    planned: 0x3B82F6,
    approved: 0x10B981,
    rejected: 0xEF4444,
    resolved: 0x059669
  };

  const statusEmojis = {
    pending: '⏳',
    planned: '📋',
    approved: '✅',
    rejected: '❌',
    resolved: '🎉'
  };

  const payload = {
    ...getDiscordMentionPayload(),
    embeds: [
      {
        title: `${statusEmojis[suggestion.status]} Suggestion Status Updated`,
        description: suggestion.text,
        color: statusColors[suggestion.status] || 0xA0A0A0,
        author: { name: suggestion.name },
        fields: [
          { name: 'Status', value: suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1), inline: true },
          { name: 'ID', value: suggestion.id, inline: true },
          { name: 'Votes', value: `👍 ${suggestion.votes.up} | 👎 ${suggestion.votes.down}`, inline: true }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: 'Community Suggestions' }
      }
    ]
  };

  const url = WEBHOOK_URL || `https://discord.com/api/v10/channels/${CHANNEL_ID}/messages`;
  const headers = WEBHOOK_URL
    ? { 'Content-Type': 'application/json' }
    : {
      'Authorization': `Bot ${BOT_TOKEN}`,
      'Content-Type': 'application/json'
    };

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Discord API error ${response.status}: ${details}`);
  }
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.get('/api/music/album-cover', async (req, res) => {
  const rawQuery = (req.query.query || '').toString().trim();
  const artist = (req.query.artist || '').toString().trim();
  const album = (req.query.album || '').toString().trim();
  const query = rawQuery || [artist, album].filter(Boolean).join(' ');

  if (!query) {
    return res.status(400).json({ error: 'A search query is required.' });
  }

  try {
    const accessToken = await getSpotifyAccessToken();
    const searchParams = new URLSearchParams({
      type: 'album',
      q: query,
      limit: '1',
      market: 'US'
    });

    const response = await fetch(`https://api.spotify.com/v1/search?${searchParams.toString()}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`Spotify album-cover request failed (${response.status}): ${details}`);
    }

    const data = await response.json();
    const albumItem = data?.albums?.items?.[0] || null;
    const coverUrl = albumItem?.images?.[0]?.url || null;

    res.json({
      coverUrl,
      albumName: albumItem?.name || null,
      artistName: albumItem?.artists?.[0]?.name || null,
      releaseDate: albumItem?.release_date || null,
      source: 'spotify'
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    console.error('Spotify album-cover lookup error:', error);
    res.status(statusCode).json({ error: error.message || 'Failed to fetch album cover.' });
  }
});

function parseRymReleaseInfo(rymUrl) {
  try {
    const parsed = new URL(rymUrl);
    const parts = parsed.pathname.split('/').filter(Boolean);
    const releaseIndex = parts.findIndex((part) => part === 'release');

    if (releaseIndex !== -1 && parts[releaseIndex + 1] === 'album') {
      const artistSlug = parts[releaseIndex + 2] || '';
      const albumSlug = parts[releaseIndex + 3] || '';
      const normalize = (value) => decodeURIComponent(value).replace(/[-_]+/g, ' ').trim();
      const artist = normalize(artistSlug);
      const album = normalize(albumSlug);
      if (artist && album) return { artist, album, title: `${artist} - ${album}` };
      if (album) return { artist: '', album, title: album };
    }
  } catch {
    // Fall through to empty title
  }

  return { artist: '', album: '', title: '' };
}

function parseRymMetadataFromHtml(html) {
  const result = {
    score: null,
    releaseDate: null
  };

  if (!html || typeof html !== 'string') {
    return result;
  }

  const jsonLdMatches = [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const match of jsonLdMatches) {
    const jsonText = (match[1] || '').trim();
    if (!jsonText) continue;

    try {
      const payload = JSON.parse(jsonText);
      const entries = Array.isArray(payload) ? payload : [payload];

      for (const entry of entries) {
        if (!entry || typeof entry !== 'object') continue;
        const ratingValue = Number.parseFloat(entry?.aggregateRating?.ratingValue);
        if (Number.isFinite(ratingValue) && result.score === null) {
          result.score = ratingValue;
        }

        const datePublished = (entry?.datePublished || '').toString().trim();
        if (datePublished && result.releaseDate === null) {
          result.releaseDate = datePublished;
        }
      }
    } catch {
      // Ignore malformed json-ld blocks
    }
  }

  if (result.score === null) {
    const scoreMatch = html.match(/(?:Average|avg(?:\.|\s)?rating|ratingValue)[^\d]{0,20}(\d\.\d{1,2}|\d{1,2}\.\d{1,2})/i);
    if (scoreMatch?.[1]) {
      const parsed = Number.parseFloat(scoreMatch[1]);
      if (Number.isFinite(parsed)) result.score = parsed;
    }
  }

  if (result.releaseDate === null) {
    const releaseMatch = html.match(/(?:Release Date|Released)[^\w]{0,20}([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}|\d{4}-\d{2}-\d{2})/i);
    if (releaseMatch?.[1]) {
      result.releaseDate = releaseMatch[1].trim();
    }
  }

  return result;
}

app.get('/api/music/rym-metadata', async (req, res) => {
  const url = (req.query.url || '').toString().trim();
  if (!url) {
    return res.status(400).json({ error: 'RYM URL is required.' });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL.' });
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!(hostname === 'rateyourmusic.com' || hostname === 'www.rateyourmusic.com')) {
    return res.status(400).json({ error: 'Only rateyourmusic.com URLs are allowed.' });
  }

  try {
    const response = await fetch(parsed.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; ServerIndex/1.0; +https://github.com/trulol1/Server-Dashboard)',
        'Accept': 'text/html,application/xhtml+xml'
      }
    });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(`RYM request failed (${response.status}): ${details.slice(0, 200)}`);
    }

    const html = await response.text();
    const metadata = parseRymMetadataFromHtml(html);

    res.json({
      score: metadata.score,
      releaseDate: metadata.releaseDate,
      source: 'rym'
    });
  } catch (error) {
    console.error('Failed to fetch RYM metadata:', error);
    res.status(502).json({ error: 'Failed to fetch metadata from RYM link.' });
  }
});

app.get('/api/music/tru-recommendations', (req, res) => {
  try {
    const musicDir = path.join(__dirname, '..', 'assets', 'music');
    if (!fs.existsSync(musicDir)) {
      return res.json({ recommendations: [] });
    }

    const files = fs.readdirSync(musicDir);
    const imageFiles = files.filter((file) => /\.(jpg|jpeg|png|webp)$/i.test(file));
    const txtFiles = files.filter((file) => /-rym\.txt$/i.test(file));

    const recommendations = txtFiles.map((txtFile) => {
      const baseName = txtFile.replace(/-rym\.txt$/i, '');
      const txtPath = path.join(musicDir, txtFile);
      const rymUrl = (fs.readFileSync(txtPath, 'utf8') || '').trim();
      const parsedInfo = parseRymReleaseInfo(rymUrl);

      const preferredCover = imageFiles.find((file) => file.toLowerCase() === `${baseName.toLowerCase()}-cover.jpg`)
        || imageFiles.find((file) => file.toLowerCase() === `${baseName.toLowerCase()}_cover.jpg`)
        || imageFiles.find((file) => file.toLowerCase().startsWith(baseName.toLowerCase()) && /cover\.(jpg|jpeg|png|webp)$/i.test(file));

      const title = parsedInfo.title || baseName.replace(/[-_]+/g, ' ').trim();

      return {
        id: baseName,
        title,
        artist: parsedInfo.artist || '',
        album: parsedInfo.album || '',
        rymUrl,
        coverUrl: preferredCover ? `assets/music/${preferredCover}` : null
      };
    }).filter((item) => item.rymUrl);

    res.json({ recommendations });
  } catch (error) {
    console.error('Failed to load Tru recommendations:', error);
    res.status(500).json({ error: 'Failed to load Tru recommendations.' });
  }
});

app.get('/api/music/random-albums', async (req, res) => {
  const requestedCount = Number.parseInt(req.query.count, 10);
  const count = Number.isInteger(requestedCount) ? Math.min(Math.max(requestedCount, 1), 20) : 8;
  const marketParam = (req.query.market || 'US').toString().trim().toUpperCase();
  const market = /^[A-Z]{2}$/.test(marketParam) ? marketParam : 'US';

  try {
    const accessToken = await getSpotifyAccessToken();

    const uniqueOffsets = new Set();
    while (uniqueOffsets.size < 3) {
      uniqueOffsets.add(Math.floor(Math.random() * 20) * 50);
    }

    let albums = [];

    for (const offset of uniqueOffsets) {
      const response = await fetch(`https://api.spotify.com/v1/browse/new-releases?limit=50&offset=${offset}&market=${market}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(`Spotify albums request failed (${response.status}): ${details}`);
      }

      const data = await response.json();
      const items = data?.albums?.items || [];
      albums = albums.concat(items);
    }

    if (!albums.length) {
      return res.status(502).json({ error: 'Spotify did not return any albums.' });
    }

    const uniqueById = new Map();
    albums.forEach((album) => {
      if (album?.id && !uniqueById.has(album.id)) {
        uniqueById.set(album.id, album);
      }
    });

    const randomizedAlbums = shuffleArray(Array.from(uniqueById.values())).slice(0, count);
    res.json({ albums: randomizedAlbums });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    console.error('Spotify album recommendation error:', error);
    res.status(statusCode).json({ error: error.message || 'Failed to fetch Spotify album recommendations.' });
  }
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
