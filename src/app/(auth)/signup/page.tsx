"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase/config";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Créer l'utilisateur dans Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Mettre à jour le profil avec le nom
      await updateProfile(user, {
        displayName: name
      });

      // 3. Créer un document utilisateur dans Firestore
      await setDoc(doc(db, "users", user.uid), {
        displayName: name,
        email: user.email,
        photoURL: null,
        createdAt: new Date().toISOString()
      });

      router.push("/dashboard");
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError("Cet email est déjà utilisé.");
      } else if (err.code === 'auth/weak-password') {
        setError("Le mot de passe doit faire au moins 6 caractères.");
      } else {
        setError("Erreur lors de l'inscription.");
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form className="space-y-6" onSubmit={handleRegister}>
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-300">
            Pseudo / Nom complet
          </label>
          <div className="mt-2">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="block w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-white shadow-sm focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6 backdrop-blur-sm transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">
            Adresse Email
          </label>
          <div className="mt-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-white shadow-sm focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6 backdrop-blur-sm transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300">
            Mot de passe
          </label>
          <div className="mt-2">
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-lg border border-white/10 bg-white/5 py-2.5 px-3 text-white shadow-sm focus:ring-2 focus:ring-inset focus:ring-primary-500 sm:text-sm sm:leading-6 backdrop-blur-sm transition-colors"
            />
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-full gradient-btn px-3 py-3 text-sm font-semibold leading-6 text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Création du compte..." : "Créer mon compte"}
          </button>
        </div>
      </form>

      <p className="mt-10 text-center text-sm text-slate-400">
        Déjà un compte ?{" "}
        <Link
          href="/signin"
          className="font-semibold leading-6 text-blue-500 hover:text-blue-400"
        >
          Se connecter
        </Link>
      </p>
    </div>
  );
}
