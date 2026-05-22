"use client";

import { useState, useEffect } from "react";
import type { AddictionProfile } from "@/lib/firebase/services/addictions";
import { X } from "lucide-react";

interface AddictionProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    addictionType: string;
    goal: string;
    startDate: string;
  }) => void;
  editProfile?: AddictionProfile | null;
}

const COMMON_ADDICTIONS = [
  "Tabac",
  "Alcool",
  "Sucre",
  "Réseaux sociaux",
  "Caféine",
  "Jeu vidéo",
  "Achat compulsif",
  "Fast-food",
  "Autre"
];

export function AddictionProfileModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editProfile 
}: AddictionProfileModalProps) {
  const [addictionType, setAddictionType] = useState("");
  const [customAddiction, setCustomAddiction] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState("");

  useEffect(() => {
    if (editProfile) {
      setAddictionType(editProfile.addictionType);
      setGoal(editProfile.goal);
      setStartDate(editProfile.startDate);
    } else {
      const today = new Date().toISOString().split('T')[0];
      setAddictionType("");
      setCustomAddiction("");
      setGoal("");
      setStartDate(today);
    }
  }, [editProfile, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalAddictionType = addictionType === "Autre" ? customAddiction : addictionType;
    onSubmit({
      addictionType: finalAddictionType,
      goal,
      startDate
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-primary shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editProfile ? "Modifier le profil" : "Nouveau suivi d'addiction"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Type d'addiction
            </label>
            <select
              value={addictionType}
              onChange={(e) => setAddictionType(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="">Sélectionnez...</option>
              {COMMON_ADDICTIONS.map(type => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {addictionType === "Autre" && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Précisez le type
              </label>
              <input
                type="text"
                value={customAddiction}
                onChange={(e) => setCustomAddiction(e.target.value)}
                required
                placeholder="Ex: Grignotage, Procrastination..."
                className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Objectif personnel
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              required
              placeholder="Ex: Arrêter complètement, Réduire de moitié..."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Date de début
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white font-semibold transition-all shadow-md hover:shadow-lg"
            >
              {editProfile ? "Modifier" : "Créer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
