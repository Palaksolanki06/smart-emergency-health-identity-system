/* ============================================================
   Smart Emergency Health Identity System — script.js
   All data stored in localStorage. No backend required.
   ============================================================ */

// ── Storage keys ──────────────────────────────────────────────
const KEYS = {
  USERS: 'ehid_users',
  SESSION: 'ehid_session',
  MEDICAL: id => `ehid_medical_${id}`,
  CONTACTS: id => `ehid_contacts_${id}`,
};

// ── Utility helpers ───────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 11).toUpperCase();
}
function getUsers() {
  return JSON.parse(localStorage.getItem(KEYS.USERS) || '[]');
}
function saveUsers(list) {
  localStorage.setItem(KEYS.USERS, JSON.stringify(list));
}
function currentUser() {
  const id = localStorage.getItem(KEYS.SESSION);
  if (!id) return null;
  return getUsers().find(u => u.id === id) || null;
}
function saveCurrentUser(user) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === user.id);
  if (idx >= 0) users[idx] = user; else users.push(user);
  saveUsers(users);
}
function getMedical(userId) {
  return JSON.parse(
    localStorage.getItem(KEYS.MEDICAL(userId)) ||
    '{"diseases":[],"allergies":[],"medications":[]}'
  );
}
function saveMedical(userId, data) {
  localStorage.setItem(KEYS.MEDICAL(userId), JSON.stringify(data));
}
function getContacts(userId) {
  return JSON.parse(localStorage.getItem(KEYS.CONTACTS(userId)) || '[]');
}
function saveContacts(userId, list) {
  localStorage.setItem(KEYS.CONTACTS(userId), JSON.stringify(list));
}

// ── Page navigation ───────────────────────────────────────────
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById('page-' + name);
  if (page) { page.classList.add('active'); window.scrollTo({ top: 0 }); }
  switch (name) {
    case 'dashboard': loadDashboard(); break;
    case 'profile': loadProfile(); break;
    case 'medical': loadMedical(); break;
    case 'contacts': loadContacts(); break;
    case 'emergency': loadEmergency(); break;
    case 'qrcode': loadQR(); break;
  }
}

// ── Toast ─────────────────────────────────────────────────────
let _toastTimer;
function showToast(msg, isError) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast' + (isError ? ' error' : '');
  el.classList.remove('hidden');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.add('hidden'), 2600);
}

// ── Toggle password visibility ────────────────────────────────
function togglePassword(inputId, btn) {
  const input = document.getElementById(inputId);
  const icon = btn.querySelector('i');
  if (input.type === 'password') {
    input.type = 'text';
    icon.className = 'fa-solid fa-eye-slash';
  } else {
    input.type = 'password';
    icon.className = 'fa-solid fa-eye';
  }
}

// ── AUTH: Login ───────────────────────────────────────────────
document.getElementById('login-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  const errMsg = document.getElementById('login-error-msg');
  errEl.classList.add('hidden');
  if (!email || !password) {
    errMsg.textContent = 'Please fill in all fields.';
    errEl.classList.remove('hidden'); return;
  }
  const user = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (!user) {
    errMsg.textContent = 'No account found with that email.';
    errEl.classList.remove('hidden'); return;
  }
  if (user.password !== password) {
    errMsg.textContent = 'Incorrect password.';
    errEl.classList.remove('hidden'); return;
  }
  localStorage.setItem(KEYS.SESSION, user.id);
  showPage('dashboard');
});

// ── AUTH: Signup ──────────────────────────────────────────────
document.getElementById('signup-form').addEventListener('submit', function (e) {
  e.preventDefault();
  const name = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const age = document.getElementById('signup-age').value.trim();
  const blood = document.getElementById('signup-blood').value;
  const phone = document.getElementById('signup-phone').value.trim();
  const password = document.getElementById('signup-password').value;
  const confirm = document.getElementById('signup-confirm').value;
  const errEl = document.getElementById('signup-error');
  const errMsg = document.getElementById('signup-error-msg');
  errEl.classList.add('hidden');
  if (!name || !email || !age || !blood || !password) {
    errMsg.textContent = 'Please fill in all required fields.';
    errEl.classList.remove('hidden'); return;
  }
  if (password !== confirm) {
    errMsg.textContent = "Passwords don't match.";
    errEl.classList.remove('hidden'); return;
  }
  if (password.length < 6) {
    errMsg.textContent = 'Password must be at least 6 characters.';
    errEl.classList.remove('hidden'); return;
  }
  const ageNum = Number(age);
  if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
    errMsg.textContent = 'Please enter a valid age.';
    errEl.classList.remove('hidden'); return;
  }
  const existing = getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    errMsg.textContent = 'An account with this email already exists.';
    errEl.classList.remove('hidden'); return;
  }
  const newUser = {
    id: uid(), name, email, password, age,
    bloodGroup: blood, phone, createdAt: new Date().toISOString(),
  };
  const users = getUsers();
  users.push(newUser);
  saveUsers(users);
  localStorage.setItem(KEYS.SESSION, newUser.id);
  showPage('dashboard');
});

