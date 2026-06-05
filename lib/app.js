// lib/app.js — the main application class. Ties all the parts together.
//
// This is the API the user sees in their code:
//
//   const { createApp } = require('./lib/app');
//   const app = createApp();
//   app.get('/hello', (req, res) => res.send('hi'));
//   app.listen(3000);

const net = require('net');
const path = require('path');
const fs = require('fs');

const { parseRequest } = require('./parser');
const { Response, getMimeType } = require('./response');
const { Router } = require('./router');
const { renderDocsPage } = require('./docs');

class App extends Router {
  constructor() {
    super(); // inherit all Router abilities (get/post/use/match...)
    this.staticDirs = []; // list of static dirs: { urlPrefix, dir }
  }

  /**
   * Registers a static files directory, like express.static.
   *   app.static('/assets', './public')  -> GET /assets/x.png serves ./public/x.png
   *   app.static('./public')             -> GET /x.png serves ./public/x.png
   */
  static(urlPrefix, dir) {
    if (dir === undefined) {
      dir = urlPrefix;
      urlPrefix = '/';
    }
    this.staticDirs.push({ urlPrefix, dir: path.resolve(dir) });
    return this;
  }

  /**
   * Registers a route that serves a styled API reference page.
   *   app.docs('/docs');  // GET /docs shows the reference page
   */
  docs(routePath = '/docs', title = 'API Reference') {
    this.get(routePath, (req, res) => {
      res.html(renderDocsPage(title));
    });
    return this;
  }

  /**
   * Tries to serve a static file for the request. Returns true if it handled it.
   */
  _tryStatic(req, res) {
    for (const { urlPrefix, dir } of this.staticDirs) {
      if (!req.path.startsWith(urlPrefix)) continue;

      // Strip the prefix from the path to get the relative path inside the dir.
      const relativePath = req.path.slice(urlPrefix.length).replace(/^\//, '');
      const filePath = path.join(dir, relativePath);

      // Security: prevent directory traversal (../../etc/passwd).
      // After resolve, the path must still be inside the allowed directory.
      const resolved = path.resolve(filePath);
      if (!resolved.startsWith(dir)) {
        res.status(403).send('Forbidden');
        return true;
      }

      try {
        const stats = fs.statSync(resolved);
        if (stats.isFile()) {
          res.sendFile(resolved);
          return true;
        }
      } catch (_) {
        // File doesn't exist -> continue to the next static dir / to routes
      }
    }
    return false;
  }

  /**
   * The heart of request handling: runs middleware, then tries a route, then a
   * static file, otherwise returns 404.
   */
  _handle(req, res) {
    this.runMiddlewares(req, res, () => {
      // 1. Try to match a route
      const matched = this.match(req.method, req.path);
      if (matched) {
        req.params = matched.params;
        try {
          matched.handler(req, res);
        } catch (err) {
          console.error('Handler error:', err);
          if (!res.sent) res.status(500).json({ error: 'Internal Server Error' });
        }
        return;
      }

      // 2. Try to serve a static file
      if (this._tryStatic(req, res)) return;

      // 3. Nothing matched -> 404
      res.status(404).json({ error: 'Not Found', path: req.path });
    });
  }

  /**
   * Starts the server. This is where the net module comes into play.
   */
  listen(port, callback) {
    const server = net.createServer((socket) => {
      // Accumulate all chunks. A request can arrive across several 'data' events!
      let buffer = '';

      socket.on('data', (chunk) => {
        buffer += chunk.toString();

        // Have we received at least all the headers (up to the empty line)?
        const headerEnd = buffer.indexOf('\r\n\r\n');
        if (headerEnd === -1) return; // not yet, wait for more data

        // Check whether there's a body that hasn't fully arrived yet (per Content-Length).
        const preParse = parseRequest(buffer);
        if (preParse) {
          const expectedLength = parseInt(preParse.headers['content-length'] || '0', 10);
          const actualBodyLength = Buffer.byteLength(preParse.body);
          if (actualBodyLength < expectedLength) return; // partial body, wait
        }

        // We have a complete request -> parse and handle it.
        const req = parseRequest(buffer);
        buffer = ''; // reset for the next request

        if (!req) {
          socket.end('HTTP/1.1 400 Bad Request\r\nContent-Length: 0\r\n\r\n');
          return;
        }

        const res = new Response(socket);
        this._handle(req, res);
      });

      socket.on('error', (err) => {
        // Clients disconnecting abruptly is normal; don't crash the server.
        if (err.code !== 'ECONNRESET') console.error('Socket error:', err.message);
      });
    });

    server.listen(port, () => {
      if (callback) callback();
      else console.log(`Server listening on http://localhost:${port}`);
    });

    this.server = server;
    return server;
  }
}

function createApp() {
  return new App();
}

module.exports = { createApp, App };
