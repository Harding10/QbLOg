"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Bug, 
  BugStatus, 
  BugSeverity, 
  Assignee,
  BugComment,
  BugActivity,
  getUserBugs,
  createBug,
  updateBug,
  deleteBug,
  getComments,
  addComment,
  deleteComment,
  getActivities,
  addActivity
} from "@/lib/firebase/services/bugs";
import { toast } from "sonner";

export function useBugs() {
  const { user } = useAuth();
  const [bugs, setBugs] = useState<Bug[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<BugStatus | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<BugSeverity | "all">("all");
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [selectedBugId, setSelectedBugId] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [editBugId, setEditBugId] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Comments and activities maps by bugId
  const [commentsMap, setCommentsMap] = useState<Record<string, BugComment[]>>({});
  const [activitiesMap, setActivitiesMap] = useState<Record<string, BugActivity[]>>({});
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchBugs = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const fetched = await getUserBugs(user.uid);
      setBugs(fetched);
    } catch (error) {
      console.error("Error fetching bugs:", error);
      toast.error("Erreur lors de la récupération des bugs.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchBugs();
  }, [fetchBugs]);

  const selectedBug = useMemo(() => {
    return bugs.find(b => b.id === selectedBugId) || null;
  }, [bugs, selectedBugId]);

  const loadBugDetails = useCallback(async (bugId: string) => {
    try {
      setDetailLoading(true);
      const [comments, activities] = await Promise.all([
        getComments(bugId),
        getActivities(bugId)
      ]);
      setCommentsMap(prev => ({ ...prev, [bugId]: comments }));
      setActivitiesMap(prev => ({ ...prev, [bugId]: activities }));
    } catch (error) {
      console.error("Error loading bug details:", error);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedBugId) {
      loadBugDetails(selectedBugId);
    }
  }, [selectedBugId, loadBugDetails]);

  // Operations
  const handleCreateBug = async (data: {
    title: string;
    description: string;
    severity: BugSeverity;
    status: BugStatus;
    assignee: Assignee | null;
    screenshotUrl?: string | null;
  }) => {
    if (!user) return;
    try {
      const bugData = {
        title: data.title,
        description: data.description,
        severity: data.severity,
        status: data.status,
        assignee: data.assignee,
        screenshotUrl: data.screenshotUrl || null,
        userId: user.uid
      };
      
      const newId = await createBug(bugData);
      
      // Log Activity
      await addActivity(newId, {
        type: "create",
        userId: user.uid,
        userName: user.displayName || user.email || "Utilisateur",
        description: `a créé le ticket "${data.title}"`
      });

      toast.success("Ticket de bug créé avec succès !");
      fetchBugs();
      setShowFormModal(false);
    } catch (error) {
      console.error("Error creating bug:", error);
      toast.error("Impossible de créer le ticket.");
    }
  };

  const handleUpdateBug = async (id: string, updates: Partial<Bug>) => {
    if (!user) return;
    
    // Find original bug to document activities
    const original = bugs.find(b => b.id === id);
    if (!original) return;

    // Optimistic UI update
    setBugs(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));

    try {
      await updateBug(id, updates);
      
      // Generate activity logs based on what changed
      const userName = user.displayName || user.email || "Utilisateur";
      if (updates.status && updates.status !== original.status) {
        await addActivity(id, {
          type: "status_change",
          userId: user.uid,
          userName,
          description: `a changé le statut de "${original.status}" à "${updates.status}"`
        });
      }
      if (updates.severity && updates.severity !== original.severity) {
        await addActivity(id, {
          type: "priority_change",
          userId: user.uid,
          userName,
          description: `a changé la priorité de "${original.severity}" à "${updates.severity}"`
        });
      }
      if (updates.assignee !== undefined && JSON.stringify(updates.assignee) !== JSON.stringify(original.assignee)) {
        const assigneeName = updates.assignee?.name || "Non assigné";
        await addActivity(id, {
          type: "assignee_change",
          userId: user.uid,
          userName,
          description: `a assigné le ticket à ${assigneeName}`
        });
      }
      if (updates.title && updates.title !== original.title) {
        await addActivity(id, {
          type: "edit",
          userId: user.uid,
          userName,
          description: `a renommé le ticket en "${updates.title}"`
        });
      }

      toast.success("Ticket mis à jour !");
      fetchBugs();
      if (selectedBugId === id) {
        loadBugDetails(id);
      }
    } catch (error) {
      console.error("Error updating bug:", error);
      toast.error("Erreur lors de la mise à jour.");
      fetchBugs(); // rollback
    }
  };

  const handleDeleteBug = async (id: string) => {
    if (!user) return;
    if (!confirm("Voulez-vous vraiment supprimer ce ticket ?")) return;

    try {
      await deleteBug(id);
      toast.success("Ticket supprimé avec succès.");
      setBugs(prev => prev.filter(b => b.id !== id));
      if (selectedBugId === id) {
        setSelectedBugId(null);
      }
    } catch (error) {
      console.error("Error deleting bug:", error);
      toast.error("Erreur lors de la suppression.");
    }
  };

  // Comments Operations
  const handleAddComment = async (bugId: string, text: string) => {
    if (!user || !text.trim()) return;
    try {
      const commentData = {
        text: text.trim(),
        userId: user.uid,
        userName: user.displayName || user.email || "Utilisateur",
        userAvatar: user.photoURL || undefined
      };
      
      await addComment(bugId, commentData);
      
      // Log activity
      await addActivity(bugId, {
        type: "comment_add",
        userId: user.uid,
        userName: commentData.userName,
        description: `a ajouté un commentaire`
      });

      loadBugDetails(bugId);
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Impossible d'ajouter le commentaire.");
    }
  };

  const handleDeleteComment = async (bugId: string, commentId: string) => {
    if (!user) return;
    try {
      await deleteComment(bugId, commentId);
      toast.success("Commentaire supprimé.");
      loadBugDetails(bugId);
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Erreur lors de la suppression du commentaire.");
    }
  };

  // Filter and Search logic
  const filteredBugs = useMemo(() => {
    return bugs.filter((bug) => {
      const matchesSearch = 
        (bug.title || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
        (bug.description || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bug.assignee?.name || "").toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === "all" ? true : bug.status === statusFilter;
      const matchesPriority = priorityFilter === "all" ? true : bug.severity === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [bugs, searchQuery, statusFilter, priorityFilter]);

  return {
    bugs,
    filteredBugs,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    priorityFilter,
    setPriorityFilter,
    view,
    setView,
    selectedBugId,
    setSelectedBugId,
    selectedBug,
    showFormModal,
    setShowFormModal,
    editBugId,
    setEditBugId,
    commandPaletteOpen,
    setCommandPaletteOpen,
    comments: commentsMap[selectedBugId || ""] || [],
    activities: activitiesMap[selectedBugId || ""] || [],
    detailLoading,
    handleCreateBug,
    handleUpdateBug,
    handleDeleteBug,
    handleAddComment,
    handleDeleteComment,
    reloadDetails: loadBugDetails,
    refresh: fetchBugs
  };
}
