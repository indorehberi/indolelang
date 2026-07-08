const http = require('http');

http.get('http://localhost:8000/api/v1/users?role=bidder', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status Code:', res.statusCode);
    console.log('Response:', data.substring(0, 500));
  });
}).on('error', err => {
  console.log('Error:', err.message);
});
