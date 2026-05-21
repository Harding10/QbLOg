"use client";

import React, { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  getAllUserFolders,
  getUserFiles,
  createFolder,
  uploadFile,
  deleteFileDoc,
  deleteFolder,
  moveFileToFolder,
  moveFolderToParent,
  Folder,
  FileData,
} from "@/lib/firebase/services/files";
import { FolderPlus, UploadCloud } from "lucide-react";
import FileBrowser, { BrowserFile } from "@/components/ui/FileBrowser";

export default function FilesPage() {
  const { user } = useAuth();
  const [allFolders, setAllFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<FileData[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    if (user) {
      setLoading(true);
      try {
        const [fetchedFolders, fetchedFiles] = await Promise.all([
          getAllUserFolders(user.uid),
          getUserFiles(user.uid, currentFolderId),
        ]);
        setAllFolders(fetchedFolders);
        setFiles(fetchedFiles);
      } catch (e) {
        console.error("Erreur lors de la récupération des fichiers", e);
      } finally {
        setLoading(false);
      }
    }
  }, [user, currentFolderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newFolderName) return;

    await createFolder({
      name: newFolderName,
      parentId: currentFolderId,
      userId: user.uid,
    });

    setShowNewFolderModal(false);
    setNewFolderName("");
    fetchData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    setUploadProgress(0);
    try {
      await uploadFile(file, user.uid, currentFolderId, (progress) => {
        setUploadProgress(progress);
      });
      fetchData();
    } catch (error) {
      console.error("Erreur d'upload", error);
      alert("Erreur lors du téléchargement du fichier.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleFolderOpen = (folderId: string | null) => {
    if (folderId === "root") setCurrentFolderId(null);
    else setCurrentFolderId(folderId);
  };

  const handleDownloadFiles = (selectedFiles: BrowserFile[]) => {
    selectedFiles.forEach((file) => {
      if (file && !file.isDir && file.url) {
        window.open(file.url, "_blank", "noopener,noreferrer");
      }
    });
  };

  const handleDeleteFiles = async (selectedFiles: BrowserFile[]) => {
    const confirmMessage =
      selectedFiles.length === 1
        ? `Supprimer "${selectedFiles[0].name}" ?`
        : `Supprimer les ${selectedFiles.length} éléments sélectionnés ?`;

    if (confirm(confirmMessage)) {
      setLoading(true);
      try {
        for (const item of selectedFiles) {
          if (item.isDir) {
            await deleteFolder(item.id);
          } else {
            await deleteFileDoc(item.id, item.url ?? "");
          }
        }
        await fetchData();
      } catch (error) {
        console.error("Erreur de suppression", error);
        alert("Erreur lors de la suppression.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleUploadFilesClick = () => {
    fileInputRef.current?.click();
  };

  const handleMoveItems = async (itemIds: string[], isDirFlags: boolean[], targetFolderId: string | null) => {
    if (!user) return;
    setLoading(true);
    try {
      for (let i = 0; i < itemIds.length; i++) {
        const id = itemIds[i];
        const isDir = isDirFlags[i];
        if (isDir) {
          await moveFolderToParent(id, targetFolderId ?? null);
        } else {
          await moveFileToFolder(id, targetFolderId ?? null);
        }
      }
      await fetchData();
    } catch (error) {
      console.error("Erreur lors du déplacement", error);
      alert("Erreur lors du déplacement des éléments.");
    } finally {
      setLoading(false);
    }
  };

  // Convert Firebase folders/files to BrowserFile array
  const browserFiles = useMemo<BrowserFile[]>(() => {
    const foldersInCurrent = allFolders.filter(
      (f) => f.parentId === currentFolderId
    );

    const mappedFolders: BrowserFile[] = foldersInCurrent.map((folder) => ({
      id: folder.id!,
      name: folder.name,
      isDir: true,
    }));

    const mappedFiles: BrowserFile[] = files.map((file) => ({
      id: file.id!,
      name: file.name,
      size: file.size,
      isDir: false,
      url: file.url,
      thumbnailUrl: file.type?.startsWith("image/") ? file.url : undefined,
      modDate: file.createdAt?.toDate ? file.createdAt.toDate() : (file.createdAt as Date | null) ?? null,
    }));

    return [...mappedFolders, ...mappedFiles];
  }, [allFolders, files, currentFolderId]);

  // Build breadcrumb folder chain
  const folderChain = useMemo<BrowserFile[]>(() => {
    const chain: BrowserFile[] = [{ id: "root", name: "Fichiers", isDir: true }];
    if (!currentFolderId) return chain;

    const path: BrowserFile[] = [];
    let currentId: string | null = currentFolderId;
    let depth = 0;

    while (currentId && depth < 20) {
      const folder = allFolders.find((f) => f.id === currentId);
      if (folder) {
        path.unshift({ id: folder.id!, name: folder.name, isDir: true });
        currentId = folder.parentId;
      } else break;
      depth++;
    }

    return [...chain, ...path];
  }, [allFolders, currentFolderId]);

  return (
    <div className="flex-1 overflow-y-auto space-y-6 px-5 md:px-12 pt-10 pb-32">
      {/* Header */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white tracking-tight">
            Base de Fichiers
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Stockez, organisez et accédez à vos documents, images et archives.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowNewFolderModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Nouveau Dossier</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            disabled={uploading}
          />

          <button
            onClick={handleUploadFilesClick}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 px-5 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-55"
          >
            <UploadCloud className="w-4 h-4" />
            {uploading ? `Upload… ${Math.round(uploadProgress)}%` : "Uploader"}
          </button>
        </div>
      </header>

      {/* Upload progress bar */}
      {uploading && (
        <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden">
          <div
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {/* File Browser */}
      {loading && allFolders.length === 0 && files.length === 0 ? (
        <div className="flex justify-center p-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500" />
        </div>
      ) : (
        <FileBrowser
          files={browserFiles}
          folderChain={folderChain}
          onFolderOpen={handleFolderOpen}
          onDownloadFiles={handleDownloadFiles}
          onDeleteFiles={handleDeleteFiles}
            onMoveItems={handleMoveItems}
          onCreateFolder={() => setShowNewFolderModal(true)}
          onUploadFiles={handleUploadFilesClick}
        />
      )}

      {/* Drag & Drop zone - Custom File Upload */}
      <label htmlFor="file-upload" className="custom-file-upload">
        <div className="icon">
          <svg viewBox="0 0 24 24" fill="" xmlns="http://www.w3.org/2000/svg">
            <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
            <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
            <g id="SVGRepo_iconCarrier">
              <path fillRule="evenodd" clipRule="evenodd" d="M10 1C9.73478 1 9.48043 1.10536 9.29289 1.29289L3.29289 7.29289C3.10536 7.48043 3 7.73478 3 8V20C3 21.6569 4.34315 23 6 23H7C7.55228 23 8 22.5523 8 22C8 21.4477 7.55228 21 7 21H6C5.44772 21 5 20.5523 5 20V9H10C10.5523 9 11 8.55228 11 8V3H18C18.5523 3 19 3.44772 19 4V9C19 9.55228 19.4477 10 20 10C20.5523 10 21 9.55228 21 9V4C21 2.34315 19.6569 1 18 1H10ZM9 7H6.41421L9 4.41421V7ZM14 15.5C14 14.1193 15.1193 13 16.5 13C17.8807 13 19 14.1193 19 15.5V16V17H20C21.1046 17 22 17.8954 22 19C22 20.1046 21.1046 21 20 21H13C11.8954 21 11 20.1046 11 19C11 17.8954 11.8954 17 13 17H14V16V15.5ZM16.5 11C14.142 11 12.2076 12.8136 12.0156 15.122C10.2825 15.5606 9 17.1305 9 19C9 21.2091 10.7909 23 13 23H20C22.2091 23 24 21.2091 24 19C24 17.1305 22.7175 15.5606 20.9844 15.122C20.7924 12.8136 18.858 11 16.5 11Z" fill="currentColor"></path>
            </g>
          </svg>
        </div>
        <div className="text">
          <span>Cliquez ou glissez-déposez pour uploader</span>
        </div>
        <input
          id="file-upload"
          type="file"
          onChange={handleFileUpload}
          disabled={uploading}
        />
      </label>

      {/* New Folder Modal */}
      {showNewFolderModal && (
        <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-primary rounded-2xl w-full max-w-sm border border-gray-200 dark:border-gray-800 shadow-2xl p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-6">
              Nouveau Dossier
            </h2>
            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nom du dossier
                </label>
                <input
                  required
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  autoFocus
                  className="w-full rounded-xl bg-white dark:bg-dark-primary border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-white p-2.5 focus:border-primary-500 focus:outline-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4 mt-6 border-t border-gray-200 dark:border-gray-800">
                <button
                  type="button"
                  onClick={() => setShowNewFolderModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-primary-500 text-white rounded-full hover:bg-primary-600 transition-colors"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
