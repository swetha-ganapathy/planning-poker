import { useParams } from 'react-router-dom';
import { useState } from 'react';

const cards = [1, 2, 3, 5, 8, 13, '?'];

export default function PokerRoom() {
  const { roomId } = useParams();
  const [votes, setVotes] = useState({});
  const [name, setName] = useState('');
  const [vote, setVote] = useState('');
  const [revealed, setRevealed] = useState(false);

  const castVote = () => {
    if (!name || !vote) return;
    setVotes(prev => ({ ...prev, [name]: vote }));
    setVote('');
  };

  return (
    <div>
      <h2>Room: {roomId}</h2>
      <input placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
      <div>
        {cards.map(card => (
          <button key={card} onClick={() => setVote(card)}>{card}</button>
        ))}
      </div>
      <button onClick={castVote}>Submit</button>
      <button onClick={() => setRevealed(true)}>Reveal Votes</button>
      <ul>
        {Object.entries(votes).map(([user, vote]) => (
          <li key={user}>
            {user}: {revealed ? vote : '❓'}
          </li>
        ))}
      </ul>
      <button onClick={() => { setVotes({}); setRevealed(false); }}>Reset</button>
    </div>
  );
}
