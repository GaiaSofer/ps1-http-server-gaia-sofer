# The Exercise: Building HTTP server

A small HTTP/1.1 server built on Node's `net` module (no `http`, `http2` or third-party libraries).
We Run it with `node server.js` - it listens on
http://localhost:3000.

## Example: Using the API

```js
const { createApp } = require('./lib/app');
const { jsonParser, logger } = require('./lib/middleware');

const app = createApp();

app.use(logger());
app.use(jsonParser());

app.get('/api/users/:id', (req, res) => {
  res.json({ id: req.params.id });
});

app.post('/api/users', (req, res) => {
  res.status(201).json(req.body);
});

app.static('/static', './public');
app.docs('/docs');

app.listen(3000);
```

* Inside the handler:
- `req` gives you:
`req.method`, `req.path`, `req.params` (from`:id`- style routes), `req.query` (from `?key=value`), `req.headers`, and
`req.body` (a string, or a parsed object when `jsonParser()` is used).
- `res` is chainable:
so `res.status(201).json(...)` works.

## Design choices:

1. I split the app into one module per concern rather than a single file, to keep each piece small and easy to follow:
- `parser` - turns the raw request text into a `req` object.
- `router` matches requests and extracts params.
- `response` builds the reply.
- `middleware` holds the JSON parser and logger.
- `app` ties them together and runs the `net` server.
 
2. The app class extends the router, so the application is a router with a few extra
abilities (static files, the docs page, the server).
This keeps the public methods flat (you call `app.get(...)` directly)

3. Request parsing waits for the full request before handing it off. TCP can split
one request across several `data` events, and a POST body can arrive after its
headers, so the server collects the bytes and only parses once it has the full
headers and a body matching `Content-Length`.

4. `Content-Length` is counted in bytes, not characters, using `Buffer.byteLength`.
Hebrew and other multibyte characters take more than one byte each, and using the
character count would make the browser cut the response short.

5. Route patterns like `/users/:id` are compiled into a regular expression once when the route is registered.
Matching an incoming request is then a single `path.match()`.

6. Static file paths are resolved and checked to make sure they stay inside the served directory(request like `/static/../../etc/passwd` is rejected).

## Two extra features:

7. The logger colors:
 - The HTTP method by what it does (reads, writes,deletes).
 - The status code by outcome.
Makes the request log easy to read while
the server runs.

8. `app.docs('/docs')` serves a styled reference page, listing each endpoint with an example of what it accepts and returns (to see the reference page - Open http://localhost:3000/docs in a browser).

##  API guide:

```
server.js       example app that uses the library
demo-raw.js     a minimal "HTTP by hand" example
lib/app.js      App class, net server, wiring
lib/router.js   routing, params, middleware
lib/parser.js   raw HTTP text into a req object
lib/response.js the chainable res object
lib/middleware.js  jsonParser and logger
lib/docs.js     the API reference page
public/index.html  a file served statically
```
