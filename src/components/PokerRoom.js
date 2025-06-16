// PokerRoom.js
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  db,
  ref,
  set,
  onValue,
  remove,
  onDisconnect,
  serverTimestamp,
  auth,
  setDisplayName,
  onAuthStateChanged
} from '../firebase';
import { QRCodeCanvas } from 'qrcode.react';
import './PokerRoom.css';

const cards = [0.5, 1, 2, 3, 5, 8, '?'];

export default function PokerRoom() {
  const { roomId } = useParams();
  const [userName, setUserName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [localVote, setLocalVote] = useState('');
  const [votes, setVotes] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [activeUsers, setActiveUsers] = useState({});
  const [copied, setCopied] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [adminUid, setAdminUid] = useState(null);
  const [currentUid, setCurrentUid] = useState(auth.currentUser?.uid || null);

  // Keep track of authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUid(user?.uid || null);
    });
    return unsubscribe;
  }, []);


  const roomLink = `https://swetha-ganapathy.github.io/planning-poker/#/room/${roomId}`;
  const participantCount = Object.keys(votes).length;
  const activeUserCount = Object.keys(activeUsers).length;

  const isAdmin = currentUid && adminUid === currentUid;

  // Autofill the admin's name when the authenticated user is the admin
  useEffect(() => {
    if (isAdmin && admin && !userName) {
      setUserName(admin);
    }
  }, [isAdmin, admin, userName]);

  const getVoteCounts = () => {
    const counts = {};
    Object.values(votes).forEach((vote) => {
      counts[vote] = (counts[vote] || 0) + 1;
    });
    return counts;
  };

  // Load room data from Firebase
  useEffect(() => {
    const votesRef = ref(db, `rooms/${roomId}/votes`);
    const revealedRef = ref(db, `rooms/${roomId}/revealed`);
    const activeUsersRef = ref(db, `rooms/${roomId}/activeUsers`);
    const adminRef = ref(db, `rooms/${roomId}/admin`);
    const adminUidRef = ref(db, `rooms/${roomId}/adminUid`);

    onValue(votesRef, (snapshot) => setVotes(snapshot.val() || {}));
    onValue(revealedRef, (snapshot) => setRevealed(snapshot.val() === true));
    onValue(activeUsersRef, (snapshot) => setActiveUsers(snapshot.val() || {}));
    onValue(adminRef, (snapshot) => setAdmin(snapshot.val() || null));
    onValue(adminUidRef, (snapshot) => setAdminUid(snapshot.val() || null));
  }, [roomId]);

  useEffect(() => {
    setIsRegistered(false);
  }, [roomId]);

  // Sync user name with Firebase Auth & presence
  useEffect(() => {
    if (userName.trim()) {
      setDisplayName(userName);
      if (!isRegistered) {
        const userRef = ref(db, `rooms/${roomId}/activeUsers/${userName}`);
        set(userRef, { joinedAt: serverTimestamp() }).then(() => {
          onDisconnect(userRef).remove();
          setIsRegistered(true);
        });
      }
    }
  }, [userName, roomId, isRegistered]);

  const castVote = () => {
    if (!userName.trim() || !localVote) return;
    set(ref(db, `rooms/${roomId}/votes/${userName}`), localVote);
    setLocalVote('');
  };

  const handleReveal = () => {
    if (isAdmin) {
      set(ref(db, `rooms/${roomId}/revealed`), true);
    }
  };

  const handleReset = () => {
    if (isAdmin) {
      remove(ref(db, `rooms/${roomId}/votes`));
      set(ref(db, `rooms/${roomId}/revealed`), false);
    }
  };

  return (
    <div className="poker-container">
      <div className="qr-code-floating">
        <QRCodeCanvas value={roomLink} size={100} fgColor="#1e3a8a" />
      </div>

      <div className="poker-header">
        <h1>Room ID: {roomId}</h1>
        <h3>Active users: {activeUserCount}</h3>
        <h3>Users who voted: {participantCount}</h3>
        {admin && <p className="admin-tag">👑 Admin: {admin}</p>}

        <div className="invite-section">
          <p>Invite others to join:</p>
          <div className="share-box">
            <input type="text" value={roomLink} readOnly />
            <button
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={() => {
                navigator.clipboard.writeText(roomLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      </div>

      <div className="name-input">
        <input
          type="text"
          placeholder="Enter your name"
          value={userName}
          onChange={(e) => setUserName(e.target.value)}
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

        {isAdmin && (
          <>
            <button className="reveal-btn" onClick={handleReveal}>
              Reveal Votes
            </button>
            <button className="reset-btn" onClick={handleReset}>
              Reset
            </button>
          </>
        )}
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

      {revealed && (
        <div className="vote-breakdown">
          <h3>Vote Breakdown:</h3>
          <ul>
            {cards.map((card) => (
              <li key={card}>
                <strong>{card}</strong>: {getVoteCounts()[card] || 0} vote
                {getVoteCounts()[card] > 1 ? 's' : ''}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
