import { useState, useEffect } from 'react';
import { supabase } from '../components/supabaseClient';
import { useRouter } from 'next/router';

export default function Home() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null); // Ajout de l'état d'erreur
  const router = useRouter();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    setLoading(true);
    setError(null); // Réinitialiser l'erreur avant chaque nouvelle requête
    const { data, error } = await supabase.from('rooms').select('*');
    if (error) {
      setError('Erreur lors du chargement des réunions. Veuillez réessayer plus tard.'); // Message utilisateur
      console.error('Erreur lors du chargement des réunions:', error);
    } else {
      setRooms(data);
    }
    setLoading(false);
  };

  const createRoom = async () => {
    setLoading(true);
    setError(null); // Réinitialiser l'erreur avant chaque nouvelle requête
    const { data, error } = await supabase.from('rooms').insert([{ created_at: new Date() }]);
    if (error) {
      setError('Erreur lors de la création de la réunion. Veuillez réessayer.'); // Message utilisateur
      console.error('Erreur lors de la création de la réunion:', error);
    } else {
      router.push(`/room/${data[0].id}`);
    }
    setLoading(false);
  };

  return (
    <div className="container">
      <h1>Réunions en cours</h1>
      {error && <div className="error">{error}</div>} {/* Affichage de l'erreur */}
      <button onClick={createRoom} className="createButton" disabled={loading}>
        {loading ? 'Création...' : 'Créer une nouvelle réunion'}
      </button>
      {rooms.length === 0 ? (
        <p>Aucune réunion disponible.</p>
      ) : (
        <ul className="roomList">
          {rooms.map((room) => (
            <li key={room.id} className="roomItem">
              <a href={`/room/${room.id}`} className="roomLink">Rejoindre la réunion {room.id}</a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
