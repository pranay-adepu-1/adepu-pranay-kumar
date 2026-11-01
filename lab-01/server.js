const express = require('express');

const app = express();
const PORT = process.env.PORT || 3000;

// Logging middleware to log incoming requests and responses
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> Status ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Route 1: GET / - Welcome text
app.get('/', (req, res) => {
  res.status(200).send('Welcome to the Node.js and Express Server!');
});

// Route 2: GET /about - JSON with name and section
app.get('/about', (req, res) => {
  res.status(200).json({
    name: 'Adepu Pranay Kumar',
    registrationNumber: '252U1R1002',
    section: 'CSE-2A(S-15)',
    course: 'B.Tech CSE',
    faculty: 'Shiva sai teja'
  });
});

// Route 3: GET /time - Current date and time using new Date()
app.get('/time', (req, res) => {
  const current = new Date();
  res.status(200).json({
    currentTime: current.toString(),
    isoString: current.toISOString(),
    localeString: current.toLocaleString()
  });
});

// Route 4: Catch-all 404 handler for unknown paths
app.use((req, res) => {
  res.status(404).json({
    error: '404 Not Found',
    message: `Cannot ${req.method} ${req.originalUrl}. The requested route does not exist on this server.`,
    statusCode: 404
  });
});

// Start listening if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Express server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

