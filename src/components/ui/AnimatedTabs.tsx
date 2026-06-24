interface AnimatedTabsProps<T extends string> {
  tabs: { id: T; label: string }[]
  activeTab: T
  onChange: (id: T) => void
}

export function AnimatedTabs<T extends string>({
  tabs,
  activeTab,
  onChange,
}: AnimatedTabsProps<T>) {
  return (
    <div className="tabs">
      {tabs.map((tab) => (
        <button
          className={`tab ${activeTab === tab.id ? "tab--active" : ""}`}
          key={tab.id}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {activeTab === tab.id && <span className="tab__indicator" />}
        </button>
      ))}
    </div>
  )
}
