'use client';

import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

export interface CardProps {
  children?: ReactNode;
  className?: string;
  title?: string;
  description?: string;
  icon?: ReactNode;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Card Body - Contenu standard pour les cartes
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const CardBody = ({
  className = '',
  title,
  description,
  icon,
}: {
  className?: string;
  title?: string;
  description?: string;
  icon?: ReactNode;
}) => (
  <div className={cn('text-start p-4 md:p-6', className)}>
    {icon && <div className="mb-4">{icon}</div>}
    {title && <h3 className="text-lg font-bold mb-2 text-zinc-200">{title}</h3>}
    {description && (
      <p className="text-wrap text-zinc-400 text-sm leading-relaxed">{description}</p>
    )}
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MultilayerCard V2 - Carte avec effet de couches
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const MultilayerCardV2 = ({ children, className = '' }: CardProps) => {
  return (
    <div className={cn('py-6', className)}>
      <div className="relative mx-auto h-auto">
        {/* Couche d'arrière-plan avec déformation */}
        <div
          className="dark:bg-zinc-900 bg-zinc-800 absolute inset-0 rounded-2xl border border-zinc-700 dark:border-zinc-800 scale-y-[1.08] scale-x-[0.98] -top-2"
          style={{
            transformOrigin: 'top center',
          }}
        ></div>

        {/* Couche principale */}
        <div
          className="absolute inset-0 rounded-2xl p-2 md:p-4 shadow-[0px_0px_20px_rgba(0,0,0,0.4)] border border-zinc-700 dark:border-zinc-700 dark:shadow-[0px_0px_64px_rgba(0,0,0,0.6)] bg-gradient-to-br from-zinc-800 to-zinc-900"
          style={{
            transformOrigin: 'top center',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Simple Card - Carte simple et épurée
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const SimpleCard = ({ children, className = '' }: CardProps) => (
  <div
    className={cn(
      'border rounded-xl overflow-hidden dark:border-zinc-700 bg-gradient-to-br from-zinc-800 to-zinc-900 shadow-lg hover:shadow-xl transition-shadow',
      className
    )}
  >
    {children}
  </div>
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Card with Icon - Carte avec icône
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const CardWithIcon = ({
  icon,
  title,
  description,
  className = '',
  color = 'blue',
}: CardProps & { color?: 'blue' | 'rose' | 'emerald' | 'purple' | 'amber' }) => {
  const colorMap = {
    blue: 'bg-blue-500/10 text-blue-400',
    rose: 'bg-rose-500/10 text-rose-400',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    purple: 'bg-purple-500/10 text-purple-400',
    amber: 'bg-amber-500/10 text-amber-400',
  };

  return (
    <SimpleCard className={className}>
      <div className="p-6 md:p-8">
        <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center mb-4', colorMap[color])}>
          {icon}
        </div>
        <h3 className="text-lg font-bold mb-2 text-zinc-100">{title}</h3>
        <p className="text-sm text-zinc-400 leading-relaxed">{description}</p>
      </div>
    </SimpleCard>
  );
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Stats Card - Carte pour afficher des statistiques
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const StatsCard = ({
  label,
  value,
  change,
  icon,
}: {
  label: string;
  value: string | number;
  change?: { value: number; isPositive: boolean };
  icon?: ReactNode;
}) => (
  <SimpleCard>
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-zinc-400">{label}</span>
        {icon && <div className="text-blue-400">{icon}</div>}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-zinc-100">{value}</p>
          {change && (
            <p
              className={cn('text-xs mt-1 font-medium', change.isPositive ? 'text-green-400' : 'text-red-400')}
            >
              {change.isPositive ? '+' : '-'} {change.value}%
            </p>
          )}
        </div>
      </div>
    </div>
  </SimpleCard>
);

