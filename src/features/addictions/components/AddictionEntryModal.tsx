"use client";

import { useState, useEffect } from "react";
import type { AddictionEntry, AddictionStatus } from "@/lib/firebase/services/addictions";
import { X, CheckCircle, XCircle } from "lucide-react";

interface AddictionEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    addictionType: string;
    date: string;
    status: AddictionStatus;
    comment?: string;
  }) => void;
  editEntry?: AddictionEntry | null;
  addictionType?: string;
}

export function AddictionEntryModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  editEntry,
  addictionType 
}: AddictionEntryModalProps) {
  const [date, setDate] = useState("");
  const [status, setStatus] = useState<AddictionStatus>("success");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (editEntry) {
      setDate(editEntry.date);
      setStatus(editEntry.status);
      setComment(editEntry.comment || "");
    } else {
      const today = new Date().toISOString().split('T')[0];
      setDate(today);
      setStatus("success");
      setComment("");
    }
  }, [editEntry, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      addictionType: addictionType || editEntry?.addictionType || "",
      date,
      status,
      comment: comment.trim() || undefined
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-primary shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editEntry ? "Modifier l'entrée" : "Enregistrer aujourd'hui"}
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
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Comment ça s'est passé aujourd'hui ?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus("success")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  status === "success"
                    ? "border-green-500 bg-green-500/10"
                    : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/5 hover:border-green-300"
                }`}
              >
                <CheckCircle className={`w-6 h-6 mx-auto mb-2 ${status === "success" ? "text-green-500" : "text-gray-400"}`} />
                <span className={`text-sm font-semibold ${status === "success" ? "text-green-500" : "text-gray-600 dark:text-gray-400"}`}>
                  Réussi ✅
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Je n'ai pas consommé
                </p>
              </button>

              <button
                type="button"
                onClick={() => setStatus("failure")}
                className={`p-4 rounded-xl border-2 transition-all ${
                  status === "failure"
                    ? "border-red-500 bg-red-500/10"
                    : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-white/5 hover:border-red-300"
                }`}
              >
                <XCircle className={`w-6 h-6 mx-auto mb-2 ${status === "failure" ? "text-red-500" : "text-gray-400"}`} />
                <span className={`text-sm font-semibold ${status === "failure" ? "text-red-500" : "text-gray-600 dark:text-gray-400"}`}>
                  Échec ❌
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  J'ai craqué
                </p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Commentaire (optionnel)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Ajoutez un commentaire personnel..."
              className="w-full px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
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
              {editEntry ? "Modifier" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
