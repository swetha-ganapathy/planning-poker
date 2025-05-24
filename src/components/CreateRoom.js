import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import './CreateRoom.css';

export default function CreateRoom() {
  const navigate = useNavigate();
  const roomId = uuid().slice(0, 6);

  return (
    <div className="create-container">
      <div className="create-card">
        <h1>Room Created</h1>
        <p>Your room ID:</p>
        <div className="room-id">{roomId}</div>
        <button className="enter-btn" onClick={() => navigate(`/room/${roomId}`)}>
          Enter Room
        </button>
      </div>
    </div>
  );
}
