import express from 'express';
import upload from 'express-fileupload';
import cors from 'cors';
import socketIO from './config/socket.js'
import router from './routes/init.js';
import connection from './config/connection.js';
import initSocket from './app/events/init.js';

console.clear();
const app = express();

app.use(express.json());
app.use(upload());
app.use(cors());
app.use("/api", router);

app.get("/", (req, res) => res.send("Welcome to the Users API!"));
app.all("*", (req, res) => res.status(404).send("You've tried reaching a route that doesn't exist."));

// Create an HTTP server
const expressServer = connection(app);

// create socket.io instance
const io = socketIO(expressServer).instance;

// Initialize socket events
initSocket(io);

app.set('socket', io);

console.log('\x1b[96mSocket.io listening for connections\x1b[0m');