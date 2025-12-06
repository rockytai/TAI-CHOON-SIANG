export interface WordData {
  word: string;
  translation: string; // Chinese meaning
  distractors: string[]; // Wrong meanings
  exampleSentence?: string;
}

export interface LevelData {
  id: number;
  worldId: number;
  isUnlocked: boolean;
  stars: number; // 0-3
}

export interface UserProfile {
  id: string;
  name: string;
  avatarId: number;
  currentLevel: number;
  totalStars: number;
  levels: Record<number, LevelData>; // Map level ID to data
  unlockedWorlds: number[];
}

export interface GameState {
  screen: 'LOGIN' | 'MAP' | 'GAME' | 'VICTORY' | 'DEFEAT';
  activeUser: UserProfile | null;
  currentLevelId: number | null;
}

export const WORLDS = [
  { id: 1, name: "Goblin Forest", theme: "Nature & Animals", bg: "bg-green-800" },
  { id: 2, name: "Barbarian Hills", theme: "Action Verbs", bg: "bg-yellow-700" },
  { id: 3, name: "Bone Ridge", theme: "Home & Family", bg: "bg-stone-700" },
  { id: 4, name: "Wizard Valley", theme: "School & Numbers", bg: "bg-purple-800" },
  { id: 5, name: "Royal Arena", theme: "Adjectives & Feelings", bg: "bg-blue-800" },
  { id: 6, name: "Legendary Peak", theme: "Abstract Concepts", bg: "bg-red-900" },
];

export const TOTAL_LEVELS = 60;
export const LEVELS_PER_WORLD = 10;