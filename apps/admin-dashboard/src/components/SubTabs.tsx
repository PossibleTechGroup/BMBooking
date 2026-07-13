import type { ReactNode } from 'react';
import { adminPageStyles } from '../styles/adminPageStyles';

export type SubTab = {
  key: string;
  label: string;
  icon?: ReactNode;
};

type SubTabsProps = {
  tabs: SubTab[];
  activeKey: string;
  onChange: (key: string) => void;
};

export function SubTabs({ tabs, activeKey, onChange }: SubTabsProps) {
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
