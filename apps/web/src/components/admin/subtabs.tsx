import type { ReactNode } from 'react';
import { adminPageStyles } from '@/lib/adminStyles';

export type AdminSubTab = {
  key: string;
  label: string;
  icon?: ReactNode;
};

type AdminSubTabsProps = {
  tabs: AdminSubTab[];
  activeKey: string;
  onChange: (key: string) => void;
};

export function AdminSubTabs({ tabs, activeKey, onChange }: AdminSubTabsProps) {
  return (
    <div style={adminPageStyles.subTabsBar}>
      {tabs.map(({ key, label, icon }) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          style={{
            ...adminPageStyles.subTabBtn,
            ...(activeKey === key ? adminPageStyles.subTabBtnActive : {}),
          }}
        >
          {icon}
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}