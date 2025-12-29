// PokerRoom.js
import { useParams } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
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
  const [reactions, setReactions] = useState({});
  const [isReactionOpen, setIsReactionOpen] = useState(false);

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
    const adminUidRef = ref(db, `rooms/${roomId}/adminUid`);
    const reactionsRef = ref(db, `rooms/${roomId}/reactions`);

    onValue(votesRef, (snapshot) => setVotes(snapshot.val() || {}));
    onValue(revealedRef, (snapshot) => setRevealed(snapshot.val() === true));
    onValue(activeUsersRef, (snapshot) => setActiveUsers(snapshot.val() || {}));
    onValue(adminRef, (snapshot) => setAdmin(snapshot.val() || null));
    onValue(adminUidRef, (snapshot) => setAdminUid(snapshot.val() || null));
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

  const reactionOptions = [
    { emoji: '👍', label: 'Thumbs up' },
    { emoji: '😂', label: 'Laugh' },
    { emoji: '👎', label: 'Thumbs down' },
    { emoji: '😢', label: 'Cry' },
    { emoji: '👏', label: 'Clap' },
    { emoji: '❤️', label: 'Heart' }
  ];

  const reactionCounts = useMemo(() => {
    const counts = {};
    Object.values(reactions).forEach((reaction) => {
      if (reaction?.emoji) {
        counts[reaction.emoji] = (counts[reaction.emoji] || 0) + 1;
      }
    });
    return counts;
  }, [reactions]);

  const sendReaction = (emoji) => {
    const trimmed = userName.trim();
    if (!trimmed || !currentUid) return;

    if (!isRegistered) {
      registerUser();
    }

    const currentReactionRef = ref(db, `rooms/${roomId}/reactions/${currentUid}`);
    if (reactions[currentUid]?.emoji === emoji) {
      remove(currentReactionRef);
    } else {
      set(currentReactionRef, {
        emoji,
        name: trimmed,
        createdAt: serverTimestamp()
      });
    }
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
  const toggleReactions = () => setIsReactionOpen((prev) => !prev);

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
          onBlur={() => registerUser()}
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

      <div className={`reaction-fab ${isReactionOpen ? 'open' : ''}`}>
        <button
          className="reaction-toggle"
          onClick={toggleReactions}
          aria-expanded={isReactionOpen}
          aria-label="Open reactions"
        >
          <span className="emoji">😊</span>
          <span className="fab-label">React</span>
          {sortedReactions.length > 0 && (
            <span className="fab-badge">{sortedReactions.length}</span>
          )}
        </button>

        {isReactionOpen && (
          <div className="reaction-popover">
            <div className="reaction-header">
              <div>
                <h3>Quick reactions</h3>
                <p className="reaction-helper">Tap an emoji to share (tap again to clear).</p>
              </div>
              <button className="popover-close" onClick={toggleReactions} aria-label="Close reactions">
                ✕
              </button>
            </div>
            <div className="reaction-buttons">
              {reactionOptions.map(({ emoji, label }) => (
                <button
                  key={emoji}
                  className={`reaction-btn ${reactions[currentUid]?.emoji === emoji ? 'active' : ''}`}
                  onClick={() => sendReaction(emoji)}
                  title={label}
                >
                  <span className="emoji">{emoji}</span>
                  <span className="reaction-count">{reactionCounts[emoji] || 0}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

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

      {participantCount > 0 && (
        <>
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
        </>
      )}
    </div>
  );
}
