// Minimal static file server using Bun.serve
// Serves "pretty" URLs without a trailing slash (e.g. /impressum)
// - Redirects requests that include a trailing slash (except "/") to the no-slash canonical URL
// - Serves files under ./public
// - If path doesn't map to a file, tries <path>/index.html (so /impressum will serve ./public/impressum/index.html)
// - Protects against directory traversal
import { extname, resolve } from 'path';
import { statSync } from 'fs';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
};

function headersForExt(ext) {
  const headers = {
    'Content-Type': MIME[ext] || 'application/octet-stream',
  };
  if (ext === '.woff2' || ext === '.woff' || ext === '.ttf' || ext === '.otf') {
    headers['Cache-Control'] = 'public, max-age=31536000, immutable';
  }
  return headers;
}

const PUBLIC_ROOT = resolve('./public');

Bun.serve({
  port: 3000,
  async fetch(req) {
    try {
      const url = new URL(req.url);
      let pathname = decodeURIComponent(url.pathname);

      // Root -> serve index.html
      if (pathname === '/') {
        const indexPath = resolve(PUBLIC_ROOT, 'index.html');
        try {
          const f = Bun.file(indexPath);
          return new Response(f.stream(), { headers: headersForExt('.html') });
        } catch {
          return new Response('Not Found', { status: 404 });
        }
      }

      // If request ends with a trailing slash (and isn't "/"), redirect to no-slash canonical URL
      if (pathname.endsWith('/')) {
        const noSlash = pathname.slice(0, -1) || '/';
        return new Response(null, {
          status: 301,
          headers: { Location: noSlash },
        });
      }

      // Build absolute path for requested resource under public
      const requestedPath = resolve(PUBLIC_ROOT + pathname);

      // Security: prevent directory traversal
      if (!requestedPath.startsWith(PUBLIC_ROOT)) {
        return new Response('Forbidden', { status: 403 });
      }

      // Helper: try to serve a file if it exists and is a file
      const tryServeFile = (absPath) => {
        try {
          const st = statSync(absPath);
          if (!st.isFile()) return null; // not a file (e.g. directory)
          const file = Bun.file(absPath);
          const ext = extname(absPath).toLowerCase() || '.html';
          return new Response(file.stream(), { headers: headersForExt(ext) });
        } catch {
          return null;
        }
      };

      // 1) Try exact file (only if it's a file, not a directory)
      const exact = tryServeFile(requestedPath);
      if (exact) return exact;

      // 2) Try as directory/index.html (e.g. /impressum -> /impressum/index.html)
      const dirIndex = resolve(requestedPath, 'index.html');
      if (dirIndex.startsWith(PUBLIC_ROOT)) {
        const dirResp = tryServeFile(dirIndex);
        if (dirResp) return dirResp;
      }

      // 3) Try adding .html extension (e.g. /impressum -> /impressum.html)
      const htmlPath = requestedPath + '.html';
      const htmlResp = tryServeFile(htmlPath);
      if (htmlResp) return htmlResp;

      // Not found
      return new Response('Not Found', { status: 404 });
    } catch (err) {
      console.error('Server error:', err);
      return new Response('Not Found', { status: 404 });
    }
  },
});

console.log('Server running at http://localhost:3000');