// ── AUTH: Logout ──────────────────────────────────────────────
function logout() {
  localStorage.removeItem(KEYS.SESSION);
  showPage('login');
}

// ── DASHBOARD ─────────────────────────────────────────────────
function loadDashboard() {
  const user = currentUser();
  if (!user) { showPage('login'); return; }
  const medical = getMedical(user.id);
  const contacts = getContacts(user.id);
  document.getElementById('dash-avatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('dash-name').textContent = user.name;
  document.getElementById('dash-email').textContent = user.email;
  document.getElementById('dash-blood').textContent = user.bloodGroup || '—';
  document.getElementById('dash-patient-id').textContent = user.id;
  document.getElementById('stat-diseases').textContent = medical.diseases.length;
  document.getElementById('stat-allergies').textContent = medical.allergies.length;
  document.getElementById('stat-meds').textContent = medical.medications.length;
  const cc = contacts.length;
  document.getElementById('contacts-count-desc').textContent =
    cc + ' contact' + (cc !== 1 ? 's' : '') + ' saved';
}

// ── PROFILE ───────────────────────────────────────────────────
let _profileEditing = false;

function loadProfile() {
  const user = currentUser();
  if (!user) { showPage('login'); return; }
  document.getElementById('profile-avatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('profile-name-display').textContent = user.name;
  document.getElementById('profile-email-display').textContent = user.email;
  setFieldView('pf-name', user.name);
  setFieldView('pf-email', user.email);
  setFieldView('pf-phone', user.phone);
  setFieldView('pf-age', user.age);
  document.getElementById('profile-blood-display').textContent = user.bloodGroup || 'Not set';
  document.getElementById('profile-blood-edit').value = user.bloodGroup || '';
  const d = new Date(user.createdAt);
  document.getElementById('profile-member-since').textContent =
    'Member since ' + d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  _profileEditing = false;
  setProfileMode(false);
}

function setFieldView(prefix, value) {
  const vEl = document.getElementById(prefix + '-view');
  const eEl = document.getElementById(prefix + '-edit');
  vEl.className = 'field-value' + (!value ? ' empty' : '');
  vEl.textContent = value || 'Not set';
  eEl.value = value || '';
}

function setProfileMode(editing) {
  _profileEditing = editing;
  document.getElementById('edit-btn').innerHTML = editing
    ? '<i class="fa-solid fa-xmark"></i> Cancel'
    : '<i class="fa-solid fa-pen"></i> Edit';
  document.getElementById('profile-save-row').classList.toggle('hidden', !editing);
  ['pf-name', 'pf-email', 'pf-phone', 'pf-age'].forEach(p => {
    document.getElementById(p + '-view').classList.toggle('hidden', editing);
    document.getElementById(p + '-edit').classList.toggle('hidden', !editing);
  });
  document.getElementById('blood-view').classList.toggle('hidden', editing);
  document.getElementById('blood-edit').classList.toggle('hidden', !editing);
}

function toggleProfileEdit() {
  if (_profileEditing) { cancelProfileEdit(); } else { setProfileMode(true); }
}
function cancelProfileEdit() { loadProfile(); }

function saveProfile() {
  const user = currentUser(); if (!user) return;
  user.name = document.getElementById('pf-name-edit').value.trim() || user.name;
  user.email = document.getElementById('pf-email-edit').value.trim() || user.email;
  user.phone = document.getElementById('pf-phone-edit').value.trim();
  user.age = document.getElementById('pf-age-edit').value.trim();
  user.bloodGroup = document.getElementById('profile-blood-edit').value;
  saveCurrentUser(user);
  loadProfile();
  showToast('Profile updated successfully!');
}

// ── MEDICAL DATA ──────────────────────────────────────────────
function loadMedical() {
  const user = currentUser(); if (!user) { showPage('login'); return; }
  const medical = getMedical(user.id);
  renderTags('diseases', medical.diseases, 'orange');
  renderTags('allergies', medical.allergies, 'red');
  renderTags('medications', medical.medications, 'blue');
}

function renderTags(category, items, colorClass) {
  const container = document.getElementById(category + '-tags');
  const countEl = document.getElementById(category + '-count');
  container.innerHTML = '';
  if (items.length === 0) {
    container.innerHTML = '<span class="tag-empty">No ' + category + ' added yet</span>';
  } else {
    items.forEach((item, idx) => {
      const tag = document.createElement('span');
      tag.className = 'tag ' + colorClass;
      tag.innerHTML = escHtml(item) +
        '<button onclick="removeMedical(\'' + category + '\',' + idx + ')" title="Remove">' +
        '<i class="fa-solid fa-xmark"></i></button>';
      container.appendChild(tag);
    });
  }
  countEl.textContent = items.length + ' item' + (items.length !== 1 ? 's' : '');
}

function addMedical(category) {
  const user = currentUser(); if (!user) return;
  const input = document.getElementById(category + '-input');
  const value = input.value.trim(); if (!value) return;
  const medical = getMedical(user.id);
  medical[category].push(value);
  saveMedical(user.id, medical);
  input.value = '';
  renderTags(category, medical[category], tagColor(category));
  showToast('Saved automatically');
}

function removeMedical(category, idx) {
  const user = currentUser(); if (!user) return;
  const medical = getMedical(user.id);
  medical[category].splice(idx, 1);
  saveMedical(user.id, medical);
  renderTags(category, medical[category], tagColor(category));
  showToast('Removed');
}

function tagColor(cat) {
  return { diseases: 'orange', allergies: 'red', medications: 'blue' }[cat];
}

// ── EMERGENCY CONTACTS ────────────────────────────────────────
function loadContacts() {
  const user = currentUser(); if (!user) { showPage('login'); return; }
  renderContacts(getContacts(user.id));
  document.getElementById('contact-form-panel').classList.add('hidden');
  document.getElementById('c-name').value = '';
  document.getElementById('c-phone').value = '';
  document.getElementById('c-rel').value = '';
  document.getElementById('contact-form-error').classList.add('hidden');
}

function renderContacts(contacts) {
  const list = document.getElementById('contacts-list');
  const empty = document.getElementById('contacts-empty');
  list.innerHTML = '';
  if (contacts.length === 0) {
    empty.classList.remove('hidden');
  } else {
    empty.classList.add('hidden');
    contacts.forEach(c => {
      const div = document.createElement('div');
      div.className = 'contact-card';
      div.innerHTML = `
        <div class="contact-avatar">${c.name.charAt(0).toUpperCase()}</div>
        <div class="contact-info">
          <p class="contact-name">${escHtml(c.name)}</p>
          <p class="contact-phone">${escHtml(c.phone)}</p>
          ${c.relationship ? `<p class="contact-rel">${escHtml(c.relationship)}</p>` : ''}
        </div>
        <div class="contact-actions">
          <a href="tel:${escHtml(c.phone)}" class="btn-call" title="Call">
            <i class="fa-solid fa-phone"></i>
          </a>
          <button class="btn-del" onclick="deleteContact('${c.id}')" title="Delete">
            <i class="fa-solid fa-trash"></i>
          </button>
        </div>`;
      list.appendChild(div);
    });
  }
}

function toggleContactForm() {
  document.getElementById('contact-form-panel').classList.toggle('hidden');
  document.getElementById('contact-form-error').classList.add('hidden');
}

function addContact() {
  const user = currentUser(); if (!user) return;
  const name = document.getElementById('c-name').value.trim();
  const phone = document.getElementById('c-phone').value.trim();
  const rel = document.getElementById('c-rel').value.trim();
  const errEl = document.getElementById('contact-form-error');
  if (!name || !phone) {
    errEl.textContent = 'Name and phone number are required.';
    errEl.classList.remove('hidden'); return;
  }
  const contacts = getContacts(user.id);
  contacts.push({ id: uid(), name, phone, relationship: rel });
  saveContacts(user.id, contacts);
  renderContacts(contacts);
  toggleContactForm();
  document.getElementById('c-name').value = '';
  document.getElementById('c-phone').value = '';
  document.getElementById('c-rel').value = '';
  showToast('Contact added');
}

function deleteContact(id) {
  const user = currentUser(); if (!user) return;
  const updated = getContacts(user.id).filter(c => c.id !== id);
  saveContacts(user.id, updated);
  renderContacts(updated);
  showToast('Contact removed');
}

// ── EMERGENCY SCREEN ──────────────────────────────────────────
function loadEmergency() {
  const user = currentUser(); if (!user) { showPage('login'); return; }
  const medical = getMedical(user.id);
  const contacts = getContacts(user.id);

  document.getElementById('em-name').textContent = user.name;
  document.getElementById('em-age').textContent = user.age || 'unknown';
  document.getElementById('em-pid').textContent = user.id;

  const bloodEl = document.getElementById('em-blood');
  bloodEl.textContent = user.bloodGroup || 'Unknown';
  bloodEl.className = 'em-blood' + (!user.bloodGroup ? ' empty' : '');

  renderEmTags('em-allergies', medical.allergies, 'orange');

  const disCard = document.getElementById('em-diseases-card');
  if (medical.diseases.length === 0) {
    disCard.classList.add('hidden');
  } else {
    disCard.classList.remove('hidden');
    renderEmTags('em-diseases', medical.diseases, 'gray');
  }

  const medsCard = document.getElementById('em-meds-card');
  if (medical.medications.length === 0) {
    medsCard.classList.add('hidden');
  } else {
    medsCard.classList.remove('hidden');
    renderEmTags('em-meds', medical.medications, 'blue');
  }

  const cEl = document.getElementById('em-contacts');
  cEl.innerHTML = '';
  if (contacts.length === 0) {
    cEl.innerHTML = '<p class="em-no-data">No emergency contacts saved</p>';
  } else {
    contacts.forEach(c => {
      cEl.innerHTML += `
        <div class="em-contact-item">
          <p class="em-contact-name">${escHtml(c.name)}</p>
          ${c.relationship ? `<p class="em-contact-rel">${escHtml(c.relationship)}</p>` : ''}
          <a href="tel:${escHtml(c.phone)}" class="em-call-btn">
            <i class="fa-solid fa-phone"></i> ${escHtml(c.phone)}
          </a>
        </div>`;
    });
  }
}

function renderEmTags(containerId, items, colorClass) {
  const el = document.getElementById(containerId);
  el.innerHTML = items.length === 0
    ? '<p class="em-no-data">None</p>'
    : items.map(i => `<span class="em-tag ${colorClass}">${escHtml(i)}</span>`).join('');
}

// ── QR CODE ───────────────────────────────────────────────────
function loadQR() {
  const user = currentUser(); if (!user) { showPage('login'); return; }
  document.getElementById('qr-name').textContent = user.name;
  document.getElementById('qr-blood').textContent = user.bloodGroup || '—';
  document.getElementById('qr-age').textContent = user.age || '—';
  document.getElementById('qr-pid').textContent = user.id;
  const url = window.location.origin + window.location.pathname + '?patient=' + user.id;
  document.getElementById('qr-url').textContent = url;
  const canvas = document.getElementById('qr-canvas');
  if (typeof QRCode !== 'undefined') {
    QRCode.toCanvas(canvas, url, { width: 200, margin: 1, color: { dark: '#1e1e2e', light: '#ffffff' } });
  } else {
    drawFallbackQR(canvas, user.id);
  }
}

function drawFallbackQR(canvas, data) {
  const size = 200, mods = 25, ms = size / mods;
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, size, size);
  const seed = Array.from(data).reduce((a, c) => a + c.charCodeAt(0), 0);
  function bit(r, c) { return Math.abs(((r * 397) ^ (c * 113) ^ (seed * 7)) * 1234567 % 100) < 50; }
  ctx.fillStyle = '#1e1e2e';
  for (let r = 0; r < mods; r++) {
    for (let c = 0; c < mods; c++) {
      if ((r < 7 && c < 7) || (r < 7 && c >= mods - 7) || (r >= mods - 7 && c < 7)) continue;
      if (bit(r, c)) ctx.fillRect(c * ms, r * ms, ms - 0.5, ms - 0.5);
    }
  }
  const drawFinder = (sx, sy) => {
    ctx.fillStyle = '#1e1e2e'; ctx.fillRect(sx, sy, 7 * ms, 7 * ms);
    ctx.fillStyle = '#fff'; ctx.fillRect(sx + ms, sy + ms, 5 * ms, 5 * ms);
    ctx.fillStyle = '#1e1e2e'; ctx.fillRect(sx + 2 * ms, sy + 2 * ms, 3 * ms, 3 * ms);
  };
  drawFinder(0, 0);
  drawFinder((mods - 7) * ms, 0);
  drawFinder(0, (mods - 7) * ms);
}

function downloadQR() {
  const user = currentUser(); if (!user) return;
  const link = document.createElement('a');
  link.download = 'healthid-' + user.id + '.png';
  link.href = document.getElementById('qr-canvas').toDataURL();
  link.click();
}

function shareQR() {
  const user = currentUser(); if (!user) return;
  if (navigator.share) {
    navigator.share({
      title: user.name + "'s Emergency Health ID",
      text: 'Patient ID: ' + user.id + '\nBlood Group: ' + (user.bloodGroup || 'Unknown'),
    });
  } else {
    showToast('Sharing not supported on this device');
  }
}

// ── XSS-safe HTML escape ──────────────────────────────────────
function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Init ──────────────────────────────────────────────────────
(function init() {
  showPage(currentUser() ? 'dashboard' : 'login');
})();