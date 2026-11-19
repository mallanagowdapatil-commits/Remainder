/**
 * MediTrack - Dashboard Controller & Application Router
 * Manages view routing, user profile, dose timeline rendering, adherence calculation, and session state.
 */

document.addEventListener('DOMContentLoaded', async () => {
  initNavigation();
  initSidebarMobileToggle();
  await initUserSnippet();
  initProfileForm();
  initDoseAcknowledgement();
  initHistoryFilters();
  initQuickLanguage();
  initLogout();
  checkSupabaseConnectionStatus();
});

// View Navigation & Router
function initNavigation() {
  const navLinks = document.querySelectorAll('.menu-link[data-target]');
  const views = document.querySelectorAll('.view-section');
  const viewTitle = document.getElementById('current-view-title');
  const viewDesc = document.getElementById('current-view-desc');

  const viewDescriptions = {
    'dashboard-view': { title: 'Patient Dashboard', desc: 'Overview of daily schedules, adherence and pending acknowledgements' },
    'medicines-view': { title: 'My Medications', desc: 'Manage your active medications, dosages and schedule timings' },
    'add-medicine-view': { title: 'Add New Medication', desc: 'Create a new prescription schedule with custom reminders' },
    'ocr-view': { title: 'Prescription OCR Scanner', desc: 'Extract medication details from doctor prescriptions using Tesseract.js' },
    'history-view': { title: 'Medication History & Reports', desc: 'Comprehensive log of acknowledged doses and adherence analytics' },
    'caregiver-view': { title: 'Caregiver Hub', desc: 'Securely link caregivers and monitor patient adherence status' },
    'pharmacy-view': { title: 'Pharmacy Access', desc: 'Quick access to official licensed online pharmacy portals' },
    'blockchain-view': { title: 'Verification Hub', desc: 'Verify cryptographic SHA-256 event integrity against Sepolia testnet' },
    'language-view': { title: 'Language Settings', desc: 'Switch application language between English, Kannada and Hindi' },
    'profile-view': { title: 'User Profile & Preferences', desc: 'Manage personal medical information and settings' }
  };

  function switchView(targetId) {
    if (!targetId) return;

    views.forEach(v => v.classList.remove('active-view'));
    navLinks.forEach(l => l.classList.remove('active'));

    const activeView = document.getElementById(targetId);
    if (activeView) {
      activeView.classList.add('active-view');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    const activeLink = document.querySelector(`.menu-link[data-target="${targetId}"]`);
    if (activeLink) {
      activeLink.classList.add('active');
    }

    if (viewDescriptions[targetId] && viewTitle && viewDesc) {
      viewTitle.textContent = viewDescriptions[targetId].title;
      viewDesc.textContent = viewDescriptions[targetId].desc;
    }

    if (targetId === 'pharmacy-view' && typeof PharmacyModule !== 'undefined') {
      PharmacyModule.renderRefillRecommendations();
    }

    if (targetId === 'caregiver-view' && typeof CaregiverEngine !== 'undefined') {
      CaregiverEngine.renderCurrentView();
    }

    if (targetId === 'blockchain-view' && typeof BlockchainService !== 'undefined') {
      BlockchainService.renderEventSubmissionQueue();
    }

    closeMobileSidebar();
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('data-target');
      switchView(target);
      window.location.hash = target.replace('-view', '');
    });
  });

  const hash = window.location.hash.replace('#', '');
  if (hash) {
    const matchingTarget = `${hash}-view`;
    if (document.getElementById(matchingTarget)) {
      switchView(matchingTarget);
    }
  }
}

// Mobile Sidebar Drawer
function initSidebarMobileToggle() {
  const sidebar = document.getElementById('app-sidebar');
  const toggleBtn = document.getElementById('sidebar-toggle');
  const backdrop = document.getElementById('sidebar-backdrop');

  if (!sidebar || !toggleBtn || !backdrop) return;

  toggleBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    backdrop.classList.toggle('open');
  });

  backdrop.addEventListener('click', () => {
    closeMobileSidebar();
  });
}

function closeMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar && backdrop) {
    sidebar.classList.remove('open');
    backdrop.classList.remove('open');
  }
}

