import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useRouter } from 'next/router';

export default function Room() {
  const [connectedUsers, setConnectedUsers] = useState([]); // Utilisateurs connectés
  const [messages, setMessages] = useState([]); // Messages de chat
  const [newMessage, setNewMessage] = useState(''); // Nouveau message
  const videoRefs = useRef({}); // Références vidéos pour chaque utilisateur
  const localVideoRef = useRef(); // Vidéo locale
  const router = useRouter();
  const { id: roomId } = router.query; // ID de la salle
  const socket = useRef(null);
  const peer = useRef(null);

  useEffect(() => {
    if (roomId) {
      socket.current = io('https://socket-production-3512.up.railway.app/');
      
      // Initialiser PeerJS
      peer.current = new Peer();

      peer.current.on('open', (id) => {
        socket.current.emit('join-room', roomId, id); // Joindre la salle avec le PeerID

        // Obtenir le flux local
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then((stream) => {
            localVideoRef.current.srcObject = stream; // Assigner le flux à la vidéo locale

            // Appeler les utilisateurs déjà connectés
            socket.current.on('all-users', (users) => {
              users.forEach((userId) => {
                const call = peer.current.call(userId, stream);
                call.on('stream', (remoteStream) => {
                  if (videoRefs.current[userId]) {
                    videoRefs.current[userId].srcObject = remoteStream;
                  }
                });
              });
            });

            // Recevoir les appels et répondre avec le flux local
            peer.current.on('call', (call) => {
              call.answer(stream);
              call.on('stream', (remoteStream) => {
                if (videoRefs.current[call.peer]) {
                  videoRefs.current[call.peer].srcObject = remoteStream;
                }
              });
            });
          });
      });

      // Gérer les nouveaux utilisateurs connectés
      socket.current.on('user-connected', (userId) => {
        setConnectedUsers((prevUsers) => [...prevUsers, userId]);

        const call = peer.current.call(userId, localVideoRef.current.srcObject);
        call.on('stream', (remoteStream) => {
          if (videoRefs.current[userId]) {
            videoRefs.current[userId].srcObject = remoteStream;
          }
        });
      });

      // Gérer les déconnexions
      socket.current.on('user-disconnected', (userId) => {
        setConnectedUsers((prevUsers) => prevUsers.filter((id) => id !== userId));
        if (videoRefs.current[userId]) {
          videoRefs.current[userId].srcObject = null;
        }
      });

      // Gérer les messages de chat
      socket.current.on('receive-message', (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      });

      return () => {
        socket.current.disconnect();
      };
    }
  }, [roomId]);

  const sendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      socket.current.emit('send-message', newMessage);
      setMessages((prevMessages) => [...prevMessages, { text: newMessage, sender: 'You' }]);
      setNewMessage('');
    }
  };

  return (
    <div>
      <h1>Room {roomId}</h1>

      {/* Section Vidéo */}
      <div>
        <video ref={localVideoRef} autoPlay muted style={{ width: '300px' }} />

        {connectedUsers.map((userId) => (
          <video
            key={userId}
            ref={(el) => (videoRefs.current[userId] = el)}
            autoPlay
            style={{ width: '300px' }}
          />
        ))}
      </div>

      {/* Section Chat */}
      <div>
        <div>
          {messages.map((msg, index) => (
            <div key={index}>
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
          />
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
}
