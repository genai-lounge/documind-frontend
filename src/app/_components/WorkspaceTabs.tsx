"use client";

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";

interface Tab {
  label: string;
  content: ReactNode;
}

/** Accessible tabs. Every panel stays mounted, so switching keeps each tab's state. */
export function WorkspaceTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0);
  const idPrefix = useId();
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    const next = (active + step + tabs.length) % tabs.length;
    setActive(next);
    buttons.current[next]?.focus();
  }

  return (
    <div className="flex flex-col gap-6 lg:min-h-0">
      <div
        role="tablist"
        aria-label="Workspace"
        onKeyDown={handleKeyDown}
        className="flex shrink-0 gap-1 border-b border-zinc-200 dark:border-zinc-800"
      >
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            ref={(el) => {
              buttons.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${i}`}
            aria-selected={i === active}
            aria-controls={`${idPrefix}-panel-${i}`}
            tabIndex={i === active ? 0 : -1}
            onClick={() => setActive(i)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${
              i === active
                ? "border-zinc-900 dark:border-zinc-100"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {tabs.map((tab, i) => (
        <div
          key={tab.label}
          role="tabpanel"
          id={`${idPrefix}-panel-${i}`}
          aria-labelledby={`${idPrefix}-tab-${i}`}
          hidden={i !== active}
          className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto"
        >
          {tab.content}
        </div>
      ))}
    </div>
  );
}
