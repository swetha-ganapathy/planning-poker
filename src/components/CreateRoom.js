import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { db, ref, set } from '../firebase';
import { useState } from 'react';
import './CreateRoom.css';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const roomId = uuid().slice(0, 6);

  const handleCreateRoom = () => {
    if (!userName.trim()) {
      alert('Please enter your name to create the room.');
      return;
    }

    // Create the room in the database and mark the creator as admin
    set(ref(db, `rooms/${roomId}`), {
      createdAt: new Date().toISOString(),
      admin: userName
    }).then(() => {
      navigate(`/room/${roomId}?admin=${encodeURIComponent(userName)}`);
    });
  };

  return (
    <div className="create-container">
      <div className="create-card">
        <h1>Room Created</h1>
        <p>Your room ID:</p>
        <div className="room-id">{roomId}</div>

        <input
          type="text"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
        />

        <button className="enter-btn" onClick={handleCreateRoom}>
          Enter Room
        </button>
      </div>
    </div>
  );
}
