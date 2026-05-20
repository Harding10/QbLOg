import { db } from "../config";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where, 
  orderBy,
  serverTimestamp
} from "firebase/firestore";

export interface Snippet {
  id?: string;
  title: string;
  language: string;
  code: string;
  userId: string;
  createdAt?: any;
}

export const createSnippet = async (snippet: Omit<Snippet, 'id' | 'createdAt'>) => {
  const ref = doc(collection(db, "snippets"));
  const newSnippet = {
    ...snippet,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, newSnippet);
  return ref.id;
};

export const getUserSnippets = async (userId: string) => {
  const q = query(collection(db, "snippets"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Snippet));
};

export const deleteSnippet = async (id: string) => {
  await deleteDoc(doc(db, "snippets", id));
};
