import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function JoinRoom() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  return (
    <div>
      <h2>Join Room</h2>
      <input value={roomId} onChange={e => setRoomId(e.target.value)} />
      <button onClick={() => navigate(`/room/${roomId}`)}>Join</button>
      <button onClick={() => navigate('/create')}>Create New Room</button>
    </div>
  );
}
