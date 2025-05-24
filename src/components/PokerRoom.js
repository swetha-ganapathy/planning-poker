import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { db, ref, set, onValue, remove } from '../firebase';
import { QRCodeCanvas } from 'qrcode.react';
import './PokerRoom.css';

const cards = [1, 2, 3, 5, 8, 13, '?'];

export default function PokerRoom() {
  const { roomId } = useParams();
  const [name, setName] = useState('');
  const [localVote, setLocalVote] = useState('');
  const [votes, setVotes] = useState({});
  const [revealed, setRevealed] = useState(false);

  // Listen for changes in Firebase
  useEffect(() => {
    const votesRef = ref(db, `rooms/${roomId}/votes`);
    const revealRef = ref(db, `rooms/${roomId}/revealed`);

    onValue(votesRef, (snapshot) => {
      const data = snapshot.val() || {};
      setVotes(data);
    });

    onValue(revealRef, (snapshot) => {
      const value = snapshot.val();
      setRevealed(value === true);
    });
  }, [roomId]);

  const castVote = () => {
    if (!name || !localVote) return;
    set(ref(db, `rooms/${roomId}/votes/${name}`), localVote);
    setLocalVote('');
  };

  const handleReveal = () => {
    set(ref(db, `rooms/${roomId}/revealed`), true);
  };

  const handleReset = () => {
    remove(ref(db, `rooms/${roomId}/votes`));
    set(ref(db, `rooms/${roomId}/revealed`), false);
  };

  const roomLink = `https://swetha-ganapathy.github.io/planning-poker/#/room/${roomId}`;

  return (
    <div className="poker-container">
      <div className="poker-header">
        <h1>Room ID: {roomId}</h1>
        <div className="invite-section">
          <p>Invite others to join:</p>
          <div className="share-box">
            <input type="text" value={roomLink} readOnly />
            <button
              className="copy-btn"
              onClick={() => {
                navigator.clipboard.writeText(roomLink);
                alert('Room link copied!');
              }}
            >
              Copy Link
            </button>
          </div>
          <div className="qr-code">
            <QRCodeCanvas value={roomLink} size={128} fgColor="#1e3a8a" />
          </div>
        </div>
      </div>

      <div className="name-input">
        <input
          type="text"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="card-options">
        {cards.map((card) => (
          <button
            key={card}
            className={`card ${localVote === card ? 'selected' : ''}`}
            onClick={() => setLocalVote(card)}
          >
            {card}
          </button>
        ))}
      </div>

      <div className="action-buttons">
        <button className="submit-btn" onClick={castVote}>
          Submit Vote
        </button>
        <button className="reveal-btn" onClick={handleReveal}>
          Reveal Votes
        </button>
        <button className="reset-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <div className="vote-list">
        <h3>Votes:</h3>
        <ul>
          {Object.entries(votes).map(([user, vote]) => (
            <li key={user}>
              <strong>{user}:</strong> {revealed ? vote : '❓'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
