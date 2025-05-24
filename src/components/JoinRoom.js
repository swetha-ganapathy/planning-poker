import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import './JoinRoom.css';

export default function JoinRoom() {
  const [roomId, setRoomId] = useState('');
  const navigate = useNavigate();

  return (
    <div className="join-container">
      <div className="join-card">
        <h1>Planning Poker</h1>
        <h2>Join a Room</h2>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button className="join-btn" onClick={() => navigate(`/room/${roomId}`)}>
          Join Room
        </button>
        <p>or</p>
        <button className="create-btn" onClick={() => navigate('/create')}>
          Create New Room
        </button>
      </div>
    </div>
  );
}
