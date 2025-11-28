import { layout } from './layout';

interface Event {
  id: number;
  brewery_id: number;
  title: string;
  description: string | null;
  event_type: string | null;
  start_datetime: string;
  end_datetime: string | null;
  recurring: string | null;
  image_url: string | null;
  external_url: string | null;
  brewery_name?: string;
  city?: string;
}

export function eventsPage(events: Event[]): string {
  // Group events by month
  const eventsByMonth = new Map<string, Event[]>();

  events.forEach(event => {
    const date = new Date(event.start_datetime);
    const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    if (!eventsByMonth.has(monthKey)) {
      eventsByMonth.set(monthKey, []);
    }
    eventsByMonth.get(monthKey)!.push(event);
  });

  const eventTypeColors: Record<string, string> = {
    'tap-takeover': '#d97706',
    'live-music': '#7c3aed',
    'food-truck': '#059669',
    'trivia': '#2563eb',
    'release': '#dc2626',
    'tour': '#0891b2',
    'festival': '#c026d3',
    'default': '#6b7280'
  };

  const eventTypeIcons: Record<string, string> = {
    'tap-takeover': 'bi-droplet-fill',
    'live-music': 'bi-music-note-beamed',
    'food-truck': 'bi-truck',
    'trivia': 'bi-question-circle-fill',
    'release': 'bi-star-fill',
    'tour': 'bi-building',
    'festival': 'bi-balloon-fill',
    'default': 'bi-calendar-event'
  };

  const content = `
    <div class="events-hero">
      <div class="container">
        <h1><i class="bi bi-calendar-heart"></i> Brewery Events</h1>
        <p>Discover what's happening at Ohio breweries</p>
      </div>
    </div>

    <div class="container events-content">
      <!-- Filter Tabs -->
      <div class="event-filters">
        <button class="filter-btn active" data-filter="all">
          <i class="bi bi-grid"></i> All Events
        </button>
        <button class="filter-btn" data-filter="tap-takeover">
          <i class="bi bi-droplet-fill"></i> Tap Takeovers
        </button>
        <button class="filter-btn" data-filter="live-music">
          <i class="bi bi-music-note-beamed"></i> Live Music
        </button>
        <button class="filter-btn" data-filter="food-truck">
          <i class="bi bi-truck"></i> Food Trucks
        </button>
        <button class="filter-btn" data-filter="trivia">
          <i class="bi bi-question-circle"></i> Trivia
        </button>
        <button class="filter-btn" data-filter="release">
          <i class="bi bi-star-fill"></i> New Releases
        </button>
      </div>

      ${events.length === 0 ? `
        <div class="no-events">
          <i class="bi bi-calendar-x"></i>
          <h3>No upcoming events</h3>
          <p>Check back soon for brewery events across Ohio!</p>
        </div>
      ` : `
        ${Array.from(eventsByMonth.entries()).map(([month, monthEvents]) => `
          <div class="month-section">
            <h2 class="month-header">${month}</h2>
            <div class="events-grid">
              ${monthEvents.map(event => {
                const date = new Date(event.start_datetime);
                const color = eventTypeColors[event.event_type || 'default'] || eventTypeColors.default;
                const icon = eventTypeIcons[event.event_type || 'default'] || eventTypeIcons.default;

                return `
                  <div class="event-card" data-type="${event.event_type || 'default'}">
                    <div class="event-date-badge" style="background: ${color};">
                      <span class="event-day">${date.getDate()}</span>
                      <span class="event-weekday">${date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                    </div>
                    <div class="event-content">
                      <div class="event-type-tag" style="color: ${color};">
                        <i class="${icon}"></i>
                        ${(event.event_type || 'Event').replace(/-/g, ' ')}
                      </div>
                      <h3 class="event-title">${event.title}</h3>
                      <div class="event-meta">
                        <span class="event-time">
                          <i class="bi bi-clock"></i>
                          ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                          ${event.end_datetime ? ` - ${new Date(event.end_datetime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}` : ''}
                        </span>
                        <a href="/brewery/${event.brewery_id}" class="event-venue">
                          <i class="bi bi-geo-alt"></i>
                          ${event.brewery_name || 'Brewery'}
                          ${event.city ? `, ${event.city}` : ''}
                        </a>
                      </div>
                      ${event.description ? `<p class="event-description">${event.description}</p>` : ''}
                      <div class="event-actions">
                        <a href="/brewery/${event.brewery_id}" class="btn btn-sm btn-outline-warning">
                          <i class="bi bi-building"></i> View Brewery
                        </a>
                        ${event.external_url ? `
                          <a href="${event.external_url}" target="_blank" rel="noopener" class="btn btn-sm btn-warning">
                            <i class="bi bi-box-arrow-up-right"></i> Event Details
                          </a>
                        ` : ''}
                      </div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
        `).join('')}
      `}

      <!-- Add to Calendar CTA -->
      <div class="calendar-cta">
        <h3><i class="bi bi-bell"></i> Never Miss an Event</h3>
        <p>Sign up for our newsletter to get weekly event updates</p>
        <a href="#email-signup-form" class="btn btn-warning">
          <i class="bi bi-envelope"></i> Subscribe Now
        </a>
      </div>
    </div>

    <style>
      .events-hero {
        background: linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%);
        color: white;
        padding: 4rem 0;
        text-align: center;
      }

      .events-hero h1 {
        font-size: 2.5rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
      }

      .events-hero p {
        font-size: 1.25rem;
        opacity: 0.9;
      }

      .events-content {
        padding: 2rem 0 4rem;
      }

      .event-filters {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-bottom: 2rem;
        padding-bottom: 1.5rem;
        border-bottom: 1px solid #e5e7eb;
      }

      .filter-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1rem;
        background: white;
        border: 2px solid #e5e7eb;
        border-radius: 25px;
        font-size: 0.9rem;
        font-weight: 500;
        color: #374151;
        cursor: pointer;
        transition: all 0.2s;
      }

      .filter-btn:hover {
        border-color: #7c3aed;
        color: #7c3aed;
      }

      .filter-btn.active {
        background: #7c3aed;
        border-color: #7c3aed;
        color: white;
      }

      .no-events {
        text-align: center;
        padding: 4rem 2rem;
        background: #f9fafb;
        border-radius: 16px;
      }

      .no-events i {
        font-size: 4rem;
        color: #d1d5db;
        margin-bottom: 1rem;
      }

      .no-events h3 {
        color: #6b7280;
        margin-bottom: 0.5rem;
      }

      .no-events p {
        color: #9ca3af;
      }

      .month-section {
        margin-bottom: 3rem;
      }

      .month-header {
        font-size: 1.5rem;
        font-weight: 700;
        color: #1f2937;
        margin-bottom: 1.5rem;
        padding-bottom: 0.75rem;
        border-bottom: 2px solid #e5e7eb;
      }

      .events-grid {
        display: grid;
        gap: 1.5rem;
      }

      .event-card {
        display: flex;
        gap: 1.5rem;
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.06);
        border: 1px solid #e5e7eb;
        transition: all 0.2s;
      }

      .event-card:hover {
        box-shadow: 0 8px 24px rgba(0,0,0,0.1);
        transform: translateY(-2px);
      }

      .event-card.hidden {
        display: none;
      }

      .event-date-badge {
        flex-shrink: 0;
        width: 70px;
        height: 70px;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: white;
      }

      .event-day {
        font-size: 1.75rem;
        font-weight: 700;
        line-height: 1;
      }

      .event-weekday {
        font-size: 0.75rem;
        text-transform: uppercase;
        opacity: 0.9;
      }

      .event-content {
        flex: 1;
        min-width: 0;
      }

      .event-type-tag {
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.5rem;
        display: flex;
        align-items: center;
        gap: 0.375rem;
      }

      .event-title {
        font-size: 1.25rem;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: #1f2937;
      }

      .event-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        margin-bottom: 0.75rem;
        font-size: 0.9rem;
        color: #6b7280;
      }

      .event-meta span,
      .event-meta a {
        display: inline-flex;
        align-items: center;
        gap: 0.375rem;
      }

      .event-venue {
        color: #d97706;
        text-decoration: none;
      }

      .event-venue:hover {
        text-decoration: underline;
      }

      .event-description {
        color: #6b7280;
        font-size: 0.95rem;
        line-height: 1.6;
        margin-bottom: 1rem;
      }

      .event-actions {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .calendar-cta {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border-radius: 16px;
        padding: 2.5rem;
        text-align: center;
        margin-top: 3rem;
      }

      .calendar-cta h3 {
        font-size: 1.5rem;
        font-weight: 700;
        color: #92400e;
        margin-bottom: 0.5rem;
      }

      .calendar-cta p {
        color: #78350f;
        margin-bottom: 1.5rem;
      }

      @media (max-width: 768px) {
        .event-card {
          flex-direction: column;
          gap: 1rem;
        }

        .event-date-badge {
          width: 100%;
          height: auto;
          padding: 0.75rem;
          flex-direction: row;
          gap: 0.5rem;
        }

        .event-day {
          font-size: 1.25rem;
        }

        .event-filters {
          justify-content: center;
        }
      }
    </style>

    <script>
      // Event filtering
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const filter = btn.dataset.filter;

          // Update active button
          document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');

          // Filter events
          document.querySelectorAll('.event-card').forEach(card => {
            if (filter === 'all' || card.dataset.type === filter) {
              card.classList.remove('hidden');
            } else {
              card.classList.add('hidden');
            }
          });

          // Show/hide month headers with no visible events
          document.querySelectorAll('.month-section').forEach(section => {
            const visibleEvents = section.querySelectorAll('.event-card:not(.hidden)');
            section.style.display = visibleEvents.length > 0 ? 'block' : 'none';
          });
        });
      });
    </script>
  `;

  return layout('Events', content, {
    description: 'Discover upcoming events at Ohio breweries - tap takeovers, live music, food trucks, trivia nights, and beer releases.'
  });
}
