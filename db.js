/* =============================================
   GramSeva - LocalStorage "Database"
   All data is stored in localStorage so it
   persists across page refreshes — simulates
   a real backend for VS Code demo use.
   ============================================= */

const DB = {

  // ── Keys ──────────────────────────────────────
  KEYS: {
    COMPLAINTS: 'gs_complaints',
    USERS:      'gs_users',
    EMPLOYEES:  'gs_employees',
    SESSION:    'gs_session',
    COUNTER:    'gs_counter',
  },

  // ── Helpers ───────────────────────────────────
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)) || null; } catch { return null; }
  },
  set(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  },

  // ── Counter for complaint IDs ─────────────────
  nextId() {
    let n = this.get(this.KEYS.COUNTER) || 123;
    this.set(this.KEYS.COUNTER, n + 1);
    return `GRM-2026-${String(n).padStart(6, '0')}`;
  },

  // ── Complaints ────────────────────────────────
  getComplaints() { return this.get(this.KEYS.COMPLAINTS) || []; },
  saveComplaints(list) { this.set(this.KEYS.COMPLAINTS, list); },

  addComplaint(data) {
    const list = this.getComplaints();
    const id   = this.nextId();
    const c    = {
      id,
      ...data,
      status:    'Submitted',
      priority:  data.priority || 'Medium',
      assignedTo: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      timeline: [
        { status: 'Submitted', time: new Date().toISOString(), note: 'Complaint registered.' }
      ],
      resolutionProof: null,
      citizenVerified: false,
      feedback: null,
    };
    list.unshift(c);
    this.saveComplaints(list);
    return c;
  },

  updateComplaint(id, patch) {
    const list = this.getComplaints();
    const i    = list.findIndex(c => c.id === id);
    if (i === -1) return null;
    list[i] = { ...list[i], ...patch, updatedAt: new Date().toISOString() };
    if (patch.status && patch.status !== list[i].status) {
      list[i].timeline.push({ status: patch.status, time: new Date().toISOString(), note: patch.note || '' });
    }
    this.saveComplaints(list);
    return list[i];
  },

  getComplaint(id) { return this.getComplaints().find(c => c.id === id) || null; },

  getComplaintsByPhone(phone) {
    return this.getComplaints().filter(c => c.phone === phone);
  },

  // ── Session ───────────────────────────────────
  getSession() { return this.get(this.KEYS.SESSION); },
  setSession(data) { this.set(this.KEYS.SESSION, data); },
  clearSession() { localStorage.removeItem(this.KEYS.SESSION); },

  // ── Employees (static for demo) ───────────────
  getEmployees() {
    return this.get(this.KEYS.EMPLOYEES) || [
      { id:'E001', name:'Ramesh Patil',   dept:'Water Supply',  phone:'9876543201', active:true },
      { id:'E002', name:'Sunita More',    dept:'Roads',         phone:'9876543202', active:true },
      { id:'E003', name:'Anil Shinde',    dept:'Electricity',   phone:'9876543203', active:true },
      { id:'E004', name:'Priya Gawade',   dept:'Sanitation',    phone:'9876543204', active:true },
      { id:'E005', name:'Vijay Deshmukh', dept:'Drainage',      phone:'9876543205', active:true },
    ];
  },

  // ── Seed demo data ────────────────────────────
  seed() {
    if (this.getComplaints().length > 0) return; // already seeded
    const demos = [
      { name:'Ananya Kulkarni', phone:'9823456780', category:'Water Supply',  desc:'No water supply for 3 days in ward 4.',    location:'Ward 4, Near School', lat:18.521, lng:73.854, status:'Resolved', priority:'High',   assignedTo:'Ramesh Patil'   },
      { name:'Suresh Bhosale',  phone:'9823456781', category:'Roads',         desc:'Large pothole on main road causing accidents.',location:'Main Bazar Road',   lat:18.524, lng:73.856, status:'In Progress', priority:'High', assignedTo:'Sunita More'    },
      { name:'Meera Jadhav',    phone:'9823456782', category:'Street Lights', desc:'Street light not working near bus stop.',  location:'Bus Stand Road',      lat:18.519, lng:73.852, status:'Assigned',    priority:'Medium', assignedTo:'Anil Shinde'  },
      { name:'Ravi Nikam',      phone:'9823456783', category:'Drainage',      desc:'Drain is overflowing on Ambedkar Nagar.',  location:'Ambedkar Nagar',      lat:18.526, lng:73.858, status:'Submitted',   priority:'High',   assignedTo:null           },
      { name:'Leela Gaikwad',   phone:'9823456784', category:'Garbage',       desc:'Garbage not collected for 5 days.',         location:'Sainath Colony',      lat:18.517, lng:73.850, status:'Submitted',   priority:'Medium', assignedTo:null           },
      { name:'Manoj Pawaskar',  phone:'9823456785', category:'Sanitation',    desc:'Public toilet near market is locked.',      location:'Market Area',         lat:18.522, lng:73.860, status:'In Progress', priority:'Low',    assignedTo:'Priya Gawade' },
    ];
    demos.forEach(d => {
      const c = this.addComplaint(d);
      if (d.status !== 'Submitted') {
        const list = this.getComplaints();
        const i = list.findIndex(x => x.id === c.id);
        list[i].status     = d.status;
        list[i].assignedTo = d.assignedTo;
        const now = new Date().toISOString();
        list[i].timeline   = [
          { status:'Submitted',  time:now, note:'Complaint registered.' },
          ...(d.status !== 'Submitted' ? [{ status:'Assigned',   time:now, note:`Assigned to ${d.assignedTo}.` }] : []),
          ...(d.status === 'In Progress' || d.status === 'Resolved' ? [{ status:'In Progress', time:now, note:'Work started.' }] : []),
          ...(d.status === 'Resolved' ? [{ status:'Resolved', time:now, note:'Issue resolved.' }] : []),
        ];
        this.saveComplaints(list);
      }
    });
  },
};

