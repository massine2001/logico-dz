import { useState, useEffect } from 'react';
import { supabase } from '../components/supabaseClient';
import { useRouter } from 'next/router';

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const router = useRouter();

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
      router.push(`/room/${data[0].id}`);
    }
  };

  return (
    <div className={styles.container}>
      <h1>Réunions en cours</h1>
      <button className={styles.createRoomButton} onClick={createRoom}>Créer une nouvelle réunion</button>
      <div className={styles.roomList}>
        {rooms.map((room) => (
          <div key={room.id} className={styles.roomCard}>
            <a href={`/room/${room.id}`} className={styles.roomLink}>Rejoindre la réunion {room.id}</a>
          </div>
        ))}
      </div>
    </div>
  );
}