// User Profile Snippet in Sidebar & Session Management
async function initUserSnippet() {
  let user = StorageHelper.get('med_app_user', {
    name: 'Patient User',
    email: 'user@example.com',
    role: 'patient',
    age: 28,
    blood_group: 'O+',
    clinical_notes: 'Regular blood pressure monitoring.'
  });

  if (typeof SupabaseService !== 'undefined' && SupabaseService.hasActiveConfig()) {
    try {
      const session = await SupabaseService.getSession();
      if (session && session.user) {
        const liveProfile = await SupabaseService.getProfile(session.user.id);
        if (liveProfile) {
          user = {
            id: session.user.id,
            email: session.user.email,
            name: liveProfile.full_name || session.user.email.split('@')[0],
            role: liveProfile.role || 'patient',
            age: liveProfile.age || user.age,
            blood_group: liveProfile.blood_group || user.blood_group,
            clinical_notes: liveProfile.clinical_notes || user.clinical_notes
          };
          StorageHelper.set('med_app_user', user);
        }
      }
    } catch (e) {
      console.warn('[Dashboard] Error restoring live Supabase profile:', e);
    }
  }

  const userNameEl = document.getElementById('sidebar-user-name');
  const userRoleEl = document.getElementById('sidebar-user-role');
  const userAvatarEl = document.getElementById('sidebar-user-avatar');

  if (userNameEl) userNameEl.textContent = user.name;
  if (userRoleEl) userRoleEl.textContent = (user.role || 'patient').toUpperCase();
  if (userAvatarEl) {
    const initials = (user.name || 'User').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    userAvatarEl.textContent = initials || 'P';
  }

  const profNameInput = document.getElementById('profile-name');
  const profEmailInput = document.getElementById('profile-email');
  const profAgeInput = document.getElementById('profile-age');
  const profBloodInput = document.getElementById('profile-blood');
  const profNotesInput = document.getElementById('profile-notes');

  if (profNameInput) profNameInput.value = user.name || '';
  if (profEmailInput) profEmailInput.value = user.email || '';
  if (profAgeInput) profAgeInput.value = user.age || '';
  if (profBloodInput) profBloodInput.value = user.blood_group || '';
  if (profNotesInput) profNotesInput.value = user.clinical_notes || '';
}

// User Profile Form Update Handler
function initProfileForm() {
  const profileForm = document.getElementById('profile-form');
  if (!profileForm) return;

  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('profile-name')?.value.trim();
    const age = parseInt(document.getElementById('profile-age')?.value, 10);
    const bloodGroup = document.getElementById('profile-blood')?.value.trim();
    const clinicalNotes = document.getElementById('profile-notes')?.value.trim();

    const currentUser = StorageHelper.get('med_app_user', {});
    const updatedProfile = {
      ...currentUser,
      name: name || currentUser.name,
      full_name: name || currentUser.name,
      age: isNaN(age) ? null : age,
      blood_group: bloodGroup,
      clinical_notes: clinicalNotes
    };

    if (typeof SupabaseService !== 'undefined' && SupabaseService.hasActiveConfig() && currentUser.id) {
      Toast.show('Syncing profile updates with Supabase...', 'info', 'Database Sync');
      const res = await SupabaseService.updateProfile(currentUser.id, {
        full_name: updatedProfile.name,
        age: updatedProfile.age,
        blood_group: updatedProfile.blood_group,
        clinical_notes: updatedProfile.clinical_notes
      });

      if (res.success) {
        StorageHelper.set('med_app_user', updatedProfile);
        initUserSnippet();
        Toast.show('Profile updated in Supabase successfully!', 'success', 'Saved');
      } else {
        Toast.show(res.error || 'Failed to update profile.', 'error', 'Error');
      }
    } else {
      StorageHelper.set('med_app_user', updatedProfile);
      initUserSnippet();
      Toast.show('Profile updated successfully.', 'success', 'Profile Updated');
    }
  });
}

// ========================================================
// DYNAMIC TODAY'S SCHEDULE TIMELINE & ADHERENCE
// ========================================================

