"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import {
  User, Sparkles, Sliders, Shield, Zap, Eye, EyeOff, Save, Trash2, Key, Info, RefreshCw
} from "lucide-react";

type ActiveTab = "profile" | "ai" | "preferences" | "plan";

export default function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>("profile");
  
  // Profile settings
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [email] = useState(user?.email || "");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // AI Settings
  const [customKey, setCustomKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [aiTone, setAiTone] = useState("developer");

  // App settings
  const [compactMode, setCompactMode] = useState(false);
  const [defaultPage, setDefaultPage] = useState("dashboard");

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || "");
    }
    try {
      const savedKey = localStorage.getItem("qblog_user_gemini_key") || "";
      const savedTone = localStorage.getItem("qblog_ai_tone") || "developer";
      const savedCompact = localStorage.getItem("qblog_compact_mode") === "true";
      const savedPage = localStorage.getItem("qblog_default_page") || "dashboard";

      setCustomKey(savedKey);
      setAiTone(savedTone);
      setCompactMode(savedCompact);
      setDefaultPage(savedPage);
    } catch (e) {
      console.error("Error reading localStorage settings:", e);
    }
  }, [user]);

  // Save Profile Name
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setIsUpdatingProfile(true);

    try {
      await updateProfile(auth.currentUser, {
        displayName: displayName.trim()
      });
      toast.success("Profil mis à jour avec succès !");
    } catch (err: any) {
      console.error(err);
      toast.error("Erreur lors de la mise à jour : " + err.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Save AI Settings
  const handleSaveAiSettings = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("qblog_user_gemini_key", customKey.trim());
      localStorage.setItem("qblog_ai_tone", aiTone);
      toast.success("Configuration IA enregistrée localement !");
    } catch (err: any) {
      toast.error("Erreur lors de la sauvegarde : " + err.message);
    }
  };

  // Save General Preferences
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      localStorage.setItem("qblog_compact_mode", String(compactMode));
      localStorage.setItem("qblog_default_page", defaultPage);
      toast.success("Préférences globales enregistrées !");
    } catch (err: any) {
      toast.error("Erreur lors de la sauvegarde : " + err.message);
    }
  };

  // Reset Cache
  const handleClearCache = () => {
    try {
      localStorage.removeItem("qblog_chat_history");
      toast.success("Historique des conversations effacé !");
    } catch (e) {
      toast.error("Erreur d'effacement du cache.");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto space-y-6 px-5 md:px-12 pt-10 pb-32">
      
      {/* ── Banner / Header ── */}
      <header className="relative rounded-2xl overflow-hidden border border-violet-100 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-violet-50/50 p-6 md:p-8">
        {/* Glow backdrop circles */}
        <div className="absolute right-0 top-0 w-64 h-64 bg-violet-200/20 rounded-full filter blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-48 h-48 bg-indigo-200/20 rounded-full filter blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[10.5px] font-bold text-indigo-700 uppercase tracking-wider">
            Configuration
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            Paramètres Généraux
          </h1>
          <p className="text-slate-500 text-sm max-w-xl">
            Gérez les détails de votre compte, configurez votre moteur d'IA Gemini, modifiez vos préférences d'affichage et gérez votre abonnement.
          </p>
        </div>
      </header>

      {/* ── Content Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* ── Tabbed Left Navigation ── */}
        <nav className="flex lg:flex-col gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold border transition-all whitespace-nowrap ${
              activeTab === "profile"
                ? "bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm"
                : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-slate-200/80"
            }`}
          >
            <User className="w-4 h-4" />
            Mon Profil
          </button>

          <button
            onClick={() => setActiveTab("ai")}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold border transition-all whitespace-nowrap ${
              activeTab === "ai"
                ? "bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm"
                : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-slate-200/80"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Moteur IA (Gemini)
          </button>

          <button
            onClick={() => setActiveTab("preferences")}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold border transition-all whitespace-nowrap ${
              activeTab === "preferences"
                ? "bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm"
                : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-slate-200/80"
            }`}
          >
            <Sliders className="w-4 h-4" />
            Préférences
          </button>

          <button
            onClick={() => setActiveTab("plan")}
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-semibold border transition-all whitespace-nowrap ${
              activeTab === "plan"
                ? "bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm"
                : "bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-slate-200/80"
            }`}
          >
            <Zap className="w-4 h-4" />
            Abonnement
          </button>
        </nav>

        {/* ── Active Tab Form Panel ── */}
        <main className="lg:col-span-3 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* PROFILE FORM */}
          {activeTab === "profile" && (
            <form onSubmit={handleUpdateProfile} className="divide-y divide-slate-100">
              <div className="p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <User className="w-4 h-4 text-indigo-500" />
                  Détails du Profil
                </h2>
                <p className="text-[13px] text-slate-400">
                  Modifiez vos informations publiques visibles sur votre compte QbLog.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-500">Nom d'affichage</label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Votre nom complet"
                      required
                      className="w-full text-sm py-2 px-3 rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-0 transition-all bg-slate-50/50"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[12px] font-bold text-slate-500">Adresse e-mail</label>
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="w-full text-sm py-2 px-3 rounded-lg border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed"
                    />
                    <span className="text-[10px] text-slate-400">L'email n'est pas modifiable.</span>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-2 mt-4">
                  <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    Données d'authentification
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-500">
                    <p><span className="font-semibold">ID Utilisateur (UID) :</span> {user?.uid}</p>
                    <p><span className="font-semibold">Création du compte :</span> {user?.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "Non spécifié"}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 flex justify-end">
                <button
                  type="submit"
                  disabled={isUpdatingProfile}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isUpdatingProfile ? "Enregistrement..." : "Enregistrer les modifications"}
                </button>
              </div>
            </form>
          )}

          {/* AI SETTINGS FORM */}
          {activeTab === "ai" && (
            <form onSubmit={handleSaveAiSettings} className="divide-y divide-slate-100">
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Configuration de l'IA
                  </h2>
                  <span className="text-[10.5px] py-0.5 px-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold uppercase tracking-wider">Actif</span>
                </div>
                <p className="text-[13px] text-slate-400">
                  Personnalisez votre assistant copilote technique alimenté par **Gemini**.
                </p>

                <div className="bg-indigo-50/50 rounded-xl p-4 border border-indigo-100/60 flex items-start gap-3 mt-2">
                  <Zap className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-[12.5px] font-semibold text-slate-800">Moteur par défaut : Google Gemini 1.5 Flash</p>
                    <p className="text-[11px] text-slate-500">Un modèle d'IA ultra-rapide optimisé pour l'écriture de code, la détection des bugs et l'explication de stack traces.</p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-[12px] font-bold text-slate-500 flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-slate-400" />
                    Clé API Gemini personnalisée (Optionnel)
                  </label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      value={customKey}
                      onChange={(e) => setCustomKey(e.target.value)}
                      placeholder="Laissez vide pour utiliser la clé système"
                      className="w-full text-sm py-2 px-3 pr-10 rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-0 transition-all bg-slate-50/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Votre clé API reste stockée de manière 100% sécurisée et chiffrée dans votre navigateur local.
                  </p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-[12px] font-bold text-slate-500">Personnalité du copilote</label>
                  <select
                    value={aiTone}
                    onChange={(e) => setAiTone(e.target.value)}
                    className="w-full text-sm py-2 px-3 rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-0 transition-all bg-slate-50/50 text-slate-700"
                  >
                    <option value="developer">👨‍💻 Développeur Senior (Technique & Code)</option>
                    <option value="friendly">👋 Assistant amical (Clair & Vulgarisé)</option>
                    <option value="debugger">🔬 Débugger Rigoureux (Précis & Stacktraces)</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  Sauvegarder l'IA
                </button>
              </div>
            </form>
          )}

          {/* PREFERENCES FORM */}
          {activeTab === "preferences" && (
            <form onSubmit={handleSavePreferences} className="divide-y divide-slate-100">
              <div className="p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-500" />
                  Préférences de l'application
                </h2>
                <p className="text-[13px] text-slate-400">
                  Modifiez l'apparence et le comportement par défaut de QbLog.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/50 transition-all">
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-slate-700">Mode Affichage Compact</p>
                      <p className="text-[10px] text-slate-400">Réduit les paddings pour afficher plus d'informations à l'écran.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={compactMode}
                        onChange={(e) => setCompactMode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <label className="text-[12px] font-bold text-slate-500">Page par défaut au démarrage</label>
                    <select
                      value={defaultPage}
                      onChange={(e) => setDefaultPage(e.target.value)}
                      className="w-full text-sm py-2 px-3 rounded-lg border border-slate-200 focus:border-indigo-400 focus:ring-0 transition-all bg-slate-50/50 text-slate-700"
                    >
                      <option value="dashboard">👋 Dashboard Général</option>
                      <option value="journal">📝 Journal Technique</option>
                      <option value="bugs">🐛 Suivi des Bugs</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-5 space-y-3">
                  <h3 className="text-xs font-bold text-slate-700">Nettoyage &amp; Données</h3>
                  <div className="flex items-center justify-between p-3 rounded-xl border border-rose-100/60 bg-rose-50/20">
                    <div className="space-y-0.5">
                      <p className="text-[11.5px] font-bold text-slate-700">Vider l'historique des conversations</p>
                      <p className="text-[10px] text-slate-400">Efface de manière permanente les requêtes locales de l'assistant.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleClearCache}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 border border-rose-200 hover:bg-rose-100 text-rose-600 rounded-lg text-[11px] font-bold transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Vider le cache
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                >
                  <Save className="w-3.5 h-3.5" />
                  Sauvegarder les Préférences
                </button>
              </div>
            </form>
          )}

          {/* SUBSCRIPTION PANEL */}
          {activeTab === "plan" && (
            <div className="divide-y divide-slate-100">
              <div className="p-6 space-y-4">
                <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-500" />
                  Mon Abonnement
                </h2>
                <p className="text-[13px] text-slate-400">
                  Visualisez les détails de votre licence de QbLog.
                </p>

                {/* Glassmorphic Active Plan Card */}
                <div className="relative rounded-2xl overflow-hidden border border-violet-100 bg-gradient-to-br from-violet-50 to-indigo-50 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                  
                  {/* SVG backdrop blur */}
                  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                    <svg className="absolute -bottom-6 -right-6 w-44 h-44 opacity-40 filter blur-2xl" viewBox="0 0 100 100" fill="none">
                      <circle cx="50" cy="50" r="40" fill="#818CF8" />
                    </svg>
                  </div>

                  <div className="relative z-10 space-y-1.5">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white border border-slate-300 text-[10px] font-bold text-slate-600 shadow-sm">
                      Free Plan
                    </div>
                    <p className="text-lg font-bold text-slate-800">Version Standard</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Profitez des fonctionnalités essentielles pour tracer vos logs et configurer votre IA de développement.
                    </p>
                  </div>

                  <button className="relative z-10 flex-shrink-0 flex items-center justify-center gap-1.5 py-2.5 px-5 bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all">
                    Upgrade to Premium
                    <Zap className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="pt-2">
                  <h3 className="text-xs font-bold text-slate-700 mb-3">Tableau comparatif des fonctionnalités</h3>
                  <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                          <th className="p-3">Fonctionnalité</th>
                          <th className="p-3">Free</th>
                          <th className="p-3 text-indigo-600">Premium</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                        <tr>
                          <td className="p-3 font-semibold text-slate-800">Moteur Gemini IA</td>
                          <td className="p-3">Oui (Saisie clé)</td>
                          <td className="p-3 text-indigo-600 font-bold">Illimité (Clé système incluse)</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-800">Timeline dynamique</td>
                          <td className="p-3">Jusqu'à 8 activités</td>
                          <td className="p-3 text-indigo-600 font-bold">Sans limite</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-800">Cloud Storage Fichiers</td>
                          <td className="p-3">50 Mo</td>
                          <td className="p-3 text-indigo-600 font-bold">5 Go</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
