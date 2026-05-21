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
  addDoc
} from "firebase/firestore";

export type BugSeverity = 'low' | 'medium' | 'high' | 'critical';
export type BugStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface Assignee {
  name: string;
  avatarUrl?: string;
  email?: string;
}

export interface Bug {
  id?: string;
  title: string;
  description: string;
  severity: BugSeverity;
  status: BugStatus;
  userId: string;
  assignee?: Assignee | null;
  screenshotUrl?: string | null;
  createdAt?: any;
  updatedAt?: any;
}

export interface BugComment {
  id?: string;
  text: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  createdAt?: any;
}

export interface BugActivity {
  id?: string;
  type: 'create' | 'status_change' | 'priority_change' | 'assignee_change' | 'comment_add' | 'screenshot_add' | 'edit';
  userId: string;
  userName: string;
  description: string;
  createdAt?: any;
}

// --- BUGS ---

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

export const updateBug = async (id: string, updates: Partial<Bug>) => {
  const bugRef = doc(db, "bugs", id);
  await updateDoc(bugRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
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

// --- COMMENTS ---

export const getComments = async (bugId: string): Promise<BugComment[]> => {
  const commentsRef = collection(db, "bugs", bugId, "comments");
  const q = query(commentsRef, orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BugComment));
};

export const addComment = async (bugId: string, comment: Omit<BugComment, 'id' | 'createdAt'>) => {
  const commentsRef = collection(db, "bugs", bugId, "comments");
  const newComment = {
    ...comment,
    createdAt: serverTimestamp()
  };
  const docRef = await addDoc(commentsRef, newComment);
  return docRef.id;
};

export const deleteComment = async (bugId: string, commentId: string) => {
  const commentRef = doc(db, "bugs", bugId, "comments", commentId);
  await deleteDoc(commentRef);
};

// --- ACTIVITIES ---

export const getActivities = async (bugId: string): Promise<BugActivity[]> => {
  const activitiesRef = collection(db, "bugs", bugId, "activities");
  const q = query(activitiesRef, orderBy("createdAt", "desc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BugActivity));
};

export const addActivity = async (bugId: string, activity: Omit<BugActivity, 'id' | 'createdAt'>) => {
  const activitiesRef = collection(db, "bugs", bugId, "activities");
  const newActivity = {
    ...activity,
    createdAt: serverTimestamp()
  };
  await addDoc(activitiesRef, newActivity);
};
