'use client';

interface TabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = [
  { id: 'board', label: 'Board' },
  { id: 'analysis', label: 'Analysis' },
  { id: 'qa', label: 'Q&A' },
];

export default function Tabs({ activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex bg-surface border-b border-border sticky top-[52px] z-10">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === tab.id
              ? 'text-accent border-accent'
              : 'text-text-muted border-transparent hover:text-text-secondary'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
