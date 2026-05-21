import { useTicketLinks } from '../../hooks/useTicketLinks'
import type { Ticket } from '../../types'

const STATUS_BADGE_CLASSES: Record<Ticket['status'], string> = {
  open: 'ticket-badge--open',
  in_progress: 'ticket-badge--in-progress',
  done: 'ticket-badge--done',
  blocked: 'ticket-badge--blocked',
}

const STATUS_DISPLAY: Record<Ticket['status'], string> = {
  open: 'Open',
  in_progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
}

export function TicketLinks() {
  const { data: tickets, isLoading } = useTicketLinks()

  if (isLoading) {
    return <div className="tickets-loading">Loading tickets...</div>
  }

  if (!tickets || tickets.length === 0) {
    return <div className="tickets-empty">No recent tickets</div>
  }

  return (
    <ul className="ticket-list" data-testid="ticket-links-list">
      {tickets.map((ticket) => (
        <li key={ticket.id} className="ticket-item">
          <a
            href={ticket.url}
            className="ticket-link"
            aria-label={`${ticket.id}: ${ticket.title} - ${STATUS_DISPLAY[ticket.status]}`}
          >
            <span className="ticket-id">{ticket.id}</span>
            <span className="ticket-title">{ticket.title}</span>
            <span className={`ticket-badge ${STATUS_BADGE_CLASSES[ticket.status]}`}>
              {STATUS_DISPLAY[ticket.status]}
            </span>
          </a>
        </li>
      ))}
    </ul>
  )
}
