import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import PokerRoom from './components/PokerRoom';

function App() {
  return (
    <Router basename="/planning-poker">
      <Routes>
        <Route path="/" element={<JoinRoom />} />
        <Route path="/create" element={<CreateRoom />} />
        <Route path="/room/:roomId" element={<PokerRoom />} />
      </Routes>
    </Router>
  );
}

export default App;
