import { UserProfile, TOTAL_LEVELS } from '../types';

const STORAGE_KEY = 'clash_of_words_save_v1';

export const getUsers = (): UserProfile[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
};

export const saveUser = (user: UserProfile) => {
  const users = getUsers();
  const index = users.findIndex(u => u.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

export const createNewUser = (name: string, avatarId: number): UserProfile => {
  const initialLevels: Record<number, any> = {};
  for (let i = 1; i <= TOTAL_LEVELS; i++) {
    initialLevels[i] = {
      id: i,
      worldId: Math.ceil(i / 10),
      isUnlocked: i === 1,
      stars: 0
    };
  }

  const newUser: UserProfile = {
    id: Date.now().toString(),
    name,
    avatarId,
    currentLevel: 1,
    totalStars: 0,
    levels: initialLevels,
    unlockedWorlds: [1]
  };
  
  saveUser(newUser);
  return newUser;
};