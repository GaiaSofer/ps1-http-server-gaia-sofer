// server.js — an example application demonstrating all of the framework's features.
// Run:  node server.js
// Open: http://localhost:3000

const { createApp } = require('./lib/app');
const { jsonParser, logger } = require('./lib/middleware');

const app = createApp();

// Middleware 
app.use(logger());      // prints every request to the console
app.use(jsonParser());  // converts a JSON body into an object

// In-memory "database" for demonstration
const users = [
  { id: 1, name: 'Dana', email: 'dana@example.com' },
  { id: 2, name: 'Yossi', email: 'yossi@example.com' },
];
let nextId = 3;

// Requirement 1: Route handlers
// GET a list
app.get('/api/users', (req, res) => {
  res.json(users);
});

// GET with a route param — :id 
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === Number(req.params.id));
  if (!user) {
    res.status(404).json({ error: `User ${req.params.id} not found` });
    return;
  }
  res.json(user);
});

// POST — creates a new resource from the body (parsed to JSON by the middleware)
app.post('/api/users', (req, res) => {
  const { name, email } = req.body || {};
  if (!name || !email) {
    res.status(400).json({ error: 'name and email are required' });
    return;
  }
  const user = { id: nextId++, name, email };
  users.push(user);
  res.status(201).json(user);
});

// DELETE with a param
app.delete('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === Number(req.params.id));
  if (index === -1) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  users.splice(index, 1);
  res.status(204).send('');
});

// Using a query string
app.get('/api/search', (req, res) => {
  const q = (req.query.q || '').toLowerCase();
  const results = users.filter(u => u.name.toLowerCase().includes(q));
  res.json({ query: q, count: results.length, results });
});

// Requirement 2: Serving static files
// GET /static/index.html serves ./public/index.html

// A welcome route at the root :)
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the API',
    documentation: 'GET /docs',
    endpoints: [
      'GET /api/users',
      'GET /api/users/:id',
      'POST /api/users',
      'DELETE /api/users/:id',
      'GET /api/search?q=...',
    ],
  });
});

// Creative feature: a styled API reference page at /docs.
app.docs('/docs', 'Creative HTTP Server — API Reference');

// Start the server (the net modul)
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
