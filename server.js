const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Hardcoded base URL
const BASE_URL = 'https://rarestudy7-52f3cb8bbd16.herokuapp.com/media/';

app.get('/extract-video', async (req, res) => {
  const { id } = req.query;
  const sessionToken = req.headers['session']; // you provide this

  if (!id) {
    return res.status(400).json({ error: 'Missing `id` query parameter' });
  }

  if (!sessionToken) {
    return res.status(400).json({ error: 'Missing `session` header' });
  }

  const fullUrl = BASE_URL + encodeURIComponent(id);

  try {
    const response = await axios.get(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://rarestudy7-52f3cb8bbd16.herokuapp.com/',
        'Accept': 'text/html,application/xhtml+xml',
        // 👇 Sends both cookies
        'Cookie': `next-login=success; session=${sessionToken}`
      }
    });

    const html = response.data;
    const match = html.match(/const videoData\s*=\s*({.*?});/s);

    if (!match) {
      return res.status(404).json({ error: 'videoData not found' });
    }

    const fixedJson = match[1].replace(/\\u0026/g, '&');
    const videoData = JSON.parse(fixedJson);
    return res.json({ success: true, videoData });

  } catch (err) {
    return res.status(500).json({
      error: 'Failed to fetch or parse video data',
      details: err.message
    });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
