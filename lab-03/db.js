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

const sqlite3Module = safeRequire('sqlite3');
const sqlite3 = sqlite3Module.verbose ? sqlite3Module.verbose() : sqlite3Module;

// Determine database file location (file-based or in-memory)
const dbPath = process.env.NODE_ENV === 'test'
  ? ':memory:'
  : process.env.DB_PATH || path.join(__dirname, 'books.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error(`[DB Error] Could not connect to SQLite database:`, err.message);
  } else {
    console.log(`[DB] Connected to SQLite database at: ${dbPath}`);
  }
});

// Promise-based helper methods for parameterized queries
const queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
};

const queryOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
};

const execute = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

// Seed initial records if table is empty
const seedDatabase = async () => {
  try {
    await execute(`
      CREATE TABLE IF NOT EXISTS books (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT NOT NULL,
        price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const countRow = await queryOne('SELECT COUNT(*) as count FROM books');
    if (countRow && countRow.count === 0) {
      const sampleBooks = [
        ['The Pragmatic Programmer', 'David Thomas, Andrew Hunt', 48.50],
        ['Clean Code', 'Robert C. Martin', 42.00],
        ['Design Patterns', 'Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides', 54.00],
        ['You Don\'t Know JS Yet', 'Kyle Simpson', 29.99],
        ['Eloquent JavaScript', 'Marijn Haverbeke', 24.50],
        ['Refactoring', 'Martin Fowler', 47.00],
        ['Introduction to Algorithms', 'Thomas H. Cormen', 85.00],
        ['JavaScript: The Good Parts', 'Douglas Crockford', 19.99],
        ['Node.js Design Patterns', 'Mario Casciaro, Luciano Mammino', 39.99],
        ['Learning SQL', 'Alan Beaulieu', 32.50]
      ];

      for (const [title, author, price] of sampleBooks) {
        await execute('INSERT INTO books (title, author, price) VALUES (?, ?, ?)', [title, author, price]);
      }
      console.log(`[DB Seed] Seeded ${sampleBooks.length} initial books into database.`);
    }
  } catch (err) {
    console.error('[DB Init Error]', err);
  }
};

// Initialize schema on load
seedDatabase();

module.exports = {
  db,
  queryAll,
  queryOne,
  execute,
  seedDatabase
};
