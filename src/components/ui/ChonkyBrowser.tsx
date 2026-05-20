"use client";

import ReactDOM from 'react-dom';

// Polyfill react-dom findDOMNode for React 19 compatibility with Material-UI v4
if (typeof window !== 'undefined') {
  if (!(ReactDOM as any).findDOMNode) {
    (ReactDOM as any).findDOMNode = (instance: any) => {
      if (!instance) return null;
      if (instance instanceof HTMLElement) return instance;
      return instance;
    };
  }
}

import React, { useMemo } from 'react';
import { 
  FileBrowser, 
  FileNavbar, 
  FileToolbar, 
  FileList, 
  FileContextMenu,
  ChonkyActions,
  setChonkyDefaults,
  FileArray,
  FileActionHandler
} from 'chonky';
import { ChonkyIconFA } from 'chonky-icon-fontawesome';

// Initialise FontAwesome icon component for Chonky safely on client-side
if (typeof window !== 'undefined') {
  setChonkyDefaults({ iconComponent: ChonkyIconFA as any });
}

interface ChonkyBrowserProps {
  files: FileArray;
  folderChain: FileArray;
  onFolderOpen: (folderId: string | null) => void;
  onDownloadFiles: (files: any[]) => void;
  onDeleteFiles: (files: any[]) => void;
  onCreateFolder: () => void;
  onUploadFiles: () => void;
}

export default function ChonkyBrowser({
  files,
  folderChain,
  onFolderOpen,
  onDownloadFiles,
  onDeleteFiles,
  onCreateFolder,
  onUploadFiles
}: ChonkyBrowserProps) {
  const customFileActions = useMemo(() => [
    ChonkyActions.CreateFolder,
    ChonkyActions.UploadFiles,
    ChonkyActions.DownloadFiles,
    ChonkyActions.DeleteFiles
  ], []);

  const handleAction = React.useCallback<FileActionHandler>((data) => {
    if (data.id === ChonkyActions.OpenFiles.id) {
      const targetFile = data.payload.targetFile || data.state.selectedFiles[0];
      if (targetFile) {
        if (targetFile.isDir) {
          onFolderOpen(targetFile.id);
        } else {
          // Double-click/Enter on a file: download or open in new tab
          onDownloadFiles([targetFile]);
        }
      }
    } else if (data.id === ChonkyActions.DownloadFiles.id) {
      onDownloadFiles(data.state.selectedFiles);
    } else if (data.id === ChonkyActions.DeleteFiles.id) {
      onDeleteFiles(data.state.selectedFiles);
    } else if (data.id === ChonkyActions.CreateFolder.id) {
      onCreateFolder();
    } else if (data.id === ChonkyActions.UploadFiles.id) {
      onUploadFiles();
    }
  }, [onFolderOpen, onDownloadFiles, onDeleteFiles, onCreateFolder, onUploadFiles]);

  const FB = FileBrowser as any;
  const FNavbar = FileNavbar as any;
  const FToolbar = FileToolbar as any;
  const FList = FileList as any;
  const FContextMenu = FileContextMenu as any;

  return (
    <div style={{ height: 600 }} className="w-full border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm bg-white dark:bg-dark-primary text-gray-800 dark:text-gray-200">
      <FB 
        files={files} 
        folderChain={folderChain}
        fileActions={customFileActions}
        onFileAction={handleAction}
      >
        <FNavbar />
        <FToolbar />
        <FList />
        <FContextMenu />
      </FB>
    </div>
  );
}
