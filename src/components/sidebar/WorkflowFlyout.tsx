import React from 'react';
import { X } from 'lucide-react';
import type { WorkflowSummary } from './sidebar.types';
import './WorkflowFlyout.css';

interface WorkflowFlyoutProps {
  workflow: WorkflowSummary | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * WorkflowFlyout - Detail flyout panel for workflow preview.
 */
export function WorkflowFlyout({ workflow, isOpen, onClose }: WorkflowFlyoutProps) {
  if (!workflow || !isOpen) return null;

  return (
    <div className="workflow-flyout" role="dialog" aria-label="Workflow details">
      <div className="workflow-flyout__header">
        <h3 className="workflow-flyout__title">{workflow.title}</h3>
        <button
          className="workflow-flyout__close"
          onClick={onClose}
          aria-label="Close flyout"
          type="button"
        >
          <X size={16} />
        </button>
      </div>
      <div className="workflow-flyout__body">
        <dl className="workflow-flyout__details">
          <dt>Status</dt>
          <dd className={`workflow-flyout__status--${workflow.status}`}>
            {workflow.status}
          </dd>
          <dt>Created</dt>
          <dd>{new Date(workflow.createdAt).toLocaleString()}</dd>
          <dt>Updated</dt>
          <dd>{new Date(workflow.updatedAt).toLocaleString()}</dd>
        </dl>
      </div>
    </div>
  );
}
