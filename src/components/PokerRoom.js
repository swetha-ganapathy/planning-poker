// PokerRoom.js
import { useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { FaSun, FaMoon } from 'react-icons/fa';
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
  const hash = window.location.hash; // e.g. "#/room/6d17ef?admin=..."
  const queryString = hash.includes('?') ? hash.split('?')[1] : '';
  const queryParams = new URLSearchParams(queryString);
  const adminTokenFromUrl = queryParams.get('admin');
  const [userName, setUserName] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [localVote, setLocalVote] = useState('');
  const [votes, setVotes] = useState({});
  const [revealed, setRevealed] = useState(false);
  const [activeUsers, setActiveUsers] = useState({});
  const [copied, setCopied] = useState(false);
  const [admin, setAdmin] = useState(null);
  const [adminToken, setAdminToken] = useState(null);
  const [currentUid, setCurrentUid] = useState(auth.currentUser?.uid || null);
  const [reactions, setReactions] = useState({});
  const [darkMode, setDarkMode] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
  const toggleDarkMode = () => setDarkMode((prev) => !prev);
  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  },  [darkMode]);

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

  const isAdmin = useMemo(() => {
    return !!adminToken && !!adminTokenFromUrl && adminToken === adminTokenFromUrl;
  }, [adminToken, adminTokenFromUrl]);

  // Autofill the admin's name when the authenticated user is the admin
  useEffect(() => {
    if (isAdmin && admin && !userName) {
      setUserName(admin);
      registerUser(admin);
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
    const adminTokenRef = ref(db, `rooms/${roomId}/adminToken`);
    const reactionsRef = ref(db, `rooms/${roomId}/reactions`);

    onValue(votesRef, (snapshot) => setVotes(snapshot.val() || {}));
    onValue(revealedRef, (snapshot) => setRevealed(snapshot.val() === true));
    onValue(activeUsersRef, (snapshot) => setActiveUsers(snapshot.val() || {}));
    onValue(adminRef, (snapshot) => setAdmin(snapshot.val() || null));
    onValue(adminTokenRef, (snapshot) => {setAdminToken(snapshot.val() || null);});
    onValue(reactionsRef, (snapshot) => setReactions(snapshot.val() || {}));
  }, [roomId]);

  useEffect(() => {
    setIsRegistered(false);
  }, [roomId]);

  // Sync user name with Firebase Auth & presence
  // Register the user in the activeUsers list once their name is finalized
  const registerUser = (name = userName) => {
    const trimmed = name.trim();
    if (!trimmed || !currentUid) return;

    setDisplayName(trimmed);

    const userRef = ref(db, `rooms/${roomId}/activeUsers/${currentUid}`);
    set(userRef, { name: trimmed, joinedAt: serverTimestamp() }).then(() => {
      if (!isRegistered) {
        onDisconnect(userRef).remove();
        setIsRegistered(true);
      }
    });
  };

  const castVote = () => {
    if (!userName.trim() || !localVote) return;
    if (!isRegistered) {
      registerUser();
    }
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
      remove(ref(db, `rooms/${roomId}/reactions`));
    }
  };

  const sortedReactions = useMemo(() => {
    return Object.entries(reactions)
      .map(([uid, reaction]) => ({ uid, ...reaction }))
      .filter((reaction) => reaction.emoji)
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [reactions]);

  const floatingReactions = useMemo(() => sortedReactions.slice(0, 12), [sortedReactions]);

  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const lockedRef = ref(db, `rooms/${roomId}/locked`);
    const unsubscribe = onValue(lockedRef, (snapshot) => {
      setLocked(!!snapshot.val());
      console.log('Locked state updated:', !!snapshot.val());
    });
    return () => unsubscribe();
  }, [roomId]);

  return (
    <div className="poker-container">
      {/* Header with QR left, info centre, toggle right */}
      <div className="poker-header">
        <div className="header-left">
          <div className="header-qr">
            <QRCodeCanvas value={roomLink} size={80} fgColor="#1e3a8a" />
            <span className="qr-label">Share</span>
          </div>
        </div>

        <div className="header-center">
          <div className="poker-title">Planning Poker</div>
          <div className="room-id-display">Room · <span>{roomId}</span></div>
          {admin && <p className="admin-tag">👑 Admin: {admin}</p>}
          <div className="invite-section">
            <span>Invite others:</span>
            <button
              className={`copy-btn ${copied ? 'copied' : ''}`}
              onClick={() => {
                navigator.clipboard.writeText(roomLink);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? '✓ Copied!' : '🔗 Copy Link'}
            </button>
          </div>
        </div>

        <div className="header-right">
          <div
            className={`theme-switcher${darkMode ? ' dark' : ''}`}
            onClick={toggleDarkMode}
            tabIndex={0}
            role="button"
            aria-label="Toggle dark mode"
            onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggleDarkMode()}
          >
            <span className="switch-track">
              <span className="switch-icon sun"><FaSun /></span>
              <span className="switch-icon moon"><FaMoon /></span>
              <span className="switch-thumb" />
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="room-stats">
        <span className="stat-pill">👥 Active: <strong>{activeUserCount}</strong></span>
        <span className="stat-pill">✅ Voted: <strong>{participantCount}</strong></span>
      </div>

      {/* Votes */}
      {participantCount > 0 && (
        <div className="page-section">
          <p className="section-label">Votes</p>
          <div className="vote-grid">
            {Object.entries(votes).map(([user, vote]) => (
              <div className="vote-card" key={user}>
                <span className="vote-card-value">{revealed ? vote : '?'}</span>
                <span className="vote-card-name">{user}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Vote breakdown */}
      {revealed && participantCount > 0 && (
        <div className="page-section">
          <p className="section-label">Vote Breakdown</p>
          <div className="breakdown-grid">
            {cards.filter(card => getVoteCounts()[card]).map(card => (
              <div className="breakdown-item" key={card}>
                <span className="breakdown-card-chip">{card}</span>
                <div className="breakdown-tally">
                  <span className="breakdown-count">{getVoteCounts()[card]}</span>
                  <span className="breakdown-label">vote{getVoteCounts()[card] > 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Name */}
      <div className="page-section">
        <p className="section-label">Your Name</p>
        <div className="name-input">
          <input
            type="text"
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onBlur={() => registerUser()}
          />
        </div>
      </div>

      {/* Card selection + submit */}
      <div className="page-section">
        <p className="section-label">Pick your estimate</p>
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
        {locked && (
          <div className="locked-notice">🔒 Voting is locked by the admin.</div>
        )}
        <button className="submit-btn" onClick={castVote} disabled={locked}>
          Submit Vote
        </button>
      </div>

      {/* Admin controls */}
      {isAdmin && (
        <div className="admin-controls">
          <p className="section-label">Admin Controls</p>
          <div className="admin-buttons">
            <button className="reveal-btn" onClick={handleReveal}>Reveal Votes</button>
            <button className="reset-btn" onClick={handleReset}>Reset</button>
            <button className="lock-btn" onClick={() => set(ref(db, `rooms/${roomId}/locked`), !locked)}>
              {locked ? '🔓 Unlock' : '🔒 Lock'}
            </button>
          </div>
        </div>
      )}

      {/* Floating reactions */}
      <div className="floating-reactions" aria-hidden="true">
        {floatingReactions.map((reaction, index) => (
          <div
            key={`${reaction.uid}-${reaction.createdAt || index}`}
            className="floating-reaction"
            style={{
              left: `${(index % 8) * 12 + 10}%`,
              animationDelay: `${index * 0.05}s`
            }}
          >
            <span className="pill-emoji">{reaction.emoji}</span>
            <span className="pill-name">{reaction.name || 'Guest'}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
