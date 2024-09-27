import { useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useRouter } from 'next/router';

let socket;

export default function Room() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [muted, setMuted] = useState(false);
  const [sharingScreen, setSharingScreen] = useState(false);
  const [screenStream, setScreenStream] = useState(null);
  const router = useRouter();
  const { id: roomId } = router.query;
  const videoRef = useRef();
  const peerVideoRef = useRef();
  const [peerId, setPeerId] = useState(null);
  const peerRef = useRef(null);
  const messageEndRef = useRef(null);
  const [devices, setDevices] = useState({ cameras: [], microphones: [] });
  const [selectedCamera, setSelectedCamera] = useState('');
  const [selectedMicrophone, setSelectedMicrophone] = useState('');

  useEffect(() => {
    if (roomId) {
      socketInitializer();
      peerInitializer();
      getDevices();

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
      alert(`Utilisateur ${userId} a rejoint la salle.`); // Notification visuelle
    
      if (peerRef.current && videoRef.current) {
        const call = peerRef.current.call(userId, videoRef.current.srcObject);
        call.on('stream', (remoteStream) => {
          peerVideoRef.current.srcObject = remoteStream;
        });
      }
    });
    
    socket.on('user-disconnected', (userId) => {
      console.log(`Utilisateur déconnecté: ${userId}`);
      alert(`Utilisateur ${userId} a quitté la salle.`); // Notification visuelle
    });
    

    socket.on('receiveMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user-muted', ({ userId, muted }) => {
      console.log(`${userId} a ${muted ? 'coupé' : 'rétabli'} son micro`);
    });

    socket.on('user-sharing-screen', ({ userId, screenStreamId }) => {
      console.log(`Utilisateur ${userId} partage son écran avec l'ID du stream: ${screenStreamId}`);
    });
  };

  const peerInitializer = () => {
    const peer = new Peer();
    peerRef.current = peer;
  
    peer.on('open', (id) => {
      setPeerId(id);
      socket.emit('join-room', roomId, id);
  
      // Demande d'accès à la caméra et au micro
      navigator.mediaDevices.getUserMedia({ video: { deviceId: selectedCamera }, audio: { deviceId: selectedMicrophone } })
        .then((stream) => {
          videoRef.current.srcObject = stream;
  
          peer.on('call', (call) => {
            call.answer(stream);
            call.on('stream', (remoteStream) => {
              peerVideoRef.current.srcObject = remoteStream;
            });
          });
        }).catch(error => {
          // Gestion d'erreur d'accès aux périphériques
          console.error('Erreur lors de la capture du média:', error);
          alert("Erreur d'accès à la caméra ou au microphone. Veuillez vérifier les permissions.");
        });
    });
  };
  

  const sendMessage = () => {
    if (newMessage.trim() !== '') {
      const message = { roomId, text: newMessage, timestamp: new Date() };
      try {
        socket.emit('sendMessage', message);
        setMessages((prev) => [...prev, message]);
        setNewMessage('');
      } catch (error) {
        console.error('Erreur lors de l\'envoi du message:', error);
        alert('Erreur lors de l\'envoi du message. Veuillez réessayer.');
      }
    } else {
      alert("Le message ne peut pas être vide.");
    }
  };
  

  const toggleMute = () => {
    setMuted(!muted);
    socket.emit('mute-status-changed', { roomId, userId: peerId, muted: !muted });
  };

  const toggleScreenShare = async () => {
    if (sharingScreen) {
      setSharingScreen(false);
      screenStream.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      alert("Vous avez arrêté le partage d'écran.");
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        setSharingScreen(true);
        socket.emit('share-screen', { roomId, userId: peerId, screenStreamId: stream.id });
        alert("Vous partagez votre écran."); // Notification visuelle
      } catch (error) {
        console.error('Erreur lors du partage d\'écran:', error);
        alert("Impossible de partager l'écran. Veuillez vérifier les permissions.");
      }
    }
  };
  
  const getDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      const microphones = devices.filter(device => device.kind === 'audioinput');
      setDevices({ cameras, microphones });
  
      if (cameras.length === 0) {
        alert("Aucune caméra trouvée.");
      }
  
      if (microphones.length === 0) {
        alert("Aucun microphone trouvé.");
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des périphériques:', error);
      alert("Erreur lors de la récupération des périphériques. Veuillez vérifier vos paramètres.");
    }
  };
  
  return (
    <div className="room-container">
      <div className="video-container">
        <video ref={videoRef} autoPlay muted />
        <video ref={peerVideoRef} autoPlay />
      </div>
      <div className="controls">
      <div className="device-selection">
      <label>Caméra :</label>
      <select onChange={(e) => setSelectedCamera(e.target.value)} value={selectedCamera}>
        {devices.cameras.map((camera) => (
          <option key={camera.deviceId} value={camera.deviceId}>
            {camera.label || `Caméra ${camera.deviceId}`}
          </option>
        ))}
      </select>

      <label>Microphone :</label>
      <select onChange={(e) => setSelectedMicrophone(e.target.value)} value={selectedMicrophone}>
        {devices.microphones.map((microphone) => (
          <option key={microphone.deviceId} value={microphone.deviceId}>
            {microphone.label || `Microphone ${microphone.deviceId}`}
          </option>
        ))}
      </select>
      <button onClick={toggleMute}>{muted ? 'Désactiver muet' : 'Activer muet'}</button>
        <button onClick={toggleScreenShare}>{sharingScreen ? 'Arrêter le partage' : 'Partager l\'écran'}</button>
   
    </div>

          </div>
      <div className="chat-container">
        <ul>
          {messages.map((message, index) => (
            <li key={index}>
              <span>{message.text}</span>
              <br />
              <small>{new Date(message.timestamp).toLocaleTimeString()}</small>
            </li>
          ))}
          <div ref={messageEndRef} />
        </ul>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
      </div>
    </div>
  );
}
