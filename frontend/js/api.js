// ================================================================
// AGRICONNECT — API CLIENT
// ================================================================

const API_BASE = 'https://agri-full.onrender.com/api';

const Api = {
  getToken: () => localStorage.getItem('agri_token'),
  getUser: () => JSON.parse(localStorage.getItem('agri_user') || 'null'),

  headers() {
    const h = { 'Content-Type': 'application/json' };
    const token = this.getToken();
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  },

  async request(method, path, body = null, isFormData = false) {
    const opts = { method, headers: isFormData ? { 'Authorization': `Bearer ${this.getToken()}` } : this.headers() };
    if (body) opts.body = isFormData ? body : JSON.stringify(body);
    try {
      const res = await fetch(`${API_BASE}${path}`, opts);
      const data = await res.json();
      if (res.status === 401) { Auth.logout(); return data; }
      return data;
    } catch (err) {
      return { success: false, message: 'Network error. Please check connection.' };
    }
  },

  get: (path) => Api.request('GET', path),
  post: (path, body) => Api.request('POST', path, body),
  put: (path, body) => Api.request('PUT', path, body),
  postForm: (path, formData) => Api.request('POST', path, formData, true),
  putForm: (path, formData) => Api.request('PUT', path, formData, true),
};

// ================================================================
// AUTH UTILITIES
// ================================================================
const Auth = {
  isLoggedIn: () => !!Api.getToken(),
  getRole: () => { const u = Api.getUser(); return u ? u.role : null; },

  async login(phone, password) {
    const res = await Api.post('/auth/login', { phone, password });
    if (res.success) {
      localStorage.setItem('agri_token', res.token);
      localStorage.setItem('agri_user', JSON.stringify(res.user));
    }
    return res;
  },

  logout() {
    localStorage.removeItem('agri_token');
    localStorage.removeItem('agri_user');
    window.location.href = '../index.html';
  },

  requireAuth() {
    if (!this.isLoggedIn()) {
      window.location.href = '../index.html';
      return false;
    }
    return true;
  },

  requireRole(...roles) {
    const role = this.getRole();
    if (!roles.includes(role)) {
      window.location.href = '../index.html';
      return false;
    }
    return true;
  }
};

// ================================================================
// UI UTILITIES
// ================================================================
const UI = {
  toast(message, type = 'info') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  },

  loading(el, show) {
    if (show) {
      el._origHTML = el.innerHTML;
      el.innerHTML = '<span class="spinner" style="width:16px;height:16px;border-width:2px;display:inline-block;"></span>';
      el.disabled = true;
    } else {
      el.innerHTML = el._origHTML;
      el.disabled = false;
    }
  },

  formatDate(d) {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  },

  formatDateTime(d) {
    if (!d) return '—';
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },

  formatCurrency(n) {
    if (n === null || n === undefined) return '—';
    return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  },

  badge(status) {
    const labels = {
      pending: '⏳ Pending', verified: '✔ Verified', approved: '✅ Approved',
      rejected: '✖ Rejected', completed: '✅ Completed', payment_done: '💰 Paid',
      in_progress: '🔄 In Progress', escalated: '⬆ Escalated', resolved: '✅ Resolved',
      scheduled: '📅 Scheduled'
    };
    return `<span class="badge badge-${status}">${labels[status] || status}</span>`;
  },

  showModal(id) { document.getElementById(id).classList.add('show'); },
  hideModal(id) { document.getElementById(id).classList.remove('show'); },

  initNavbar() {
    const user = Api.getUser();
    if (!user) return;

    const avatarEl = document.querySelector('.user-avatar');
    const nameEl = document.querySelector('.user-name');
    const roleEl = document.querySelector('.user-role');

    if (avatarEl) avatarEl.textContent = user.name.charAt(0).toUpperCase();
    if (nameEl) nameEl.textContent = user.name;
    if (roleEl) roleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);

    // User dropdown toggle
    document.querySelector('.user-menu')?.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelector('.dropdown-menu')?.classList.toggle('show');
    });

    document.addEventListener('click', () => {
      document.querySelector('.dropdown-menu')?.classList.remove('show');
    });

    // Logout
    document.getElementById('logoutBtn')?.addEventListener('click', () => Auth.logout());

    // Notifications
    document.querySelector('.notif-btn')?.addEventListener('click', () => {
      window.location.href = 'notifications.html';
    });

    // Sidebar mobile
    document.querySelector('.sidebar-toggle')?.addEventListener('click', () => {
      document.querySelector('.sidebar')?.classList.toggle('mobile-open');
    });

    this.loadNotifCount();
  },

  async loadNotifCount() {
    const res = await Api.get('/dashboard/notifications');
    if (res.success) {
      const unread = res.notifications.filter(n => !n.is_read).length;
      const badge = document.querySelector('.notif-badge');
      if (badge) badge.textContent = unread > 0 ? unread : '';
    }
  },

  setActiveNav(id) {
    document.querySelectorAll('.sidebar-nav li a').forEach(a => a.classList.remove('active'));
    document.getElementById(id)?.classList.add('active');
  }
};

// ================================================================
// FORMATTERS
// ================================================================
const fmt = {
  qty: (q, unit = 'qtl') => `${parseFloat(q).toFixed(2)} ${unit}`,
  phone: (p) => p ? p.replace(/(\d{5})(\d{5})/, '$1 $2') : '—',
};
