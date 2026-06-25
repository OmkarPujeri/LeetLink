const https = require('https');

async function verifyLeetCode(username, titleSlug) {
  try {
    const data = await fetchJson(
      `https://leetcode.com/api/submissions/${encodeURIComponent(username)}?offset=0&limit=20`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; LeetLink/1.0)',
          'Referer': 'https://leetcode.com/'
        }
      }
    );

    if (data.submissions_dump) {
      return data.submissions_dump.some(sub =>
        sub.title_slug === titleSlug && sub.status_display === 'Accepted'
      );
    }
    return false;
  } catch (err) {
    console.error('LC verify error:', err.message);
    return false;
  }
}

function parseLeetCodeUrl(url) {
  if (!url) return null;
  const match = url.match(/\/problems\/([^/?#]+)/);
  return match ? match[1] : null;
}

async function verifySolved(leetcodeUsername, sourceId, url) {
  const titleSlug = parseLeetCodeUrl(url);
  if (!titleSlug) return false;
  return await verifyLeetCode(leetcodeUsername, titleSlug);
}

function fetchJson(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const opts = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers: Object.assign({
        'User-Agent': 'Mozilla/5.0 (compatible; LeetLink/1.0)',
        'Accept': 'application/json'
      }, options.headers || {}),
      timeout: 15000
    };

    if (options.body) {
      opts.method = 'POST';
      opts.headers['Content-Length'] = Buffer.byteLength(options.body);
    }

    const req = https.request(opts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve(data);
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });

    if (options.body) req.write(options.body);
    req.end();
  });
}

module.exports = { verifySolved, verifyLeetCode };
