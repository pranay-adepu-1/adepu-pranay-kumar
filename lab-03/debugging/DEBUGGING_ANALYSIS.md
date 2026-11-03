# BDF Lab 03 - Debugging Exercise Analysis

**Course:** Backend Development Fundamentals (Year II Term II)  
**Institution:** Aurora University  
**Faculty:** Joel Prashanth D  
**Student:** Adepu Pranay Kumar  
**Registration Number:** 252U1R1002  
**Section:** CSE-2A(S-15)  

---

## Overview

In this debugging exercise, students were presented with a broken version of the REST API project containing four classic backend errors:
1. **Port Conflict (`EADDRINUSE`)**
2. **Wrong Import Path (`MODULE_NOT_FOUND`)**
3. **Table-name Typo (`no such table`)**
4. **Missing `await` (Asynchronous synchronization bug)**

Below is a detailed analysis of each error, including its symptoms, root cause, code comparison, and fix.

---

### Bug 1: Port Conflict (`EADDRINUSE`)

#### 1. Symptom & Error Output
When starting the server using `node broken-server.js`:
```
Error: listen EADDRINUSE: address already in use :::3000
    at Server.setupListenHandle [as _listen2] (node:net:1904:16)
    at listenInCluster (node:net:1961:12)
    at Server.listen (node:net:2063:7)
    at Function.listen (.../node_modules/express/lib/application.js:635:24)
    at Object.<anonymous> (.../debugging/broken-server.js:46:5)
```

#### 2. Root Cause
- The application attempts to bind to TCP port `3000`, which is either already occupied by another running Node.js process, or the code accidentally invokes `app.listen(PORT)` multiple times.
- Furthermore, hardcoding `const PORT = 3000` prevents cloud hosts (such as Render, AWS, Heroku) from dynamically assigning the port through environment variables (`process.env.PORT`).

#### 3. Resolution
- Use `process.env.PORT || 3000` to allow dynamic port allocation.
- Ensure only a single `app.listen()` call is executed when the file is run directly (`if (require.main === module)`).
- If another process is holding the port locally, identify and kill it (e.g. `Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess`).

```javascript
// BROKEN:
const PORT = 3000;
app.listen(PORT, ...);
app.listen(PORT, ...); // Duplicate listener

// FIXED:
const PORT = process.env.PORT || 3005;
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}
```

---

### Bug 2: Wrong Import Path (`MODULE_NOT_FOUND`)

#### 1. Symptom & Error Output
```
node:internal/modules/cjs/loader:1225
  throw err;
  ^

Error: Cannot find module './database/db'
Require stack:
- C:\...\lab-03\debugging\broken-server.js
    at Module._resolveFilename (node:internal/modules/cjs/loader:1222:15)
    at Module._load (node:internal/modules/cjs/loader:1048:27)
    at Module.require (node:internal/modules/cjs/loader:1305:19)
    at require (node:internal/modules/helpers:123:18)
    at Object.<anonymous> (.../debugging/broken-server.js:15:12)
```

#### 2. Root Cause
- The developer wrote `require('./database/db')`, assuming the database module was in a subfolder named `database`. However, the actual database file is located at `../db.js` relative to the `debugging` folder (or `./db.js` in the project root).
- In CommonJS, relative paths (`./` and `../`) are resolved relative to the current file's directory (`__dirname`).

#### 3. Resolution
- Correct the relative path to point to the actual file location.

```javascript
// BROKEN:
const db = require('./database/db');

// FIXED:
const { queryAll } = require('../db');
```

---

### Bug 3: Table-Name Typo (`SQLITE_ERROR: no such table`)

#### 1. Symptom & Error Output
When an HTTP client performs `GET /books`:
```json
HTTP/1.1 500 Internal Server Error
Content-Type: application/json; charset=utf-8

{
  "message": "SQLITE_ERROR: no such table: tbl_books"
}
```

#### 2. Root Cause
- The database schema initialized the table as `books` (`CREATE TABLE IF NOT EXISTS books (...)`).
- The developer queried `tbl_books` in `SELECT * FROM tbl_books`. SQLite checks the sqlite_master schema, fails to find `tbl_books`, and throws an error.

#### 3. Resolution
- Align the SQL query table name with the database schema (`books`).

```javascript
// BROKEN:
const sql = 'SELECT * FROM tbl_books';

// FIXED:
const sql = 'SELECT id, title, author, price FROM books';
```

---

### Bug 4: Missing `await` (Asynchronous Promise Bug)

#### 1. Symptom & Output
When `GET /books` is invoked without `await`:
```json
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "success": true,
  "data": {}
}
```
In other cases or Node versions, the client may receive an empty object `{}` because `JSON.stringify(new Promise(...))` serializes to `{}`! The server might also trigger an `UnhandledPromiseRejection` if the query later encounters an error after the HTTP response has already closed.

#### 2. Root Cause
- `db.queryAll(sql)` returns a JavaScript `Promise`.
- Without the `await` keyword, JavaScript does not pause execution of the `async` handler to wait for the Promise to resolve. Instead, it synchronously assigns the pending `Promise` object to `books` and immediately sends `res.json({ success: true, data: books })`.
- Since Promise objects have no enumerable properties, JSON serialization produces `{}` instead of the expected array of books.

#### 3. Resolution
- Add `await` before calling the async query helper so the resolved array of rows is assigned to `books`.

```javascript
// BROKEN:
const books = db.queryAll(sql); // Returns Promise { <pending> }

// FIXED:
const books = await queryAll(sql); // Awaits and returns Array of rows
```

---

## Summary Comparison Matrix

| Bug # | Classification | Error Code / Indicator | Root Cause | Fix Applied |
| :--- | :--- | :--- | :--- | :--- |
| **1** | System / Network | `EADDRINUSE` | Hardcoded port, duplicate `listen()` | Use `process.env.PORT \|\| 3005`, single listener |
| **2** | Module Resolution | `MODULE_NOT_FOUND` | Incorrect relative import path | Corrected path to `../db` |
| **3** | Database Query | `SQLITE_ERROR: no such table` | Typo in SQL table name (`tbl_books`) | Corrected table name to `books` |
| **4** | Asynchronous Flow | Premature response / `{}` payload | Missing `await` on DB Promise | Added `await queryAll(sql)` |
