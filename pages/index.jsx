// pages/index.js
import { useState, useEffect } from 'react';
import { supabase } from '../components/supabaseClient';
import { useRouter } from 'next/router';

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const router = useRouter();

  // Charger les réunions depuis Supabase
  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    const { data, error } = await supabase.from('rooms').select('*');
    if (error) {
      console.error('Erreur lors du chargement des réunions:', error);
    } else {
      setRooms(data);
    }
  };

  const createRoom = async () => {
    const { data, error } = await supabase.from('rooms').insert([{ created_at: new Date() }]);
    if (error) {
      console.error('Erreur lors de la création de la réunion:', error);
    } else {
      router.push(`/room/${data[0].id}`); // Rediriger vers la réunion créée
    }
  };

  return (
    <div>
      <h1>Réunions en cours</h1>
      <button onClick={createRoom}>Créer une nouvelle réunion</button>
      <ul>
        {rooms.map((room) => (
          <li key={room.id}>
            <a href={`/room/${room.id}`}>Rejoindre la réunion {room.id}</a>
          </li>
        ))}
      </ul>
    </div>
  );
}
