import React from 'react';
import type { WorkflowStatusFilter as FilterType } from './sidebar.types';
import './WorkflowStatusFilter.css';

interface WorkflowStatusFilterProps {
  value: FilterType;
  onChange: (value: FilterType) => void;
}

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'running', label: 'Running' },
  { value: 'completed', label: 'Done' },
  { value: 'failed', label: 'Failed' },
];

/**
 * WorkflowStatusFilter - Chip-based status filter for workflow list.
 *
 * Features:
 * - Radio group semantics
 * - Keyboard navigable with arrow keys
 * - Visual active state
 */
export function WorkflowStatusFilter({
  value,
  onChange,
}: WorkflowStatusFilterProps) {
  const handleKeyDown = (e: React.KeyboardEvent, idx: number) => {
    let nextIdx = idx;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      nextIdx = (idx + 1) % FILTER_OPTIONS.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      nextIdx = (idx - 1 + FILTER_OPTIONS.length) % FILTER_OPTIONS.length;
    }
    if (nextIdx !== idx) {
      onChange(FILTER_OPTIONS[nextIdx].value);
    }
  };

  return (
    <div
      className="workflow-filter"
      role="radiogroup"
      aria-label="Filter by status"
    >
      {FILTER_OPTIONS.map((option, idx) => (
        <button
          key={option.value}
          className={`workflow-filter__chip ${
            value === option.value ? 'workflow-filter__chip--active' : ''
          }`}
          role="radio"
          aria-checked={value === option.value}
          tabIndex={value === option.value ? 0 : -1}
          onClick={() => onChange(option.value)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
