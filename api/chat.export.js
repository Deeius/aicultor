/**
 * CommonJS wrapper for chat.js to enable testing
 * This file exports the handler function for Jest tests
 */

const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS_CAP = 1500;

// Simple in-memory rate limiter
const ipHits = new Map();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_HITS = 60;

function checkRateLimit(ip) {
  const now = Date.now();
  const entry = ipHits.get(ip) || { count: 0, start: now };
  if (now - entry.start > WINDOW_MS) {
    ipHits.set(ip, { count: 1, start: now });
    return true;
  }
  if (entry.count >= MAX_HITS) {
    return false;
  }
  entry.count++;
  ipHits.set(ip, entry);
  return true;
}

async function handler(req, res) {
  // CORS
  const rawOrigin = req.headers.origin || '';
  // Sanitize origin to prevent header injection attacks
  const origin = rawOrigin.replace(/[\r\n]/g, '');
  const allowed = process.env.FRONTEND_URL ? origin.startsWith(process.env.FRONTEND_URL) : true;

  res.setHeader('Access-Control-Allow-Origin', allowed ? origin : '');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  // Rate limit
  const ip = req.headers['x-forwarded-for']?.split(',')[0] || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(429).json({ error: 'Demasiadas peticiones. Espera unos minutos.' });
  }

  const { messages, system, max_tokens } = req.body || {};
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'Campo "messages" requerido (array).' });
  }

  try {
    const response = await client.messages.create({
      model: ALLOWED_MODEL,
      max_tokens: Math.min(max_tokens || 1000, MAX_TOKENS_CAP),
      system: system || undefined,
      messages,
    });
    return res.status(200).json({ content: response.content });
  } catch (err) {
    console.error('Anthropic error:', err.message);
    return res.status(err.status || 500).json({ error: err.message || 'Error del servidor.' });
  }
}

module.exports = { default: handler, handler };
