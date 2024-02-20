const express = require('express');
const { createServer } = require('node:http');
const { readFileSync } = require('fs')


const app = express();
const server = createServer(app);

app.get('/', (req, res) => {
  const indexData = readFileSync('index.html')
  res.send(indexData.toString());
  //res.send('<h1>Hello razzi</h1>');

});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
  
});