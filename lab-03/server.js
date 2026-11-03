const path = require('path');

function safeRequire(pkg) {
  try {
    return require(pkg);
  } catch (err) {
    try {
      return require(path.join(__dirname, '..', 'lab-01', 'node_modules', pkg));
    } catch (err2) {
      return require(path.join(__dirname, '..', 'node_modules', pkg));
    }
  }
}

try {
  safeRequire('dotenv').config();
} catch (e) {
  // Ignore if dotenv is not present
}

const express = safeRequire('express');
const cors = safeRequire('cors');
const { queryAll, queryOne, execute } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS and JSON parsing
if (cors) {
  app.use(cors());
}
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} -> Status ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Root Route: API Overview & Documentation
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'Lab 3: REST API, query parameters, validation, and debugging',
    student: {
      name: 'Adepu Pranay Kumar',
      registrationNumber: '252U1R1002',
      section: 'CSE-2A(S-15)',
      course: 'B.Tech CSE - Backend Development Fundamentals (Year II Term II)',
      institution: 'Aurora University'
    },
    documentation: {
      endpoints: [
        { method: 'GET', path: '/books', description: 'List books with search_q, order_by, order, limit, offset, min_price, max_price' },
        { method: 'GET', path: '/books/:id', description: 'Retrieve a book by numeric ID' },
        { method: 'POST', path: '/books', description: 'Create a new book (requires title, author, numeric price)' },
        { method: 'PUT', path: '/books/:id', description: 'Update an existing book completely' },
        { method: 'PATCH', path: '/books/:id', description: 'Partially update an existing book' },
        { method: 'DELETE', path: '/books/:id', description: 'Delete a book by ID' },
        { method: 'GET', path: '/health', description: 'Health check probe' }
      ],
      exampleQueries: [
        '/books?search_q=Code',
        '/books?order_by=price&order=DESC',
        '/books?min_price=20&max_price=50',
        '/books?limit=3&offset=0'
      ]
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Allowed columns for ordering to prevent SQL injection
const ALLOWED_ORDER_COLUMNS = ['id', 'title', 'author', 'price', 'created_at'];
const ALLOWED_ORDER_DIRECTIONS = ['ASC', 'DESC'];

// GET /books - List books with filtering, search, sorting, and pagination
app.get('/books', async (req, res, next) => {
  try {
    const {
      search_q = '',
      order_by = 'id',
      order = 'ASC',
      limit = '10',
      offset = '0',
      min_price,
      max_price
    } = req.query;

    // Validate order_by against whitelist
    const normalizedOrderBy = String(order_by).toLowerCase();
    if (!ALLOWED_ORDER_COLUMNS.includes(normalizedOrderBy)) {
      return res.status(400).json({
        message: `Validation Error: 'order_by' must be one of [${ALLOWED_ORDER_COLUMNS.join(', ')}].`
      });
    }

    // Validate order direction against whitelist
    const normalizedOrder = String(order).toUpperCase();
    if (!ALLOWED_ORDER_DIRECTIONS.includes(normalizedOrder)) {
      return res.status(400).json({
        message: "Validation Error: 'order' must be either 'ASC' or 'DESC'."
      });
    }

    // Validate limit and offset
    const parsedLimit = parseInt(limit, 10);
    const parsedOffset = parseInt(offset, 10);

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      return res.status(400).json({
        message: "Validation Error: 'limit' must be a positive integer greater than 0."
      });
    }

    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        message: "Validation Error: 'offset' must be a non-negative integer (>= 0)."
      });
    }

    // Build parameterized query dynamically
    const whereConditions = [];
    const queryParams = [];

    // Partial title match with LIKE
    if (search_q && search_q.trim() !== '') {
      whereConditions.push('title LIKE ?');
      queryParams.push(`%${search_q.trim()}%`);
    }

    // Price range filters
    const hasMin = min_price !== undefined && min_price !== '';
    const hasMax = max_price !== undefined && max_price !== '';

    if (hasMin || hasMax) {
      const parsedMin = hasMin ? parseFloat(min_price) : null;
      const parsedMax = hasMax ? parseFloat(max_price) : null;

      if (hasMin && (isNaN(parsedMin) || parsedMin < 0)) {
        return res.status(400).json({
          message: "Validation Error: 'min_price' must be a valid non-negative number."
        });
      }

      if (hasMax && (isNaN(parsedMax) || parsedMax < 0)) {
        return res.status(400).json({
          message: "Validation Error: 'max_price' must be a valid non-negative number."
        });
      }

      if (hasMin && hasMax) {
        if (parsedMin > parsedMax) {
          return res.status(400).json({
            message: "Validation Error: 'min_price' cannot be greater than 'max_price'."
          });
        }
        whereConditions.push('price BETWEEN ? AND ?');
        queryParams.push(parsedMin, parsedMax);
      } else if (hasMin) {
        whereConditions.push('price >= ?');
        queryParams.push(parsedMin);
      } else if (hasMax) {
        whereConditions.push('price <= ?');
        queryParams.push(parsedMax);
      }
    }

    // Construct SQL WHERE clause
    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // Count total matching records
    const countSql = `SELECT COUNT(*) AS total FROM books ${whereClause}`;
    const totalRow = await queryOne(countSql, queryParams);
    const total = totalRow ? totalRow.total : 0;

    // Fetch paginated and sorted records
    const fetchSql = `
      SELECT id, title, author, price, created_at
      FROM books
      ${whereClause}
      ORDER BY ${normalizedOrderBy} ${normalizedOrder}
      LIMIT ? OFFSET ?
    `;

    const books = await queryAll(fetchSql, [...queryParams, parsedLimit, parsedOffset]);

    return res.status(200).json({
      success: true,
      count: books.length,
      total,
      limit: parsedLimit,
      offset: parsedOffset,
      data: books
    });
  } catch (err) {
    next(err);
  }
});

