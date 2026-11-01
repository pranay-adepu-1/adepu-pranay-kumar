const http = require('http');

const PORT = process.env.PORT || 3000;

// Plain HTTP server replying with "Hello" as required by Task 3
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Hello');
});

server.listen(PORT, () => {
  console.log(`Plain HTTP server is running at http://localhost:${PORT}/`);
});

module.exports = server;

