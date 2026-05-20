import { db } from "../config";
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from "firebase/firestore";

export interface Note {
  id?: string;
  title: string;
  content: string;
  isFavorite: boolean;
  templateType: 'bug' | 'api' | 'daily' | null;
  userId: string;
  tags: string[]; // Tableau d'IDs de tags
  createdAt?: any;
  updatedAt?: any;
}

export interface Tag {
  id?: string;
  name: string;
  color: string;
  userId: string;
}

// --- NOTES ---

export const createNote = async (note: Omit<Note, 'id' | 'createdAt' | 'updatedAt'>) => {
  const noteRef = doc(collection(db, "notes"));
  const newNote = {
    ...note,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(noteRef, newNote);
  return noteRef.id;
};

export const getUserNotes = async (userId: string) => {
  const q = query(collection(db, "notes"), where("userId", "==", userId), orderBy("updatedAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Note));
};

export const getNote = async (id: string) => {
  const docRef = doc(db, "notes", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Note;
  }
  return null;
};

export const updateNote = async (id: string, data: Partial<Omit<Note, 'id' | 'userId' | 'createdAt'>>) => {
  const noteRef = doc(db, "notes", id);
  await updateDoc(noteRef, {
    ...data,
    updatedAt: serverTimestamp()
  });
};

export const deleteNote = async (id: string) => {
  await deleteDoc(doc(db, "notes", id));
};

// --- TAGS ---

export const createTag = async (tag: Omit<Tag, 'id'>) => {
  const tagRef = doc(collection(db, "tags"));
  await setDoc(tagRef, tag);
  return { id: tagRef.id, ...tag };
};

export const getUserTags = async (userId: string) => {
  const q = query(collection(db, "tags"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tag));
};
