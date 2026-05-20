"use client";

import React, { useState, useCallback } from "react";
import {
  Folder,
  File,
  FileImage,
  FileVideo,
  FileAudio,
  FileText,
  FileCode,
  FileArchive,
  Download,
  Trash2,
  ChevronRight,
  Home,
  Grid3X3,
  List,
  FolderPlus,
  Upload,
  MoreVertical,
  CheckSquare,
  Square,
  X,
  Move,
} from "lucide-react";

export interface BrowserFile {
  id: string;
  name: string;
  isDir: boolean;
  size?: number;
  url?: string;
  thumbnailUrl?: string;
  modDate?: Date | null;
}

interface FileBrowserProps {
  files: BrowserFile[];
  folderChain: BrowserFile[];
  onFolderOpen: (folderId: string | null) => void;
  onDownloadFiles: (files: BrowserFile[]) => void;
  onDeleteFiles: (files: BrowserFile[]) => void;
  onCreateFolder: () => void;
  onUploadFiles: () => void;
  onMoveItems?: (itemIds: string[], isDir: boolean[], targetFolderId: string | null) => void;
}

function getFileIcon(file: BrowserFile) {
  if (file.isDir) return <Folder className="w-6 h-6 text-amber-400" />;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext))
    return <FileImage className="w-6 h-6 text-blue-400" />;
  if (["mp4", "mov", "avi", "webm", "mkv"].includes(ext))
    return <FileVideo className="w-6 h-6 text-purple-400" />;
  if (["mp3", "wav", "ogg", "flac", "aac"].includes(ext))
    return <FileAudio className="w-6 h-6 text-pink-400" />;
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext))
    return <FileText className="w-6 h-6 text-orange-400" />;
  if (["js", "ts", "jsx", "tsx", "py", "java", "cpp", "c", "html", "css", "json"].includes(ext))
    return <FileCode className="w-6 h-6 text-green-400" />;
  if (["zip", "tar", "gz", "rar", "7z"].includes(ext))
    return <FileArchive className="w-6 h-6 text-yellow-400" />;
  return <File className="w-6 h-6 text-gray-400" />;
}

function formatSize(bytes?: number): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
}

