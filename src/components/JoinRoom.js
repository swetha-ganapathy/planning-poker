import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { db, ref, get } from '../firebase'; // ✅ Import `get` and `ref` from Firebase
import './JoinRoom.css';

export default function JoinRoom() {
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!roomId.trim()) {
      setError('Please enter a valid Room ID');
      return;
    }

    try {
      const roomRef = ref(db, `rooms/${roomId}`);
      const snapshot = await get(roomRef);

      if (snapshot.exists()) {
        navigate(`/room/${roomId}`);
      } else {
        setError(`Room ID "${roomId}" does not exist.`);
      }
    } catch (err) {
      console.error('Error checking room:', err);
      setError('Something went wrong. Please try again.');
    }
  };

  return (
    <div className="join-container">
      <div className="join-card">
        <h1>Planning Poker</h1>
        <h2>Join a Room</h2>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value);
            setError('');
          }}
        />
        <button className="join-btn" onClick={handleJoin}>
          Join Room
        </button>
        {error && <p style={{ color: 'red', marginTop: '10px' }}>{error}</p>}

        <p>or</p>
        <button className="create-btn" onClick={() => navigate('/create')}>
          Create New Room
        </button>
      </div>
    </div>
  );
}