// ── Shared UI helpers ─────────────────────────────
const UI = {
  toast(msg, type = 'success') {
    const tc = document.getElementById('toast-container') || (() => {
      const el = document.createElement('div');
      el.id = 'toast-container';
      el.className = 'toast-container';
      document.body.appendChild(el);
      return el;
    })();
    const icons = { success:'✅', error:'❌', info:'ℹ️' };
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<span>${icons[type] || '🔔'}</span><span>${msg}</span>`;
    tc.appendChild(t);
    setTimeout(() => t.remove(), 4000);
  },

  openModal(id)  { document.getElementById(id)?.classList.add('open'); },
  closeModal(id) { document.getElementById(id)?.classList.remove('open'); },

  statusPill(status) {
    const map = {
      'Submitted':         'pill-submitted',
      'Assigned':          'pill-assigned',
      'In Progress':       'pill-progress',
      'Resolved':          'pill-resolved',
      'Citizen Verified':  'pill-verified',
      'Overdue':           'pill-overdue',
    };
    return `<span class="pill ${map[status]||'pill-submitted'}">${status}</span>`;
  },

  priorityPill(p) {
    const map = { High:'pill-high', Medium:'pill-medium', Low:'pill-low' };
    return `<span class="pill ${map[p]||'pill-low'}">${p}</span>`;
  },

  timeAgo(iso) {
    const d = Math.floor((Date.now() - new Date(iso)) / 1000);
    if (d < 60)   return 'just now';
    if (d < 3600) return `${Math.floor(d/60)}m ago`;
    if (d < 86400)return `${Math.floor(d/3600)}h ago`;
    return `${Math.floor(d/86400)}d ago`;
  },

  formatDate(iso) {
    return new Date(iso).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' });
  },

  catIcon(cat) {
    const map = {
      'Water Supply':'💧','Roads':'🛣️','Street Lights':'💡',
      'Drainage':'🌊','Garbage':'🗑️','Sanitation':'🧹',
      'Public Toilets':'🚻','Other':'📋'
    };
    return map[cat] || '📋';
  },

  statusTrail(currentStatus) {
    const steps = ['Submitted','Assigned','In Progress','Resolved','Citizen Verified'];
    const idx   = steps.indexOf(currentStatus);
    return `<div class="status-trail">
      ${steps.map((s, i) => `
        <div class="trail-step">
          <div class="trail-step-wrap">
            <div class="trail-dot ${i < idx ? 'done' : i === idx ? 'active' : ''}">
              ${i < idx ? '✓' : i + 1}
            </div>
            <div class="trail-label">${s.split(' ')[0]}</div>
          </div>
          ${i < steps.length - 1 ? `<div class="trail-line ${i < idx ? 'done' : ''}"></div>` : ''}
        </div>
      `).join('')}
    </div>`;
  },
};

// Seed on first load
DB.seed();
