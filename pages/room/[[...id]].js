import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useRouter } from 'next/router';
import './Room.css';  // Assurez-vous d'avoir un fichier CSS séparé

let socket;  // Éviter de recréer des instances socket

export default function Room() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const router = useRouter();
  const { id: roomId } = router.query;
  const videoRef = useRef();
  const peerVideoRef = useRef();
  const [peerId, setPeerId] = useState(null);
  const peerRef = useRef(null);
  const messageEndRef = useRef(null); // Référence pour autoscroll

  useEffect(() => {
    if (roomId) {
      socketInitializer();
      peerInitializer();

      return () => {
        if (socket) socket.disconnect();
      };
    }
  }, [roomId]);

  const socketInitializer = () => {
    if (!socket) {
      socket = io('https://socket-production-3512.up.railway.app/');
    }

    socket.on('user-connected', (userId) => {
      console.log(`Utilisateur connecté: ${userId}`);
      if (peerRef.current && videoRef.current) {
        const call = peerRef.current.call(userId, videoRef.current.srcObject);
        call.on('stream', (remoteStream) => {
          peerVideoRef.current.srcObject = remoteStream;
        });
      }
    });

    socket.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user-disconnected', (userId) => {
      console.log(`Utilisateur déconnecté: ${userId}`);
    });
  };

  const peerInitializer = () => {
    const peer = new Peer();
    peerRef.current = peer;

    peer.on('open', (id) => {
      setPeerId(id);
      socket.emit('join-room', roomId, id);

      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        videoRef.current.srcObject = stream;

        peer.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (remoteStream) => {
            peerVideoRef.current.srcObject = remoteStream;
          });
        });
      });
    });
  };

  const sendMessage = () => {
    if (newMessage.trim() !== '') {
      const message = { roomId, text: newMessage, timestamp: new Date() };
      socket.emit('sendMessage', message);
      setMessages((prev) => [...prev, message]);
      setNewMessage('');
    }
  };

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="room-container">
      <h1>Réunion {roomId}</h1>

      <div className="video-section">
        <video ref={videoRef} autoPlay className="local-video" />
        <video ref={peerVideoRef} autoPlay className="peer-video" />
      </div>

      <div className="chat-section">
        <ul className="chat-messages">
          {messages.map((msg, index) => (
            <li key={index} className="message-bubble">
              <span>{msg.text}</span>
              <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
            </li>
          ))}
          <div ref={messageEndRef} />
        </ul>
        <div className="message-input-container">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="message-input"
            placeholder="Tapez votre message..."
          />
          <button onClick={sendMessage} className="send-button">
            Envoyer
          </button>
        </div>
      </div>
    </div>
  );
}
