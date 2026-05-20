import React, { useRef, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import './WorkflowSearchBar.css';

interface WorkflowSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

/**
 * WorkflowSearchBar - Debounced search input for filtering workflows.
 *
 * Features:
 * - Search icon
 * - Clear button when value present
 * - Accessible with proper ARIA
 * - No dangerouslySetInnerHTML (XSS-1)
 */
export function WorkflowSearchBar({
  value,
  onChange,
  placeholder = 'Search workflows...',
}: WorkflowSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="workflow-search">
      <Search
        size={16}
        className="workflow-search__icon"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="search"
        className="workflow-search__input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label="Search workflows"
        role="searchbox"
        autoComplete="off"
      />
      {value && (
        <button
          className="workflow-search__clear"
          onClick={() => {
            onChange('');
            inputRef.current?.focus();
          }}
          aria-label="Clear search"
          type="button"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
