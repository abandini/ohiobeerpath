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
