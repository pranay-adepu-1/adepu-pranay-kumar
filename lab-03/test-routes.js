const http = require('http');
const app = require('./server');

const TEST_PORT = 3003;

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsedBody;
        try {
          parsedBody = JSON.parse(data);
        } catch {
          parsedBody = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: parsedBody,
          rawBody: data
        });
      });
    });

    req.on('error', (err) => reject(err));

    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runAllTests() {
  console.log('========================================================================');
  console.log('  LAB 3: REST API, QUERY PARAMETERS, VALIDATION & DEBUGGING TEST SUITE  ');
  console.log('  Student: Adepu Pranay Kumar | Reg: 252U1R1002 | Sec: CSE-2A(S-15)      ');
  console.log('========================================================================\n');

  const server = app.listen(TEST_PORT, async () => {
    let passed = 0;
    let failed = 0;

    const assertTest = (description, condition, details = '') => {
      if (condition) {
        console.log(`  [PASS] ${description}`);
        passed++;
      } else {
        console.error(`  [FAIL] ${description} - ${details}`);
        failed++;
      }
    };

    try {
      // 1. Root & Health Check
      console.log('--- Phase 1: Service Root & Health Endpoints ---');
      let res = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/', method: 'GET' });
      assertTest('GET / returns 200 with API overview', res.statusCode === 200 && res.body.student && res.body.documentation);

      res = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/health', method: 'GET' });
      assertTest('GET /health returns 200 OK with status ok', res.statusCode === 200 && res.body.status === 'ok');

      // 2. Query Parameters on GET /books
      console.log('\n--- Phase 2: GET /books Query Parameters (Search, Sort, Filters, Pagination) ---');
      res = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/books', method: 'GET' });
      assertTest('GET /books default returns 200 with data array', res.statusCode === 200 && Array.isArray(res.body.data) && res.body.count > 0);

      res = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/books?search_q=Clean', method: 'GET' });
      assertTest('GET /books?search_q=Clean matches "Clean Code"', res.statusCode === 200 && res.body.data.some(b => b.title.includes('Clean Code')));

      res = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/books?order_by=price&order=DESC', method: 'GET' });
      const isDesc = res.statusCode === 200 && res.body.data.length >= 2 && res.body.data[0].price >= res.body.data[1].price;
      assertTest('GET /books?order_by=price&order=DESC orders highest price first', isDesc);

      res = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/books?order_by=title&order=ASC', method: 'GET' });
      const isAscTitle = res.statusCode === 200 && res.body.data.length >= 2 && res.body.data[0].title.localeCompare(res.body.data[1].title) <= 0;
      assertTest('GET /books?order_by=title&order=ASC orders alphabetically', isAscTitle);

      res = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/books?min_price=20&max_price=40', method: 'GET' });
      const inRange = res.statusCode === 200 && res.body.data.every(b => b.price >= 20 && b.price <= 40);
      assertTest('GET /books?min_price=20&max_price=40 filters between prices', inRange);

      res = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/books?limit=3&offset=0', method: 'GET' });
      assertTest('GET /books?limit=3&offset=0 returns exactly 3 records', res.statusCode === 200 && res.body.data.length === 3 && res.body.limit === 3);

      // 3. GET /books/:id
      console.log('\n--- Phase 3: GET /books/:id (Success and 404 Failure) ---');
      const sampleId = res.body.data[0].id;
      res = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: `/books/${sampleId}`, method: 'GET' });
      assertTest(`GET /books/${sampleId} returns 200 and single book object`, res.statusCode === 200 && res.body.data.id === sampleId);

      res = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/books/999999', method: 'GET' });
      assertTest('GET /books/999999 returns 404 with error message', res.statusCode === 404 && res.body.message.includes('not found'));

      // 4. POST /books Validation and 201 Created
      console.log('\n--- Phase 4: POST /books Validation and 201 Status Code ---');
      res = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/books',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { title: 'Test Book For Automation', author: 'Adepu Pranay', price: 34.99 });
      assertTest('POST /books with valid data returns 201 Created', res.statusCode === 201 && res.body.data && res.body.data.id > 0);
      const createdBookId = res.body?.data?.id;

      // Failure validation: Missing title
      res = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/books',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { author: 'Adepu Pranay', price: 34.99 });
      assertTest('POST /books reject missing title with 400 Bad Request', res.statusCode === 400 && res.body.message.includes('title'));

      // Failure validation: Missing author
      res = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/books',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { title: 'No Author Book', price: 19.99 });
      assertTest('POST /books reject missing author with 400 Bad Request', res.statusCode === 400 && res.body.message.includes('author'));

      // Failure validation: Non-numeric price
      res = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/books',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, { title: 'Invalid Price Book', author: 'Author', price: 'not-a-number' });
      assertTest('POST /books reject non-numeric price with 400 Bad Request', res.statusCode === 400 && res.body.message.includes('price'));

      // 5. PUT /books/:id Update and Status Codes
      console.log('\n--- Phase 5: PUT /books/:id Update and Status Codes ---');
      res = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: `/books/${createdBookId}`,
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      }, { title: 'Updated Book Title', author: 'Updated Author', price: 49.99 });
      assertTest(`PUT /books/${createdBookId} returns 200 OK and updated data`, res.statusCode === 200 && res.body.data.title === 'Updated Book Title');

      res = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: '/books/999999',
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      }, { title: 'Non existent', author: 'None', price: 20 });
      assertTest('PUT /books/999999 non-existent returns 404 Not Found', res.statusCode === 404 && res.body.message.includes('not found'));

      // 6. PATCH /books/:id Partial Update
      console.log('\n--- Phase 6: PATCH /books/:id Partial Update ---');
      res = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: `/books/${createdBookId}`,
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' }
      }, { price: 55.00 });
      assertTest(`PATCH /books/${createdBookId} updates only price and returns 200 OK`, res.statusCode === 200 && res.body.data.price === 55.00);

      // 7. DELETE /books/:id Delete and Status Codes
      console.log('\n--- Phase 7: DELETE /books/:id Deletion and Status Codes ---');
      res = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: `/books/${createdBookId}`,
        method: 'DELETE'
      });
      assertTest(`DELETE /books/${createdBookId} returns 200 OK with success message`, res.statusCode === 200 && res.body.message.includes('deleted successfully'));

      res = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: `/books/${createdBookId}`,
        method: 'DELETE'
      });
      assertTest(`DELETE /books/${createdBookId} again returns 404 Not Found`, res.statusCode === 404 && res.body.message.includes('not found'));

      // 8. Query Validation Failure Cases
      console.log('\n--- Phase 8: Query Validation and Global 404 Failure Cases ---');
      res = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/books?order_by=hacked_column', method: 'GET' });
      assertTest('GET /books?order_by=hacked_column rejected with 400 Bad Request', res.statusCode === 400 && res.body.message.includes('order_by'));

      res = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/books?order=INVALID', method: 'GET' });
      assertTest('GET /books?order=INVALID rejected with 400 Bad Request', res.statusCode === 400 && res.body.message.includes('order'));

      res = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/books?min_price=100&max_price=50', method: 'GET' });
      assertTest('GET /books?min_price=100&max_price=50 rejected with 400 Bad Request', res.statusCode === 400 && res.body.message.includes('min_price'));

      res = await request({ hostname: '127.0.0.1', port: TEST_PORT, path: '/non-existent-api-path', method: 'GET' });
      assertTest('GET /non-existent-api-path returns consistent 404 JSON', res.statusCode === 404 && res.body.message.includes('does not exist'));

      console.log('\n========================================================================');
      console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED (TOTAL: ${passed + failed})`);
      console.log('========================================================================\n');

      if (failed > 0) {
        process.exitCode = 1;
      }
    } catch (err) {
      console.error('[TEST SUITE ERROR]', err);
      process.exitCode = 1;
    } finally {
      server.close();
    }
  });
}

runAllTests();

