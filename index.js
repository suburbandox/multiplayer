const express = require('express');
const { createServer } = require('node:http');
const { readFileSync } = require('fs')
const { join } = require('node:path');
const { Server } = require('socket.io');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  connectionStateRecovery: {}
});
app.get('/', (req, res) => {
  const indexData = readFileSync('index.html')
  res.sendFile(join(__dirname, 'index.html'));
  //res.send(indexData.toString());
  //res.send('<h1>Hello razzi</h1>');
});

io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    console.log('message: ' + msg);
  });
});

// io.on('connection', (socket) => {
//   socket.broadcast.emit('hi');
// });

io.on('connection', (socket) => {
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });
});

// this will emit the event to all connected sockets
 io.emit('hello7', 'world'); 

//from server
// io.on('connection', (socket) => {
//   socket.emit('hello', 'world7');
// });

//to server
// io.on('connection', (socket) => {
//   socket.on('hello', (arg) => {
//     console.log(arg); // 'world'
//   });
// });
//to server
// io.on('connection', (socket) => {
//   socket.on('hello2', (arg1, arg2, arg3) => {
//     console.log(arg1); // 1
//     console.log(arg2); // '2'
//     console.log(arg3); // { 3: '4', 5: <Buffer 06> }
//   });
// });
//from server
// io.on('connection', (socket) => {
//   socket.emit('hello2', 1, '2', { 3: '4', 5: Buffer.from([6]) });
// });
//to server
// io.on('connection', (socket) => {
//   socket.on('request', (arg1, arg2, callback) => {
//     console.log(arg1); // { foo: 'bar' }
//     console.log(arg2); // 'baz'
//     callback({
//       status: 'ok'
//     });
//   });
// });
//from server
// io.on('connection', (socket) => {
//   socket.timeout(5000).emit('request2', { foo: 'bar' }, 'baz', (err, response) => {
//     if (err) {
//       // the client did not acknowledge the event in the given delay
//     } else {
//       console.log(response.status); // 'ok'
//     }
//   });
// });
// io.on('connection', async (socket) => {
//   try {
//     const response = await socket.timeout(5000).emitWithAck('request', { foo: 'bar' }, 'baz');
//     console.log(response.status); // 'ok'
//   } catch (e) {
//     // the client did not acknowledge the event in the given delay
//   }
// });

// io.on('connection', (socket) => {
//   socket.on('request', (arg1, arg2, callback) => {
//     console.log(arg1); // { foo: 'bar' }
//     console.log(arg2); // 'baz'
//     callback({
//       status: 'ok'
//     });
//   });
// });
io.on('connection', (socket) => {
  socket.emit('hello', 1, '2', { 3: '4', 5: Uint8Array.from([6]) });
});
io.on('connection', async (socket) => {
  try {
    const response = await socket.timeout(5000).emitWithAck('request', { foo: 'bar' }, 'baz');
    console.log(response.status); // 'ok'
  } catch (e) {
    // the client did not acknowledge the event in the given delay
  }
});

server.listen(3000, () => {
  console.log('server running at http://localhost:3000');
});