// GET /books/:id - Retrieve a book by ID
app.get('/books/:id', async (req, res, next) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: "Validation Error: Book ID must be a valid positive integer."
      });
    }

    const book = await queryOne('SELECT * FROM books WHERE id = ?', [bookId]);
    if (!book) {
      return res.status(404).json({
        message: `Book with ID ${bookId} not found.`
      });
    }

    return res.status(200).json({
      success: true,
      data: book
    });
  } catch (err) {
    next(err);
  }
});

// POST /books - Create a new book
app.post('/books', async (req, res, next) => {
  try {
    const { title, author, price } = req.body;

    // Reject missing title
    if (title === undefined || title === null || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        message: "Validation Error: 'title' is required and must be a non-empty string."
      });
    }

    // Reject missing author
    if (author === undefined || author === null || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({
        message: "Validation Error: 'author' is required and must be a non-empty string."
      });
    }

    // Reject missing or non-numeric price
    if (price === undefined || price === null || typeof price !== 'number' || isNaN(price) || price < 0) {
      return res.status(400).json({
        message: "Validation Error: 'price' is required and must be a non-negative number."
      });
    }

    // Parameterized INSERT query
    const insertSql = 'INSERT INTO books (title, author, price) VALUES (?, ?, ?)';
    const result = await execute(insertSql, [title.trim(), author.trim(), price]);

    const createdBook = await queryOne('SELECT * FROM books WHERE id = ?', [result.lastID]);

    return res.status(201).json({
      message: 'Book created successfully.',
      data: createdBook
    });
  } catch (err) {
    next(err);
  }
});

