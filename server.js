/**
 * MediTrack Pro - Lightweight Static Development Server
 * Zero dependencies (Pure Node.js built-ins)
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.sol': 'text/plain; charset=utf-8',
  '.sql': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  // Parse URL and strip query strings or hashes
  let reqPath = decodeURI(req.url.split('?')[0]);
  if (reqPath === '/' || reqPath === '') {
    reqPath = '/index.html';
  }

  const safePath = path.normalize(path.join(ROOT_DIR, reqPath));

  // Security: Prevent directory traversal outside project root
  if (!safePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden: Access Denied');
    return;
  }

  fs.stat(safePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <div style="font-family: sans-serif; text-align: center; padding: 50px;">
          <h2>404 - Page Not Found</h2>
          <p>The requested path <code>${reqPath}</code> was not found.</p>
          <a href="/index.html">Return to MediTrack Home</a>
        </div>
      `);
      return;
    }

    const ext = path.extname(safePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    });

    const readStream = fs.createReadStream(safePath);
    readStream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log('========================================================');
  console.log('  MediTrack Pro - Medical Reminder & Tracker Application ');
  console.log('========================================================');
  console.log(`  Local Server Running: http://localhost:${PORT}`);
  console.log(`  - Landing Page:      http://localhost:${PORT}/index.html`);
  console.log(`  - Sign In Portal:    http://localhost:${PORT}/login.html`);
  console.log(`  - Registration:      http://localhost:${PORT}/register.html`);
  console.log(`  - Master Dashboard:  http://localhost:${PORT}/dashboard.html`);
  console.log('========================================================');
  console.log('  Press Ctrl+C to stop the server at any time.');
});
