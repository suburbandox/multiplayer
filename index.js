


const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

function tic(io){
    let serverTurn =0
    let player=0
    io.on('connection', (socket) => {
        player++
        //console.log(player)
        io.emit("playernum",player)
        console.log("player"+ player+"joined")

        io.emit("turn",serverTurn)
        socket.on('buttonpress', () => {
            serverTurn++
            io.emit('buttonstate', serverTurn);
        });
        socket.on('disconnect', (e) => {
          player--
          console.log(e)
          console.log("player"+ player+"left");
        });
      })
}
async function main() {
  const db = await open({
    filename: 'chat.db',
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_offset TEXT UNIQUE,
      content TEXT
    );
  `);

  const app = express();
  const server = createServer(app);
  const io = new Server(server)
  tic(io)
  app.get('/', (req, res) => {
    res.sendFile(join(__dirname, 'index.html'));
  });

  app.get('/tic', (req, res) => {
    res.sendFile(join(__dirname, 'tic.html'));
  });

  io.on('connection', async (socket) => {
    socket.on('chat message', async (msg, clientOffset, callback) => {
      let result;
      try {
        result = await db.run('INSERT INTO messages (content, client_offset) VALUES (?, ?)', msg, clientOffset);
      } catch (e) {
        if (e.errno === 19 /* SQLITE_CONSTRAINT */ ) {
          callback();
        } else {
          // nothing to do, just let the client retry
        }
        return;
      }
      io.emit('chat message', msg, result.lastID);
      callback();
    });

    if (!socket.recovered) {
      try {
        await db.each('SELECT id, content FROM messages WHERE id > ?',
          [socket.handshake.auth.serverOffset || 0],
          (_err, row) => {
            socket.emit('chat message', row.content, row.id);
          }
        )
      } catch (e) {
        // something went wrong
      }
    }
  });

  const port = 3000;

  server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
  });
}

main();