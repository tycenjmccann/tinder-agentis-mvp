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
 * WorkflowStatusFilter - Pill-style filter tabs for workflow status.
 */
export function WorkflowStatusFilter({ value, onChange }: WorkflowStatusFilterProps) {
  return (
    <div className="workflow-status-filter" role="radiogroup" aria-label="Filter by status">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          className={`workflow-status-filter__btn ${
            value === option.value ? 'workflow-status-filter__btn--active' : ''
          }`}
          onClick={() => onChange(option.value)}
          role="radio"
          aria-checked={value === option.value}
          type="button"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
