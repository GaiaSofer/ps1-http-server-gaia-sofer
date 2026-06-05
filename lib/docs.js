// lib/docs.js — a styled API reference page.
//
// This is written the simple, explicit way: it is just an HTML string that we
// wrote by hand, describing each endpoint with an example request and response.
// There is no magic here — if you add a route, you update this list yourself.
//
// Each endpoint is shown in a colored card: the HTTP method is color-coded by
// what it does (green = read, blue = create, red = delete), and we show an
// example of what the endpoint accepts and what it returns.

function renderDocsPage(title) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      background: #0f1117; color: #e6e6e6; padding: 40px 24px; line-height: 1.6;
    }
    .container { max-width: 720px; margin: 0 auto; }
    h1 { font-size: 22px; font-weight: 500; margin-bottom: 4px; }
    .subtitle { color: #8a8f98; font-size: 14px; margin-bottom: 28px; }
    .card {
      background: #161922; border: 1px solid #232733; border-radius: 10px;
      padding: 14px 16px; margin-bottom: 12px;
    }
    .head { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
    .method {
      color: #fff; font-weight: 500; font-size: 12px; letter-spacing: 0.04em;
      padding: 3px 10px; border-radius: 6px; min-width: 60px; text-align: center;
    }
    .get { background: #1d9e75; }
    .post { background: #378add; }
    .delete { background: #e24b4a; }
    .path { font-family: 'SF Mono', Monaco, monospace; font-size: 14px; color: #d6d9e0; }
    .param { color: #ed93b1; }
    .label { font-size: 12px; color: #6b7280; margin-bottom: 3px; margin-top: 8px; }
    pre {
      background: #0f1117; border-radius: 6px; padding: 8px 10px;
      font-family: 'SF Mono', Monaco, monospace; font-size: 12px;
      color: #9fe1cb; margin: 0; white-space: pre-wrap;
    }
    pre.in { color: #85b7eb; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p class="subtitle">Each endpoint, with an example request and response.</p>

    <div class="card">
      <div class="head">
        <span class="method get">GET</span>
        <code class="path">/api/users</code>
      </div>
      <div class="label">Returns</div>
      <pre>[ { "id": 1, "name": "Dana", "email": "dana@example.com" }, ... ]</pre>
    </div>

    <div class="card">
      <div class="head">
        <span class="method get">GET</span>
        <code class="path">/api/users/<span class="param">:id</span></code>
      </div>
      <div class="label">Returns</div>
      <pre>{ "id": 1, "name": "Dana", "email": "dana@example.com" }</pre>
    </div>

    <div class="card">
      <div class="head">
        <span class="method post">POST</span>
        <code class="path">/api/users</code>
      </div>
      <div class="label">Accepts</div>
      <pre class="in">{ "name": "Maya", "email": "maya@example.com" }</pre>
      <div class="label">Returns (201 Created)</div>
      <pre>{ "id": 3, "name": "Maya", "email": "maya@example.com" }</pre>
    </div>

    <div class="card">
      <div class="head">
        <span class="method delete">DELETE</span>
        <code class="path">/api/users/<span class="param">:id</span></code>
      </div>
      <div class="label">Returns</div>
      <pre>204 No Content (empty body)</pre>
    </div>

    <div class="card">
      <div class="head">
        <span class="method get">GET</span>
        <code class="path">/api/search?q=...</code>
      </div>
      <div class="label">Returns</div>
      <pre>{ "query": "may", "count": 1, "results": [ ... ] }</pre>
    </div>
  </div>
</body>
</html>`;
}

module.exports = { renderDocsPage };
