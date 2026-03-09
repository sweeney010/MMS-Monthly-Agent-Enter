module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, anthropic-version, x-api-key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const authHeader = req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

  // Route selection via query param: ?mode=anthropic | openai | brain (default)
  const mode = req.query.mode || 'brain';

  const ENDPOINTS = {
    brain:     'https://brain-platform.pattern.com/api/v1/llms/invoke',
    anthropic: 'https://brain-platform.pattern.com/api/v1/anthropic_compatible/v1/messages',
    openai:    'https://brain-platform.pattern.com/api/v1/openai_compatible/chat/completions',
  };

  const url = ENDPOINTS[mode] || ENDPOINTS.brain;

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': authHeader,
  };
  if (mode === 'anthropic') headers['anthropic-version'] = '2023-06-01';

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(req.body),
    });
    const data = await upstream.json();
    return res.status(upstream.status).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Proxy error: ' + err.message });
  }
};
