import { db } from "../config";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  addDoc,
  getDoc
} from "firebase/firestore";

export type AddictionStatus = 'success' | 'failure';

export interface AddictionEntry {
  id?: string;
  userId: string;
  addictionType: string;
  date: string; // YYYY-MM-DD format
  status: AddictionStatus;
  comment?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface AddictionProfile {
  id?: string;
  userId: string;
  addictionType: string;
  goal: string;
  startDate: string; // YYYY-MM-DD format
  bestStreak: number;
  currentStreak: number;
  badges: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface AddictionStats {
  totalDays: number;
  successfulDays: number;
  failedDays: number;
  successRate: number;
  currentStreak: number;
  bestStreak: number;
  longestStreak: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  unlocked: boolean;
}

// --- ADDICTION PROFILES ---

export const createAddictionProfile = async (profile: Omit<AddictionProfile, 'id' | 'createdAt' | 'updatedAt' | 'bestStreak' | 'currentStreak' | 'badges'>) => {
  const profileRef = doc(collection(db, "addictionProfiles"));
  const newProfile = {
    ...profile,
    bestStreak: 0,
    currentStreak: 0,
    badges: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(profileRef, newProfile);
  return profileRef.id;
};

export const getUserAddictionProfiles = async (userId: string): Promise<AddictionProfile[]> => {
  const q = query(collection(db, "addictionProfiles"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AddictionProfile));
};

export const getAddictionProfile = async (userId: string, addictionType: string): Promise<AddictionProfile | null> => {
  const q = query(
    collection(db, "addictionProfiles"), 
    where("userId", "==", userId),
    where("addictionType", "==", addictionType)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as AddictionProfile;
};

export const updateAddictionProfile = async (id: string, updates: Partial<AddictionProfile>) => {
  const profileRef = doc(db, "addictionProfiles", id);
  await updateDoc(profileRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteAddictionProfile = async (id: string) => {
  await deleteDoc(doc(db, "addictionProfiles", id));
};

// --- ADDICTION ENTRIES ---

export const createAddictionEntry = async (entry: Omit<AddictionEntry, 'id' | 'createdAt' | 'updatedAt'>) => {
  const entryRef = doc(collection(db, "addictionEntries"));
  const newEntry = {
    ...entry,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(entryRef, newEntry);
  return entryRef.id;
};

export const getUserAddictionEntries = async (userId: string, addictionType?: string): Promise<AddictionEntry[]> => {
  let q;
  if (addictionType) {
    q = query(
      collection(db, "addictionEntries"), 
      where("userId", "==", userId),
      where("addictionType", "==", addictionType),
      orderBy("date", "desc")
    );
  } else {
    q = query(
      collection(db, "addictionEntries"), 
      where("userId", "==", userId),
      orderBy("date", "desc")
    );
  }
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AddictionEntry));
};

export const getAddictionEntryByDate = async (userId: string, addictionType: string, date: string): Promise<AddictionEntry | null> => {
  const q = query(
    collection(db, "addictionEntries"),
    where("userId", "==", userId),
    where("addictionType", "==", addictionType),
    where("date", "==", date)
  );
  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as AddictionEntry;
};

export const updateAddictionEntry = async (id: string, updates: Partial<AddictionEntry>) => {
  const entryRef = doc(db, "addictionEntries", id);
  await updateDoc(entryRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteAddictionEntry = async (id: string) => {
  await deleteDoc(doc(db, "addictionEntries", id));
};

// --- STREAK CALCULATIONS ---

export const calculateStreak = (entries: AddictionEntry[]): { currentStreak: number; bestStreak: number } => {
  if (entries.length === 0) return { currentStreak: 0, bestStreak: 0 };

  // Sort entries by date ascending
  const sortedEntries = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  
  const today = new Date().toISOString().split('T')[0];
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;
  let lastDate: string | null = null;

  // Check if there's an entry for today
  const todayEntry = sortedEntries.find(e => e.date === today);
  const hasTodayEntry = todayEntry !== undefined;

  // Calculate current streak
  for (let i = sortedEntries.length - 1; i >= 0; i--) {
    const entry = sortedEntries[i];
    
    if (entry.status === 'success') {
      if (!lastDate) {
        // First entry from the end
        if (hasTodayEntry || entry.date === today) {
          currentStreak = 1;
          lastDate = entry.date;
        } else {
          // Check if entry is from yesterday
          const entryDate = new Date(entry.date);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];
          
          if (entry.date === yesterdayStr) {
            currentStreak = 1;
            lastDate = entry.date;
          } else {
            break;
          }
        }
      } else {
        // Check if entry is consecutive
        const entryDate = new Date(entry.date);
        const lastDateObj = new Date(lastDate);
        const diffDays = Math.floor((lastDateObj.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          currentStreak++;
          lastDate = entry.date;
        } else {
          break;
        }
      }
    } else {
      // Reset streak on failure
      break;
    }
  }

  // Calculate best streak (all-time)
  for (const entry of sortedEntries) {
    if (entry.status === 'success') {
      if (!lastDate) {
        tempStreak = 1;
        lastDate = entry.date;
      } else {
        const entryDate = new Date(entry.date);
        const lastDateObj = new Date(lastDate);
        const diffDays = Math.floor((entryDate.getTime() - lastDateObj.getTime()) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
          lastDate = entry.date;
        } else {
          bestStreak = Math.max(bestStreak, tempStreak);
          tempStreak = 1;
          lastDate = entry.date;
        }
      }
    } else {
      bestStreak = Math.max(bestStreak, tempStreak);
      tempStreak = 0;
      lastDate = null;
    }
  }
  bestStreak = Math.max(bestStreak, tempStreak);

  return { currentStreak, bestStreak };
};

// --- STATISTICS ---

export const calculateAddictionStats = (entries: AddictionEntry[]): AddictionStats => {
  const totalDays = entries.length;
  const successfulDays = entries.filter(e => e.status === 'success').length;
  const failedDays = entries.filter(e => e.status === 'failure').length;
  const successRate = totalDays > 0 ? Math.round((successfulDays / totalDays) * 100) : 0;
  const { currentStreak, bestStreak } = calculateStreak(entries);
  const longestStreak = bestStreak;

  return {
    totalDays,
    successfulDays,
    failedDays,
    successRate,
    currentStreak,
    bestStreak,
    longestStreak
  };
};

// --- BADGES ---

export const BADGES: Omit<Badge, 'unlocked'>[] = [
  {
    id: '3-days',
    name: 'Début Prometteur',
    description: '3 jours sans addiction',
    icon: '🥉',
    requirement: 3
  },
  {
    id: '7-days',
    name: 'Semaine Parfaite',
    description: '7 jours sans addiction',
    icon: '🥈',
    requirement: 7
  },
  {
    id: '14-days',
    name: 'Deux Semaines',
    description: '14 jours sans addiction',
    icon: '🏅',
    requirement: 14
  },
  {
    id: '30-days',
    name: 'Mois Complet',
    description: '30 jours sans addiction',
    icon: '🥇',
    requirement: 30
  },
  {
    id: '60-days',
    name: 'Deux Mois',
    description: '60 jours sans addiction',
    icon: '🌟',
    requirement: 60
  },
  {
    id: '90-days',
    name: 'Trimestre',
    description: '90 jours sans addiction',
    icon: '🎖️',
    requirement: 90
  },
  {
    id: '100-days',
    name: 'Cent Jours',
    description: '100 jours de discipline',
    icon: '💎',
    requirement: 100
  },
  {
    id: '180-days',
    name: 'Six Mois',
    description: '180 jours sans addiction',
    icon: '👑',
    requirement: 180
  },
  {
    id: '365-days',
    name: 'Une Année',
    description: '365 jours sans addiction',
    icon: '🏆',
    requirement: 365
  }
];

export const checkBadges = (currentStreak: number, existingBadges: string[]): Badge[] => {
  return BADGES.map(badge => ({
    ...badge,
    unlocked: existingBadges.includes(badge.id) || currentStreak >= badge.requirement
  }));
};

export const getNewBadges = (currentStreak: number, existingBadges: string[]): string[] => {
  return BADGES
    .filter(badge => currentStreak >= badge.requirement && !existingBadges.includes(badge.id))
    .map(badge => badge.id);
};

// --- MOTIVATIONAL MESSAGES ---

export const getMotivationalMessage = (streak: number, lastStatus: AddictionStatus | null): string => {
  const messages = {
    highStreak: [
      "Tu es sur une très bonne lancée, continue comme ça 💪",
      "Incroyable ! Tu progresses chaque jour 🔥",
      "Tu es un champion ! Ne lâche rien 🏆",
      "Ta détermination est impressionnante ! 🌟"
    ],
    mediumStreak: [
      "Bien joué ! Tu tiens bon 👍",
      "Chaque jour compte, continue ! 💪",
      "Tu es sur la bonne voie ! 🎯"
    ],
    lowStreak: [
      "Chaque petit pas compte ! 🚶",
      "Le plus important, c'est de commencer 🌱",
      "Tu peux le faire ! 💪"
    ],
    afterFailure: [
      "Une rechute ne définit pas ton parcours, recommence aujourd'hui.",
      "Ne te décourage pas, chaque jour est une nouvelle chance.",
      "L'échec fait partie du succès, relève-toi ! 💪",
      "Un mauvais jour ne ruine pas ton progrès. Continue !"
    ],
    firstSuccess: [
      "Premier jour réussi ! Excellent début 🎉",
      "Bien joué pour cette première victoire ! 🌟"
    ]
  };

  if (lastStatus === 'failure') {
    return messages.afterFailure[Math.floor(Math.random() * messages.afterFailure.length)];
  }

  if (streak === 1) {
    return messages.firstSuccess[Math.floor(Math.random() * messages.firstSuccess.length)];
  }

  if (streak >= 30) {
    return messages.highStreak[Math.floor(Math.random() * messages.highStreak.length)];
  }

  if (streak >= 7) {
    return messages.mediumStreak[Math.floor(Math.random() * messages.mediumStreak.length)];
  }

  return messages.lowStreak[Math.floor(Math.random() * messages.lowStreak.length)];
};
