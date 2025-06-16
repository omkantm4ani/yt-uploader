// const express = require('express');
// const axios = require('axios');

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Hardcoded base URL
// const BASE_URL = 'https://rarestudy7-52f3cb8bbd16.herokuapp.com/media/';

// app.get('/extract-video', async (req, res) => {
//   const { id } = req.query;
//   const sessionToken = req.headers['session']; // you provide this

//   if (!id) {
//     return res.status(400).json({ error: 'Missing `id` query parameter' });
//   }

//   if (!sessionToken) {
//     return res.status(400).json({ error: 'Missing `session` header' });
//   }

//   const fullUrl = BASE_URL + encodeURIComponent(id);

//   try {
//     const response = await axios.get(fullUrl, {
//       headers: {
//         'User-Agent': 'Mozilla/5.0',
//         'Referer': 'https://rarestudy7-52f3cb8bbd16.herokuapp.com/',
//         'Accept': 'text/html,application/xhtml+xml',
//         // 👇 Sends both cookies
//         'Cookie': `next-login=success; session=${sessionToken}`
//       }
//     });

//     const html = response.data;
//     const match = html.match(/const videoData\s*=\s*({.*?});/s);

//     if (!match) {
//       return res.status(404).json({ error: 'videoData not found' });
//     }

//     const fixedJson = match[1].replace(/\\u0026/g, '&');
//     const videoData = JSON.parse(fixedJson);
//     return res.json({ success: true, videoData });

//   } catch (err) {
//     return res.status(500).json({
//       error: 'Failed to fetch or parse video data',
//       details: err.message
//     });
//   }
// });

// app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));




// ==================================================================================================
const express = require('express');
const axios = require('axios');
const cookie = require('cookie');
const cors = require('cors'); // Import CORS


const app = express();
const PORT = process.env.PORT || 3000;

// Configure CORS to allow only requests from 'https://alphacbse.site'
const allowedOrigins = [
  'https://alphacbse.site',
  'https://alphacbse.fun',
  'https://max-study.netlify.app',
  'http://localhost:5173',
];
// ✅ Enable CORS with origin check
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
// Hardcoded base URL
const BASE_URL = 'https://rarestudy7-52f3cb8bbd16.herokuapp.com/media/';

app.get('/extract-video', async (req, res) => {
  const id = req.query.id;

  if (!id) {
    return res.status(400).json({ error: 'Missing `id` query parameter' });
  }

  const fullUrl = BASE_URL + encodeURIComponent(id);

  try {
    const response = await axios.get(fullUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://rarestudy7-52f3cb8bbd16.herokuapp.com/',
        'Accept': 'text/html,application/xhtml+xml',
        'Cookie': cookie.serialize('next-login', 'success') + '; ' +
                  cookie.serialize('session', '.eJxlkU9vmzAcQL8L57XiT8ia3kgIjr3YCOJA8GXCwIqNoTQJaWDad59JpV12siy_n_X8_Nv42VfnNu-q7mq8Xs9D9c24vjdVZ7wa1YjM6uSJUKAfiRWJ_QbVHBTzHh4naBGBVs8aUtVOQ3LrEOrZ2McL4uOBSDjqgSY7xTWU_XeoVj3bwCWUmUnspM1odGcpqbG_dbDv3UO_uWeyFNkBXmCXTOyEhiy1FJTvIqTYwvJtgal3J6M-b1lfdMSkbXBlB31nE4wFUCYUn4KDYCq3bs3T4yxK89Tt8s08sxqZHQz5qa9LoG5cwKV2_5WnkeagxVI4hZQoRhuLtYEgU2SHYOuEaTS7zY93WIqm_BQ_nApQu4WtZOGUOsq9zjeu5LY5c_-8j_8xaKXPFU-Dns8t2i9vzQzMrmsimykC5TVL1WXfkht_tEA3DpJJN-RQJgLrRsxvbELfTNxmLqHrmkzFIpuYYkLzMpHZ1FgZRSoEqGE0bohkeo0-MYATGVGpHSR3kqHcITd20K38-mRE5_kudgvwaJcczeQAO1O3U3WpfTEtzJA2bkg9Ezvmc_Ti73fek2WOjUxrZUfc_lg7MerFulhGznh-6WHUPgHwcTH-_AWeX9DP.aE75IA.UfoVrY3gzJsNbhBYfJcFNLsARuA')
      }
    });

    const html = response.data;
    const match = html.match(/const videoData\s*=\s*({.*?});/s);

    if (!match) {
      return res.status(404).json({ error: 'videoData not found' });
    }

    let rawJson = match[1].replace(/\\u0026/g, '&');

    try {
      const videoData = JSON.parse(rawJson);
      return res.json({ success: true, videoData });
    } catch (jsonErr) {
      return res.status(500).json({ error: 'Failed to parse videoData', details: jsonErr.message });
    }
  } catch (err) {
    return res.status(500).json({ error: 'Request failed', details: err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
