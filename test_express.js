const express = require('express');
const app = express();
const path = require('path');

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res) => res.status(404).send('Not Found'));

const server = app.listen(0, () => {
  const port = server.address().port;
  console.log(`Server on ${port}`);
  const http = require('http');
  
  // Create dummy file
  const fs = require('fs');
  fs.mkdirSync('uploads/kyc', {recursive: true});
  fs.writeFileSync('uploads/kyc/test.txt', 'hello');

  http.get(`http://localhost:${port}/uploads/kyc/test.txt`, (res) => {
    console.log('/uploads: ' + res.statusCode);
  });
  
  http.get(`http://localhost:${port}/api/uploads/kyc/test.txt`, (res) => {
    console.log('/api/uploads: ' + res.statusCode);
    server.close();
  });
});
