'use client';

import React, { useState } from 'react';
import { useI18n } from '@/lib/i18n/LanguageProvider';
import { LANGS } from '@/lib/i18n/translations';
import { Globe, Check, ChevronDown } from 'lucide-react';

export default function LangSwitcher({ className = '' }: { className?: string }) {
  const { lang, setLang } = useI18n();
  const [open, setOpen] = useState(false);
  const current = LANGS.find((l) => l.code === lang) || LANGS[0];

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-3 py-2 rounded-[10px] border border-border bg-surface hover:bg-foreground/5 transition-colors cursor-pointer"
        aria-label="Change language"
      >
        <Globe size={16} className="text-primary" />
        <span className="text-[13px] font-semibold text-text">{current.label}</span>
        <ChevronDown size={14} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-50 min-w-[180px] rounded-[12px] border border-border bg-surface shadow-xl overflow-hidden">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-[14px] hover:bg-foreground/5 transition-colors cursor-pointer ${
                  l.code === lang ? 'text-primary font-semibold' : 'text-text'
                }`}
              >
                <span>{l.label}</span>
                {l.code === lang && <Check size={16} />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}