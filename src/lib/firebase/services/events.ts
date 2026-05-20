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
  serverTimestamp,
  Timestamp
} from "firebase/firestore";

export interface CalendarEvent {
  id?: string;
  title: string;
  description?: string;
  date: Timestamp; // Date de l'événement
  userId: string;
  createdAt?: any;
}

export const createEvent = async (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
  const ref = doc(collection(db, "events"));
  const newEvent = {
    ...event,
    createdAt: serverTimestamp(),
  };
  await setDoc(ref, newEvent);
  return ref.id;
};

export const getUserEvents = async (userId: string) => {
  const q = query(collection(db, "events"), where("userId", "==", userId), orderBy("date", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CalendarEvent));
};

export const deleteEvent = async (id: string) => {
  await deleteDoc(doc(db, "events", id));
};