function renderDashboardScheduleTimeline(medicines) {
  const container = document.getElementById('today-timeline-container');
  const activeMedsStat = document.getElementById('stat-active-meds');
  const todayDosesStat = document.getElementById('stat-today-doses');
  const pendingStat = document.getElementById('stat-pending-count');
  const pendingBadge = document.getElementById('pending-badge-count');

  if (!container) return;

  if (activeMedsStat) {
    activeMedsStat.textContent = medicines.filter(m => m.is_active !== false).length;
  }

  // Flatten active medicines into individual scheduled doses for today
  let todayDoses = [];
  medicines.forEach(med => {
    if (med.is_active !== false) {
      (med.timings || ['08:00']).forEach(time => {
        todayDoses.push({
          medId: med.id,
          name: med.name,
          dosage: med.dosage,
          form_type: med.form_type,
          instructions: med.instructions,
          time: time
        });
      });
    }
  });

  // Sort chronologically
  todayDoses.sort((a, b) => a.time.localeCompare(b.time));

  if (todayDosesStat) {
    todayDosesStat.textContent = todayDoses.length;
  }

  if (todayDoses.length === 0) {
    container.innerHTML = `
      <div class="card text-center text-muted" style="padding: 2.5rem 1rem;">
        <p>No doses scheduled for today.</p>
        <button class="btn btn-primary btn-sm" onclick="document.querySelector('.menu-link[data-target=\\'add-medicine-view\\']').click()">
          Add Your First Medication
        </button>
      </div>
    `;
    if (pendingStat) pendingStat.textContent = '0';
    if (pendingBadge) pendingBadge.textContent = '0';
    updateDashboardCounters();
    return;
  }

  container.innerHTML = '';

  // Retrieve today's recorded events from ReminderEngine or LocalStorage
  const today = new Date().toISOString().split('T')[0];
  const storedEvents = StorageHelper.get(`med_events_${today}`, []);
  const eventMap = {};
  storedEvents.forEach(e => {
    eventMap[`${e.medId}_${e.time}`] = e;
  });

  todayDoses.forEach((dose, index) => {
    const doseKey = `${dose.medId}_${dose.time}`;
    let status = 'PENDING';
    let ackRecord = null;

    if (typeof ReminderEngine !== 'undefined') {
      if (ReminderEngine.acknowledgedDoses[doseKey]) {
        status = 'TAKEN';
        ackRecord = ReminderEngine.acknowledgedDoses[doseKey];
      } else if (ReminderEngine.missedDoses[doseKey]) {
        status = 'MISSED';
        ackRecord = ReminderEngine.missedDoses[doseKey];
      }
    }

    if (status === 'PENDING' && eventMap[doseKey]) {
      status = eventMap[doseKey].status;
      ackRecord = eventMap[doseKey];
    }

    const card = document.createElement('div');
    card.className = `dose-card status-${status.toLowerCase()}`;
    card.setAttribute('data-medicine-name', dose.name);
    card.setAttribute('data-medicine-id', dose.medId);
    card.setAttribute('data-dosage', dose.dosage);
    card.setAttribute('data-time', dose.time);
    card.setAttribute('data-dose-index', index);

    const timePeriod = getTimePeriodLabel(dose.time);
    const timeFormatted = formatTime12Hour(dose.time);

    let statusBadgeHtml = '';
    let checkboxHtml = '';
    let actionsHtml = '';

    if (status === 'TAKEN') {
      statusBadgeHtml = `<span class="badge badge-taken dose-status-badge"><span class="badge-dot"></span> Taken</span>`;
      checkboxHtml = `
        <label class="checkbox-ack-container">
          <input type="checkbox" class="dose-checkbox" checked disabled>
          <span class="checkbox-ack-label">Confirmed Taken</span>
        </label>
      `;
      actionsHtml = ``;
    } else if (status === 'MISSED') {
      statusBadgeHtml = `<span class="badge badge-missed dose-status-badge"><span class="badge-dot"></span> Missed</span>`;
      checkboxHtml = `
        <label class="checkbox-ack-container">
          <input type="checkbox" class="dose-checkbox" disabled>
          <span class="checkbox-ack-label">Marked as Missed</span>
        </label>
      `;
      actionsHtml = ``;
    } else {
      statusBadgeHtml = `<span class="badge badge-pending dose-status-badge"><span class="badge-dot"></span> Pending</span>`;
      checkboxHtml = `
        <label class="checkbox-ack-container">
          <input type="checkbox" class="dose-checkbox">
          <span class="checkbox-ack-label">I have taken this medicine</span>
        </label>
      `;
      actionsHtml = `
        <div class="dose-actions-secondary">
          <button class="btn btn-secondary btn-sm btn-snooze" title="Snooze reminder">Snooze</button>
          <button class="btn btn-outline btn-sm btn-missed" title="Mark as missed">Missed</button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="dose-time-box">
        <span class="dose-time-label">${timePeriod}</span>
        <span>${timeFormatted}</span>
      </div>
      <div class="dose-details">
        <div class="dose-name">
          ${escapeHtml(dose.name)}
          ${statusBadgeHtml}
        </div>
        <div class="dose-meta">
          <span><strong>Dosage:</strong> ${escapeHtml(dose.dosage)} (${escapeHtml(dose.form_type || 'Oral')})</span>
          <span>•</span>
          <span><strong>Instructions:</strong> ${escapeHtml(dose.instructions || 'Take as instructed')}</span>
        </div>
      </div>
      <div class="dose-ack-zone">
        ${checkboxHtml}
        ${actionsHtml}
      </div>
    `;

    container.appendChild(card);
  });

  updateDashboardCounters();

  // Re-attach acknowledgement listeners to newly rendered cards
  initDoseAcknowledgement();
}

function getTimePeriodLabel(time24) {
  if (!time24) return 'Scheduled';
  const hour = parseInt(time24.split(':')[0], 10);
  if (hour < 12) return 'Morning';
  if (hour < 16) return 'Afternoon';
  if (hour < 20) return 'Evening';
  return 'Night';
}

// Dose Checkbox Acknowledgement & Snooze / Missed Handlers
function initDoseAcknowledgement() {
  const checkboxes = document.querySelectorAll('.dose-checkbox');

  checkboxes.forEach(cb => {
    if (cb.dataset.bound === 'true') return;
    cb.dataset.bound = 'true';

    cb.addEventListener('change', async () => {
      const card = cb.closest('.dose-card');
      const medName = card.getAttribute('data-medicine-name') || 'Medication';
      const scheduledTime = card.getAttribute('data-time') || '09:00';
      const medId = card.getAttribute('data-medicine-id');

      if (cb.checked) {
        const confirmed = confirm(
          `Confirm dose intake for ${medName} scheduled at ${formatTime12Hour(scheduledTime)}?`
        );

        if (confirmed) {
          cb.disabled = true;
          const med = (typeof activeMedicines !== 'undefined' ? activeMedicines : []).find(m => m.id === medId || m.name === medName) || {
            id: medId || 'med_' + Date.now(),
            name: medName,
            dosage: card.getAttribute('data-dosage') || '1 Dose'
          };

          if (typeof ReminderEngine !== 'undefined') {
            await ReminderEngine.acknowledgeDose(med, scheduledTime);
          } else {
            card.classList.remove('status-pending', 'status-missed');
            card.classList.add('status-taken');
            const badge = card.querySelector('.dose-status-badge');
            if (badge) {
              badge.className = 'badge badge-taken dose-status-badge';
              badge.innerHTML = '<span class="badge-dot"></span> Taken';
            }
            const label = card.querySelector('.checkbox-ack-label');
            if (label) label.textContent = 'Confirmed Taken';
            updateDashboardCounters();
          }
        } else {
          cb.checked = false;
        }
      }
    });
  });

  // Snooze Button Handlers
  document.querySelectorAll('.btn-snooze').forEach(btn => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', () => {
      const card = btn.closest('.dose-card');
      const medName = card.getAttribute('data-medicine-name');
      const minutes = prompt('Enter snooze duration in minutes (5, 10, or 15):', '10');
      if (minutes && !isNaN(minutes)) {
        const minsNum = parseInt(minutes, 10);
        const medId = card.getAttribute('data-medicine-id');
        const scheduledTime = card.getAttribute('data-time') || '09:00';
        if (typeof ReminderEngine !== 'undefined') {
          ReminderEngine.snoozedDoses[`${medId}_${scheduledTime}`] = {
            snoozedUntil: Date.now() + minsNum * 60 * 1000,
            intervalMins: minsNum
          };
        }
        Toast.show(`Reminder for ${medName} snoozed for ${minsNum} minutes. Dose remains PENDING.`, 'warning', 'Snoozed');
      }
    });
  });

  // Mark as Missed Handlers
  document.querySelectorAll('.btn-missed').forEach(btn => {
    if (btn.dataset.bound === 'true') return;
    btn.dataset.bound = 'true';

    btn.addEventListener('click', async () => {
      const card = btn.closest('.dose-card');
      const medName = card.getAttribute('data-medicine-name');
      const scheduledTime = card.getAttribute('data-time') || '09:00';
      const medId = card.getAttribute('data-medicine-id');

      const confirmed = confirm(`Are you sure you want to mark ${medName} as MISSED?`);
      if (confirmed) {
        const med = (typeof activeMedicines !== 'undefined' ? activeMedicines : []).find(m => m.id === medId || m.name === medName) || {
          id: medId || 'med_' + Date.now(),
          name: medName,
          dosage: card.getAttribute('data-dosage') || '1 Dose'
        };

        if (typeof ReminderEngine !== 'undefined') {
          await ReminderEngine.recordMissedDose(med, scheduledTime, 'Marked missed on timeline');
        } else {
          card.classList.remove('status-pending', 'status-taken');
          card.classList.add('status-missed');
          const badge = card.querySelector('.dose-status-badge');
          if (badge) {
            badge.className = 'badge badge-missed dose-status-badge';
            badge.innerHTML = '<span class="badge-dot"></span> Missed';
          }
          const cb = card.querySelector('.dose-checkbox');
          if (cb) { cb.checked = false; cb.disabled = true; }
          updateDashboardCounters();
        }
      }
    });
  });
}

