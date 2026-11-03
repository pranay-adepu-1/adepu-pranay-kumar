# Backend Development Fundamentals — Labs Repository

**Student Name:** Adepu Pranay Kumar  
**Registration Number:** 252U1R1002  
**Section:** CSE-2A(S-15)  
**Course:** B.Tech CSE (Backend Development Fundamentals - Year II Term II)  
**Institution:** Aurora University  
**Faculty:** Joel Prashanth D / Shiva sai teja  

This repository contains all lab assignments for the Backend Development Fundamentals course, organized by lab directory (`lab-01` to `lab-10`).

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/pranay-adepu-1/adepu-pranay-kumar)

### Live Deployment on Render
- **Course Landing / API Index:** [https://adepu-pranay-kumar.onrender.com/](https://adepu-pranay-kumar.onrender.com/)
- **Lab 1 - About (Student Info):** [https://adepu-pranay-kumar.onrender.com/about](https://adepu-pranay-kumar.onrender.com/about)
- **Lab 1 - Server Time:** [https://adepu-pranay-kumar.onrender.com/time](https://adepu-pranay-kumar.onrender.com/time)
- **Lab 3 - Books API (Default):** [https://adepu-pranay-kumar.onrender.com/books](https://adepu-pranay-kumar.onrender.com/books)
- **Lab 3 - Title Search (LIKE):** [https://adepu-pranay-kumar.onrender.com/books?search_q=Clean](https://adepu-pranay-kumar.onrender.com/books?search_q=Clean)
- **Lab 3 - Sort by Price DESC:** [https://adepu-pranay-kumar.onrender.com/books?order_by=price&order=DESC](https://adepu-pranay-kumar.onrender.com/books?order_by=price&order=DESC)
- **Lab 3 - Price Filter (BETWEEN):** [https://adepu-pranay-kumar.onrender.com/books?min_price=20&max_price=45](https://adepu-pranay-kumar.onrender.com/books?min_price=20&max_price=45)
- **Lab 3 - Pagination (limit & offset):** [https://adepu-pranay-kumar.onrender.com/books?limit=3&offset=0](https://adepu-pranay-kumar.onrender.com/books?limit=3&offset=0)
- **Lab 3 - Single Book by ID:** [https://adepu-pranay-kumar.onrender.com/books/1](https://adepu-pranay-kumar.onrender.com/books/1)
- **Lab 3 - Health Check:** [https://adepu-pranay-kumar.onrender.com/health](https://adepu-pranay-kumar.onrender.com/health)

---

## Course Lab Directory Structure

| Lab Folder | Title | Status | Link |
| :--- | :--- | :--- | :--- |
| **`lab-01/`** | **Node.js and Express Server** | Completed | [lab-01/README.md](./lab-01/README.md) |
| `lab-02/` | Express Routing & Middleware | Planned | — |
| **`lab-03/`** | **RESTful API Development & Validation** | Completed | [lab-03/README.md](./lab-03/README.md) |
| `lab-04/` | Database Integration & Queries | Planned | — |
| `lab-05/` | Authentication & Security | Planned | — |
| `lab-06/` | Advanced Middleware & Validation | Planned | — |
| `lab-07/` | Error Handling & Logging | Planned | — |
| `lab-08/` | File Uploads & Static Assets | Planned | — |
| `lab-09/` | API Testing & Optimization | Planned | — |
| `lab-10/` | Full Backend Deployment | Planned | — |

---

## Lab 1 Overview

- **Folder:** [`lab-01/`](./lab-01/)
- **Technology Stack:** Node.js, Express.js
- **Key Features:**
  - Plain Node.js server using built-in `http` module (`http-server.js`)
  - Express.js server with routes (`server.js`):
    - `GET /` : Welcome text
    - `GET /about` : JSON with student and course metadata
    - `GET /time` : Real-time timestamp using `new Date()`
    - 404 handler for unknown routes
  - Automated route testing script (`test-routes.js`)
  - Screenshots in [`lab-01/screenshots/`](./lab-01/screenshots/)
  - Full lab documentation, package.json field analysis, and viva answers in [`lab-01/README.md`](./lab-01/README.md)

---

## Lab 3 Overview

- **Folder:** [`lab-03/`](./lab-03/)
- **Technology Stack:** Node.js, Express.js, SQLite3, Parameterized SQL Queries
- **Key Features:**
  - **REST Resource Naming & HTTP Verbs:**
    - `GET /books`: List books with filtering, searching, sorting, and pagination
    - `GET /books/:id`: Retrieve single book by numeric ID
    - `POST /books`: Create a new book record (201 Created)
    - `PUT /books/:id`: Full update of an existing book (200 OK)
    - `PATCH /books/:id`: Partial update of an existing book (200 OK)
    - `DELETE /books/:id`: Delete a book record by ID (200 OK)
  - **Query Parameters on `GET /books`:**
    - `search_q`: Partial title match using SQL `LIKE ?`
    - `order_by`: Whitelisted ordering columns (`id`, `title`, `author`, `price`, `created_at`)
    - `order`: Sort order direction (`ASC`, `DESC`)
    - `limit` and `offset`: Pagination controls with default values
    - `min_price` and `max_price`: Price range filtering using SQL `BETWEEN ? AND ?`
  - **Request Body Validation:**
    - Rejects missing `title`, missing `author`, and non-numeric `price` with `400 Bad Request` and clear JSON error message.
  - **Proper Status Codes & Uniform Error Handling:**
    - `201 Created` for resource creation
    - `200 OK` for reads, updates, and deletes
    - `404 Not Found` for non-existent IDs with `{ "message": "..." }`
    - `400 Bad Request` for invalid input or malformed JSON
  - **Faculty Debugging Exercise Resolution:**
    - Post-mortem analysis and complete fix for 4 classic backend errors:
      1. Port conflict (`EADDRINUSE`)
      2. Wrong import path (`MODULE_NOT_FOUND`)
      3. Table-name typo (`no such table: tbl_books`)
      4. Missing `await` on asynchronous query call
    - Located in [`lab-03/debugging/`](./lab-03/debugging/) with `broken-server.js`, `fixed-server.js`, and `DEBUGGING_ANALYSIS.md`.
  - **Testing Evidence & Deliverables:**
    - Automated test runner [`test-routes.js`](./lab-03/test-routes.js) executing 23 comprehensive tests (23/23 passing)
    - Official Postman Collection v2.1.0 [`postman_collection.json`](./lab-03/postman_collection.json)
    - High-resolution visual capture cards in [`lab-03/screenshots/`](./lab-03/screenshots/)
    - In-depth documentation and viva voce answers in [`lab-03/README.md`](./lab-03/README.md)
