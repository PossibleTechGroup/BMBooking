import React from 'react';

interface DesktopLayoutProps {
  left: React.ReactNode;
  center: React.ReactNode;
  right: React.ReactNode;
}

export function DesktopLayout({ left, center, right }: DesktopLayoutProps) {
  return (
    <div className="hidden lg:grid grid-cols-[300px_1fr_340px] gap-[24px] h-[calc(100vh-80px)]">
      <aside className="sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto scrollbar-thin pt-5 pb-8 px-4">
        {left}
      </aside>
      <main className="overflow-y-auto py-5 pr-4">
        {center}
      </main>
      <aside className="sticky top-[80px] h-[calc(100vh-80px)] overflow-y-auto scrollbar-thin pt-5 pb-8 pl-0 pr-4">
        {right}
      </aside>
    </div>
  );
}
