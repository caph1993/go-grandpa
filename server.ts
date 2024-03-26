import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import ViteExpress from "vite-express";

const app = express();
// const server = http.createServer(app);

const PORT = parseInt(process.env.PORT || '3000');

app.get("/message", (_, res) => res.send("Hello from express!"));

const server = ViteExpress.listen(app, PORT, () => console.log("Server is listening..."));

const io = new Server(server, {
  path: '/go/socket.io',
});


const hist: any[] = [];
let nUsers = 0;
io.on('connection', (socket) => {
  // console.log('A user connected');
  nUsers++;
  socket.emit('users', nUsers);
  socket.broadcast.emit('users', nUsers);
  socket.emit('hist', hist);
  socket.on('clear', (data: any) => {
    while (hist.length) hist.pop();
    socket.broadcast.emit('hist', hist);
  });
  socket.on('move', (data: any) => {
    data.time = new Date().toISOString();
    hist.push(data);
    // console.log('Received move:', data);
    socket.broadcast.emit('hist', hist);
    socket.emit('hist', hist);
  });
  socket.on('disconnect', () => {
    nUsers--;
    socket.broadcast.emit('users', nUsers);
  });
});

