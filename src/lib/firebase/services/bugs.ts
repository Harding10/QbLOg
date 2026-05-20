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
  serverTimestamp
} from "firebase/firestore";

export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BugStatus = 'open' | 'in_progress' | 'resolved';

export interface Bug {
  id?: string;
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  userId: string;
  createdAt?: any;
  updatedAt?: any;
}

export const createBug = async (bug: Omit<Bug, 'id' | 'createdAt' | 'updatedAt'>) => {
  const bugRef = doc(collection(db, "bugs"));
  const newBug = {
    ...bug,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  await setDoc(bugRef, newBug);
  return bugRef.id;
};

export const getUserBugs = async (userId: string) => {
  const q = query(collection(db, "bugs"), where("userId", "==", userId), orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Bug));
};

export const updateBugStatus = async (id: string, status: BugStatus) => {
  const bugRef = doc(db, "bugs", id);
  await updateDoc(bugRef, {
    status,
    updatedAt: serverTimestamp()
  });
};

export const deleteBug = async (id: string) => {
  await deleteDoc(doc(db, "bugs", id));
};
