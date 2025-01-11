// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomeScreen from './components/HomeScreen';
// import MyChatsScreen from './components/MyChatsScreen'
// import AccountScreen from './components/AccountScreen'

function App() {
  return (
    <Router>
      {/* Remove or comment out the Navbar to remove any "hamburger icon" */}
      {/* <Navbar /> */}
      <Routes>
        {/* If you only need a single-page iMessage-like view: */}
        <Route path="/" element={<HomeScreen />} />

        {/* Otherwise, you can keep additional routes if needed (just remove the Navbar) */}
        {/* <Route path="/mychats" element={<MyChatsScreen />} />
        <Route path="/account" element={<AccountScreen />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
