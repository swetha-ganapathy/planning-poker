import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';

export default function CreateRoom() {
  const navigate = useNavigate();
  const roomId = uuid().slice(0, 6);

  return (
    <div>
      <h2>Room Created</h2>
      <p>Room ID: <strong>{roomId}</strong></p>
      <button onClick={() => navigate(`/room/${roomId}`)}>Go to Room</button>
    </div>
  );
}
