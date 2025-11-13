// Minimal static file server using Bun.serve
import { extname } from 'path';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

Bun.serve({
  port: 3000,
  async fetch(req) {
    try {
      const url = new URL(req.url);
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      if (pathname === '/') pathname = '/index.html';

      const filePath = `./public${pathname}`;
      // Prevent directory traversal
      if (!filePath.startsWith('./public/')) {
        return new Response('Forbidden', { status: 403 });
      }

      const file = Bun.file(filePath);
      const ext = extname(filePath).toLowerCase() || '.html';
      const headers = {
        'Content-Type': MIME[ext] || 'application/octet-stream',
      };
      return new Response(file.stream(), { headers });
    } catch (err) {
      return new Response('Not Found', { status: 404 });
    }
  },
});

console.log('Server running at http://localhost:3000');
