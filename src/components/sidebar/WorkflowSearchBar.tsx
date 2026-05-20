import React from 'react';
import { Search, X } from 'lucide-react';
import './WorkflowSearchBar.css';

interface WorkflowSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * WorkflowSearchBar - Search input with icon and clear button.
 * Accessible with proper roles and labels.
 */
export function WorkflowSearchBar({ value, onChange }: WorkflowSearchBarProps) {
  return (
    <div className="workflow-search">
      <Search
        size={16}
        className="workflow-search__icon"
        aria-hidden="true"
      />
      <input
        className="workflow-search__input"
        type="search"
        role="searchbox"
        aria-label="Search workflows"
        placeholder="Search workflows..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          className="workflow-search__clear"
          onClick={() => onChange('')}
          aria-label="Clear search"
          type="button"
        >
          <X size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
