import { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import Peer from 'peerjs';
import { useRouter } from 'next/router';

export default function Room() {
  const [connectedUsers, setConnectedUsers] = useState([]); // Utilisateurs connectés
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

        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then((stream) => {
            localVideoRef.current.srcObject = stream; // Afficher la vidéo locale

            // Recevoir les appels entrants et répondre avec le flux local
            peer.current.on('call', (call) => {
              call.answer(stream);
              call.on('stream', (remoteStream) => {
                if (videoRefs.current[call.peer]) {
                  videoRefs.current[call.peer].srcObject = remoteStream; // Associer le flux reçu à la vidéo de l'autre utilisateur
                }
              });
            });
          });
      });

      socket.current.on('user-connected', (userId) => {
        setConnectedUsers((prevUsers) => [...prevUsers, userId]); // Ajouter l'utilisateur connecté

        // Appeler l'utilisateur avec le flux local
        const call = peer.current.call(userId, localVideoRef.current.srcObject);
        call.on('stream', (remoteStream) => {
          if (videoRefs.current[userId]) {
            videoRefs.current[userId].srcObject = remoteStream; // Afficher le flux distant
          }
        });
      });

      socket.current.on('user-disconnected', (userId) => {
        setConnectedUsers((prevUsers) => prevUsers.filter((id) => id !== userId)); // Supprimer l'utilisateur déconnecté
        if (videoRefs.current[userId]) {
          videoRefs.current[userId].srcObject = null; // Arrêter l'affichage de la vidéo de l'utilisateur déconnecté
        }
      });

      return () => {
        socket.current.disconnect(); // Déconnecter le socket lors du démontage du composant
      };
    }
  }, [roomId]);

  return (
    <div className={"container"}>
      <h1>Réunion {roomId}</h1>

      {/* Section vidéo */}
      <div className={"videoSection"}>
        {/* Vidéo locale */}
        <video ref={localVideoRef} autoPlay muted className={"localVideo"} />

        {/* Vidéos des autres utilisateurs */}
        {connectedUsers.map((userId) => (
          <video
            key={userId}
            ref={(el) => (videoRefs.current[userId] = el)} // Assigner la référence vidéo pour chaque utilisateur
            autoPlay
            className={"remoteVideo"}
          />
        ))}
      </div>
    </div>
  );
}