// Calculate pending doses and strict adherence score: Taken / (Taken + Missed) * 100
function updateDashboardCounters() {
  const container = document.getElementById('today-timeline-container');
  const pendingStat = document.getElementById('stat-pending-count');
  const pendingBadge = document.getElementById('pending-badge-count');
  const adherenceStat = document.getElementById('dash-adherence-stat');

  let pendingCount = 0;
  let takenCount = 0;
  let missedCount = 0;

  if (container) {
    const cards = container.querySelectorAll('.dose-card');
    cards.forEach(card => {
      if (card.classList.contains('status-pending')) pendingCount++;
      else if (card.classList.contains('status-taken')) takenCount++;
      else if (card.classList.contains('status-missed')) missedCount++;
    });
  }

  if (pendingStat) pendingStat.textContent = pendingCount;
  if (pendingBadge) pendingBadge.textContent = pendingCount;

  if (adherenceStat) {
    const totalRecorded = takenCount + missedCount;
    if (totalRecorded === 0) {
      adherenceStat.textContent = '100%';
    } else {
      const adherence = Math.round((takenCount / totalRecorded) * 100);
      adherenceStat.textContent = `${adherence}%`;
    }
  }
}

// Medication History Filter Pills
function initHistoryFilters() {
  const filterButtons = document.querySelectorAll('.history-filter-btn');
  const historyRows = document.querySelectorAll('.history-row');

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('btn-primary'));
      filterButtons.forEach(b => b.classList.add('btn-secondary'));
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');

      const filter = btn.getAttribute('data-filter');

      historyRows.forEach(row => {
        const status = row.getAttribute('data-status');
        if (filter === 'all' || status === filter) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });

      Toast.show(`Filtered records: ${filter.toUpperCase()}`, 'info', 'Filter Applied', 1500);
    });
  });
}

