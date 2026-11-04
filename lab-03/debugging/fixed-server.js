/**
 * BDF Lab 03 - Debugging Exercise: Fixed Server
 * Faculty: MR.sai shiva teja
 * Student: Adepu Pranay Kumar (Reg: 252U1R1002)
 *
 * RESOLUTION FOR THE 4 BUGS:
 *   Fix 1: Configured dynamic PORT with process.env.PORT and single listener.
 *   Fix 2: Corrected relative import path to '../db' (or './db').
 *   Fix 3: Fixed table-name typo to 'books'.
 *   Fix 4: Added 'await' to resolve the asynchronous database query.
 */

const express = require('express');

// FIX 2: Correct import path pointing to the db module
const { queryAll } = require('../db');

const app = express();
app.use(express.json());

// FIX 1: Use process.env.PORT with fallback, avoiding port collision
const PORT = process.env.PORT || 3005;

// Fixed Route: Correct table name and properly awaited promise
app.get('/books', async (req, res) => {
  try {
    // FIX 3: Correct table name 'books' (instead of typo 'tbl_books')
    const sql = 'SELECT id, title, author, price FROM books';

    // FIX 4: Added 'await' before async database call
    const books = await queryAll(sql);

    res.status(200).json({
      success: true,
      count: books.length,
      data: books
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// FIX 1: Single server listener invocation
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[FIXED] Debugging exercise server running on http://localhost:${PORT}`);
  });
}

module.exports = app;

