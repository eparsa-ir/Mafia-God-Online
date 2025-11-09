
import React, { useState, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from "@google/genai";
import { Player, Role, GamePhase, GunType, NightResult } from './types';
import PlayerStatus from './components/PlayerStatus';
import Log from './components/Log';
import { MoonIcon, SunIcon, BanIcon, RefreshIcon, TimeIcon, SparklesIcon, GavelIcon, WhatsAppIcon, TelegramIcon } from './components/icons';

const PLAYER_COUNT = 12;
const MAFIA_COUNT = 4;

interface GameState {
    players: Player[];
    day: number;
    pollUsed: number;
    logLength: number;
    gamePhase: GamePhase;
}

const PlayerSetup: React.FC<{ onStart: (names: string[]) => void }> = ({ onStart }) => {
  const [names, setNames] = useState<string[]>(Array(PLAYER_COUNT).fill(''));

  const handleNameChange = (index: number, name: string) => {
    const newNames = [...names];
    newNames[index] = name;
    setNames(newNames);
  };

  const handleStart = () => {
    const formattedNames = names.map((name, index) => {
        const trimmedName = name.trim();
        return trimmedName === '' ? `بازیکن شماره ${index + 1}` : `${index + 1}. ${trimmedName}`;
    });
    
    if (new Set(formattedNames).size !== PLAYER_COUNT) {
      alert('نام‌های تکراری مجاز نیست. لطفاً نام‌های منحصربه‌فرد وارد کنید یا فیلدهای خالی را برای نام‌های پیش‌فرض بگذارید.');
      return;
    }
    onStart(formattedNames);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-4">
      <div className="w-full max-w-md bg-gray-800 p-8 rounded-lg shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-6 text-red-500">مافیا مینیمال</h1>
        <p className="text-center text-gray-400 mb-8">نام ۱۲ بازیکن را وارد کنید (خالی بگذارید برای نام پیش‌فرض)</p>
        <div className="grid grid-cols-2 gap-4 mb-8">
          {names.map((name, index) => (
            <input
              key={index}
              type="text"
              placeholder={`بازیکن ${index + 1}`}
              value={name}
              onChange={(e) => handleNameChange(index, e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          ))}
        </div>
        <button
          onClick={handleStart}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-md transition-colors"
        >
          شروع بازی
        </button>
      </div>
    </div>
  );
};

const RoleRevealPhase: React.FC<{ 
    players: Player[], 
    onStartFirstDay: () => void, 
    viewedPlayers: Set<string>,
    setViewedPlayers: React.Dispatch<React.SetStateAction<Set<string>>>
}> = ({ players, onStartFirstDay, viewedPlayers, setViewedPlayers }) => {
    const [revealedPlayer, setRevealedPlayer] = useState<Player | null>(null);

    const handleReveal = (player: Player) => {
        if (viewedPlayers.has(player.name)) return;
        setRevealedPlayer(player);
        setViewedPlayers(prev => new Set(prev).add(player.name));
    };

    const mafiaTeammates = (player: Player) => {
        if (player.role !== Role.MAFIA) return null;
        const teammates = players.filter(p => p.role === Role.MAFIA && p.name !== player.name).map(p => p.name).join(', ');
        return teammates.length > 0 ? teammates : 'شما تنها مافیای باقی‌مانده هستید.';
    };
    
    return (
        <div className="p-4 text-center">
            <h2 className="text-2xl font-bold mb-4">نمایش نقش‌ها</h2>
            <p className="text-gray-400 mb-6">هر بازیکن روی اسم خود کلیک کند تا نقش خود را ببیند. (فقط یکبار)</p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
                {players.map(p => (
                    <button 
                        key={p.id} 
                        onClick={() => handleReveal(p)} 
                        disabled={viewedPlayers.has(p.name)}
                        className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-4 rounded transition-colors disabled:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {p.name}
                    </button>
                ))}
            </div>

            {revealedPlayer && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={() => setRevealedPlayer(null)}>
                    <div className="bg-gray-800 rounded-lg p-8 shadow-2xl border border-gray-700 max-w-sm w-full" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold mb-2">{revealedPlayer.name}</h3>
                        <p className={`text-4xl font-bold my-4 ${revealedPlayer.role === Role.MAFIA ? 'text-red-500' : 'text-blue-400'}`}>
                            {revealedPlayer.role}
                        </p>
                        {revealedPlayer.role === Role.MAFIA && (
                            <div className="mt-4">
                                <h4 className="font-semibold text-gray-400">هم‌تیمی‌های شما:</h4>
                                {players.filter(p => p.role === Role.MAFIA && p.name !== revealedPlayer.name).length > 0 ? (
                                    <ul className="space-y-1 mt-2">
                                        {players.filter(p => p.role === Role.MAFIA && p.name !== revealedPlayer.name).map(teammate => (
                                            <li key={teammate.id} className="flex items-center justify-between text-lg text-red-300">
                                                <span>{teammate.name}</span>
                                                {viewedPlayers.has(teammate.name) ?
                                                    <span className="text-xs font-normal bg-green-500/30 text-green-300 px-2 py-1 rounded-full">آنلاین</span> :
                                                    <span className="text-xs font-normal bg-gray-600 text-gray-400 px-2 py-1 rounded-full">آفلاین</span>
                                                }
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="text-lg text-red-300">{mafiaTeammates(revealedPlayer)}</p>
                                )}
                            </div>
                        )}
                        <button onClick={() => setRevealedPlayer(null)} className="mt-6 w-full bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded">
                            بستن
                        </button>
                    </div>
                </div>
            )}
            
            <div className="w-full max-w-md mx-auto mt-4">
              <button onClick={onStartFirstDay} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded">
                  شروع روز اول
              </button>
            </div>
        </div>
    );
};

const EndGameReport: React.FC<{ log: string[], players: Player[], onReset: () => void }> = ({ log, players, onReset }) => {
    const [copyStatus, setCopyStatus] = useState('کپی کردن گزارش');
    const finalLogMessage = log.find(l => l.includes("پیروز شد")) || "نتیجه نهایی ثبت نشد.";

    const handleCopy = () => {
        const plainTextLog = log.map(l => l.replace(/<[^>]*>?/gm, '')).join('\n');
        navigator.clipboard.writeText(plainTextLog).then(() => {
            setCopyStatus('کپی شد!');
            setTimeout(() => setCopyStatus('کپی کردن گزارش'), 2000);
        }).catch(err => {
            console.error('Failed to copy log: ', err);
            setCopyStatus('خطا در کپی');
        });
    };

    return (
        <div className="text-center p-8 bg-gray-800 rounded-lg">
            <h2 className="text-3xl font-bold text-green-400 mb-4">بازی تمام شد!</h2>
            <p className="text-xl mb-8" dangerouslySetInnerHTML={{ __html: finalLogMessage }} />
            <div className="flex justify-center gap-4 mb-4">
                 <button onClick={handleCopy} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
                    {copyStatus}
                </button>
                <button onClick={onReset} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition-colors flex items-center gap-2">
                    <RefreshIcon className="h-4 w-4" />
                    شروع بازی جدید
                </button>
            </div>
            <h3 className="text-2xl font-bold mb-4">گزارش کامل بازی</h3>
            <div className="text-left max-h-[50vh] overflow-y-auto bg-gray-900/50 p-4 rounded">
                <Log messages={log} />
            </div>
        </div>
    );
};

const loadInitialState = () => {
    try {
        const savedStateJSON = localStorage.getItem('mafiaGameState');
        if (savedStateJSON) {
            const savedState = JSON.parse(savedStateJSON);
            if (savedState.players && savedState.gamePhase && typeof savedState.day === 'number') {
                return { ...savedState, history: savedState.history || [] };
            }
        }
    } catch (error) {
        console.error("Could not load game state from localStorage", error);
        localStorage.removeItem('mafiaGameState');
    }
    return {
        players: [],
        gamePhase: GamePhase.SETUP,
        day: 0,
        log: [],
        pollUsed: 0,
        history: [],
    };
};

const App: React.FC = () => {
  const [initialState] = useState(loadInitialState);

  const [players, setPlayers] = useState<Player[]>(initialState.players);
  const [gamePhase, setGamePhase] = useState<GamePhase>(initialState.gamePhase);
  const [day, setDay] = useState(initialState.day);
  const [log, setLog] = useState<string[]>(initialState.log);
  const [pollUsed, setPollUsed] = useState(initialState.pollUsed);
  const [history, setHistory] = useState<GameState[]>(initialState.history);
  
  const [showRoles, setShowRoles] = useState(false);
  const [viewedPlayers, setViewedPlayers] = useState<Set<string>>(new Set());
  
  const [nightMafiaAction, setNightMafiaAction] = useState<{ target: string; shooter: string } | null>(null);
  const [nightMafiaSaves, setNightMafiaSaves] = useState<string[]>([]);
  const [nightIndividualActions, setNightIndividualActions] = useState<Record<string, { shot: string | null, save: string | null }>>({});
  const [nightResult, setNightResult] = useState<NightResult | null>(null);
  const [isKickModalOpen, setIsKickModalOpen] = useState(false);
  const [playerToKick, setPlayerToKick] = useState<string | null>(null);
  const [isTimeTravelModalOpen, setIsTimeTravelModalOpen] = useState(false);
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number | null>(null);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDefenseModalOpen, setIsDefenseModalOpen] = useState(false);
  const [playerOnTrial, setPlayerOnTrial] = useState<Player | null>(null);
  const [defenseTimer, setDefenseTimer] = useState(60);
  
  const livingPlayers = players.filter(p => p.isAlive);
  const livingMafia = players.filter(p => p.isAlive && p.role === Role.MAFIA);
  const livingCitizens = players.filter(p => p.isAlive && p.role === Role.CITIZEN);
  
  const addLog = useCallback((message: string) => {
    setLog(prev => [...prev, message]);
  }, []);

  const checkWinCondition = useCallback(() => {
    if(gamePhase === GamePhase.END) return true;

    const mafiaCount = livingMafia.length;
    const citizenCount = livingCitizens.length;

    if (mafiaCount === 0) {
      addLog("<strong class='text-blue-400'>شهروندان پیروز شدند!</strong> تمام مافیاها حذف شدند.");
      setGamePhase(GamePhase.END);
      return true;
    }
    if (mafiaCount >= citizenCount) {
      addLog("<strong class='text-red-400'>مافیا پیروز شد!</strong> تعداد مافیا و شهروندان برابر شد.");
      setGamePhase(GamePhase.END);
      return true;
    }
    return false;
  }, [livingMafia.length, livingCitizens.length, addLog, gamePhase]);

  useEffect(() => {
    if (gamePhase !== GamePhase.SETUP && gamePhase !== GamePhase.ROLE_REVEAL && gamePhase !== GamePhase.END) {
        checkWinCondition();
    }
  }, [players, gamePhase, checkWinCondition]);

  useEffect(() => {
    if (gamePhase !== GamePhase.SETUP) {
        const stateToSave = { players, gamePhase, day, log, pollUsed, history };
        localStorage.setItem('mafiaGameState', JSON.stringify(stateToSave));
    } else {
        localStorage.removeItem('mafiaGameState');
    }
  }, [players, gamePhase, day, log, pollUsed, history]);

  useEffect(() => {
    if (isDefenseModalOpen && defenseTimer > 0) {
      const timerId = setTimeout(() => setDefenseTimer(defenseTimer - 1), 1000);
      return () => clearTimeout(timerId);
    }
  }, [isDefenseModalOpen, defenseTimer]);

  const handleResetGame = () => {
    localStorage.removeItem('mafiaGameState');
    localStorage.removeItem('showRoles');
    setPlayers([]);
    setGamePhase(GamePhase.SETUP);
    setDay(0);
    setLog([]);
    setPollUsed(0);
    setHistory([]);
    setNightMafiaAction(null);
    setNightMafiaSaves([]);
    setNightIndividualActions({});
    setNightResult(null);
    setIsKickModalOpen(false);
    setPlayerToKick(null);
    setIsTimeTravelModalOpen(false);
    setSelectedHistoryIndex(null);
    setShowRoles(false);
    setViewedPlayers(new Set());
    setIsResetModalOpen(false);
    setIsDefenseModalOpen(false);
    setPlayerOnTrial(null);
  };

  const handleGameStart = (names: string[]) => {
    const roles = [
        ...Array(MAFIA_COUNT).fill(Role.MAFIA), 
        ...Array(PLAYER_COUNT - MAFIA_COUNT).fill(Role.CITIZEN)
    ].sort(() => Math.random() - 0.5);
    
    const initialPlayers: Player[] = names.map((name, index) => ({
      id: index,
      name,
      role: roles[index],
      isAlive: true,
      hasGun: true,
      hasSave: true,
      receivedGuns: []
    }));

    setPlayers(initialPlayers);
    setGamePhase(GamePhase.ROLE_REVEAL);
    setDay(0);
    setLog(['بازی شروع شد. بازیکنان نقش‌ها را مشاهده می‌کنند.']);
    setPollUsed(0);
    setHistory([]);
    setShowRoles(false);
    setViewedPlayers(new Set());
  };
  
  const getPhaseName = (phase: GamePhase) => {
    if (phase.startsWith('NIGHT')) return 'شب';
    if (phase.startsWith('DAY')) return 'روز';
    return '';
  }

  const handleRevertToState = (index: number | null) => {
    if (index === null) return;
    
    const stateToRestore = history[index];
    const newHistory = history.slice(0, index);

    setPlayers(stateToRestore.players);
    setGamePhase(stateToRestore.gamePhase);
    setDay(stateToRestore.day);
    setPollUsed(stateToRestore.pollUsed);
    setLog(prev => prev.slice(0, stateToRestore.logLength));
    setHistory(newHistory);
    
    setNightMafiaAction(null);
    setNightMafiaSaves([]);
    setNightIndividualActions({});
    setNightResult(null);
    
    setIsTimeTravelModalOpen(false);
    setSelectedHistoryIndex(null);
    addLog(`<strong class="text-yellow-400">بازگشت به گذشته:</strong> بازی به شروع ${getPhaseName(stateToRestore.gamePhase)} ${stateToRestore.day} بازگردانده شد.`);
  };

  const handleStartFirstDay = () => {
    const snapshot: GameState = {
        players: JSON.parse(JSON.stringify(players)),
        day: 1,
        pollUsed: 0,
        gamePhase: GamePhase.DAY,
        logLength: log.length,
    };
    setHistory([snapshot]);
    setDay(1);
    setGamePhase(GamePhase.DAY);
    addLog(`روز 1 آغاز شد.`);
  };

  const handleMafiaActionSubmit = (target: string | null, shooter: string | null, saves: string[]) => {
    if (target && shooter) {
        setNightMafiaAction({ target, shooter });
        setPlayers(prevPlayers => prevPlayers.map(p => p.name === shooter ? { ...p, hasGun: false } : p));
        addLog(`مافیا تصمیمات خود را گرفت. شات به <strong class='text-yellow-400'>${target}</strong> توسط <strong class='text-red-400'>${shooter}</strong>. سیو مافیا: ${saves.length > 0 ? saves.map(s => `<strong class='text-green-400'>${s}</strong>`).join(', ') : 'هیچ'}.`);
    } else {
        setNightMafiaAction(null);
        addLog(`مافیا امشب شلیک نکرد. سیو مافیا: ${saves.length > 0 ? saves.map(s => `<strong class='text-green-400'>${s}</strong>`).join(', ') : 'هیچ'}.`);
    }
    setNightMafiaSaves(saves);
    setGamePhase(GamePhase.NIGHT_IND_ACTION);
  };
  
  const processNight = useCallback((individualActions: Record<string, { shot: string | null; save: string | null; }>) => {
    let shots: Record<string, { count: number, shooters: { name: string, role: Role }[] }> = {};
    let saves: Record<string, number> = {};
    let currentPlayers = JSON.parse(JSON.stringify(players)) as Player[];
    let nightLog: string[] = [];

    const getPlayer = (name: string) => currentPlayers.find(p => p.name === name);

    // 1. Apply Mafia saves
    nightMafiaSaves.forEach(targetName => {
      saves[targetName] = (saves[targetName] || 0) + 1;
      const saver = livingMafia.find(m => m.hasSave && nightMafiaSaves.includes(m.name)); 
      if (saver) {
        const p = getPlayer(saver.name);
        if(p && p.hasSave) {
          p.hasSave = false;
          nightLog.push(`<strong class='text-red-400'>${saver.name} (مافیا)</strong> از سیو خود برای <strong class='text-green-400'>${targetName}</strong> استفاده کرد.`);
        }
      }
    });

    // 2. Apply individual saves
    Object.entries(individualActions).forEach(([saverName, action]) => {
      if (action.save) {
        saves[action.save] = (saves[action.save] || 0) + 1;
        const p = getPlayer(saverName);
        if(p && p.hasSave) {
          p.hasSave = false;
           nightLog.push(`<strong class='text-blue-400'>${saverName}</strong> از سیو خود برای <strong class='text-green-400'>${action.save}</strong> استفاده کرد.`);
        }
      }
    });

    // 3. Register Mafia shot
    if (nightMafiaAction) {
      shots[nightMafiaAction.target] = { count: 1, shooters: [{name: nightMafiaAction.shooter, role: Role.MAFIA}] };
      const shooterPlayer = getPlayer(nightMafiaAction.shooter);
      if (shooterPlayer) shooterPlayer.hasGun = false;
      nightLog.push(`<strong class='text-red-400'>${nightMafiaAction.shooter}</strong> به <strong class='text-yellow-400'>${nightMafiaAction.target}</strong> شلیک کرد.`);
    }

    // 4. Register individual shots
    Object.entries(individualActions).forEach(([shooterName, action]) => {
      if (action.shot) {
        const shooterPlayer = getPlayer(shooterName);
        if (shooterPlayer && shooterPlayer.role === Role.CITIZEN && shooterPlayer.hasGun) {
            shooterPlayer.hasGun = false;
            if (!shots[action.shot]) shots[action.shot] = { count: 0, shooters: [] };
            shots[action.shot].count++;
            shots[action.shot].shooters.push({name: shooterName, role: shooterPlayer.role});
            nightLog.push(`<strong class='text-blue-400'>${shooterName}</strong> به <strong class='text-yellow-400'>${action.shot}</strong> شلیک کرد.`);
        }
      }
    });

    // 5. Determine eliminations
    let eliminated: { player: Player, reason: string }[] = [];
    
    Object.entries(shots).forEach(([targetName, shotData]) => {
      const targetPlayer = getPlayer(targetName);
      // Fireback check first
      if (targetPlayer?.role === Role.CITIZEN) {
        shotData.shooters.forEach(shooter => {
          if (shooter.role === Role.CITIZEN) {
            const shooterPlayer = getPlayer(shooter.name);
            if (shooterPlayer && shooterPlayer.isAlive && !eliminated.some(e => e.player.name === shooterPlayer.name)) {
              shooterPlayer.isAlive = false;
              eliminated.push({ player: { ...shooterPlayer, isAlive: false }, reason: `فایربک (شلیک به شهروند <strong class='text-blue-400'>${targetName}</strong>)` });
              nightLog.push(`<strong class='text-red-500'>فایربک!</strong> <strong class='text-blue-400'>${shooter.name}</strong> به شهروند شلیک کرد و حذف شد.`);
            }
          }
        });
      }
    });
    
    Object.entries(shots).forEach(([targetName, shotData]) => {
      const targetPlayer = getPlayer(targetName);
      if (targetPlayer && targetPlayer.isAlive && !eliminated.some(e => e.player.name === targetPlayer.name)) {
        const finalShotCount = shotData.count;
        const saveCount = saves[targetName] || 0;
        if (finalShotCount > saveCount) {
          targetPlayer.isAlive = false;
          eliminated.push({ player: { ...targetPlayer, isAlive: false }, reason: `شات در شب (${finalShotCount} شات, ${saveCount} سیو)` });
          nightLog.push(`<strong class='text-yellow-400'>${targetName}</strong> با ${finalShotCount} شات و ${saveCount} سیو حذف شد.`);
        } else if (finalShotCount > 0) {
            nightLog.push(`<strong class='text-green-400'>${targetName}</strong> با ${saveCount} سیو از ${finalShotCount} شات نجات یافت.`);
        }
      }
    });
    
    setNightMafiaAction(null);
    setNightMafiaSaves([]);
    setNightIndividualActions({});

    const result: NightResult = {
      eliminated,
      gunTransfers: eliminated.map(e => ({ from: e.player, gunType: null, to: null })),
      log: nightLog
    };

    setNightResult(result);
    setPlayers(currentPlayers);
    setGamePhase(GamePhase.NIGHT_GUN_TRANSFER);
  }, [players, nightMafiaAction, nightMafiaSaves, livingMafia]);

  const handleIndividualActionSubmit = (actions: Record<string, { shot: string | null; save: string | null; }>) => {
    setNightIndividualActions(actions);
    addLog("اقدامات انفرادی بازیکنان ثبت شد. در حال محاسبه نتایج شب...");
    processNight(actions);
  };

  const handleGunTransferSubmit = (transfers: NightResult['gunTransfers']) => {
    let currentPlayers = [...players];
    const newLog = [...log, ...(nightResult?.log || [])];
    newLog.push(`<strong>پایان شب ${day}.</strong>`);

    const newGuns = transfers.filter(t => t.to && t.gunType);

    newGuns.forEach(transfer => {
        const recipient = currentPlayers.find(p => p.name === transfer.to);
        if (recipient) {
            if(recipient.isAlive){
                 recipient.receivedGuns = [...(recipient.receivedGuns || []), transfer.gunType!];
            } else {
                 newLog.push(`اسلحه ${transfer.from.name} به ${recipient.name} (حذف شده) منتقل شد و از بازی خارج شد.`);
            }
        }
    });
    
    const snapshot: GameState = {
        players: JSON.parse(JSON.stringify(currentPlayers)),
        day: day + 1,
        pollUsed,
        gamePhase: GamePhase.DAY,
        logLength: newLog.length,
    };
    setHistory(prev => [...prev, snapshot]);

    setPlayers(currentPlayers);
    
    if (checkWinCondition()) return;

    setDay(day + 1);
    setGamePhase(GamePhase.DAY);

    const eliminatedNames = nightResult?.eliminated.map(e => `<strong>${e.player.name}</strong> (${e.reason})`).join(', ') || 'هیچکس';
    newLog.push(`روز ${day + 1} آغاز شد. کشته‌های شب: ${eliminatedNames}.`);
    const gunsGiven = transfers.filter(t => t.to && t.gunType && currentPlayers.find(p=>p.name === t.to)?.isAlive).length;
    if(gunsGiven > 0) {
        newLog.push(`<strong class='text-purple-400'>${gunsGiven} اسلحه جدید وارد بازی شد.</strong>`);
    }
    setLog(newLog);
  };
  
  const handlePoll = () => {
      if (pollUsed < 2) {
          const eliminatedMafia = players.filter(p => !p.isAlive && p.role === Role.MAFIA).length;
          const eliminatedCitizens = players.filter(p => !p.isAlive && p.role === Role.CITIZEN).length;
          addLog(`<strong>نتیجه استعلام:</strong> <strong class='text-red-400'>${eliminatedMafia} مافیا</strong> و <strong class='text-blue-400'>${eliminatedCitizens} شهروند</strong> حذف شده‌اند.`);
          setPollUsed(pollUsed + 1);
      }
  };
  
  const handleDayGunUse = (shooterName: string, targetName: string | null, gunIndex: number) => {
    const shooter = players.find(p => p.name === shooterName);
    if (!shooter || !shooter.receivedGuns || shooter.receivedGuns[gunIndex] === undefined) return;

    let updatedPlayers = [...players];
    const gunType = shooter.receivedGuns[gunIndex];
    const shooterIndex = updatedPlayers.findIndex(p => p.name === shooterName);
    
    // Remove the used gun
    const newGuns = [...updatedPlayers[shooterIndex].receivedGuns!];
    newGuns.splice(gunIndex, 1);
    updatedPlayers[shooterIndex] = {...updatedPlayers[shooterIndex], receivedGuns: newGuns};

    if (targetName === null) {
        addLog(`<strong class='text-purple-400'>${shooterName}</strong> با اسلحه روز (${gunType}) یک <strong class='text-gray-400'>تیر هوایی</strong> شلیک کرد.`);
    } else if (gunType === GunType.CORRECT) {
        const targetIndex = updatedPlayers.findIndex(p => p.name === targetName);
        if (targetIndex > -1) {
            updatedPlayers[targetIndex] = {...updatedPlayers[targetIndex], isAlive: false};
            addLog(`<strong class='text-green-500'>شلیک موفق!</strong> <strong class='text-purple-400'>${shooterName}</strong> با اسلحه روز به <strong class='text-yellow-400'>${targetName}</strong> شلیک کرد و او را حذف کرد.`);
        }
    } else { // SABOTAGED
        updatedPlayers[shooterIndex] = {...updatedPlayers[shooterIndex], isAlive: false};
        addLog(`<strong class='text-red-500'>شلیک ناموفق!</strong> <strong class='text-purple-400'>${shooterName}</strong> با اسلحه خراب به <strong class='text-yellow-400'>${targetName}</strong> شلیک کرد و خودش حذف شد.`);
    }
    setPlayers(updatedPlayers);
  };
  
  const handleStartTrial = (playerName: string) => {
    const player = livingPlayers.find(p => p.name === playerName);
    if (player) {
        setPlayerOnTrial(player);
        setDefenseTimer(60);
        setIsDefenseModalOpen(true);
        addLog(`<strong class='text-yellow-400'>${playerName}</strong> برای دفاع به جایگاه فراخوانده شد.`);
    }
  };

  const handleEliminationByVote = (votedOutName: string) => {
      setPlayers(players.map(p => p.name === votedOutName ? {...p, isAlive: false} : p));
      addLog(`<strong class='text-yellow-400'>${votedOutName}</strong> با رای‌گیری در روز حذف شد.`);
      addLog(`<strong>پایان روز ${day}.</strong> وصیت بازیکن شنیده می‌شود.`);
      setIsDefenseModalOpen(false);
      setPlayerOnTrial(null);
  };
  
  const handleAcquitPlayer = () => {
    if (playerOnTrial) {
        addLog(`<strong class='text-green-400'>${playerOnTrial.name}</strong> توسط گرداننده تبرئه شد و در بازی باقی ماند.`);
    }
    setIsDefenseModalOpen(false);
    setPlayerOnTrial(null);
  };

  const handleEndDay = () => {
    if (checkWinCondition()) return;

    const snapshot: GameState = {
        players: JSON.parse(JSON.stringify(players)),
        day: day,
        pollUsed,
        gamePhase: GamePhase.NIGHT_MAF_ACTION,
        logLength: log.length,
    };
    setHistory(prev => [...prev, snapshot]);

    setGamePhase(GamePhase.NIGHT_MAF_ACTION);
    addLog(`شب ${day} آغاز می‌شود.`);
  };

  const handleDisciplinaryKick = (playerName: string) => {
    const playerToKick = players.find(p => p.name === playerName);
    if (!playerToKick || !playerToKick.isAlive) return;

    setPlayers(players.map(p => 
        p.name === playerName 
        ? { ...p, isAlive: false, receivedGuns: [] } 
        : p
    ));
    addLog(`<strong class='text-orange-500'>اخراج انضباطی!</strong> ${playerName} از بازی حذف شد.`);
    setIsKickModalOpen(false);
    setPlayerToKick(null);
  };
  
  const handleToggleShowRoles = () => {
    const newShowRoles = !showRoles;
    if (newShowRoles) {
        // When showing roles, mark all as viewed.
        setViewedPlayers(new Set(players.map(p => p.name)));
    }
    setShowRoles(newShowRoles);
  };

  const renderPhase = () => {
    switch (gamePhase) {
      case GamePhase.ROLE_REVEAL:
        return <RoleRevealPhase players={players} onStartFirstDay={handleStartFirstDay} viewedPlayers={viewedPlayers} setViewedPlayers={setViewedPlayers} />;
      case GamePhase.NIGHT_MAF_ACTION:
        return <NightMafiaActionPhase livingMafia={livingMafia} livingPlayers={livingPlayers} onSubmit={handleMafiaActionSubmit} />;
      case GamePhase.NIGHT_IND_ACTION:
        return <NightIndividualActionPhase livingPlayers={livingPlayers} onSubmit={handleIndividualActionSubmit} />;
      case GamePhase.NIGHT_GUN_TRANSFER:
        return <NightGunTransferPhase nightResult={nightResult} players={players} onSubmit={handleGunTransferSubmit} />;
      case GamePhase.DAY:
        const votesNeeded = Math.ceil(livingPlayers.length / 2);
        return <DayPhase
                    day={day}
                    onPoll={handlePoll}
                    pollUsed={pollUsed}
                    players={players}
                    onUseGun={handleDayGunUse}
                    onStartTrial={handleStartTrial}
                    onEndDay={handleEndDay}
                    votesNeeded={votesNeeded}
                    />;
      case GamePhase.END:
        return <EndGameReport log={log} players={players} onReset={handleResetGame} />;
      default:
        return null;
    }
  };
  
  if (gamePhase === GamePhase.SETUP) {
    return <PlayerSetup onStart={handleGameStart} />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 flex flex-col">
      <div className="flex-grow p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-grow flex flex-col gap-4">
          <header className="bg-gray-800 p-4 rounded-lg shadow-lg flex justify-between items-center">
            <h1 className="text-2xl font-bold text-red-500">مافیا مینیمال</h1>
            <div className="flex items-center gap-4 text-xl font-semibold">
                {gamePhase.startsWith('NIGHT') ? <MoonIcon className="text-blue-300"/> : <SunIcon className="text-yellow-300" />}
                <span>{gamePhase.startsWith('NIGHT') ? `شب ${day}` : `روز ${day}`}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
                 <button 
                  onClick={() => setIsTimeTravelModalOpen(true)}
                  title="بازگشت به گذشته"
                  disabled={history.length === 0}
                  className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-3 rounded text-sm flex items-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  <TimeIcon className="h-4 w-4"/>
                  بازگشت
                </button>
                <button 
                  onClick={() => setIsKickModalOpen(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-3 rounded text-sm flex items-center gap-2"
                >
                  <BanIcon className="h-4 w-4"/>
                  اخراج
                </button>
                <button 
                  onClick={() => setIsResetModalOpen(true)}
                  title="شروع بازی جدید"
                  className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-3 rounded text-sm flex items-center gap-2"
                >
                  <RefreshIcon className="h-4 w-4"/>
                  شروع مجدد
                </button>
            </div>
          </header>
          <main className="flex-grow bg-gray-800/50 p-4 rounded-lg">
            {renderPhase()}
          </main>
          <Log messages={log} />
        </div>
        <PlayerStatus 
            players={players} 
            showRoles={showRoles}
            gamePhase={gamePhase}
            onToggleShowRoles={handleToggleShowRoles}
            viewedPlayersCount={viewedPlayers.size}
            totalPlayersCount={PLAYER_COUNT}
        />

        {isKickModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-8 shadow-2xl border border-gray-700 max-w-sm w-full">
                  <h3 className="text-2xl font-bold mb-4 text-orange-400">اخراج انضباطی</h3>
                  <p className="text-gray-400 mb-6">کدام بازیکن را می‌خواهید از بازی حذف کنید؟ این عمل غیرقابل بازگشت است.</p>
                  
                  <select
                      value={playerToKick || ''}
                      onChange={(e) => setPlayerToKick(e.target.value)}
                      className="w-full bg-gray-700 p-2 rounded mb-6"
                  >
                      <option value="" disabled>یک بازیکن را انتخاب کنید</option>
                      {livingPlayers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                  
                  <div className="flex gap-4">
                      <button
                          onClick={() => {
                              setIsKickModalOpen(false);
                              setPlayerToKick(null);
                          }}
                          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded transition-colors"
                      >
                          انصراف
                      </button>
                      <button
                          onClick={() => {
                              if (playerToKick) {
                                  handleDisciplinaryKick(playerToKick);
                              }
                          }}
                          disabled={!playerToKick}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 rounded transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                      >
                          تایید اخراج
                      </button>
                  </div>
              </div>
          </div>
        )}
        
        {isTimeTravelModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-8 shadow-2xl border border-gray-700 max-w-md w-full">
                  <h3 className="text-2xl font-bold mb-4 text-purple-400">بازگشت به گذشته</h3>
                  <p className="text-gray-400 mb-6">به کدام نقطه از بازی می‌خواهید برگردید؟</p>
                  <div className="max-h-64 overflow-y-auto space-y-2">
                      {history.map((snapshot, index) => (
                           <label key={index} className="flex items-center w-full text-right bg-gray-700 hover:bg-purple-800 p-3 rounded transition-colors cursor-pointer">
                              <input
                                  type="radio"
                                  name="history-point"
                                  className="ml-4"
                                  checked={selectedHistoryIndex === index}
                                  onChange={() => setSelectedHistoryIndex(index)}
                              />
                              بازگشت به شروع <strong className="text-yellow-300 mr-1">{getPhaseName(snapshot.gamePhase)} {snapshot.day}</strong>
                          </label>
                      ))}
                  </div>
                   <div className="flex gap-4 mt-6">
                       <button
                          onClick={() => {
                              setIsTimeTravelModalOpen(false)
                              setSelectedHistoryIndex(null)
                          }}
                          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded transition-colors"
                      >
                          انصراف
                      </button>
                       <button
                          onClick={() => handleRevertToState(selectedHistoryIndex)}
                          disabled={selectedHistoryIndex === null}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                      >
                          تایید بازگشت
                      </button>
                  </div>
              </div>
          </div>
        )}

        {isResetModalOpen && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-8 shadow-2xl border border-gray-700 max-w-sm w-full">
                  <h3 className="text-2xl font-bold mb-4 text-red-400">شروع مجدد بازی</h3>
                  <p className="text-gray-400 mb-6">آیا مطمئن هستید که می‌خواهید بازی فعلی را پاک کرده و یک بازی جدید شروع کنید؟ این عمل غیرقابل بازگشت است.</p>
                  <div className="flex gap-4">
                      <button
                          onClick={() => setIsResetModalOpen(false)}
                          className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded transition-colors"
                      >
                          انصراف
                      </button>
                      <button
                          onClick={handleResetGame}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition-colors"
                      >
                          تایید و شروع مجدد
                      </button>
                  </div>
              </div>
          </div>
        )}

        {isDefenseModalOpen && playerOnTrial && (
            <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                <div className="bg-gray-800 rounded-lg p-8 shadow-2xl border border-gray-700 max-w-md w-full text-center">
                    <GavelIcon className="h-12 w-12 mx-auto text-yellow-400 mb-4" />
                    <h3 className="text-2xl font-bold mb-2">دفاعیه برای <strong className="text-yellow-300">{playerOnTrial.name}</strong></h3>
                    <p className="text-gray-400 mb-6">بازیکن ۶۰ ثانیه فرصت دارد تا از خود دفاع کند.</p>
                    
                    <div className="text-6xl font-mono text-white my-4 p-4 bg-gray-900/50 rounded-lg">
                        {defenseTimer}
                    </div>

                    <p className="text-sm text-gray-500 mb-6">پس از پایان دفاعیه، گرداننده تصمیم نهایی را اعلام می‌کند.</p>
                    
                    <div className="flex gap-4">
                        <button
                            onClick={handleAcquitPlayer}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded transition-colors"
                        >
                            تبرئه
                        </button>
                        <button
                            onClick={() => handleEliminationByVote(playerOnTrial.name)}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded transition-colors"
                        >
                            حذف بازیکن
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
      <footer className="text-center text-xs text-gray-500 py-2 flex flex-col items-center justify-center gap-2">
          <span>Design with AI by <a href="https://eparsa.ir" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-red-500 transition-colors">eParsa.ir</a></span>
          <div className="flex items-center gap-4">
              <a href="https://api.whatsapp.com/send?phone=989393783832" target="_blank" rel="noopener noreferrer" title="WhatsApp" className="text-gray-400 hover:text-green-500 transition-colors">
                  <WhatsAppIcon className="h-5 w-5" />
              </a>
              <a href="https://t.me/spiderboy" target="_blank" rel="noopener noreferrer" title="Telegram" className="text-gray-400 hover:text-blue-500 transition-colors">
                  <TelegramIcon className="h-5 w-5" />
              </a>
          </div>
      </footer>
    </div>
  );
};


const NightMafiaActionPhase: React.FC<{livingMafia: Player[], livingPlayers: Player[], onSubmit: (target: string | null, shooter: string | null, saves: string[]) => void}> = ({livingMafia, livingPlayers, onSubmit}) => {
    const [target, setTarget] = useState('');
    const [shooter, setShooter] = useState('');
    const [saves, setSaves] = useState<string[]>([]);
    
    const canMafiaShoot = livingMafia.some(p => p.hasGun);

    const handleSaveToggle = (playerName: string) => {
        setSaves(prev => {
            const mafiaWithSave = livingMafia.find(p => p.name === playerName && p.hasSave);
            if (!mafiaWithSave) return prev;
    
            const currentSaves = prev.filter(name => {
                const saver = livingMafia.find(p => p.name === name);
                return saver && saver.hasSave;
            });
    
            if (currentSaves.includes(playerName)) {
                return currentSaves.filter(n => n !== playerName);
            } else {
                const availableSavers = livingMafia.filter(p => p.hasSave).length;
                if (currentSaves.length < availableSavers) {
                    return [...currentSaves, playerName];
                }
            }
            return prev;
        });
    };
    
    const handleSubmit = () => {
        if (target === '_NO_SHOT_') {
            onSubmit(null, null, saves);
            return;
        }

        if (target && shooter) {
            const shooterPlayer = livingMafia.find(p => p.name === shooter);
            if(shooterPlayer && !shooterPlayer.hasGun) {
                alert('شات‌زن انتخابی اسلحه ندارد.');
                return;
            }
            onSubmit(target, shooter, saves);
        } else {
            if (!canMafiaShoot) {
                onSubmit(null, null, saves);
            } else {
                alert('لطفا هدف شات و شات‌زن را مشخص کنید، یا گزینه "عدم شلیک تیر" را انتخاب کنید.');
            }
        }
    }
    
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-center">اقدامات تیم مافیا</h2>
            <div className="space-y-4">
                <div>
                    <label className="block mb-1 font-semibold">شات شب به:</label>
                    <select value={target} onChange={e => {
                      setTarget(e.target.value);
                      if (e.target.value === '_NO_SHOT_') {
                        setShooter('');
                      }
                    }} className="w-full bg-gray-700 p-2 rounded">
                        <option value="">انتخاب هدف</option>
                        <option value="_NO_SHOT_">عدم شلیک تیر</option>
                        {livingPlayers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block mb-1 font-semibold">توسط:</label>
                    <select value={shooter} onChange={e => setShooter(e.target.value)} className="w-full bg-gray-700 p-2 rounded" disabled={target === '_NO_SHOT_' || !canMafiaShoot}>
                        <option value="">انتخاب شات‌زن</option>
                        {livingMafia.map(p => <option key={p.id} value={p.name} disabled={!p.hasGun}>{p.name} {p.hasGun ? "" : "(شات ندارد)"}</option>)}
                    </select>
                    {!canMafiaShoot && <p className="text-sm text-yellow-400 mt-1">هیچ مافیایی اسلحه برای شلیک ندارد.</p>}
                </div>
                <div>
                    <label className="block mb-1 font-semibold">سیو مافیا (بازیکنان دارای سیو):</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                        {livingMafia.map(mafia => (
                            <button key={mafia.id} onClick={() => handleSaveToggle(mafia.name)} disabled={!mafia.hasSave} className={`p-2 rounded transition-colors ${saves.includes(mafia.name) ? 'bg-green-600' : 'bg-gray-600'} disabled:bg-gray-800 disabled:text-gray-500`}>
                                سیو {mafia.name}
                            </button>
                        ))}
                    </div>
                     {saves.length > 0 && <p className="mt-2 text-sm text-gray-400">سیو برای: {saves.join(', ')}</p>}
                </div>
                <button onClick={handleSubmit} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded mt-4">ثبت اقدامات مافیا</button>
            </div>
        </div>
    );
};

const NightIndividualActionPhase: React.FC<{ livingPlayers: Player[], onSubmit: (actions: Record<string, { shot: string | null; save: string | null; }>) => void }> = ({ livingPlayers, onSubmit }) => {
    const [actions, setActions] = useState<Record<string, { shot: string | null; save: string | null; }>>(() => {
        const initialState: Record<string, { shot: string | null; save: string | null; }> = {};
        livingPlayers.forEach(p => {
            initialState[p.name] = { shot: null, save: null };
        });
        return initialState;
    });
    const [gmNarration, setGmNarration] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [aiUpdatedFields, setAiUpdatedFields] = useState<Set<string>>(new Set());


    const handleActionChange = (playerName: string, type: 'shot' | 'save', target: string | null) => {
        setActions(prev => ({
            ...prev,
            [playerName]: { ...prev[playerName], [type]: target }
        }));
    };
    
    const handleSubmit = () => {
        onSubmit(actions);
    }

    const handleGeminiAnalysis = async () => {
        if (!gmNarration.trim()) {
            alert("لطفاً وقایع شب را توصیف کنید.");
            return;
        }
        setIsAnalyzing(true);
        setAiUpdatedFields(new Set());

        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        const playerNames = livingPlayers.map(p => p.name).join(', ');

        const prompt = `
            شما دستیار یک بازی مافیا هستید. وظیفه شما این است که گزارش گاد بازی از وقایع شب را بخوانید و آن را به یک ساختار JSON تبدیل کنید.
            فقط اقدامات بازیکنان شهروند را در نظر بگیرید. اقدامات مافیا در مرحله جداگانه‌ای انجام شده است.
            بازیکنان زنده عبارتند از: ${playerNames}.
            گزارش گاد: "${gmNarration}"

            اقدامات ممکن "shot" (شلیک) و "save" (نجات) هستند. هر بازیکن می‌تواند خودش را نجات دهد.
            نام بازیکنان را دقیقاً همانطور که در لیست آمده است برگردانید.
        `;
        
        const actionSchema = {
            type: Type.OBJECT,
            properties: {
                actions: {
                    type: Type.ARRAY,
                    description: "لیستی از تمام اقدامات انجام شده در شب.",
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            actor: {
                                type: Type.STRING,
                                description: `نام بازیکنی که اقدام را انجام داده است. باید یکی از اینها باشد: ${playerNames}`
                            },
                            actionType: {
                                type: Type.STRING,
                                description: "نوع اقدام، 'shot' یا 'save'."
                            },
                            target: {
                                type: Type.STRING,
                                description: `هدف اقدام. باید یکی از اینها باشد: ${playerNames}`
                            }
                        },
                        required: ["actor", "actionType", "target"]
                    }
                }
            }
        };

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: actionSchema,
                },
            });

            const resultJson = response.text;
            const parsedResult = JSON.parse(resultJson);

            if (parsedResult && parsedResult.actions) {
                const newActions = { ...actions };
                const updatedFields = new Set<string>();

                parsedResult.actions.forEach((action: { actor: string, actionType: 'shot' | 'save', target: string }) => {
                    const actorExists = livingPlayers.some(p => p.name === action.actor);
                    const targetExists = livingPlayers.some(p => p.name === action.target);
                    const actorPlayer = livingPlayers.find(p => p.name === action.actor);

                    if (actorExists && targetExists && actorPlayer) {
                         if (action.actionType === 'shot' && actorPlayer.hasGun && actorPlayer.role === Role.CITIZEN) {
                            newActions[action.actor] = { ...newActions[action.actor], shot: action.target };
                            updatedFields.add(`${action.actor}-shot`);
                        } else if (action.actionType === 'save' && actorPlayer.hasSave) {
                            newActions[action.actor] = { ...newActions[action.actor], save: action.target };
                            updatedFields.add(`${action.actor}-save`);
                        }
                    }
                });

                setActions(newActions);
                setAiUpdatedFields(updatedFields);
                setTimeout(() => setAiUpdatedFields(new Set()), 2000); // Remove highlight after 2 seconds
            }

        } catch (error) {
            console.error("Error analyzing with Gemini:", error);
            alert("خطایی در تحلیل وقایع رخ داد. لطفاً به صورت دستی وارد کنید.");
        } finally {
            setIsAnalyzing(false);
        }
    };
    
    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-center">اقدامات انفرادی</h2>
            
            <details className="bg-gray-800/50 rounded-lg mb-4">
                <summary className="p-3 cursor-pointer font-semibold flex items-center gap-2 text-purple-300">
                    <SparklesIcon />
                    دستیار هوش مصنوعی گاد (اختیاری)
                </summary>
                <div className="p-4 border-t border-gray-700">
                    <p className="text-sm text-gray-400 mb-2">وقایع شب (فقط اقدامات شهروندان) را به زبان فارسی ساده بنویسید تا فرم زیر به صورت خودکار پر شود.</p>
                    <p className="text-xs text-gray-500 mb-2">مثال: "رضا به سارا شلیک کرد. مریم خودش را سیو کرد."</p>
                    <textarea
                        value={gmNarration}
                        onChange={(e) => setGmNarration(e.target.value)}
                        placeholder="اینجا بنویسید..."
                        rows={3}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                        disabled={isAnalyzing}
                    />
                    <button onClick={handleGeminiAnalysis} disabled={isAnalyzing} className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded flex items-center justify-center gap-2 disabled:bg-gray-500">
                        {isAnalyzing ? (
                            <>
                                <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                <span>در حال تحلیل...</span>
                            </>
                        ) : (
                            <span>تحلیل وقایع با هوش مصنوعی</span>
                        )}
                    </button>
                </div>
            </details>

            <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-2">
                {livingPlayers.map(p => (
                    <div key={p.id} className="bg-gray-700 p-3 rounded-lg">
                        <h3 className="font-bold text-lg mb-2 text-gray-200">{p.name}</h3>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="text-xs text-gray-400 block">شلیک به:</label>
                                <select
                                    value={actions[p.name]?.shot || ''}
                                    onChange={(e) => handleActionChange(p.name, 'shot', e.target.value || null)}
                                    disabled={!p.hasGun || p.role !== Role.CITIZEN}
                                    className={`w-full bg-gray-600 p-1 rounded text-sm mt-1 ${aiUpdatedFields.has(`${p.name}-shot`) ? 'ring-2 ring-purple-500 transition-all' : ''} disabled:opacity-50`}
                                >
                                    <option value="">انتخاب هدف</option>
                                    {livingPlayers.map(target => <option key={target.id} value={target.name}>{target.name}</option>)}
                                </select>
                                {!p.hasGun && p.role === Role.CITIZEN && <span className="text-xs text-yellow-500">اسلحه ندارد</span>}
                                {p.role === Role.MAFIA && <span className="text-xs text-gray-500">مافیا</span>}
                            </div>
                            <div>
                                <label className="text-xs text-gray-400 block">سیو:</label>
                                <select
                                    value={actions[p.name]?.save || ''}
                                    onChange={(e) => handleActionChange(p.name, 'save', e.target.value || null)}
                                    disabled={!p.hasSave}
                                    className={`w-full bg-gray-600 p-1 rounded text-sm mt-1 ${aiUpdatedFields.has(`${p.name}-save`) ? 'ring-2 ring-purple-500 transition-all' : ''} disabled:opacity-50`}
                                >
                                    <option value="">انتخاب هدف</option>
                                    {livingPlayers.map(target => <option key={target.id} value={target.name}>{target.name}</option>)}
                                </select>
                                 {!p.hasSave && <span className="text-xs text-red-500">سیو ندارد</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={handleSubmit} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded mt-4">
                ثبت اقدامات انفرادی
            </button>
        </div>
    );
};

const NightGunTransferPhase: React.FC<{
    nightResult: NightResult | null;
    players: Player[];
    onSubmit: (transfers: NightResult['gunTransfers']) => void;
}> = ({ nightResult, players, onSubmit }) => {
    const eliminatedWithGuns = nightResult?.eliminated.filter(e => e.player.hasGun || (e.player.receivedGuns && e.player.receivedGuns.length > 0)) || [];
    const livingPlayers = players.filter(p => p.isAlive);

    const initialTransfers = nightResult?.eliminated.map(e => ({ from: e.player, gunType: null, to: null })) || [];
    const [transfers, setTransfers] = useState<NightResult['gunTransfers']>(initialTransfers);

    const handleTransferChange = (fromPlayerName: string, gunType: GunType | null, toPlayerName: string | null) => {
        setTransfers(prev =>
            prev.map(t =>
                t.from.name === fromPlayerName
                    ? { ...t, gunType: gunType, to: toPlayerName }
                    : t
            )
        );
    };

    if (!nightResult) return <div className="text-center p-4">در حال بارگذاری نتایج شب...</div>;

    if (eliminatedWithGuns.length === 0) {
        return (
            <div className="p-4 text-center">
                <h2 className="text-xl font-bold mb-4">انتقال اسلحه</h2>
                <p className="text-gray-400 mb-6">هیچ بازیکنی که اسلحه داشته باشد در شب حذف نشده است.</p>
                <button onClick={() => onSubmit(transfers)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
                    ادامه به روز
                </button>
            </div>
        );
    }

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-center">انتقال اسلحه</h2>
            <p className="text-center text-gray-400 mb-6">بازیکنان حذف شده باید اسلحه‌های خود را به دیگران بدهند.</p>
            <div className="space-y-4">
                {eliminatedWithGuns.map(e => (
                    <div key={e.player.id} className="bg-gray-700 p-3 rounded-lg">
                        <h3 className="font-bold text-lg mb-2">{e.player.name} حذف شد.</h3>
                        <p className="mb-2 text-sm text-gray-300">لطفا اسلحه او را به یک بازیکن زنده منتقل کنید.</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-400">نوع اسلحه</label>
                                <select
                                    value={transfers.find(t => t.from.name === e.player.name)?.gunType || ''}
                                    onChange={(evt) => handleTransferChange(e.player.name, evt.target.value as GunType, transfers.find(t => t.from.name === e.player.name)?.to || null)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-800"
                                >
                                    <option value="">انتخاب کنید</option>
                                    <option value={GunType.CORRECT}>درست</option>
                                    <option value={GunType.SABOTAGED}>خرابکاری‌شده</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-400">به بازیکن</label>
                                <select
                                    value={transfers.find(t => t.from.name === e.player.name)?.to || ''}
                                    onChange={(evt) => handleTransferChange(e.player.name, transfers.find(t => t.from.name === e.player.name)?.gunType, evt.target.value || null)}
                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-600 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-gray-800"
                                >
                                    <option value="">انتخاب کنید</option>
                                    {livingPlayers.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            <button onClick={() => onSubmit(transfers)} className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 rounded mt-6">
                تایید و شروع روز
            </button>
        </div>
    );
};

const DayPhase: React.FC<{
    day: number;
    onPoll: () => void;
    pollUsed: number;
    players: Player[];
    onUseGun: (shooterName: string, targetName: string | null, gunIndex: number) => void;
    onStartTrial: (playerName: string) => void;
    onEndDay: () => void;
    votesNeeded: number;
}> = ({ day, onPoll, pollUsed, players, onUseGun, onStartTrial, onEndDay, votesNeeded }) => {
    
    const livingPlayers = players.filter(p => p.isAlive);
    const playersWithGuns = livingPlayers.filter(p => p.receivedGuns && p.receivedGuns.length > 0);

    const [gunUse, setGunUse] = useState<{ shooter: string, gunIndex: number, target: string | null } | null>(null);

    const handleGunUseClick = (shooter: string, gunIndex: number) => {
        setGunUse({ shooter, gunIndex, target: null });
    };

    const confirmGunUse = () => {
        if (gunUse) {
            onUseGun(gunUse.shooter, gunUse.target, gunUse.gunIndex);
            setGunUse(null);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4 text-center">روز {day}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <button
                    onClick={onPoll}
                    disabled={pollUsed >= 2}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                    استعلام ({2 - pollUsed} مانده)
                </button>
                <button
                    onClick={onEndDay}
                    className="col-span-1 md:col-span-2 bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-4 rounded transition-colors"
                >
                    پایان روز و رفتن به شب
                </button>
            </div>

            {playersWithGuns.length > 0 && (
                <div className="mb-6 p-4 bg-gray-900/50 rounded-lg">
                    <h3 className="font-bold text-lg mb-2 text-purple-300">استفاده از اسلحه روز</h3>
                    <div className="flex flex-wrap gap-2">
                        {playersWithGuns.map(p =>
                            p.receivedGuns?.map((gun, index) => (
                                <button
                                    key={`${p.id}-${index}`}
                                    onClick={() => handleGunUseClick(p.name, index)}
                                    className="bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold py-1 px-3 rounded"
                                >
                                    {p.name} (اسلحه {gun})
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
            
            <div className="mb-6">
                <h3 className="font-bold text-lg mb-2 text-yellow-300">رای‌گیری برای حذف</h3>
                <p className="text-sm text-gray-400 mb-4">برای اخراج یک بازیکن، او باید حداقل {votesNeeded} رای بیاورد. روی نام بازیکن کلیک کنید تا او را برای دفاعیه به جایگاه بفرستید.</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {livingPlayers.map(p => (
                        <button
                            key={p.id}
                            onClick={() => onStartTrial(p.name)}
                            className="bg-yellow-700/50 hover:bg-yellow-600/50 border border-yellow-700 text-yellow-200 font-semibold py-3 px-2 rounded transition-colors text-sm truncate"
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
            </div>

            {gunUse && (
                 <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-gray-800 rounded-lg p-8 shadow-2xl border border-gray-700 max-w-sm w-full">
                        <h3 className="text-2xl font-bold mb-4 text-purple-400">شلیک با اسلحه روز</h3>
                        <p className="text-gray-400 mb-6">
                            <strong className="text-white">{gunUse.shooter}</strong> در حال شلیک با اسلحه <strong className="text-white">{players.find(p => p.name === gunUse.shooter)?.receivedGuns?.[gunUse.gunIndex]}</strong> است.
                        </p>
                        
                        <label className="block mb-1 font-semibold">هدف:</label>
                        <select
                            value={gunUse.target === null ? '_AIR_SHOT_' : (gunUse.target || '')}
                            onChange={(e) => setGunUse({ ...gunUse, target: e.target.value === '_AIR_SHOT_' ? null : e.target.value })}
                            className="w-full bg-gray-700 p-2 rounded mb-6"
                        >
                            <option value="">انتخاب هدف</option>
                            <option value="_AIR_SHOT_">تیر هوایی</option>
                            {livingPlayers.filter(p => p.name !== gunUse.shooter).map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                        </select>
                        
                        <div className="flex gap-4">
                            <button
                                onClick={() => setGunUse(null)}
                                className="flex-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 rounded transition-colors"
                            >
                                انصراف
                            </button>
                            <button
                                onClick={confirmGunUse}
                                disabled={gunUse.target === undefined}
                                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded transition-colors disabled:bg-gray-500"
                            >
                                تایید شلیک
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;