// Quick Language Switcher
function initQuickLanguage() {
  const langSelect = document.getElementById('language-select');
  if (langSelect && typeof I18n !== 'undefined') {
    langSelect.value = I18n.currentLang || 'en';
  }
}

// Logout & Session Revocation
function initLogout() {
  const logoutLinks = document.querySelectorAll('.logout-trigger');

  logoutLinks.forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();

      const confirmed = confirm('Are you sure you want to sign out?');
      if (confirmed) {
        if (typeof SupabaseService !== 'undefined' && SupabaseService.hasActiveConfig()) {
          await SupabaseService.signOut();
        }

        StorageHelper.remove('med_app_session');
        Toast.show('Signed out successfully. Redirecting to login...', 'info', 'Session Ended');
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 800);
      }
    });
  });
}

// Real-time Supabase Connection Banner
async function checkSupabaseConnectionStatus() {
  const pill = document.getElementById('connection-status-pill');
  if (!pill) return;

  if (typeof SupabaseService === 'undefined' || !SupabaseService.hasActiveConfig()) {
    pill.className = 'status-pill status-demo';
    pill.innerHTML = '<span class="status-dot"></span> Local Storage';
    pill.title = 'Running in offline local storage mode. Connect Supabase credentials in config.js for cloud persistence.';
    return;
  }

  try {
    const isConnected = await SupabaseService.testConnection();
    if (isConnected) {
      pill.className = 'status-pill status-connected';
      pill.innerHTML = '<span class="status-dot"></span> Cloud Active';
      pill.title = 'Connected to Supabase PostgreSQL Database with Row Level Security.';
    } else {
      pill.className = 'status-pill status-disconnected';
      pill.innerHTML = '<span class="status-dot"></span> Local Mode';
      pill.title = 'Supabase credentials configured, but service is currently unreachable. Operating with local caching.';
    }
  } catch (err) {
    pill.className = 'status-pill status-disconnected';
    pill.innerHTML = '<span class="status-dot"></span> Local Mode';
  }
}
