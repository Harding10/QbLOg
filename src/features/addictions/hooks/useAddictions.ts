"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  AddictionEntry,
  AddictionProfile,
  AddictionStats,
  AddictionStatus,
  Badge,
  getUserAddictionProfiles,
  getAddictionProfile,
  createAddictionProfile,
  updateAddictionProfile,
  deleteAddictionProfile,
  getUserAddictionEntries,
  getAddictionEntryByDate,
  createAddictionEntry,
  updateAddictionEntry,
  deleteAddictionEntry,
  calculateAddictionStats,
  checkBadges,
  getNewBadges,
  getMotivationalMessage
} from "@/lib/firebase/services/addictions";
import { toast } from "sonner";

export function useAddictions() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<AddictionProfile[]>([]);
  const [entries, setEntries] = useState<AddictionEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<AddictionProfile | null>(null);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editEntryId, setEditEntryId] = useState<string | null>(null);
  const [editProfileId, setEditProfileId] = useState<string | null>(null);

  const fetchProfiles = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const fetched = await getUserAddictionProfiles(user.uid);
      setProfiles(fetched);
      if (fetched.length > 0 && !selectedProfile) {
        setSelectedProfile(fetched[0]);
      }
    } catch (error) {
      console.error("Error fetching profiles:", error);
      toast.error("Erreur lors de la récupération des profils.");
    } finally {
      setLoading(false);
    }
  }, [user, selectedProfile]);

  const fetchEntries = useCallback(async () => {
    if (!user || !selectedProfile) return;
    try {
      const fetched = await getUserAddictionEntries(user.uid, selectedProfile.addictionType);
      setEntries(fetched);
    } catch (error) {
      console.error("Error fetching entries:", error);
      toast.error("Erreur lors de la récupération des entrées.");
    }
  }, [user, selectedProfile]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  useEffect(() => {
    if (selectedProfile) {
      fetchEntries();
    }
  }, [selectedProfile, fetchEntries]);

  // Statistics calculation
  const stats = useMemo(() => {
    if (!selectedProfile) return null;
    return calculateAddictionStats(entries);
  }, [entries, selectedProfile]);

  // Badges calculation
  const badges = useMemo(() => {
    if (!selectedProfile || !stats) return [];
    return checkBadges(stats.currentStreak, selectedProfile.badges);
  }, [selectedProfile, stats]);

  // Motivational message
  const motivationalMessage = useMemo(() => {
    if (!stats || entries.length === 0) return "Commencez votre parcours aujourd'hui ! 🌱";
    const lastEntry = entries[0];
    return getMotivationalMessage(stats.currentStreak, lastEntry?.status || null);
  }, [stats, entries]);

  // Profile operations
  const handleCreateProfile = async (data: {
    addictionType: string;
    goal: string;
    startDate: string;
  }) => {
    if (!user) return;
    try {
      const profileData = {
        userId: user.uid,
        addictionType: data.addictionType,
        goal: data.goal,
        startDate: data.startDate
      };
      
      const newId = await createAddictionProfile(profileData);
      toast.success("Profil créé avec succès !");
      fetchProfiles();
      setShowProfileModal(false);
    } catch (error) {
      console.error("Error creating profile:", error);
      toast.error("Impossible de créer le profil.");
    }
  };

  const handleUpdateProfile = async (id: string, updates: Partial<AddictionProfile>) => {
    if (!user) return;
    try {
      await updateAddictionProfile(id, updates);
      toast.success("Profil mis à jour !");
      fetchProfiles();
      setShowProfileModal(false);
      setEditProfileId(null);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Erreur lors de la mise à jour.");
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!user) return;
    if (!confirm("Voulez-vous vraiment supprimer ce profil ? Toutes les entrées associées seront supprimées.")) return;

    try {
      await deleteAddictionProfile(id);
      toast.success("Profil supprimé avec succès.");
      setProfiles(prev => prev.filter(p => p.id !== id));
      if (selectedProfile?.id === id) {
        setSelectedProfile(null);
        setEntries([]);
      }
    } catch (error) {
      console.error("Error deleting profile:", error);
      toast.error("Erreur lors de la suppression.");
    }
  };

  // Entry operations
  const handleCreateEntry = async (data: {
    addictionType: string;
    date: string;
    status: AddictionStatus;
    comment?: string;
  }) => {
    if (!user) return;
    try {
      const entryData = {
        userId: user.uid,
        addictionType: data.addictionType,
        date: data.date,
        status: data.status,
        comment: data.comment
      };
      
      await createAddictionEntry(entryData);
      
      // Update profile streak and badges
      if (selectedProfile) {
        const updatedEntries = [...entries, { ...entryData, id: 'temp' }];
        const newStats = calculateAddictionStats(updatedEntries);
        const newBadges = getNewBadges(newStats.currentStreak, selectedProfile.badges);
        
        await updateAddictionProfile(selectedProfile.id!, {
          currentStreak: newStats.currentStreak,
          bestStreak: Math.max(selectedProfile.bestStreak, newStats.bestStreak),
          badges: [...selectedProfile.badges, ...newBadges]
        });

        // Show badge unlock notifications
        if (newBadges.length > 0) {
          newBadges.forEach(badgeId => {
            const badge = badges.find(b => b.id === badgeId);
            if (badge) {
              toast.success(`🎉 Nouveau badge débloqué : ${badge.icon} ${badge.name}`);
            }
          });
        }
      }

      toast.success("Entrée enregistrée avec succès !");
      fetchEntries();
      fetchProfiles();
      setShowEntryModal(false);
    } catch (error) {
      console.error("Error creating entry:", error);
      toast.error("Impossible d'enregistrer l'entrée.");
    }
  };

  const handleUpdateEntry = async (id: string, updates: Partial<AddictionEntry>) => {
    if (!user) return;
    
    // Optimistic UI update
    setEntries(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e));

    try {
      await updateAddictionEntry(id, updates);
      
      // Recalculate streak and badges
      if (selectedProfile) {
        const updatedEntries = entries.map(e => e.id === id ? { ...e, ...updates } : e);
        const newStats = calculateAddictionStats(updatedEntries);
        const newBadges = getNewBadges(newStats.currentStreak, selectedProfile.badges);
        
        await updateAddictionProfile(selectedProfile.id!, {
          currentStreak: newStats.currentStreak,
          bestStreak: Math.max(selectedProfile.bestStreak, newStats.bestStreak),
          badges: [...selectedProfile.badges, ...newBadges]
        });

        if (newBadges.length > 0) {
          newBadges.forEach(badgeId => {
            const badge = badges.find(b => b.id === badgeId);
            if (badge) {
              toast.success(`🎉 Nouveau badge débloqué : ${badge.icon} ${badge.name}`);
            }
          });
        }
      }

      toast.success("Entrée mise à jour !");
      fetchEntries();
      fetchProfiles();
      setShowEntryModal(false);
      setEditEntryId(null);
    } catch (error) {
      console.error("Error updating entry:", error);
      toast.error("Erreur lors de la mise à jour.");
      fetchEntries(); // rollback
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!user) return;
    if (!confirm("Voulez-vous vraiment supprimer cette entrée ?")) return;

    try {
      await deleteAddictionEntry(id);
      toast.success("Entrée supprimée avec succès.");
      setEntries(prev => prev.filter(e => e.id !== id));
      
      // Recalculate streak
      if (selectedProfile) {
        const updatedEntries = entries.filter(e => e.id !== id);
        const newStats = calculateAddictionStats(updatedEntries);
        
        await updateAddictionProfile(selectedProfile.id!, {
          currentStreak: newStats.currentStreak,
          bestStreak: selectedProfile.bestStreak // Keep best streak
        });
      }
      
      fetchProfiles();
    } catch (error) {
      console.error("Error deleting entry:", error);
      toast.error("Erreur lors de la suppression.");
    }
  };

  const handleSelectProfile = (profile: AddictionProfile) => {
    setSelectedProfile(profile);
  };

  const handleOpenEntryModal = (date?: string) => {
    setEditEntryId(null);
    setShowEntryModal(true);
  };

  const handleOpenEditEntryModal = (entryId: string) => {
    setEditEntryId(entryId);
    setShowEntryModal(true);
  };

  const handleOpenProfileModal = () => {
    setEditProfileId(null);
    setShowProfileModal(true);
  };

  const handleOpenEditProfileModal = (profileId: string) => {
    setEditProfileId(profileId);
    setShowProfileModal(true);
  };

  return {
    // Data
    profiles,
    entries,
    selectedProfile,
    stats,
    badges,
    motivationalMessage,
    loading,
    
    // UI state
    showEntryModal,
    showProfileModal,
    editEntryId,
    editProfileId,
    
    // Actions
    setShowEntryModal,
    setShowProfileModal,
    setEditEntryId,
    setEditProfileId,
    setSelectedProfile: handleSelectProfile,
    
    // Profile operations
    handleCreateProfile,
    handleUpdateProfile,
    handleDeleteProfile,
    handleOpenProfileModal,
    handleOpenEditProfileModal,
    
    // Entry operations
    handleCreateEntry,
    handleUpdateEntry,
    handleDeleteEntry,
    handleOpenEntryModal,
    handleOpenEditEntryModal,
    
    // Refresh
    refresh: () => {
      fetchProfiles();
      fetchEntries();
    }
  };
}
