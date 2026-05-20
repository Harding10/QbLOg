import { db, storage } from "../config";
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  updateDoc,
  query, 
  where, 
  serverTimestamp
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";

export interface Folder {
  id?: string;
  name: string;
  parentId: string | null;
  userId: string;
  createdAt?: any;
}

export interface FileData {
  id?: string;
  name: string;
  url: string;
  size: number;
  type: string;
  folderId: string | null;
  userId: string;
  createdAt?: any;
}

// --- FOLDERS ---
export const createFolder = async (folder: Omit<Folder, 'id' | 'createdAt'>) => {
  const ref = doc(collection(db, "folders"));
  await setDoc(ref, { ...folder, createdAt: serverTimestamp() });
  return ref.id;
};

export const getUserFolders = async (userId: string, parentId: string | null = null) => {
  const q = query(
    collection(db, "folders"), 
    where("userId", "==", userId),
    where("parentId", "==", parentId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder));
};

export const deleteFolder = async (id: string) => {
  await deleteDoc(doc(db, "folders", id));
  // Note: En production, il faudrait aussi supprimer récursivement les sous-dossiers et fichiers
};

export const getAllUserFolders = async (userId: string) => {
  const q = query(
    collection(db, "folders"), 
    where("userId", "==", userId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Folder));
};

// --- FILES ---
export const uploadFile = async (
  file: File, 
  userId: string, 
  folderId: string | null,
  onProgress?: (progress: number) => void
): Promise<FileData> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
  
  // Utiliser le preset approprié en fonction du type de fichier
  const isImage = file.type.startsWith('image/');
  const uploadPreset = isImage ? 'qblog_images_preset' : 'qblog_pdf_preset';

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', uploadPreset);

  if (onProgress) onProgress(20);

  try {
    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/upload`, {
      method: 'POST',
      body: formData,
    });
    
    if (onProgress) onProgress(80);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || "Erreur d'upload vers Cloudinary");
    }

    if (onProgress) onProgress(100);
    const downloadURL = data.secure_url;
    
    // Sauvegarder les métadonnées dans Firestore
    const fileRef = doc(collection(db, "files"));
    const fileData: Omit<FileData, 'id'> = {
      name: file.name,
      url: downloadURL,
      size: file.size,
      type: file.type,
      folderId,
      userId,
      createdAt: serverTimestamp(),
    };
    await setDoc(fileRef, fileData);
    
    return { id: fileRef.id, ...fileData };
  } catch (error) {
    console.error("Erreur Cloudinary:", error);
    throw error;
  }
};

export const getUserFiles = async (userId: string, folderId: string | null = null) => {
  const q = query(
    collection(db, "files"), 
    where("userId", "==", userId),
    where("folderId", "==", folderId)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FileData));
};

export const deleteFileDoc = async (id: string, url: string) => {
  // 1. Supprimer de Firestore
  await deleteDoc(doc(db, "files", id));
  
  // 2. Supprimer de Storage uniquement si ce n'est PAS un fichier Cloudinary
  if (!url.includes('cloudinary.com') && !url.includes('i.ibb.co') && !url.includes('imgbb.com')) {
    try {
      const storageRef = ref(storage, url);
      await deleteObject(storageRef);
    } catch (e) {
      console.error("Erreur lors de la suppression du fichier dans Storage", e);
    }
  }
};

// --- MOVE ---
export const moveFileToFolder = async (fileId: string, newFolderId: string | null) => {
  await updateDoc(doc(db, "files", fileId), { folderId: newFolderId });
};

export const moveFolderToParent = async (folderId: string, newParentId: string | null) => {
  await updateDoc(doc(db, "folders", folderId), { parentId: newParentId });
};
