// examples/matches-assignment-spec.js
//
// This file demonstrates that our library provides the SAME functionality as
// the two examples in the assignment brief, using the same usage shape.
// The assignment says: "Your API can look different, but should provide
// similar functionality." This file makes the correspondence obvious.
//
// Run:  node examples/matches-assignment-spec.js
// Then: curl http://localhost:3001/api/hello
//       curl http://localhost:3001/api/users/42
//       curl -X POST http://localhost:3001/api/users -H "Content-Type: application/json" -d '{"name":"Sam","email":"sam@example.com"}'
//       curl http://localhost:3001/static/index.html

const { createApp } = require('../lib/app');
const { jsonParser } = require('../lib/middleware');

const app = createApp();
app.use(jsonParser()); // makes req.body a parsed object, like the brief assumes

// ---- Example 2 from the brief: route handlers ----
// Brief:  router.get('/api/hello', (req, res) => { res.json({ message: 'Hello, World!' }); });
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

// Brief:  router.post('/api/users', (req, res) => { const { name, email } = req.body; res.status(201).json({...}); });
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;
  res.status(201).json({ id: Date.now(), name, email, created: true });
});

// Brief:  router.get('/api/users/:id', (req, res) => { res.json({ id: req.params.id, ... }); });
app.get('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  res.json({ id: userId, name: 'User ' + userId });
});

// ---- Example 1 from the brief: static file serving ----
// Brief:  const staticHandler = serveStatic('./public');  if (req.path.startsWith('/static')) {...}
app.static('/static', './public');

app.listen(3001, () => {
  console.log('Spec-matching example running on http://localhost:3001');
});
