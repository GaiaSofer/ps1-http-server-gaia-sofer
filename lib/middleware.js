// lib/middleware.js — built-in middleware ready to use.
//
// Middleware is a function (req, res, next) that runs before the handler.
// It can modify req/res, then call next() to continue down the chain.

/**
 * jsonParser: if the request is JSON, converts req.body from a string to an object.
 * This lets the handler write req.body.name instead of JSON.parse(req.body).name.
 */
function jsonParser() {
  return (req, res, next) => {
    const contentType = req.headers['content-type'] || '';
    if (contentType.includes('application/json') && req.body) {
      try {
        req.body = JSON.parse(req.body);
      } catch (_) {
        req.body = {}; // invalid body -> empty object instead of crashing
      }
    }
    next(); // always continue
  };
}

// ANSI color codes — the standard way to color text in a terminal.
// Each code switches the color on; RESET switches back to normal.
const COLORS = {
  reset: '\x1b[0m',
  gray: '\x1b[90m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

// Pick a color for each HTTP method, grouped by what it does:
// reads = green, creates/updates = blue/cyan, deletes = red.
function colorForMethod(method) {
  if (method === 'GET') return COLORS.green;
  if (method === 'POST') return COLORS.blue;
  if (method === 'PUT' || method === 'PATCH') return COLORS.cyan;
  if (method === 'DELETE') return COLORS.red;
  return COLORS.gray;
}

// Pick a color for the status code by outcome:
// 2xx success = green, 4xx client error = yellow, 5xx server error = red.
function colorForStatus(code) {
  if (code >= 500) return COLORS.red;
  if (code >= 400) return COLORS.yellow;
  if (code >= 200 && code < 300) return COLORS.green;
  return COLORS.gray;
}

/**
 * logger: prints every incoming request with the time, method, path, and the
 * status code of the response — all color-coded for quick scanning.
 * The method is colored by category, the status by outcome.
 */
function logger() {
  return (req, res, next) => {
    const time = new Date().toISOString().slice(11, 19); // HH:MM:SS
    const methodColor = colorForMethod(req.method);

    // We don't know the status code until the response is sent, so we register
    // an onFinish callback. The response calls it with the final status code.
    res.onFinish = (statusCode) => {
      const statusColor = colorForStatus(statusCode);
      console.log(
        `${COLORS.gray}[${time}]${COLORS.reset} ` +
        `${methodColor}${req.method.padEnd(6)}${COLORS.reset} ` +
        `${req.path} ` +
        `${statusColor}${statusCode}${COLORS.reset}`
      );
    };

    next();
  };
}

module.exports = { jsonParser, logger };
