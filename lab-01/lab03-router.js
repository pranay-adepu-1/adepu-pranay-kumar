const express = require('express');
const { queryAll, queryOne, execute } = require('./lab03-db');

const router = express.Router();

router.use(express.json());

const ALLOWED_ORDER_COLUMNS = ['id', 'title', 'author', 'price', 'created_at'];
const ALLOWED_ORDER_DIRECTIONS = ['ASC', 'DESC'];

router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

router.get('/books', async (req, res, next) => {
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

    const normalizedOrderBy = String(order_by).toLowerCase();
    if (!ALLOWED_ORDER_COLUMNS.includes(normalizedOrderBy)) {
      return res.status(400).json({
        message: `Validation Error: 'order_by' must be one of [${ALLOWED_ORDER_COLUMNS.join(', ')}].`
      });
    }

    const normalizedOrder = String(order).toUpperCase();
    if (!ALLOWED_ORDER_DIRECTIONS.includes(normalizedOrder)) {
      return res.status(400).json({
        message: "Validation Error: 'order' must be either 'ASC' or 'DESC'."
      });
    }

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

    const whereConditions = [];
    const queryParams = [];

    if (search_q && search_q.trim() !== '') {
      whereConditions.push('title LIKE ?');
      queryParams.push(`%${search_q.trim()}%`);
    }

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

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    const countSql = `SELECT COUNT(*) AS total FROM books ${whereClause}`;
    const totalRow = await queryOne(countSql, queryParams);
    const total = totalRow ? totalRow.total : 0;

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

router.get('/books/:id', async (req, res, next) => {
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

router.post('/books', async (req, res, next) => {
  try {
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

router.put('/books/:id', async (req, res, next) => {
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

router.patch('/books/:id', async (req, res, next) => {
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

router.delete('/books/:id', async (req, res, next) => {
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

module.exports = router;
