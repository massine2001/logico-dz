// pages/api/socket.js

import { Server } from 'socket.io';

export default function handler(req, res) {
  if (!res.socket.server.io) {
    console.log('Initialisation de Socket.IO');
    const io = new Server(res.socket.server);
    res.socket.server.io = io;

    io.on('connection', (socket) => {
      console.log('Nouvel utilisateur connecté', socket.id);

      socket.on('joinRoom', (roomId) => {
        socket.join(roomId);
        console.log(`Utilisateur ${socket.id} a rejoint la réunion ${roomId}`);
        socket.broadcast.to(roomId).emit('user-connected', socket.id);  // Notifie les autres utilisateurs
      });

      socket.on('sendMessage', (message) => {
        io.in(message.roomId).emit('receiveMessage', message);  // Diffuse le message à tous les utilisateurs dans la salle
      });

      socket.on('disconnect', () => {
        console.log('Utilisateur déconnecté', socket.id);
        socket.broadcast.emit('user-disconnected', socket.id);
      });
    });
  }
  res.end();
}
