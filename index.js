const express = require('express');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { Server } = require('socket.io');
const sqlite3 = require('sqlite3');//.verbose(); wats this
const { open } = require('sqlite');
const cons = require('@ladjs/consolidate');
const busboy = require('busboy');
const fs = require('fs');

function tic(io){
    let serverTurn =0
    let player=0
    io.on('connection', (socket) => {
        player++
        //console.log(player)
        io.emit("playernum",player)
        console.log("player"+ player+"joined")

        socket.on('board',(board) => {
          io.emit('board',board)
        })
        socket.on('currentPlayer',(currentPlayer) => {
          io.emit('currentPlayer',currentPlayer)
        })
        socket.on('row',(row) => {
          io.emit('row',row)
        })
        socket.on('col',(col) => {
          io.emit('col',col)
        })

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
async function movie(io ,db){
  await db.exec(`
  CREATE TABLE IF NOT EXISTS movie (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    year INTEGER,
    genre TEXT
  );
`);

}

async function chat(io) {
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


  io.on('connection', async (socket) => {
    socket.on('chat message', async (msg, clientOffset, callback) => {
      let result;
      try {
        result = await db.run('INSERT INTO messages (content, client_offset) VALUES (?, ?)', msg, clientOffset);
      } catch (e) {
        if (e.errno === 19 /* SQLITE_CONSTRAINT */) {
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
        );
      } catch (e) {
        // something went wrong
      }
    }
  });
}
async function main() {
  const app = express();
  const server = createServer(app);
  const io = new Server(server)

  // const db = new sqlite3.Database('example.db');

  const db = await open({
    filename: 'app.db',
    driver: sqlite3.Database
  });

  await chat(io);
  tic(io)
  await movie(io,db)

  app.engine('html', cons.mustache);
  app.set('views', './views')
  app.set('view engine', 'html')

  app.use(express.json())
  app.use(express.static('public'));
  app.use(express.static('public/images'));

  app.use(express.urlencoded({extended:true}))

  app.get('/', (req, res) => {   
    res.sendFile(join(__dirname, 'projects/home/index.html'));
  });

  app.get('/tic', (req, res) => {
    res.sendFile(join(__dirname, 'projects/tic/tic.html'));
  });

  app.get('/chat', (req, res) => {
    res.sendFile(join(__dirname, 'projects/chat/chat.html'));
  });

  app.get('/create_movie', (req, res) => {
    res.sendFile(join(__dirname, 'projects/movie/movie.html'));
  });

  app.get('/movies', async (req, res) => {
    const movies = await db.all('select * from movie')
    //res.render('movies', { movies })
    res.render('movies2', { movies })

  });

  app.get('/movies/:id', async (req, res) => {
    const result = await db.get(`
      SELECT title, year, genre,id,image
      FROM movie
      where id = ?
      `, req.params.id
    );
    //res.render('moviesupdate', { movie: result })
    console.log(result)
    res.render('moviesupdate2', { movie: result })
  });

  app.post('/upload', async (req, res) => {
    let imo = "rainbow"
    const formData = {}; // Initialize an empty object to store form data
    const bb = busboy({ headers: req.headers });
    bb.on('file', (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      const saveTo = join(__dirname, `images`,filename);
      if(fs.existsSync(saveTo)){

        res.end(`  <script>
        alert("these are not the droids you are looking for")
      </script>
      <a href="/">go back</a>`)
      return
      }else{
        const destination = fs.createWriteStream(saveTo);
        file.pipe(destination);
      }
      console.log(
        `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
        filename,
        encoding,
        mimeType
      );
      file.on('data', (data) => {
        console.log(`File [${name}] got ${data.length} bytes`);
      }).on('close', () => {
        console.log(`File [${name}] done`);
      });
      imo=filename
    });
    bb.on('field', (name, val, info) => {
      console.log(`Field [${name}]: value: %j`, val);
      formData[name] = val;
    });

    req.pipe(bb);
    bb.on('close', () => {
      console.log('Done parsing form!');
      res.sendFile(join(__dirname, 'projects/home/index.html'));
      //res.writeHead(303, { Connection: 'close', Location: '/' });
      //res.end();
      console.log(imo)
      console.log('Form data:', formData);
      console.log(formData.age)
    });
  });

  app.post('/movie/create', async (req, res) => {
    console.log(req.body)
    console.log("blue")
    const { title, year, genre } = req.body

    const result = await db.run(`
      INSERT INTO movie (title, year, genre)
      VALUES (?, ?, ?)`,
      title, year, genre// why is this not a array
    );
    
    console.log(`result is ${result}`)
    res.redirect('/movies')
  });

  app.post("/movies_update", (req, res) => {
    const movie = req.body;
    console.log(movie)
    const { id, title, year, genre } = req.body;

    const updateQuery = `
    UPDATE movie
    SET  title= ?,
    year = ?,
    genre = ?
    WHERE id = ?`;

    db.run(updateQuery, [title, year, genre,id], function (err) {
      if (err) {
        console.error("Error updating record:", err.message);
        res.status(500).send("Internal Server Error");
        return;
      }
      console.log(`Row(s) updated: ${this.changes}`);
      res.send("Record updated successfully");
    });

    res.redirect("/movies");
  
  });
  app.post("/movies_update2", (req, res) => {
    // const movie = req.body;
    // console.log(movie)
    // const { id, title, year, genre } = req.body;

    let imo = "rainbow"
    const formData = {}; // Initialize an empty object to store form data
    const bb = busboy({ headers: req.headers });
    bb.on('file', (name, file, info) => {
      const { filename, encoding, mimeType } = info;
      const saveTo = join(__dirname, `public/images`,filename);
      // if(fs.existsSync(saveTo)){

      //   res.end(`  <script>
      //   alert("these are not the droids you are looking for")
      // </script>
      // <a href="/">go back</a>`)
      // return
      // }else{
      //   const destination = fs.createWriteStream(saveTo);
      //   file.pipe(destination);
      // }
      const destination = fs.createWriteStream(saveTo);
      file.pipe(destination);
      console.log(
        `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
        filename,
        encoding,
        mimeType
      );
      file.on('data', (data) => {
        console.log(`File [${name}] got ${data.length} bytes`);
      }).on('close', () => {
        console.log(`File [${name}] done`);
      });
      imo=filename
    });
    bb.on('field', (name, val, info) => {
      console.log(`Field [${name}]: value: %j`, val);
      formData[name] = val;
    });

    req.pipe(bb);
    bb.on('close', () => {
      console.log('Done parsing form!');
      res.sendFile(join(__dirname, 'projects/home/index.html'));
      //res.writeHead(303, { Connection: 'close', Location: '/' });
      //res.end();
      console.log(imo)
      console.log('Form data:', formData);
      //console.log(formData.age)

      const updateQuery = `
    UPDATE movie
    SET  title= ?,
    year = ?,
    genre = ?,
    image=?
    WHERE id = ?`;

    db.run(updateQuery, [formData.title, formData.year, formData.genre,imo,formData.id], function (err) {
      if (err) {
        console.log("oops")
        console.error("Error updating record:", err.message);
        res.status(500).send("Internal Server Error");
        return;
      }
      console.log(`Row(s) updated: ${this.changes}`);
      res.send("Record updated successfully");
    });

    res.redirect("/movies");

    });  
  });
  
  const port = 3000;
  server.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
  });
}

main();