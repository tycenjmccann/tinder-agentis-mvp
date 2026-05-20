// Sidebar Types
export interface Agent {
  id: string;
  name: string;
  role: string;
  status: 'active' | 'idle' | 'error';
  lastActivity: string;
}

export interface AgentStatusResponse {
  agents: Agent[];
}

export interface WorkflowSummary {
  id: string;
  title: string;
  status: 'running' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowListResponse {
  workflows: WorkflowSummary[];
  total: number;
  page: number;
  hasMore: boolean;
}

export type WorkflowStatusFilter = 'all' | 'running' | 'completed' | 'failed';

export interface QuickAction {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  onClick: () => void;
  variant?: 'default' | 'primary';
  disabled?: boolean;
}

export interface SidebarNavigationProps {
  /** Start in collapsed mode */
  defaultCollapsed?: boolean;
  /** Callback when navigation occurs */
  onNavigate: (route: string) => void;
  /** Override responsive breakpoint (default: 768px) */
  collapseBreakpoint?: number;
  /** Custom class for additional styling */
  className?: string;
}

export interface AgentStatusPanelProps {
  /** Polling interval in ms (default: 10000) */
  pollingInterval?: number;
  /** Max agents to display before "show more" (default: 8) */
  maxVisible?: number;
  /** Click handler for agent selection */
  onAgentClick?: (agent: Agent) => void;
}

export interface WorkflowHistoryListProps {
  /** Items per page for infinite loading (default: 20) */
  pageSize?: number;
  /** Search debounce in ms (default: 300) */
  searchDebounce?: number;
  /** Click handler for workflow selection */
  onWorkflowClick?: (workflow: WorkflowSummary) => void;
  /** Enable virtualization threshold (default: 50) */
  virtualizationThreshold?: number;
}

export interface QuickActionsProps {
  actions: QuickAction[];
}
