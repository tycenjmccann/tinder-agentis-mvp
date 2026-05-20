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
 * WorkflowStatusFilter - Chip-style filter group.
 * Uses radiogroup pattern for accessibility.
 */
export function WorkflowStatusFilter({
  value,
  onChange,
}: WorkflowStatusFilterProps) {
  return (
    <div
      className="workflow-filter"
      role="radiogroup"
      aria-label="Filter by status"
    >
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          className={`workflow-filter__chip ${
            value === option.value ? 'workflow-filter__chip--active' : ''
          }`}
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