function formatDate(date?: Date | null): string {
  if (!date) return "";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function FileBrowser({
  files,
  folderChain,
  onFolderOpen,
  onDownloadFiles,
  onDeleteFiles,
  onCreateFolder,
  onUploadFiles,
  onMoveItems,
}: FileBrowserProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    file: BrowserFile;
  } | null>(null);

  // Drag & Drop state
  const [draggedItems, setDraggedItems] = useState<BrowserFile[]>([]);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const toggleSelect = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = () => {
    if (selected.size === files.length) setSelected(new Set());
    else setSelected(new Set(files.map((f) => f.id)));
  };

  const handleDoubleClick = (file: BrowserFile) => {
    if (file.isDir) {
      setSelected(new Set());
      onFolderOpen(file.id);
    } else if (file.url) {
      window.open(file.url, "_blank", "noopener,noreferrer");
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file: BrowserFile) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const closeContextMenu = () => setContextMenu(null);

  // ─── Drag & Drop handlers ───

  const handleDragStart = (e: React.DragEvent, file: BrowserFile) => {
    // If the dragged file is part of a selection, drag the whole selection
    let items: BrowserFile[];
    if (selected.has(file.id) && selected.size > 1) {
      items = files.filter((f) => selected.has(f.id));
    } else {
      items = [file];
    }
    setDraggedItems(items);
    setIsDragging(true);

    // Encode the drag data
    const payload = JSON.stringify(items.map((f) => ({ id: f.id, isDir: f.isDir, name: f.name })));
    e.dataTransfer.setData("application/x-filebrowser", payload);
    e.dataTransfer.effectAllowed = "move";

    // Custom drag image showing count
    if (items.length > 1) {
      const badge = document.createElement("div");
      badge.textContent = `${items.length} éléments`;
      badge.style.cssText =
        "position:absolute;left:-9999px;padding:6px 16px;border-radius:12px;background:#f97316;color:#fff;font-size:13px;font-weight:600;white-space:nowrap;";
      document.body.appendChild(badge);
      e.dataTransfer.setDragImage(badge, 0, 0);
      requestAnimationFrame(() => badge.remove());
    }
  };

  const handleDragEnd = () => {
    setDraggedItems([]);
    setDropTargetId(null);
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent, file: BrowserFile) => {
    if (!file.isDir) return;
    // Don't allow drop on itself
    if (draggedItems.some((d) => d.id === file.id)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetId(file.id);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we actually left the element (not entering a child)
    const related = e.relatedTarget as HTMLElement | null;
    if (!related || !(e.currentTarget as HTMLElement).contains(related)) {
      setDropTargetId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetFolder: BrowserFile) => {
    e.preventDefault();
    setDropTargetId(null);
    setIsDragging(false);

    if (!targetFolder.isDir || !onMoveItems) return;

    try {
      const raw = e.dataTransfer.getData("application/x-filebrowser");
      if (!raw) return;
      const items: { id: string; isDir: boolean; name: string }[] = JSON.parse(raw);
      // Don't drop folder into itself
      const filtered = items.filter((i) => i.id !== targetFolder.id);
      if (filtered.length === 0) return;

      onMoveItems(
        filtered.map((i) => i.id),
        filtered.map((i) => i.isDir),
        targetFolder.id === "root" ? null : targetFolder.id
      );
      setSelected(new Set());
      setDraggedItems([]);
    } catch {
      // Invalid drag data
    }
  };

  // Drop on breadcrumb folder
  const handleBreadcrumbDrop = (e: React.DragEvent, folderId: string | null) => {
    e.preventDefault();
    setDropTargetId(null);
    setIsDragging(false);

    if (!onMoveItems) return;

    try {
      const raw = e.dataTransfer.getData("application/x-filebrowser");
      if (!raw) return;
      const items: { id: string; isDir: boolean }[] = JSON.parse(raw);
      if (items.length === 0) return;

      onMoveItems(
        items.map((i) => i.id),
        items.map((i) => i.isDir),
        folderId
      );
      setSelected(new Set());
      setDraggedItems([]);
    } catch {
      // Invalid drag data
    }
  };

  const handleBreadcrumbDragOver = (e: React.DragEvent, folderId: string) => {
    if (!isDragging) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDropTargetId(folderId);
  };

  return (
    <div
      className="relative flex flex-col rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-dark-primary overflow-hidden shadow-sm"
      style={{ minHeight: 520 }}
      onClick={closeContextMenu}
    >
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02]">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 flex-1 min-w-0 text-sm">
          {folderChain.map((folder, i) => (
            <React.Fragment key={folder.id}>
              {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />}
              <button
                onClick={() => {
                  setSelected(new Set());
                  onFolderOpen(folder.id === "root" ? null : folder.id);
                }}
                onDragOver={(e) => handleBreadcrumbDragOver(e, folder.id)}
                onDragLeave={(e) => handleDragLeave(e)}
                onDrop={(e) => handleBreadcrumbDrop(e, folder.id === "root" ? null : folder.id)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-all truncate max-w-[120px] ${
                  dropTargetId === folder.id
                    ? "bg-primary-500/20 ring-2 ring-primary-500 text-primary-600 dark:text-primary-400"
                    : i === folderChain.length - 1
                      ? "text-gray-800 dark:text-white font-medium bg-gray-100 dark:bg-white/10 cursor-default"
                      : "text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                }`}
              >
                {i === 0 ? <Home className="w-3.5 h-3.5 flex-shrink-0" /> : null}
                <span className="truncate">{folder.name}</span>
              </button>
            </React.Fragment>
          ))}
        </nav>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5">
          {selected.size > 0 && (
            <>
              <span className="text-xs text-gray-500 dark:text-gray-400 font-medium px-2">
                {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
              </span>
              <button
                onClick={() => onDownloadFiles(files.filter((f) => selected.has(f.id) && !f.isDir))}
                title="Télécharger"
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  onDeleteFiles(files.filter((f) => selected.has(f.id)));
                  setSelected(new Set());
                }}
                title="Supprimer"
                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setSelected(new Set())}
                title="Désélectionner"
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}

          <button onClick={onCreateFolder} title="Nouveau dossier" className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <FolderPlus className="w-4 h-4" />
          </button>
          <button onClick={onUploadFiles} title="Uploader" className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors">
            <Upload className="w-4 h-4" />
          </button>

          <div className="w-px h-5 bg-gray-200 dark:bg-white/10 mx-1" />

          <button
            onClick={() => setViewMode("grid")}
            title="Vue grille"
            className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-primary-500/10 text-primary-500" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"}`}
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            title="Vue liste"
            className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-primary-500/10 text-primary-500" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10"}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-4">
              <Folder className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Ce dossier est vide</p>
            <p className="text-gray-400 dark:text-gray-600 text-sm mt-1">Uploadez des fichiers ou créez un dossier</p>
          </div>
        ) : viewMode === "list" ? (
          /* ─── List View ─── */
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/5">
                <th className="w-10 px-4 py-2.5 text-left">
                  <button onClick={selectAll} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                    {selected.size === files.length && files.length > 0 ? <CheckSquare className="w-4 h-4 text-primary-500" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <th className="px-2 py-2.5 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Nom</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 hidden md:table-cell">Taille</th>
                <th className="px-4 py-2.5 text-right text-xs font-medium text-gray-500 dark:text-gray-400 hidden lg:table-cell">Modifié</th>
                <th className="w-10 px-2 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {files.map((file) => {
                const isSelected = selected.has(file.id);
                const isDropTarget = dropTargetId === file.id && file.isDir;
                const isBeingDragged = draggedItems.some((d) => d.id === file.id);
                return (
                  <tr
                    key={file.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, file)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOver(e, file)}
                    onDragLeave={(e) => handleDragLeave(e)}
                    onDrop={(e) => handleDrop(e, file)}
                    onDoubleClick={() => handleDoubleClick(file)}
                    onContextMenu={(e) => handleContextMenu(e, file)}
                    onClick={(e) => toggleSelect(file.id, e)}
                    className={`group cursor-pointer border-b border-gray-50 dark:border-white/[0.03] transition-all ${
                      isDropTarget
                        ? "bg-primary-500/15 ring-2 ring-inset ring-primary-500 dark:ring-primary-400"
                        : isBeingDragged
                          ? "opacity-40"
                          : isSelected
                            ? "bg-primary-500/5 dark:bg-primary-500/10"
                            : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    }`}
                  >
                    <td className="px-4 py-2.5">
                      {isSelected ? <CheckSquare className="w-4 h-4 text-primary-500" /> : <Square className="w-4 h-4 text-gray-300 dark:text-gray-600 group-hover:text-gray-400" />}
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="flex-shrink-0">
                          {file.thumbnailUrl ? (
                            <div className="w-8 h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-white/5">
                              <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                            </div>
                          ) : (
                            getFileIcon(file)
                          )}
                        </div>
                        <span className="font-medium text-gray-800 dark:text-white truncate max-w-[200px] sm:max-w-[300px]">
                          {file.name}
                        </span>
                        {isDropTarget && (
                          <span className="ml-2 text-xs text-primary-500 font-semibold flex items-center gap-1">
                            <Move className="w-3 h-3" /> Déposer ici
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {file.isDir ? "—" : formatSize(file.size)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-gray-500 dark:text-gray-400 hidden lg:table-cell">
                      {formatDate(file.modDate)}
                    </td>
                    <td className="px-2 py-2.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleContextMenu(e as any, file); }}
                        className="p-1 rounded-lg text-gray-300 dark:text-gray-600 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          /* ─── Grid View ─── */
          <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {files.map((file) => {
              const isSelected = selected.has(file.id);
              const isDropTarget = dropTargetId === file.id && file.isDir;
              const isBeingDragged = draggedItems.some((d) => d.id === file.id);
              return (
                <div
                  key={file.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, file)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOver(e, file)}
                  onDragLeave={(e) => handleDragLeave(e)}
                  onDrop={(e) => handleDrop(e, file)}
                  onDoubleClick={() => handleDoubleClick(file)}
                  onContextMenu={(e) => handleContextMenu(e, file)}
                  onClick={(e) => toggleSelect(file.id, e)}
                  className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl cursor-pointer transition-all border ${
                    isDropTarget
                      ? "bg-primary-500/15 border-primary-500 ring-2 ring-primary-500/30 scale-105"
                      : isBeingDragged
                        ? "opacity-40 border-transparent"
                        : isSelected
                          ? "bg-primary-500/10 border-primary-500/30 dark:border-primary-500/50"
                          : "border-transparent hover:bg-gray-50 dark:hover:bg-white/5 hover:border-gray-200 dark:hover:border-white/10"
                  }`}
                >
                  <div className="absolute top-2 left-2 z-10">
                    {isSelected ? <CheckSquare className="w-4 h-4 text-primary-500" /> : <Square className="w-4 h-4 text-transparent group-hover:text-gray-400 transition-colors" />}
                  </div>
                  {isDropTarget && (
                    <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                      <span className="text-xs text-primary-500 font-bold bg-white/90 dark:bg-gray-900/90 px-3 py-1 rounded-full shadow flex items-center gap-1">
                        <Move className="w-3 h-3" /> Déposer
                      </span>
                    </div>
                  )}
                  <div className="w-full aspect-square rounded-lg flex items-center justify-center bg-gray-100 dark:bg-white/5 overflow-hidden">
                    {file.thumbnailUrl ? (
                      <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="scale-[2]">{getFileIcon(file)}</div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center w-full truncate leading-tight">{file.name}</p>
                  {!file.isDir && file.size && <p className="text-xs text-gray-400 dark:text-gray-500">{formatSize(file.size)}</p>}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Drag indicator banner */}
      {isDragging && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div className="bg-primary-500 text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-lg flex items-center gap-2 animate-pulse">
            <Move className="w-3.5 h-3.5" />
            Glissez sur un dossier pour déplacer
          </div>
        </div>
      )}

      {/* Status bar */}
      <div className="px-4 py-2 border-t border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/[0.02] flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <span>
          {files.length} élément{files.length !== 1 ? "s" : ""}
          {selected.size > 0 && ` · ${selected.size} sélectionné${selected.size > 1 ? "s" : ""}`}
        </span>
        <span>Glisser-déposer pour déplacer · Double-clic pour ouvrir</span>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={closeContextMenu} />
          <div
            className="fixed z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 rounded-xl shadow-2xl py-1.5 min-w-[180px]"
            style={{ top: contextMenu.y, left: contextMenu.x }}
            onClick={(e) => e.stopPropagation()}
          >
            {!contextMenu.file.isDir && (
              <button onClick={() => { onDownloadFiles([contextMenu.file]); closeContextMenu(); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <Download className="w-4 h-4 text-gray-400" /> Télécharger
              </button>
            )}
            {contextMenu.file.isDir && (
              <button onClick={() => { onFolderOpen(contextMenu.file.id); closeContextMenu(); }} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                <Folder className="w-4 h-4 text-amber-400" /> Ouvrir
              </button>
            )}
            <div className="border-t border-gray-100 dark:border-white/5 my-1" />
            <button
              onClick={() => { onDeleteFiles([contextMenu.file]); setSelected(new Set()); closeContextMenu(); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          </div>
        </>
      )}
    </div>
  );
}
