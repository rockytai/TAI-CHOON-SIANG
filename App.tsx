import React, { useState, useEffect, useCallback, useRef } from 'react';
import { CoCButton } from './components/CoCButton';
import { getAudioContext, playPcmData, playSfx } from './services/audio';
import { generateLevelContent, speakWord } from './services/gemini';
import { createNewUser, getUsers, saveUser } from './services/storage';
import { GameState, LevelData, UserProfile, WORLDS, WordData, LEVELS_PER_WORLD, TOTAL_LEVELS } from './types';

// --- Icons ---
const StarIcon = ({ filled }: { filled: boolean }) => (
  <svg className={`w-6 h-6 ${filled ? 'text-yellow-400 drop-shadow-md' : 'text-gray-600'}`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
  </svg>
);

const SpeakerIcon = () => (
  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// --- Sub-Components ---

const Avatar = ({ id, size = 'md' }: { id: number; size?: 'sm' | 'md' | 'lg' }) => {
  const sizeClass = size === 'sm' ? 'w-10 h-10' : size === 'md' ? 'w-20 h-20' : 'w-32 h-32';
  return (
    <div className={`${sizeClass} rounded-full bg-blue-200 border-4 border-white overflow-hidden shadow-lg relative`}>
      <img src={`https://picsum.photos/seed/${id + 500}/200`} alt="Avatar" className="w-full h-full object-cover" />
    </div>
  );
};

// --- Screens ---

const LoginScreen: React.FC<{ onLogin: (user: UserProfile) => void }> = ({ onLogin }) => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    setUsers(getUsers());
  }, []);

  const handleCreate = () => {
    if (!newName.trim()) return;
    const user = createNewUser(newName, Math.floor(Math.random() * 100));
    onLogin(user);
  };

  return (
    <div className="min-h-screen bg-[url('https://picsum.photos/id/10/1920/1080')] bg-cover bg-center flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/90 backdrop-blur-sm rounded-3xl p-8 border-4 border-stone-700 shadow-2xl">
        <h1 className="text-4xl font-titan text-center text-amber-500 mb-8 drop-shadow-md stroke-black" style={{ WebkitTextStroke: '1px black' }}>
          Clash of Words
        </h1>
        
        {!isCreating ? (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center text-stone-700 mb-4">Select Commander</h2>
            <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto pr-2">
              {users.map(u => (
                <button
                  key={u.id}
                  onClick={() => onLogin(u)}
                  className="flex items-center gap-4 p-3 bg-stone-100 rounded-xl hover:bg-amber-100 transition-colors border-2 border-stone-300"
                >
                  <Avatar id={u.avatarId} size="sm" />
                  <div className="text-left flex-1">
                    <p className="font-bold text-stone-800">{u.name}</p>
                    <p className="text-xs text-stone-500">Level {u.currentLevel} - {u.totalStars} Stars</p>
                  </div>
                  <CoCButton size="sm" variant="green">Play</CoCButton>
                </button>
              ))}
              {users.length === 0 && <p className="text-center text-stone-500 italic">No commanders found.</p>}
            </div>
            <CoCButton onClick={() => setIsCreating(true)} className="w-full mt-4" variant="blue">
              New Recruit
            </CoCButton>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-center text-stone-700">Recruitment</h2>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter your name"
              className="w-full p-4 text-lg border-2 border-stone-300 rounded-xl focus:border-amber-500 outline-none bg-stone-50"
            />
            <div className="flex gap-2">
              <CoCButton onClick={() => setIsCreating(false)} variant="gray" className="flex-1">Back</CoCButton>
              <CoCButton onClick={handleCreate} disabled={!newName.trim()} className="flex-1">Start</CoCButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MapScreen: React.FC<{ user: UserProfile, onSelectLevel: (id: number) => void, onLogout: () => void }> = ({ user, onSelectLevel, onLogout }) => {
  return (
    <div className="min-h-screen bg-stone-900 flex flex-col">
      {/* Header */}
      <div className="bg-stone-800 p-4 shadow-lg border-b-4 border-stone-950 flex justify-between items-center sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <Avatar id={user.avatarId} size="sm" />
          <div>
            <h2 className="text-white font-bold">{user.name}</h2>
            <div className="flex items-center gap-1 text-yellow-400 text-sm">
              <StarIcon filled={true} />
              <span>{user.totalStars}</span>
            </div>
          </div>
        </div>
        <CoCButton onClick={onLogout} size="sm" variant="gray">Log Out</CoCButton>
      </div>

      {/* Worlds */}
      <div className="flex-1 overflow-y-auto p-4 space-y-12 pb-20">
        {WORLDS.map((world) => {
          const isWorldUnlocked = user.unlockedWorlds.includes(world.id);
          
          return (
            <div key={world.id} className={`relative rounded-3xl p-6 ${world.bg} border-4 border-black/20 shadow-xl ${!isWorldUnlocked ? 'opacity-60 grayscale' : ''}`}>
               <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-stone-100 px-6 py-2 rounded-xl border-4 border-stone-600 shadow-lg z-10 whitespace-nowrap">
                 <h3 className="font-titan text-xl text-stone-800">{world.name}</h3>
               </div>
               
               <p className="text-white/80 text-center mb-6 mt-4 font-bold text-sm uppercase tracking-widest">{world.theme}</p>

               <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                 {Array.from({ length: LEVELS_PER_WORLD }).map((_, idx) => {
                   const levelId = (world.id - 1) * LEVELS_PER_WORLD + (idx + 1);
                   const levelData = user.levels[levelId];
                   const isLocked = !levelData.isUnlocked;

                   return (
                     <button
                       key={levelId}
                       disabled={isLocked || !isWorldUnlocked}
                       onClick={() => onSelectLevel(levelId)}
                       className={`
                         relative group flex flex-col items-center justify-center h-24 rounded-xl border-b-4 transition-all
                         ${isLocked 
                            ? 'bg-stone-600 border-stone-800 cursor-not-allowed' 
                            : 'bg-yellow-100 hover:bg-white border-yellow-600 active:border-b-0 active:translate-y-1'
                          }
                       `}
                     >
                       <span className={`font-titan text-2xl ${isLocked ? 'text-stone-400' : 'text-stone-800'}`}>
                         {levelId}
                       </span>
                       {!isLocked && (
                         <div className="flex gap-0.5 mt-1">
                           {[1, 2, 3].map(s => (
                             <div key={s} className="w-3 h-3">
                               <StarIcon filled={s <= levelData.stars} />
                             </div>
                           ))}
                         </div>
                       )}
                       {isLocked && (
                         <div className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-xl">
                            <span className="text-2xl">🔒</span>
                         </div>
                       )}
                     </button>
                   );
                 })}
               </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// --- Game Logic ---

const GameScreen: React.FC<{ 
  user: UserProfile, 
  levelId: number, 
  onExit: () => void,
  onComplete: (stars: number) => void 
}> = ({ user, levelId, onExit, onComplete }) => {
  const [loading, setLoading] = useState(true);
  const [words, setWords] = useState<WordData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [playerHP, setPlayerHP] = useState(100);
  const [enemyHP, setEnemyHP] = useState(100);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answerState, setAnswerState] = useState<'IDLE' | 'CORRECT' | 'WRONG'>('IDLE');
  const [gameResult, setGameResult] = useState<'WIN' | 'LOSE' | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Initialize Level
  useEffect(() => {
    const init = async () => {
      const worldId = Math.ceil(levelId / 10);
      const theme = WORLDS.find(w => w.id === worldId)?.theme || "General";
      const fetchedWords = await generateLevelContent(levelId, theme);
      setWords(fetchedWords);
      setLoading(false);
      prepareRound(0, fetchedWords);
    };
    init();
  }, [levelId]);

  const prepareRound = (index: number, wordList: WordData[]) => {
    const currentWord = wordList[index];
    if (!currentWord) return;

    // Mix correct answer with distractors
    const allOptions = [currentWord.translation, ...currentWord.distractors];
    // Shuffle
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }
    setOptions(allOptions);
    setSelectedOption(null);
    setAnswerState('IDLE');

    // Auto play audio after short delay
    setTimeout(() => {
        handlePlayAudio(currentWord.word);
    }, 500);
  };

  const handlePlayAudio = async (text: string) => {
    if (isPlayingAudio) return;
    setIsPlayingAudio(true);
    const audioData = await speakWord(text);
    if (audioData) {
      await playPcmData(audioData);
    }
    setIsPlayingAudio(false);
  };

  const handleAnswer = (option: string) => {
    if (answerState !== 'IDLE') return;
    setSelectedOption(option);
    
    const isCorrect = option === words[currentIndex].translation;
    
    if (isCorrect) {
      setAnswerState('CORRECT');
      playSfx('correct');
      // Damage Enemy
      setEnemyHP(prev => Math.max(0, prev - (100 / words.length)));
    } else {
      setAnswerState('WRONG');
      playSfx('wrong');
      // Damage Player
      setPlayerHP(prev => Math.max(0, prev - 20)); // 5 mistakes = lose
    }

    // Next round delay
    setTimeout(() => {
      if (isCorrect) {
        if (currentIndex + 1 < words.length) {
          setCurrentIndex(prev => prev + 1);
          prepareRound(currentIndex + 1, words);
        } else {
          // Level cleared
          setGameResult('WIN');
          playSfx('win');
        }
      } else {
         // Check if dead
         if (playerHP - 20 <= 0) {
            setGameResult('LOSE');
         } else {
             // Let them try again or move on? 
             // Logic: If wrong, move to next word but no damage to enemy? 
             // For strict game: Stay on same word until correct, but HP lost.
             // We will reset state to IDLE to allow retry, but HP is gone.
             setSelectedOption(null);
             setAnswerState('IDLE');
         }
      }
    }, 1500);
  };

  // End Game Calculation
  useEffect(() => {
    if (gameResult === 'WIN') {
      // Calculate Stars based on HP remaining
      let stars = 1;
      if (playerHP >= 80) stars = 3;
      else if (playerHP >= 50) stars = 2;
      onComplete(stars);
    }
  }, [gameResult]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-900 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-500 mb-4"></div>
        <p className="text-white font-titan text-xl">Summoning Goblins...</p>
      </div>
    );
  }

  if (gameResult) {
    return (
      <div className="min-h-screen bg-black/80 flex items-center justify-center p-4">
        <div className="bg-[#fff8e1] rounded-3xl p-8 max-w-sm w-full border-4 border-stone-600 shadow-2xl text-center">
          <h2 className={`font-titan text-4xl mb-4 ${gameResult === 'WIN' ? 'text-green-600' : 'text-red-600'}`}>
            {gameResult === 'WIN' ? 'VICTORY!' : 'DEFEAT!'}
          </h2>
          {gameResult === 'WIN' && (
            <div className="flex justify-center gap-2 mb-6">
              {[1, 2, 3].map(s => {
                 const earned = (playerHP >= 80 && s<=3) || (playerHP >= 50 && s<=2) || s===1;
                 return <div key={s} className="w-12 h-12"><StarIcon filled={earned} /></div>
              })}
            </div>
          )}
          <div className="flex flex-col gap-3">
            <CoCButton onClick={onExit} variant="orange">Return Home</CoCButton>
          </div>
        </div>
      </div>
    );
  }

  const currentWord = words[currentIndex];

  return (
    <div className="min-h-screen bg-sky-300 flex flex-col relative overflow-hidden">
      
      {/* Top Bar: HP */}
      <div className="p-4 flex justify-between items-start z-10">
        <div className="w-1/3">
           <div className="flex items-center gap-2 mb-1">
             <div className="w-8 h-8 bg-blue-500 border-2 border-white rounded-md"></div>
             <span className="font-bold text-white drop-shadow-md">YOU</span>
           </div>
           <div className="h-4 bg-gray-700 rounded-full border-2 border-black overflow-hidden">
             <div 
               className="h-full bg-green-500 transition-all duration-500" 
               style={{ width: `${playerHP}%` }}
             ></div>
           </div>
        </div>
        
        <button onClick={onExit} className="bg-red-500 p-2 rounded-lg border-b-4 border-red-800 text-white">
          <CloseIcon />
        </button>

        <div className="w-1/3 text-right">
           <div className="flex items-center gap-2 mb-1 justify-end">
             <span className="font-bold text-white drop-shadow-md">BOSS</span>
             <div className="w-8 h-8 bg-red-600 border-2 border-white rounded-full"></div>
           </div>
           <div className="h-4 bg-gray-700 rounded-full border-2 border-black overflow-hidden">
             <div 
               className="h-full bg-purple-500 transition-all duration-500" 
               style={{ width: `${enemyHP}%` }}
             ></div>
           </div>
        </div>
      </div>

      {/* Battle Scene (Visuals) */}
      <div className="flex-1 flex items-end justify-between px-8 pb-12 relative">
         {/* Ground */}
         <div className="absolute bottom-0 left-0 right-0 h-1/4 bg-green-600 border-t-8 border-green-800"></div>
         
         {/* Player Sprite (Placeholder) */}
         <div className={`relative z-10 transition-transform duration-300 ${answerState === 'WRONG' ? 'animate-shake' : ''}`}>
             <div className="w-32 h-32 bg-[url('https://picsum.photos/seed/barbarian/200')] bg-cover border-4 border-white rounded-xl shadow-xl transform hover:scale-105 transition-transform"></div>
             {answerState === 'WRONG' && <div className="absolute -top-10 left-0 text-red-600 font-titan text-3xl animate-bounce">-20</div>}
         </div>

         {/* Enemy Sprite (Placeholder) */}
         <div className={`relative z-10 transition-transform duration-300 ${answerState === 'CORRECT' ? 'animate-shake opacity-70' : ''}`}>
             <div className="w-40 h-40 bg-[url('https://picsum.photos/seed/goblin/200')] bg-cover border-4 border-red-900 rounded-full shadow-xl"></div>
              {answerState === 'CORRECT' && <div className="absolute -top-10 right-0 text-yellow-400 font-titan text-3xl animate-bounce">HIT!</div>}
         </div>
      </div>

      {/* Control Panel */}
      <div className="bg-stone-100 border-t-8 border-stone-400 p-6 rounded-t-3xl shadow-[0_-4px_20px_rgba(0,0,0,0.3)] z-20">
        
        {/* Word Display */}
        <div className="flex items-center justify-center gap-4 mb-8">
           <button 
             onClick={() => handlePlayAudio(currentWord.word)}
             className="bg-blue-500 p-3 rounded-full border-b-4 border-blue-700 hover:bg-blue-400 active:border-b-0 active:translate-y-1 transition-all"
           >
             <SpeakerIcon />
           </button>
           <h1 className="text-4xl md:text-5xl font-titan text-stone-800 tracking-wide">{currentWord.word}</h1>
        </div>

        {/* Options */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {options.map((option, idx) => {
             let variant: 'green' | 'orange' | 'blue' | 'gray' = 'gray';
             
             if (answerState !== 'IDLE') {
               if (option === currentWord.translation) variant = 'green';
               else if (option === selectedOption) variant = 'orange'; // Wrong selected
             }

             return (
               <CoCButton 
                 key={idx}
                 variant={variant}
                 onClick={() => handleAnswer(option)}
                 disabled={answerState !== 'IDLE'}
                 className="text-xl"
               >
                 {option}
               </CoCButton>
             );
          })}
        </div>
        
        <div className="mt-4 text-center text-stone-500 text-sm">
          Level {levelId} - Wave {currentIndex + 1}/{words.length}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};

// --- Main App Component ---

const App: React.FC = () => {
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number | null>(null);
  const [view, setView] = useState<'LOGIN' | 'MAP' | 'GAME'>('LOGIN');

  // Handle auto-login from session if needed, for now stick to manual
  
  const handleLogin = (user: UserProfile) => {
    setActiveUser(user);
    setView('MAP');
  };

  const handleLevelSelect = (levelId: number) => {
    setCurrentLevel(levelId);
    setView('GAME');
  };

  const handleGameExit = () => {
    setCurrentLevel(null);
    setView('MAP');
  };

  const handleGameComplete = (stars: number) => {
    if (!activeUser || !currentLevel) return;

    const updatedUser = { ...activeUser };
    const currentLevelData = updatedUser.levels[currentLevel];
    
    // Update stars if higher
    if (stars > currentLevelData.stars) {
        // Calculate diff to add to total
        const diff = stars - currentLevelData.stars;
        updatedUser.totalStars += diff;
        currentLevelData.stars = stars;
    }

    // Unlock next level
    const nextLevelId = currentLevel + 1;
    if (nextLevelId <= TOTAL_LEVELS) {
        updatedUser.levels[nextLevelId].isUnlocked = true;
        
        // Unlock next world if applicable
        const nextLevelWorld = Math.ceil(nextLevelId / LEVELS_PER_WORLD);
        if (!updatedUser.unlockedWorlds.includes(nextLevelWorld)) {
            updatedUser.unlockedWorlds.push(nextLevelWorld);
        }
    }
    
    // If completed max level of current world, and user is on that level, increment progress
    if (currentLevel === activeUser.currentLevel) {
       updatedUser.currentLevel = Math.min(activeUser.currentLevel + 1, TOTAL_LEVELS);
    }

    saveUser(updatedUser);
    setActiveUser(updatedUser); // Update state
    
    // Small delay to show victory screen before navigating (handled by game component actually, so we just update data here)
  };

  return (
    <>
      {view === 'LOGIN' && <LoginScreen onLogin={handleLogin} />}
      {view === 'MAP' && activeUser && (
        <MapScreen 
          user={activeUser} 
          onSelectLevel={handleLevelSelect} 
          onLogout={() => { setActiveUser(null); setView('LOGIN'); }}
        />
      )}
      {view === 'GAME' && activeUser && currentLevel && (
        <GameScreen 
          user={activeUser} 
          levelId={currentLevel} 
          onExit={handleGameExit}
          onComplete={handleGameComplete}
        />
      )}
    </>
  );
};

export default App;