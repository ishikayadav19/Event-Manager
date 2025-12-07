// Simple event app – fresh logic

const eventForm = document.getElementById('eventForm');
const eventsContainer = document.getElementById('eventsContainer');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');

const totalEventsEl = document.getElementById('totalEvents');
const upcomingEventsEl = document.getElementById('upcomingEvents');
const completedEventsEl = document.getElementById('completedEvents');
const todayText = document.getElementById('todayText');

const navLinks = document.querySelectorAll('.nav-link');
const eventsSection = document.getElementById('eventsSection');
const calendarSection = document.getElementById('calendarSection');
const settingsSection = document.getElementById('settingsSection');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');

let events = [];
let allEvents = [];

// Today label
todayText.textContent = new Date().toLocaleDateString('en-IN', {
  weekday: 'short',
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

// Load from storage
function loadEvents() {
  const saved = localStorage.getItem('simple-events');
  events = saved ? JSON.parse(saved) : [];
  allEvents = [...events];
  renderEvents();
  updateStats();
}

function saveEvents() {
  localStorage.setItem('simple-events', JSON.stringify(events));
  allEvents = [...events];
  updateStats();
}

// Stats
function updateStats() {
  const total = events.length;
  const completed = events.filter(e => e.completed).length;

  const now = new Date();
  const upcoming = events.filter(e => {
    if (!e.date || !e.time) return false;
    const d = new Date(e.date + ' ' + e.time);
    return d >= now && !e.completed;
  }).length;

  totalEventsEl.textContent = total;
  upcomingEventsEl.textContent = upcoming;
  completedEventsEl.textContent = completed;
}

// Render
function renderEvents() {
  eventsContainer.innerHTML = '';

  if (events.length === 0) {
    eventsContainer.innerHTML =
      '<p style="font-size:0.85rem;color:#6b7280;">No events yet. Add one on the left.</p>';
    return;
  }

  const sorted = [...events].sort((a, b) =>
    new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time)
  );

  sorted.forEach(ev => {
    const card = document.createElement('div');
    card.className = 'event-card' + (ev.completed ? ' attended' : '');
    card.dataset.id = ev.id;

    card.innerHTML = `
      <h3>${ev.title}</h3>
      <div class="event-meta">
        <span class="badge">${formatDate(ev.date)} • ${ev.time || '--:--'}</span>
        <span class="badge badge-category">${ev.category}</span>
      </div>
      <p class="event-desc">${ev.description || 'No description provided.'}</p>
      <div class="actions">
        <button class="btn" data-action="toggle">${ev.completed ? 'Mark Pending' : 'Mark Completed'}</button>
        <button class="btn" data-action="delete">Delete</button>
      </div>
    `;
    eventsContainer.appendChild(card);
  });
}

function formatDate(dateStr) {
  if (!dateStr) return '--';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '--';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Add event
eventForm.addEventListener('submit', e => {
  e.preventDefault();

  const title = document.getElementById('title').value.trim();
  const date = document.getElementById('date').value;
  const time = document.getElementById('time').value;
  const category = document.getElementById('category').value;
  const description = document.getElementById('description').value.trim();

  if (!title || !date || !time) {
    showToast('Please fill title, date and time.', 'error');
    return;
  }

  const newEvent = {
    id: Date.now(),
    title,
    date,
    time,
    category,
    description,
    completed: false
  };

  events.push(newEvent);
  saveEvents();
  renderEvents();
  eventForm.reset();
  showToast('Event added.', 'success');
});

// Card actions via delegation
eventsContainer.addEventListener('click', e => {
  const btn = e.target.closest('button');
  if (!btn) return;

  const action = btn.dataset.action;
  const card = btn.closest('.event-card');
  if (!card) return;

  const id = Number(card.dataset.id);
  const idx = events.findIndex(ev => ev.id === id);
  if (idx === -1) return;

  if (action === 'toggle') {
    events[idx].completed = !events[idx].completed;
    saveEvents();
    renderEvents();
    showToast(events[idx].completed ? 'Marked completed.' : 'Marked pending.', 'info');
  } else if (action === 'delete') {
    events.splice(idx, 1);
    saveEvents();
    renderEvents();
    showToast('Event deleted.', 'info');
  }
});

// Search
function filterEvents() {
  const term = searchInput.value.toLowerCase();
  if (!term.trim()) {
    events = [...allEvents];
  } else {
    events = allEvents.filter(ev =>
      ev.title.toLowerCase().includes(term) ||
      ev.category.toLowerCase().includes(term)
    );
  }
  renderEvents();
}

searchInput.addEventListener('input', filterEvents);

// Theme toggle (lavender/white vs black/white)
const savedTheme = localStorage.getItem('simple-theme');
if (savedTheme === 'dark') document.body.classList.add('dark');

themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const mode = document.body.classList.contains('dark') ? 'dark' : 'light';
  localStorage.setItem('simple-theme', mode);
});

// Sidebar nav (just show placeholders)
navLinks.forEach(btn => {
  btn.addEventListener('click', () => {
    navLinks.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const section = btn.dataset.section;
    eventsSection.style.display = section === 'events' ? 'grid' : 'none';
    calendarSection.style.display = section === 'calendar' ? 'block' : 'none';
    settingsSection.style.display = section === 'settings' ? 'block' : 'none';

    if (section === 'events') {
      pageTitle.textContent = 'Events';
      pageSubtitle.textContent = 'Manage all your events in one place';
    } else if (section === 'calendar') {
      pageTitle.textContent = 'Calendar';
      pageSubtitle.textContent = 'Visual view of your events (coming soon)';
    } else {
      pageTitle.textContent = 'Settings';
      pageSubtitle.textContent = 'Customize your dashboard';
    }
  });
});

// Toast
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.2s ease-out forwards';
    setTimeout(() => toast.remove(), 200);
  }, 2400);
}

// Init
loadEvents();
