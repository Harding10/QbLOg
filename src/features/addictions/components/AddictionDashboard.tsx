"use client";

import { useAddictions } from "../hooks/useAddictions";
import { AddictionStats } from "./AddictionStats";
import { AddictionStreak } from "./AddictionStreak";
import { AddictionBadges } from "./AddictionBadges";
import { AddictionCalendar } from "./AddictionCalendar";
import { AddictionEntryModal } from "./AddictionEntryModal";
import { AddictionProfileModal } from "./AddictionProfileModal";
import { MotivationalMessage } from "./MotivationalMessage";
import { 
  Plus, 
  Settings, 
  Trash2, 
  ChevronDown,
  Flame,
  Calendar,
  TrendingUp,
  Award
} from "lucide-react";

export function AddictionDashboard() {
  const {
    profiles,
    entries,
    selectedProfile,
    stats,
    badges,
    motivationalMessage,
    loading,
    showEntryModal,
    showProfileModal,
    editEntryId,
    editProfileId,
    setShowEntryModal,
    setShowProfileModal,
    setSelectedProfile,
    handleCreateProfile,
    handleUpdateProfile,
    handleDeleteProfile,
    handleOpenProfileModal,
    handleOpenEditProfileModal,
    handleCreateEntry,
    handleUpdateEntry,
    handleDeleteEntry,
    handleOpenEntryModal,
    handleOpenEditEntryModal,
    refresh
  } = useAddictions();

  const editEntry = editEntryId ? entries.find(e => e.id === editEntryId) : null;
  const editProfile = editProfileId ? profiles.find(p => p.id === editProfileId) : null;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 dark:bg-white/5 rounded-lg w-1/3 animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // No profiles state
  if (profiles.length === 0) {
    return (
      <div className="space-y-6">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
              Suivi des Addictions
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Suivez et améliorez votre comportement face à vos addictions.
            </p>
          </div>
          <button
            onClick={handleOpenProfileModal}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau suivi</span>
          </button>
        </header>

        <div className="text-center py-20 px-4 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-white/2 max-w-xl mx-auto">
          <div className="w-16 h-16 bg-primary-500/10 text-primary-500 border border-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
            <Flame className="w-7 h-7" />
          </div>
          <h3 className="text-xl font-bold text-gray-850 dark:text-gray-200 mb-2">
            Commencez votre parcours
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6 text-sm leading-relaxed">
            Créez votre premier profil de suivi d'addiction pour commencer à enregistrer vos progrès quotidiens.
          </p>
          <button
            onClick={handleOpenProfileModal}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Créer un profil</span>
          </button>
        </div>

        <AddictionProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          onSubmit={handleCreateProfile}
          editProfile={null}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-800 dark:text-white tracking-tight">
            Suivi des Addictions
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Suivez et améliorez votre comportement face à vos addictions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenProfileModal}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-primary-500 hover:bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau suivi</span>
          </button>
        </div>
      </header>

      {/* Profile Selector */}
      {profiles.length > 1 && (
        <div className="flex items-center gap-4 p-4 rounded-2xl border border-gray-200 dark:border-gray-800/80 bg-white/60 dark:bg-dark-primary/40 backdrop-blur-md">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
            Profil actif :
          </span>
          <div className="flex flex-wrap gap-2">
            {profiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedProfile(profile)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  selectedProfile?.id === profile.id
                    ? "bg-primary-500 text-white"
                    : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"
                }`}
              >
                {profile.addictionType}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Motivational Message */}
      {motivationalMessage && (
        <MotivationalMessage message={motivationalMessage} />
      )}

      {/* Stats Cards */}
      <AddictionStats stats={stats} />

      {/* Streak and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <AddictionStreak 
            currentStreak={stats?.currentStreak || 0} 
            bestStreak={stats?.bestStreak || 0} 
          />
        </div>
        
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800/80 p-6 bg-white/60 dark:bg-dark-primary/40 backdrop-blur-md">
          <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">
            Actions rapides
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => handleOpenEntryModal()}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>Enregistrer aujourd'hui</span>
            </button>
            {selectedProfile && (
              <button
                onClick={() => handleOpenEditProfileModal(selectedProfile.id!)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-semibold transition-all"
              >
                <Settings className="w-4 h-4" />
                <span>Modifier le profil</span>
              </button>
            )}
            {selectedProfile && (
              <button
                onClick={() => handleDeleteProfile(selectedProfile.id!)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 font-semibold transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>Supprimer le profil</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Calendar and Badges */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AddictionCalendar 
          entries={entries} 
          onDateClick={(date) => {
            const existingEntry = entries.find(e => e.date === date);
            if (existingEntry) {
              handleOpenEditEntryModal(existingEntry.id!);
            } else {
              handleOpenEntryModal(date);
            }
          }}
        />
        
        <AddictionBadges badges={badges} />
      </div>

      {/* Recent Entries */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800/80 p-6 bg-white/60 dark:bg-dark-primary/40 backdrop-blur-md">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Entrées récentes
        </h3>
        
        {entries.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
            Aucune entrée enregistrée. Commencez dès aujourd'hui !
          </p>
        ) : (
          <div className="space-y-2">
            {entries.slice(0, 5).map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    entry.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`} />
                  <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                    {new Date(entry.date).toLocaleDateString('fr-FR', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                    entry.status === 'success' 
                      ? 'bg-green-500/10 text-green-500' 
                      : 'bg-red-500/10 text-red-500'
                  }`}>
                    {entry.status === 'success' ? 'Réussi' : 'Échec'}
                  </span>
                  <button
                    onClick={() => handleOpenEditEntryModal(entry.id!)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEntry(entry.id!)}
                    className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Entry Modal */}
      <AddictionEntryModal
        isOpen={showEntryModal}
        onClose={() => {
          setShowEntryModal(false);
        }}
        onSubmit={async (data) => {
          if (editEntryId) {
            await handleUpdateEntry(editEntryId, data);
          } else {
            await handleCreateEntry(data);
          }
        }}
        editEntry={editEntry}
        addictionType={selectedProfile?.addictionType}
      />

      {/* Profile Modal */}
      <AddictionProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
        }}
        onSubmit={async (data) => {
          if (editProfileId) {
            await handleUpdateProfile(editProfileId, data);
          } else {
            await handleCreateProfile(data);
          }
        }}
        editProfile={editProfile}
      />
    </div>
  );
}
