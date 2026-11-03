/**
 * BDF Lab 03 - Debugging Exercise: Broken Server
 * Faculty: Joel Prashanth D
 * Student: Adepu Pranay Kumar (Reg: 252U1R1002)
 *
 * THIS FILE CONTAINS 4 INTENTIONAL CLASSIC BUGS:
 *   Bug 1: Port Conflict (EADDRINUSE)
 *   Bug 2: Wrong Import Path (Cannot find module)
 *   Bug 3: Table-name Typo (SQLITE_ERROR: no such table)
 *   Bug 4: Missing Await (Promise { <pending> } returned instead of data)
 */

const express = require('express');

// BUG 2: WRONG IMPORT PATH
// The file is located at '../db' or './db', but the developer wrote './database/db'
// Error: Cannot find module './database/db'
const db = require('./database/db');

const app = express();
app.use(express.json());

// BUG 1: PORT CONFLICT (EADDRINUSE)
// Hardcoding a fixed port without checking process.env.PORT or colliding with another instance
// Error: Error: listen EADDRINUSE: address already in use :::3000
const PORT = 3000;

// Broken Route: Missing await and Table-name typo
app.get('/books', async (req, res) => {
  try {
    // BUG 3: TABLE-NAME TYPO
    // The table name is 'books', but the developer typed 'tbl_books'
    // Error: SQLITE_ERROR: no such table: tbl_books
    const sql = 'SELECT * FROM tbl_books';

    // BUG 4: MISSING AWAIT
    // Calling the asynchronous database query without 'await'
    // Result: 'books' is assigned a pending Promise [object Promise],
    // sending empty/unresolved response or triggering unhandled rejections
    const books = db.queryAll(sql); // <-- MISSING AWAIT!

    res.status(200).json({ success: true, data: books });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Second listener on same port causing EADDRINUSE conflict immediately
app.listen(PORT, () => {
  console.log(`Server instance 1 running on port ${PORT}`);
});

// BUG 1 DEMO: Calling listen again on the same port causes EADDRINUSE
app.listen(PORT, () => {
  console.log(`Server instance 2 running on port ${PORT}`);
});
