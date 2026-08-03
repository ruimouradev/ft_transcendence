import React, { useState } from 'react';
import { Users, Play, LogOut, ShieldAlert, Sparkles, PlusCircle } from 'lucide-react';

export default function UnoGamePage() {
  // State Management
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [inputRoomId, setInputRoomId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [gameStarted, setGameStarted] = useState(false);

  // Mock Players List
  const [players, setPlayers] = useState([
    { id: 1, name: 'You (Host)', isReady: true },
    { id: 2, name: 'Alex', isReady: true },
    { id: 3, name: 'Sarah', isReady: false },
  ]);

  // Mock Player Hand
  const [myHand, setMyHand] = useState([
    { id: 1, color: 'bg-red-500', value: '7' },
    { id: 2, color: 'bg-blue-500', value: 'Skip' },
    { id: 3, color: 'bg-yellow-500', value: '+2' },
    { id: 4, color: 'bg-green-500', value: '3' },
    { id: 5, color: 'bg-black', value: 'Wild' },
  ]);

  // Current Card on Top of Discard Pile
  const [topCard, setTopCard] = useState({ color: 'bg-red-500', value: '5' });

  // Handlers
  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (inputRoomId && playerName) {
      setRoomId(inputRoomId);
      setInRoom(true);
    }
  };

  const handleCreateRoom = () => {
    if (!playerName) return alert('Please enter your name first!');
    const newRoomCode = Math.floor(100000 + Math.random() * 900000).toString();
    setRoomId(newRoomCode);
    setInRoom(true);
  };

  const handleLeaveRoom = () => {
    setInRoom(false);
    setGameStarted(false);
  };

  const playCard = (cardToPlay) => {
    if (!gameStarted) return;
    setTopCard(cardToPlay);
    setMyHand(myHand.filter((card) => card.id !== cardToPlay.id));
  };

  // ---------------------------------------------------------------------------
  // 1. JOIN / CREATE ROOM VIEW
  // ---------------------------------------------------------------------------
  if (!inRoom) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800 rounded-2xl p-8 shadow-2xl border border-slate-700">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-yellow-400 to-blue-500">
              UNO!
            </h1>
            <p className="text-slate-400 mt-2">Join a match or create your own room</p>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Your Name</label>
              <input
                type="text"
                required
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="e.g. CardMaster99"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Room Code</label>
              <input
                type="text"
                value={inputRoomId}
                onChange={(e) => setInputRoomId(e.target.value)}
                placeholder="Enter 6-digit code"
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg focus:ring-2 focus:ring-yellow-400 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Users size={20} /> Join Room
            </button>
          </form>

          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
            <span className="relative bg-slate-800 px-3 text-sm text-slate-400">OR</span>
          </div>

          <button
            onClick={handleCreateRoom}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-yellow-500 hover:opacity-90 font-bold rounded-lg transition-opacity flex items-center justify-center gap-2"
          >
            <PlusCircle size={20} /> Create New Room
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 2. LOBBY VIEW (Waiting for players)
  // ---------------------------------------------------------------------------
  if (inRoom && !gameStarted) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-slate-800 rounded-2xl p-6 shadow-2xl border border-slate-700">
          <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
            <div>
              <h2 className="text-xl font-bold">Game Lobby</h2>
              <p className="text-sm text-slate-400">Room Code: <span className="text-yellow-400 font-mono font-bold">{roomId}</span></p>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="p-2 bg-slate-700 hover:bg-red-600/20 hover:text-red-400 rounded-lg transition-colors"
            >
              <LogOut size={20} />
            </button>
          </div>

          {/* Player List */}
          <div className="space-y-3 mb-8">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Players ({players.length}/4)</h3>
            {players.map((p) => (
              <div key={p.id} className="flex justify-between items-center bg-slate-900 p-3 rounded-lg">
                <span className="font-medium">{p.name}</span>
                <span className={`text-xs px-2 py-1 rounded font-bold ${p.isReady ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {p.isReady ? 'READY' : 'WAITING'}
                </span>
              </div>
            ))}
          </div>

          {/* Action Button */}
          <button
            onClick={() => setGameStarted(true)}
            className="w-full py-4 bg-green-500 hover:bg-green-400 text-slate-900 font-black text-lg rounded-xl transition-all shadow-lg shadow-green-500/20 flex items-center justify-center gap-2"
          >
            <Play size={24} fill="currentColor" /> START GAME
          </button>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // 3. GAMEPLAY VIEW
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 overflow-hidden">
      {/* Header Bar */}
      <header className="flex justify-between items-center bg-slate-900/80 backdrop-blur p-4 rounded-xl border border-slate-800">
        <div className="flex items-center gap-4">
          <span className="font-black text-2xl text-red-500">UNO</span>
          <span className="text-sm bg-slate-800 px-3 py-1 rounded-full text-slate-400">Room: {roomId}</span>
        </div>
        <button
          onClick={handleLeaveRoom}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-sm transition-colors"
        >
          <LogOut size={16} /> Leave
        </button>
      </header>

      {/* Opponents Area (Top/Sides) */}
      <div className="flex justify-around items-center my-4">
        {players.slice(1).map((player) => (
          <div key={player.id} className="flex flex-col items-center bg-slate-900/50 p-3 rounded-xl border border-slate-800">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center font-bold mb-1">
              {player.name[0]}
            </div>
            <span className="text-xs text-slate-300 font-medium">{player.name}</span>
            <span className="text-xs text-slate-500">7 Cards</span>
          </div>
        ))}
      </div>

      {/* Play Area (Center Board) */}
      <div className="flex-1 flex items-center justify-center gap-8 my-6">
        {/* Draw Pile */}
        <div 
          onClick={() => alert('Card drawn!')}
          className="w-28 h-40 bg-slate-800 border-2 border-slate-600 rounded-xl flex flex-col items-center justify-center shadow-2xl cursor-pointer hover:scale-105 transition-transform group"
        >
          <div className="w-16 h-24 bg-red-600 rounded-lg flex items-center justify-center font-black text-xl border-2 border-white transform -rotate-12 group-hover:rotate-0 transition-transform">
            UNO
          </div>
          <span className="text-xs text-slate-400 mt-2">Draw Deck</span>
        </div>

        {/* Discard Pile */}
        <div className="flex flex-col items-center">
          <div className={`w-28 h-40 ${topCard.color} rounded-xl border-4 border-white flex items-center justify-center text-3xl font-black shadow-2xl transform rotate-3`}>
            {topCard.value}
          </div>
          <span className="text-xs text-slate-400 mt-2">Discard Pile</span>
        </div>
      </div>

      {/* Player Action & Hand Area */}
      <div className="flex flex-col items-center gap-4">
        {/* UNO Button */}
        <button 
          onClick={() => alert('UNO Call Registered!')}
          className="px-6 py-2 bg-gradient-to-r from-yellow-500 to-red-500 text-slate-900 font-black rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform flex items-center gap-2"
        >
          <Sparkles size={18} /> CALL UNO!
        </button>

        {/* Player Hand */}
        <div className="flex items-center justify-center gap-2 overflow-x-auto max-w-full p-4">
          {myHand.map((card) => (
            <button
              key={card.id}
              onClick={() => playCard(card)}
              className={`w-24 h-36 ${card.color} rounded-xl border-2 border-white flex items-center justify-center text-2xl font-black shadow-lg transform hover:-translate-y-6 hover:scale-110 transition-all duration-200 shrink-0`}
            >
              {card.value}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}