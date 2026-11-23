"use client";

/**
 * Edge tab that collapses and expands the copilot panel. Sits on the panel's
 * left edge when open, and on the window's right edge when collapsed.
 */
export function ChatHandle({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      className={`chat-handle${open ? " chat-handle--open" : ""}`}
      aria-expanded={open}
      aria-label={open ? "Collapse copilot" : "Expand copilot"}
      title={open ? "Collapse copilot" : "Expand copilot"}
      onClick={onToggle}
    >
      <span aria-hidden="true" className="chat-handle__chevron">
        {open ? "›" : "‹"}
      </span>
      {!open && <span className="chat-handle__label">Copilot</span>}
    </button>
  );
}
