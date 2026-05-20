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
    <div className="space-y-6 px-5 md:px-12 pt-10 pb-32">
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
          onCreateFolder={() => setShowNewFolderModal(true)}
          onUploadFiles={handleUploadFilesClick}
        />
      )}

      {/* Drag & Drop zone */}
      <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-2xl p-8 text-center bg-gray-50 dark:bg-dark-primary/40 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer relative group">
        <input
          type="file"
          onChange={handleFileUpload}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />
        <div className="w-16 h-16 bg-white dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-50 dark:group-hover:bg-primary-500/20 transition-colors border border-gray-100 dark:border-white/5">
          <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-primary-500 transition-colors" />
        </div>
        <p className="text-gray-700 dark:text-gray-200 font-medium text-lg">
          Glissez-déposez vos fichiers ici
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          ou cliquez pour parcourir votre appareil
        </p>
      </div>

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
