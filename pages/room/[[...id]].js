import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useRouter } from 'next/router';

export default function Room() {
  const socket = io('https://socket-production-3512.up.railway.app/');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const router = useRouter();
  const { id: roomId } = router.query;
  const videoRef = useRef();
  const peerVideoRef = useRef();
  const [peerId, setPeerId] = useState(null);
  const peerRef = useRef(null);

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
    socket.on('user-connected', (userId) => {
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

    socket.on('receiveMessage', (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
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
    if (newMessage.trim() === '') return;  // Évite d'envoyer des messages vides
    socket.emit('sendMessage', { roomId, text: newMessage });
    setMessages((prevMessages) => [...prevMessages, { text: newMessage }]);
    setNewMessage('');
  };

  return (
    <div className={'container'}>
      <div className={'videoSection'}>
        <video ref={videoRef} autoPlay muted className={'localVideo'} />
        <video ref={peerVideoRef} autoPlay className={'remoteVideo'} />
      </div>
      <div className={'chatSection'}>
        <div className={'messages'}>
          {messages.map((message, index) => (
            <div key={index} className={'message'}>
              {message.text}
            </div>
          ))}
        </div>
        <div className={'messageInput'}>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez un message"
          />
          <button onClick={sendMessage}>Envoyer</button>
        </div>
      </div>
    </div>
  );
}
