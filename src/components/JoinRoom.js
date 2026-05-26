import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { db, ref, get } from '../firebase';
import './JoinRoom.css';

export default function JoinRoom() {
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleJoin = async () => {
    if (!roomId.trim()) {
      setError('Please enter a Room ID.');
      return;
    }
    setLoading(true);
    try {
      const snapshot = await get(ref(db, `rooms/${roomId.trim()}`));
      if (snapshot.exists()) {
        navigate(`/room/${roomId.trim()}`);
      } else {
        setError(`Room "${roomId.trim()}" does not exist.`);
      }
    } catch (err) {
      console.error('Error checking room:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="join-container">
      <div className="join-card">

        <div className="join-header">
          <div className="join-icon">◈</div>
          <h1>Planning Poker</h1>
          <p>Estimate together, ship faster</p>
        </div>

        <div className="join-body">
          <div className="join-field">
            <label className="join-label">Room ID</label>
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => { setRoomId(e.target.value); setError(''); }}
              onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
            />
            {error && <p className="join-error">⚠ {error}</p>}
          </div>

          <button className="join-btn" onClick={handleJoin} disabled={loading}>
            {loading ? 'Checking…' : 'Join Room →'}
          </button>

          <div className="join-divider">
            <span>or</span>
          </div>

          <button className="create-btn" onClick={() => navigate('/create')}>
            + Create New Room
          </button>
        </div>

      </div>
    </div>
  );
}
