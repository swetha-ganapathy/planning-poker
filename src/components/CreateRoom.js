import { useNavigate } from 'react-router-dom';
import { v4 as uuid } from 'uuid';
import { db, ref, set, auth } from '../firebase';
import { useState } from 'react';
import './CreateRoom.css';

export default function CreateRoom() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [copied, setCopied] = useState(false);
  const [roomId] = useState(() => uuid().slice(0, 6));

  const handleCopy = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreateRoom = () => {
    if (!userName.trim()) {
      alert('Please enter your name to create the room.');
      return;
    }
    const adminToken = crypto.randomUUID();
    set(ref(db, `rooms/${roomId}`), {
      createdAt: new Date().toISOString(),
      admin: userName,
      adminUid: auth.currentUser.uid,
      adminToken
    }).then(() => {
      navigate(`/room/${roomId}?admin=${adminToken}`);
    });
  };

  return (
    <div className="create-container">
      <div className="create-card">

        <div className="create-header">
          <div className="create-icon">✦</div>
          <h1>New Room Ready</h1>
          <p>Share the Room ID with your team to start estimating</p>
        </div>

        <div className="create-body">
          <div className="create-field">
            <label className="create-label">Room ID</label>
            <div className="room-id-row">
              <div className="room-id">{roomId}</div>
              <button
                className={`copy-id-btn ${copied ? 'copied' : ''}`}
                onClick={handleCopy}
                title="Copy room ID"
              >
                {copied ? '✓' : '📋'}
              </button>
            </div>
          </div>

          <div className="create-field">
            <label className="create-label">Your Name</label>
            <input
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
            />
          </div>

          <button className="enter-btn" onClick={handleCreateRoom}>
            Enter Room →
          </button>
        </div>

      </div>
    </div>
  );
}
