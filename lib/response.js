// lib/response.js — builds a convenient response object (res), Express-style.
//
// Instead of building an HTTP string by hand in every handler, the handler
// receives a res object with convenient methods:
//   res.status(200).json({...}) / res.send("text") / res.sendFile(...)
//
// The trick for chaining (res.status(201).json(...)): every method that does
// not finish the response returns 'this', so you can keep calling methods on it.

const fs = require('fs');
const path = require('path');

// Status text matching each code (part of the status line: "HTTP/1.1 200 OK")
const STATUS_TEXTS = {
  200: 'OK',
  201: 'Created',
  204: 'No Content',
  301: 'Moved Permanently',
  302: 'Found',
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  500: 'Internal Server Error',
};

// Maps file extension -> Content-Type, to serve static files correctly.
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
};

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

class Response {
  constructor(socket) {
    this.socket = socket;
    this.statusCode = 200;
    this.headers = {};
    this.sent = false; // ensures we never send a response twice on the same socket
    this.onFinish = null; // optional callback, called with the status code when sending
  }

  // Sets the status code. Returns this -> chainable.
  status(code) {
    this.statusCode = code;
    return this;
  }

  // Sets a single header. Returns this -> chainable.
  set(key, value) {
    this.headers[key] = value;
    return this;
  }

  // Builds the full HTTP string and sends it. Internal method (hence the underscore).
  _send(body) {
    if (this.sent) return; // guard against double-send
    this.sent = true;

    // If something (like the logger) registered an onFinish callback, tell it
    // the status code now that we know the response is complete.
    if (typeof this.onFinish === 'function') this.onFinish(this.statusCode);

    const statusText = STATUS_TEXTS[this.statusCode] || 'Unknown';
    const bodyBuffer = Buffer.isBuffer(body) ? body : Buffer.from(body || '');

    // Content-Length must be the byte length, not the character count
    // (important for Hebrew/emoji!).
    this.headers['Content-Length'] = bodyBuffer.length;
    if (!this.headers['Connection']) this.headers['Connection'] = 'close';

    let head = `HTTP/1.1 ${this.statusCode} ${statusText}\r\n`;
    for (const [key, value] of Object.entries(this.headers)) {
      head += `${key}: ${value}\r\n`;
    }
    head += '\r\n';

    // Write the head as text and the body as bytes, then close.
    this.socket.write(head);
    this.socket.end(bodyBuffer);
  }

  // Sends plain text.
  send(text) {
    if (!this.headers['Content-Type']) {
      this.set('Content-Type', 'text/plain; charset=utf-8');
    }
    this._send(text);
    return this;
  }

  // Sends JSON (auto-serializes the object).
  json(data) {
    this.set('Content-Type', 'application/json; charset=utf-8');
    this._send(JSON.stringify(data));
    return this;
  }

  // Sends HTML.
  html(markup) {
    this.set('Content-Type', 'text/html; charset=utf-8');
    this._send(markup);
    return this;
  }

  // Sends a file from disk with the correct Content-Type based on extension.
  sendFile(filePath) {
    fs.readFile(filePath, (err, data) => {
      if (err) {
        this.status(404).send('File not found');
        return;
      }
      this.set('Content-Type', getMimeType(filePath));
      this._send(data);
    });
    return this;
  }

  // Shortcut: redirect to another location.
  redirect(location, code = 302) {
    this.status(code).set('Location', location)._send('');
    return this;
  }
}

module.exports = { Response, getMimeType, MIME_TYPES };
