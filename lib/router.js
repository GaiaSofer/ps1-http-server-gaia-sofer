// lib/router.js — the routing system: the core of the framework.
//
// Responsible for:
//   1. Registering routes:  app.get('/users/:id', handler)
//   2. Supporting params:   '/users/:id' matches '/users/42' and gives params.id = '42'
//   3. Middleware:          functions that run before the handler (e.g. logging, parsing)
//   4. Matching an incoming request to the correct route

/**
 * Turns a path pattern like '/users/:id/posts/:postId' into:
 *   - a regex that matches conforming paths
 *   - a list of parameter names in order of appearance: ['id', 'postId']
 *
 * The trick: replace each ':something' with a capture group ([^/]+) that
 * captures anything up to the next '/', and remember the name.
 */
function compilePath(pattern) {
  const paramNames = [];

  const regexString = pattern
    .replace(/\/$/, '') // remove a trailing '/' if present (so /users and /users/ both match)
    .replace(/:([^/]+)/g, (_, name) => {
      paramNames.push(name);
      return '([^/]+)'; // capture group: "anything that isn't a /"
    });

  // ^...$ for an exact match, not a partial one. The trailing '?' allows an optional '/'.
  const regex = new RegExp(`^${regexString}/?$`);
  return { regex, paramNames };
}

class Router {
  constructor() {
    // routes per method. Each route: { regex, paramNames, handler }
    this.routes = { GET: [], POST: [], PUT: [], PATCH: [], DELETE: [] };
    // global middleware that runs on every request before the handler
    this.middlewares = [];
  }

  // Registers middleware (runs on every request). E.g. JSON parsing or logging.
  use(fn) {
    this.middlewares.push(fn);
    return this;
  }

  // Adds a single route to a specific method.
  _add(method, pattern, handler) {
    const { regex, paramNames } = compilePath(pattern);
    this.routes[method].push({ regex, paramNames, pattern, handler });
    return this;
  }

  get(pattern, handler) { return this._add('GET', pattern, handler); }
  post(pattern, handler) { return this._add('POST', pattern, handler); }
  put(pattern, handler) { return this._add('PUT', pattern, handler); }
  patch(pattern, handler) { return this._add('PATCH', pattern, handler); }
  delete(pattern, handler) { return this._add('DELETE', pattern, handler); }

  /**
   * Looks for a route matching the given method and path.
   * Returns { handler, params } if found, otherwise null.
   */
  match(method, path) {
    const routes = this.routes[method] || [];

    for (const route of routes) {
      const result = path.match(route.regex);
      if (result) {
        // result[0] is the whole match; result[1], result[2]... are the captured groups.
        const params = {};
        route.paramNames.forEach((name, i) => {
          params[name] = decodeURIComponent(result[i + 1]);
        });
        return { handler: route.handler, params };
      }
    }
    return null;
  }

  /**
   * Runs all middleware in a chain, then the handler.
   * Each middleware receives (req, res, next). It must call next() to continue.
   * This is exactly the Express model.
   */
  runMiddlewares(req, res, finalHandler) {
    let index = 0;

    const next = () => {
      if (index < this.middlewares.length) {
        const mw = this.middlewares[index++];
        mw(req, res, next); // the middleware decides when to call next
      } else {
        finalHandler(); // no more middleware -> run the handler
      }
    };

    next();
  }
}

module.exports = { Router, compilePath };
