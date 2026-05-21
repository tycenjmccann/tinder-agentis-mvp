import { useWorkflowProgress } from '../../hooks/useWorkflowProgress'

export function WorkflowProgress() {
  const { data: workflows, isLoading } = useWorkflowProgress()

  if (isLoading) {
    return <div className="workflow-loading">Loading workflows...</div>
  }

  if (!workflows || workflows.length === 0) {
    return <div className="workflow-empty">No active workflows</div>
  }

  return (
    <ul className="workflow-list" data-testid="workflow-progress-list">
      {workflows.map((workflow) => (
        <li key={workflow.id} className="workflow-item">
          <div className="workflow-header">
            <span className="workflow-name">{workflow.name}</span>
            <span className="workflow-percent">{workflow.progress}%</span>
          </div>
          <div
            className="workflow-progress-bar"
            role="progressbar"
            aria-valuenow={workflow.progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${workflow.name} progress`}
          >
            <div
              className="workflow-progress-fill"
              style={{ width: `${workflow.progress}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  )
}
