import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import './WorkflowSearchBar.css';

interface WorkflowSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
}

/**
 * WorkflowSearchBar - Debounced search input for workflows.
 */
export function WorkflowSearchBar({
  value,
  onChange,
  debounceMs = 300,
}: WorkflowSearchBarProps) {
  const [localValue, setLocalValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(localValue);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onChange]);

  return (
    <div className="workflow-search">
      <Search size={14} className="workflow-search__icon" aria-hidden="true" />
      <input
        className="workflow-search__input"
        type="search"
        placeholder="Search workflows..."
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        aria-label="Search workflows"
      />
    </div>
  );
}
