import React from "react";

interface Player {
  id: number | string;
  name: string;
  avatar: string;
  is_winner: boolean;
}

interface GamePlayersProps {
  players: Player[];
  currentPlayerId: number | string;
}

const POSITION_CLASSES: Record<number, string[]> = {
  2: [
    "bottom-0 left-1/2 -translate-x-1/2",
    "top-0 left-1/2 -translate-x-1/2",
  ],

  3: [
    "bottom-0 left-1/2 -translate-x-1/2",
    "top-4 left-4",
    "top-4 right-4",
  ],

  4: [
    "bottom-0 left-1/2 -translate-x-1/2",
    "top-0 left-1/2 -translate-x-1/2",
    "top-1/2 left-0 -translate-y-1/2",
    "top-1/2 right-0 -translate-y-1/2",
  ],
};

interface PlayerCardProps {
  player: Player;
  isCurrentPlayer: boolean;
}

function PlayerCard({
  player,
  isCurrentPlayer,
}: PlayerCardProps) {
  const isWinner = player.is_winner;

  return (
    <div
      className={`
        relative
        flex flex-col items-center
        min-w-[100px]
        transition-all duration-300
        ${isCurrentPlayer ? "scale-110" : ""}
      `}
    >
      {/* Current player indicator */}
      {isCurrentPlayer && (
        <div className="absolute -top-5 text-xs font-bold text-cyan-300">
          YOU
        </div>
      )}

      {/* Avatar */}
      <div
        className={`
          rounded-full p-[2px]
          ${
            isWinner
              ? "bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-200 shadow-lg shadow-yellow-400/60"
              : isCurrentPlayer
              ? "bg-gradient-to-r from-cyan-300 via-purple-300 to-cyan-300 shadow-lg shadow-cyan-300/50"
              : "bg-slate-600"
          }
        `}
      >
        <div className="rounded-full bg-slate-950 p-1">
          <img
            src={player.avatar}
            alt={player.name}
            className="h-12 w-12 rounded-full object-cover"
          />
        </div>
      </div>

      {/* Name */}
      <div className="mt-2 max-w-[120px] truncate text-sm font-semibold text-white">
        {player.name}
      </div>

      {/* Result */}
      <div
        className={`
          mt-1 rounded-full px-3 py-1 text-xs font-bold
          ${
            isWinner
              ? "bg-yellow-400/20 text-yellow-300"
              : "bg-slate-800/80 text-slate-300"
          }
        `}
      >
        {player.is_winner ? "WINNER" : "LOSER"}
        {player.is_winner ? `(+${player.score})` : ""}
      </div>
    </div>
  );
}

export default function GamePlayers({
  players,
  currentPlayerId,
}: GamePlayersProps) {
  if (players.length === 0) {
    return null;
  }

  if (players.length > 4) {
    console.warn(
      "GamePlayers supports a maximum of 4 players."
    );
    return null;
  }

  /*
   * Put the current player first.
   *
   * Example:
   *
   * Original:
   * [Bob, Alice, David, Charlie]
   *
   * Current player = David
   *
   * Result:
   * [David, Charlie, Bob, Alice]
   *
   * David will always be at the bottom.
   */
  const currentIndex = players.findIndex(
    (player) => player.id === currentPlayerId
  );

  const orderedPlayers: Player[] =
    currentIndex === -1
      ? players
      : [
          ...players.slice(currentIndex),
          ...players.slice(0, currentIndex),
        ];

  const positions = POSITION_CLASSES[orderedPlayers.length];

  return (
    <div className="relative mx-auto h-[420px] w-full max-w-[800px]">
      {/* Game table */}
      <div
        className="
          absolute
          left-1/2 top-1/2
          h-48 w-72
          -translate-x-1/2 -translate-y-1/2
          rounded-[50%]
          border border-white/10
          bg-slate-900/50
          shadow-2xl
          backdrop-blur-sm
        "
      >
        <div className="flex h-full items-center justify-center">
          <span className="text-2xl font-bold tracking-widest text-white/20">
            UNO
          </span>
        </div>
      </div>

      {/* Players */}
      {orderedPlayers.map((player, index) => (
        <div
          key={player.id}
          className={`absolute ${positions[index]}`}
        >
          <PlayerCard
            player={player}
            isCurrentPlayer={index === 0}
          />
        </div>
      ))}
    </div>
  );
}