const express = require('express');
const cors = require('cors');
const lab01App = require('./lab-01/server');
const lab03App = require('./lab-03/server');

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[ROOT SERVER] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Root Landing Page: Course Overview & Unified Route Index
app.get('/', (req, res) => {
  res.status(200).json({
    course: 'Backend Development Fundamentals (Year II Term II)',
    institution: 'Aurora University',
    student: {
      name: 'Adepu Pranay Kumar',
      registrationNumber: '252U1R1002',
      section: 'CSE-2A(S-15)',
      faculty: 'MR.sai shiva teja'
    },
    status: 'online',
    labs: {
      'lab-01': {
        title: 'Node.js and Express Server',
        status: 'Completed',
        endpoints: [
          { method: 'GET', path: '/about', description: 'Student and course metadata' },
          { method: 'GET', path: '/time', description: 'Server real-time timestamp' }
        ]
      },
      'lab-03': {
        title: 'REST API, Query Parameters, Validation & Debugging',
        status: 'Completed',
        endpoints: [
          { method: 'GET', path: '/books', description: 'List books with search_q, order_by, order, limit, offset, min_price, max_price' },
          { method: 'GET', path: '/books/:id', description: 'Retrieve single book by numeric ID' },
          { method: 'POST', path: '/books', description: 'Create new book record (requires title, author, price)' },
          { method: 'PUT', path: '/books/:id', description: 'Update book completely' },
          { method: 'PATCH', path: '/books/:id', description: 'Update book partially' },
          { method: 'DELETE', path: '/books/:id', description: 'Delete book by ID' },
          { method: 'GET', path: '/health', description: 'Service health probe' }
        ],
        sampleQueries: [
          '/books?search_q=Clean',
          '/books?order_by=price&order=DESC',
          '/books?min_price=20&max_price=45',
          '/books?limit=3&offset=0'
        ]
      }
    }
  });
});

// Mount Lab 01 routes: /about, /time
app.get('/about', (req, res, next) => lab01App.handle(req, res, next));
app.get('/time', (req, res, next) => lab01App.handle(req, res, next));

// Mount Lab 03 routes: /books, /health, /books/:id
app.use(lab03App);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[ROOT] Course unified server listening on port ${PORT}`);
  });
}

module.exports = app;

