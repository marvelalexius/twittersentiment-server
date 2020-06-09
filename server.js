const dotenv = require('dotenv');
const express = require('express');
const socket = require('socket.io');
const http = require('http');
const tweetstream = require('./tweetstream');

dotenv.config();

const app = express();

const server = http.createServer(app);
const port = process.env.PORT || 5000;

const io = socket(server);

app.use(express.json());

tweetstream(app, io);

server.listen(port, () => {
    console.log(`listening on port ${port}`);
});