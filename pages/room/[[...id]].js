// pages/room.js
import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useRouter } from 'next/router';

export default function Room() {
  const socket = io('https://socket-production-3512.up.railway.app/');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const router = useRouter();
  const { id: roomId } = router.query;  // Récupère l'ID de la réunion depuis l'URL
  const videoRef = useRef();
  const peerVideoRef = useRef();
  const [peerId, setPeerId] = useState(null);
  const peerRef = useRef(null); // Utiliser un ref pour peer

  useEffect(() => {
    if (roomId) {
      // Initialiser Socket.IO
      socketInitializer();

      // Initialiser PeerJS
      peerInitializer();

      return () => {
        if (socket) socket.disconnect();
      };
    }
  }, [roomId]);

  const socketInitializer = () => {
    // Rejoindre la réunion via Socket.IO
    socket.emit('join-room', roomId, peerId); 

    socket.on('receiveMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on('user-connected', (userId) => {
      console.log(`Utilisateur connecté: ${userId}`);
      if (peerRef.current && videoRef.current) {
        const call = peerRef.current.call(userId, videoRef.current.srcObject);
        call.on('stream', (remoteStream) => {
          peerVideoRef.current.srcObject = remoteStream;
        });
      }
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

      // Demander la permission d'utiliser la caméra et le micro
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        videoRef.current.srcObject = stream;

        // Recevoir l'appel d'un utilisateur
        peer.on('call', (call) => {
          call.answer(stream); // Répondre à l'appel en envoyant le flux vidéo/audio
          call.on('stream', (remoteStream) => {
            peerVideoRef.current.srcObject = remoteStream;
          });
        });
      });
    });
  };

  const sendMessage = () => {
    socket.emit('sendMessage', { roomId, text: newMessage });
    setNewMessage('');
  };

  return (
    <div>
      <h1>Réunion {roomId}</h1>

      {/* Section vidéo */}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <video ref={videoRef} autoPlay muted style={{ width: '45%' }} />
        <video ref={peerVideoRef} autoPlay style={{ width: '45%' }} />
      </div>

      {/* Chat en temps réel */}
      <ul>
        {messages.map((msg, index) => (
          <li key={index}>{msg.text}</li>
        ))}
      </ul>

      <input
        type="text"
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
      />
      <button onClick={sendMessage}>Envoyer</button>
    </div>
  );
}
