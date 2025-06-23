import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import CreateRoom from './components/CreateRoom';
import JoinRoom from './components/JoinRoom';
import PokerRoom from './components/PokerRoom';
import { ThemeProvider } from './ThemeContext';
import ThemeToggle from './ThemeToggle';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/" element={<JoinRoom />} />
          <Route path="/create" element={<CreateRoom />} />
          <Route path="/room/:roomId" element={<PokerRoom />} />
        </Routes>
      </Router>
      <ThemeToggle />
    </ThemeProvider>
  );
}

export default App;
