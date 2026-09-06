import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { adminPageStyles } from '@/lib/adminStyles';

type PageHeaderProps = {
  icon?: LucideIcon;
  iconColor?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function AdminPageHeader({ icon: Icon, iconColor, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div style={adminPageStyles.header}>
      <div>
        <h1 style={adminPageStyles.title}>
          {Icon && <Icon size={28} color={iconColor ?? 'var(--text-primary)'} />}
          {title}
        </h1>
        {subtitle && <p style={adminPageStyles.subtitle}>{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}