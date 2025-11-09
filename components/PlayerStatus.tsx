
import React from 'react';
import { Player, Role, GamePhase } from '../types';
import { GunIcon, SkullIcon, UserIcon, MedicIcon, PistolIcon } from './icons';

interface PlayerStatusProps {
  players: Player[];
  showRoles: boolean;
  gamePhase: GamePhase;
  onToggleShowRoles: () => void;
  viewedPlayersCount: number;
  totalPlayersCount: number;
}

const PlayerStatus: React.FC<PlayerStatusProps> = ({ 
  players, 
  showRoles,
  gamePhase,
  onToggleShowRoles,
  viewedPlayersCount,
  totalPlayersCount
}) => {
  const alivePlayers = players.filter(p => p.isAlive).length;
  const mafiaAlive = players.filter(p => p.isAlive && p.role === Role.MAFIA).length;
  const citizensAlive = alivePlayers - mafiaAlive;

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg w-full md:w-1/3 h-full flex flex-col">
      <h2 className="text-xl font-bold mb-4 text-center text-gray-300">وضعیت بازیکنان</h2>
      <div className="flex justify-around mb-4 text-lg">
        <span className="text-blue-400 font-bold">شهروندان: {citizensAlive}</span>
        <span className="text-red-400 font-bold">مافیا: {mafiaAlive}</span>
      </div>
      <div className="space-y-2 flex-grow overflow-y-auto pr-2">
        {players.map(player => (
          <div key={player.id} className={`p-3 rounded-md flex items-center justify-between transition-all duration-300 ${player.isAlive ? 'bg-gray-700' : 'bg-gray-900 opacity-50'}`}>
            <div className="flex items-center gap-3">
              {player.isAlive ? (
                 <UserIcon className={showRoles ? (player.role === Role.MAFIA ? 'text-red-500' : 'text-blue-500') : 'text-gray-400'} />
              ) : (
                <SkullIcon className="text-gray-500" />
              )}
              <span className={`font-medium ${!player.isAlive ? 'line-through text-gray-500' : ''} ${showRoles ? (player.role === Role.MAFIA ? 'text-red-500' : 'text-blue-500') : ''}`}>
                {player.name}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span title="شات" className={player.hasGun ? 'text-yellow-400' : 'text-gray-600'}>
                <PistolIcon />
              </span>
              <span title="سیو" className={player.hasSave ? 'text-red-400' : 'text-gray-600'}>
                <MedicIcon />
              </span>
              {player.receivedGuns && player.receivedGuns.length > 0 && player.isAlive && (
                <span title={`اسلحه دریافتی: ${player.receivedGuns.join(', ')}`} className={`text-purple-400 flex items-center gap-1 ${player.receivedGuns.length > 1 ? 'animate-pulse' : ''}`}>
                  <GunIcon />
                  <span className="text-xs font-bold">x{player.receivedGuns.length}</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 pt-4 border-t border-gray-700">
        {gamePhase === GamePhase.ROLE_REVEAL && !showRoles && (
          <p className="text-center text-sm text-gray-400 mb-2">
            {viewedPlayersCount} از {totalPlayersCount} بازیکن نقش خود را دیده‌اند.
          </p>
        )}
        <button
          onClick={onToggleShowRoles}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-3 rounded text-sm transition-colors"
        >
          {showRoles ? 'مخفی کردن نقش‌ها' : 'نمایش نقش‌ها برای گرداننده'}
        </button>
      </div>
    </div>
  );
};

export default PlayerStatus;
