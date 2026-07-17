import React from 'react';
import Link from 'next/link';
import { MedText } from '@/components/ui/med-text';
import { Star } from 'lucide-react';

interface Stat {
  label: string;
  value: string | number;
}

interface LeftSidebarProps {
  name: string;
  role: 'patient' | 'doctor';
  subtitle?: string;
  stats: Stat[];
  pills?: string[];
  avatar?: string | null;
  rating?: number;
  profileLink?: string;
}

export function LeftSidebar({ name, role, subtitle, stats, pills, avatar, rating, profileLink }: LeftSidebarProps) {
  const initials = name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'U';

  const profileContent = (
    <>
      <div className="w-[72px] h-[72px] rounded-full bg-foreground/10 flex items-center justify-center mx-auto mb-3 overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all">
        {avatar ? (
          <img src={avatar} alt={name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-[24px] font-bold text-primary">{initials}</span>
        )}
      </div>
      <MedText variant="body" className="text-[16px] font-semibold text-text">{name}</MedText>
    </>
  );

  return (
    <div className="space-y-4">
      <div className="bg-surface border border-border rounded-[16px] p-5 text-center">
        {profileLink ? (
          <Link href={profileLink} className="block">
            {profileContent}
          </Link>
        ) : (
          profileContent
        )}
        <div className="flex items-center justify-center gap-1.5 mt-1">
          <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-primary/10 text-primary">
            {role === 'doctor' ? 'Doctor' : 'Patient'}
          </span>
          {rating != null && (
            <span className="flex items-center gap-0.5 text-[11px] text-muted">
              <Star size={11} className="text-star fill-star" /> {rating.toFixed(1)}
            </span>
          )}
        </div>
        {subtitle && <MedText variant="metadata" className="mt-2 text-muted">{subtitle}</MedText>}
      </div>

      {stats.length > 0 && (
        <div className="bg-surface border border-border rounded-[16px] p-4">
          <div className="grid grid-cols-3 gap-2">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <MedText variant="h2" as="span" className="text-[18px] block">{s.value}</MedText>
                <MedText variant="metadata" className="text-[10px] text-muted">{s.label}</MedText>
              </div>
            ))}
          </div>
        </div>
      )}

      {pills && pills.length > 0 && (
        <div className="bg-surface border border-border rounded-[16px] p-4">
          <MedText variant="metadata" className="text-[11px] text-muted mb-3 tracking-[0.3px] uppercase">Tags</MedText>
          <div className="flex flex-wrap gap-1.5">
            {pills.map((p) => (
              <span key={p} className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-background text-text-secondary border border-border">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
