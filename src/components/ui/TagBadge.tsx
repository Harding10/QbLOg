import React from "react";
import { X } from "lucide-react";

interface TagBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
}

export function TagBadge({ name, color, onRemove }: TagBadgeProps) {
  return (
    <span 
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium"
      style={{ 
        backgroundColor: `${color}20`, // 20% opacity for background
        color: color,
        border: `1px solid ${color}40` // 40% opacity for border
      }}
    >
      {name}
      {onRemove && (
        <button 
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-70 focus:outline-none"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}

// Fonction utilitaire pour générer une couleur aléatoire constante pour un string donné
export function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  // Pour s'assurer que la couleur est lisible sur fond sombre, on l'éclaircit un peu si nécessaire
  // (Une méthode simple consiste à s'assurer que les valeurs hex ne sont pas trop basses)
  return color;
}