// PUT /books/:id - Completely update an existing book
app.put('/books/:id', async (req, res, next) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: "Validation Error: Book ID must be a valid positive integer."
      });
    }

    const existingBook = await queryOne('SELECT * FROM books WHERE id = ?', [bookId]);
    if (!existingBook) {
      return res.status(404).json({
        message: `Book with ID ${bookId} not found.`
      });
    }

    const { title, author, price } = req.body;

    if (title === undefined || title === null || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({
        message: "Validation Error: 'title' is required and must be a non-empty string."
      });
    }

    if (author === undefined || author === null || typeof author !== 'string' || author.trim() === '') {
      return res.status(400).json({
        message: "Validation Error: 'author' is required and must be a non-empty string."
      });
    }

    if (price === undefined || price === null || typeof price !== 'number' || isNaN(price) || price < 0) {
      return res.status(400).json({
        message: "Validation Error: 'price' is required and must be a non-negative number."
      });
    }

    await execute('UPDATE books SET title = ?, author = ?, price = ? WHERE id = ?', [
      title.trim(),
      author.trim(),
      price,
      bookId
    ]);

    const updatedBook = await queryOne('SELECT * FROM books WHERE id = ?', [bookId]);

    return res.status(200).json({
      message: 'Book updated successfully.',
      data: updatedBook
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /books/:id - Partially update an existing book
app.patch('/books/:id', async (req, res, next) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: "Validation Error: Book ID must be a valid positive integer."
      });
    }

    const existingBook = await queryOne('SELECT * FROM books WHERE id = ?', [bookId]);
    if (!existingBook) {
      return res.status(404).json({
        message: `Book with ID ${bookId} not found.`
      });
    }

    const { title, author, price } = req.body;
    const updates = [];
    const params = [];

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({
          message: "Validation Error: 'title' must be a non-empty string."
        });
      }
      updates.push('title = ?');
      params.push(title.trim());
    }

    if (author !== undefined) {
      if (typeof author !== 'string' || author.trim() === '') {
        return res.status(400).json({
          message: "Validation Error: 'author' must be a non-empty string."
        });
      }
      updates.push('author = ?');
      params.push(author.trim());
    }

    if (price !== undefined) {
      if (typeof price !== 'number' || isNaN(price) || price < 0) {
        return res.status(400).json({
          message: "Validation Error: 'price' must be a non-negative number."
        });
      }
      updates.push('price = ?');
      params.push(price);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        message: "Validation Error: At least one field ('title', 'author', or 'price') must be provided for update."
      });
    }

    params.push(bookId);
    await execute(`UPDATE books SET ${updates.join(', ')} WHERE id = ?`, params);

    const updatedBook = await queryOne('SELECT * FROM books WHERE id = ?', [bookId]);

    return res.status(200).json({
      message: 'Book updated partially successfully.',
      data: updatedBook
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /books/:id - Delete a book by ID
app.delete('/books/:id', async (req, res, next) => {
  try {
    const bookId = parseInt(req.params.id, 10);
    if (isNaN(bookId) || bookId <= 0) {
      return res.status(400).json({
        message: "Validation Error: Book ID must be a valid positive integer."
      });
    }

    const existingBook = await queryOne('SELECT * FROM books WHERE id = ?', [bookId]);
    if (!existingBook) {
      return res.status(404).json({
        message: `Book with ID ${bookId} not found.`
      });
    }

    await execute('DELETE FROM books WHERE id = ?', [bookId]);

    return res.status(200).json({
      message: `Book with ID ${bookId} deleted successfully.`,
      data: existingBook
    });
  } catch (err) {
    next(err);
  }
});

// 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({
    message: `Cannot ${req.method} ${req.originalUrl}. The requested route does not exist on this server.`
  });
});

// Centralized error-handling middleware
app.use((err, req, res, next) => {
  console.error('[Internal Error]', err);

  // Handle malformed JSON body errors from express.json()
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      message: 'Malformed JSON payload in request body.'
    });
  }

  return res.status(500).json({
    message: 'An internal server error occurred. Please try again later.'
  });
});

// Start listening if executed directly
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

module.exports = app;
