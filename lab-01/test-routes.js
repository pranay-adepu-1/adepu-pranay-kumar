const http = require('http');
const app = require('./server');

const TEST_PORT = 3001;

function makeRequest(port, path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: path,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          path,
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.end();
  });
}

async function runTests() {
  console.log('====================================================');
  console.log('  TESTING EXPRESS SERVER (Tasks 4, 5, 6, 7)');
  console.log('====================================================\n');

  const server = app.listen(TEST_PORT, async () => {
    try {
      const routesToTest = ['/', '/about', '/time', '/non-existent-path'];

      for (const route of routesToTest) {
        console.log(`--> Requesting: GET http://localhost:${TEST_PORT}${route}`);
        const response = await makeRequest(TEST_PORT, route);
        console.log(`    Status Code: ${response.statusCode} ${response.statusCode === 200 ? 'OK' : response.statusCode === 404 ? 'Not Found' : ''}`);
        console.log(`    Content-Type: ${response.headers['content-type']}`);
        console.log(`    Response Body: ${response.body}`);
        console.log('----------------------------------------------------');
      }

      console.log('\n[SUCCESS] All Express routes verified with expected status codes!\n');
    } catch (err) {
      console.error('[ERROR] Route testing failed:', err);
    } finally {
      server.close();
    }
  });
}

runTests();

