/**
 * MediTrack - Medicine Reminder & Acknowledgement Engine
 * Handles scheduled dose alerts, explicit checkbox intake verification,
 * snooze / dismissal controls, deadline tracking, and deterministic event hashing.
 */

const ReminderEngine = {
  activeTimer: null,
  snoozedDoses: {},       // key: doseKey -> { snoozedUntil, intervalMins }
  dismissedDoses: {},     // key: doseKey -> timestamp until which reminder is suppressed
  acknowledgedDoses: {},  // key: doseKey -> eventRecord (status: 'TAKEN')
  missedDoses: {},        // key: doseKey -> eventRecord (status: 'MISSED')
  audioContext: null,
  notificationsAllowed: false,
  currentModalDoseKey: null,

  /**
   * Initialize Reminder Engine
   */
  async init() {
    this.loadPersistedEvents();
    this.initNotificationButton();
    this.initReminderModal();
    this.checkOverdueDosesOnLoad();
    this.startSchedulerLoop();
    console.log('[ReminderEngine] Medicine Reminder Subsystem Initialized.');
  },

  /**
   * Load today's persisted dose events from Storage
   */
  loadPersistedEvents() {
    const today = new Date().toISOString().split('T')[0];
    const storedEvents = StorageHelper.get(`med_events_${today}`, []);
    storedEvents.forEach(ev => {
      const key = `${ev.medId}_${ev.time}`;
      if (ev.status === 'TAKEN') {
        this.acknowledgedDoses[key] = ev;
      } else if (ev.status === 'MISSED') {
        this.missedDoses[key] = ev;
      }
    });
  },

  /**
   * Persist a dose event in today's local store without overwriting past history
   */
  savePersistedEvent(eventObj) {
    const today = new Date().toISOString().split('T')[0];
    const storedEvents = StorageHelper.get(`med_events_${today}`, []);
    const filtered = storedEvents.filter(e => !(e.medId === eventObj.medId && e.time === eventObj.time));
    filtered.push(eventObj);
    StorageHelper.set(`med_events_${today}`, filtered);

    // Also append to global history list
    const historyList = StorageHelper.get('med_app_history', []);
    historyList.unshift(eventObj);
    StorageHelper.set('med_app_history', historyList);
  },

  /**
   * Check for due and overdue doses on page load
   */
  checkOverdueDosesOnLoad() {
    const medicines = typeof activeMedicines !== 'undefined' ? activeMedicines : StorageHelper.get('med_app_medicines', []);
    if (!medicines || medicines.length === 0) return;

    const now = new Date();
    const currentMinutesTotal = now.getHours() * 60 + now.getMinutes();

    medicines.forEach(med => {
      if (med.is_active === false) return;

      (med.timings || []).forEach(timeStr => {
        const [schedH, schedM] = timeStr.split(':').map(Number);
        const schedMinutesTotal = schedH * 60 + schedM;
        const doseKey = `${med.id}_${timeStr}`;

        // Already acknowledged or marked missed
        if (this.acknowledgedDoses[doseKey] || this.missedDoses[doseKey]) {
          return;
        }

        const deadlineMins = parseInt(med.confirmation_deadline_mins, 10) || 60;
        const timeDiff = currentMinutesTotal - schedMinutesTotal;

        // Overdue beyond confirmation deadline
        if (timeDiff > deadlineMins) {
          console.warn(`[ReminderEngine] Overdue dose detected on load for ${med.name} at ${timeStr}. Marking MISSED.`);
          this.recordMissedDose(med, timeStr, 'Confirmation deadline expired before intake was logged');
        }
      });
    });
  },

  /**
   * Initialize browser notification button and state
   */
  initNotificationButton() {
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        this.notificationsAllowed = true;
        this.updateNotificationPill(true);
      } else {
        this.updateNotificationPill(false);
      }
    }
  },

  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      Toast.show('This browser does not support desktop notifications.', 'warning', 'Notifications');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        this.notificationsAllowed = true;
        this.updateNotificationPill(true);
        Toast.show('Notifications enabled for scheduled dose alerts.', 'success', 'Permission Granted');
        new Notification('MediTrack Reminders', {
          body: 'Medication alerts are active. Note: alerts require browser to remain open.',
          icon: 'favicon.ico'
        });
      } else {
        this.notificationsAllowed = false;
        this.updateNotificationPill(false);
        Toast.show('Notification permission was denied. In-app alerts will be used.', 'info', 'In-App Only');
      }
    } catch (e) {
      console.warn('Notification error:', e);
    }
  },

  updateNotificationPill(enabled) {
    const btn = document.getElementById('notification-toggle-btn');
    if (btn) {
      btn.innerHTML = enabled
        ? `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg> Alerts Active`
        : `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg> Enable Alerts`;
      btn.className = enabled ? 'btn btn-teal btn-sm' : 'btn btn-secondary btn-sm';
    }
  },

  /**
   * Continuous Scheduler Loop
   * Checks for due doses, snoozed intervals, and confirmation deadlines
   */
  startSchedulerLoop() {
    if (this.activeTimer) clearInterval(this.activeTimer);

    // Initial check followed by recurring 10-second checks
    this.checkSchedules();
    this.activeTimer = setInterval(() => {
      this.checkSchedules();
    }, 10000);
  },

  checkSchedules() {
    const medicines = typeof activeMedicines !== 'undefined' ? activeMedicines : StorageHelper.get('med_app_medicines', []);
    if (!medicines || medicines.length === 0) return;

    const now = new Date();
    const currentHours = now.getHours();
    const currentMins = now.getMinutes();
    const currentMinutesTotal = currentHours * 60 + currentMins;

    medicines.forEach(med => {
      if (med.is_active === false) return;

      (med.timings || []).forEach(timeStr => {
        const [schedH, schedM] = timeStr.split(':').map(Number);
        const schedMinutesTotal = schedH * 60 + schedM;
        const doseKey = `${med.id}_${timeStr}`;

        // 1. If already TAKEN or MISSED, ignore
        if (this.acknowledgedDoses[doseKey] || this.missedDoses[doseKey]) {
          return;
        }

        const deadlineMins = parseInt(med.confirmation_deadline_mins, 10) || 60;
        const timeDiff = currentMinutesTotal - schedMinutesTotal;

        // 2. Deadline Expiry Check: If past scheduled time + deadline -> auto mark MISSED
        if (timeDiff > deadlineMins) {
          this.recordMissedDose(med, timeStr, 'Confirmation deadline expired');
          return;
        }

        // 3. Snooze Check: If currently snoozed and snooze time not reached, skip
        const snoozeInfo = this.snoozedDoses[doseKey];
        if (snoozeInfo && Date.now() < snoozeInfo.snoozedUntil) {
          return;
        }

        // 4. Dismiss Cooldown Check: Suppress recurring popups for 5 minutes after dismiss
        const dismissedUntil = this.dismissedDoses[doseKey];
        if (dismissedUntil && Date.now() < dismissedUntil) {
          return;
        }

        // 5. Dose Due Check: Window of 0 to +deadlineMins
        if (timeDiff >= 0 && timeDiff <= deadlineMins) {
          if (!this.isModalActiveFor(doseKey)) {
            this.triggerDoseReminder(med, timeStr);
          }
        }
      });
    });
  },

  isModalActiveFor(doseKey) {
    const modal = document.getElementById('dose-reminder-modal');
    return modal && modal.classList.contains('active') && this.currentModalDoseKey === doseKey;
  },

  /**
   * Trigger in-app modal, notification, and acoustic chime
   */
  triggerDoseReminder(med, timeStr) {
    this.currentModalDoseKey = `${med.id}_${timeStr}`;

    const modal = document.getElementById('dose-reminder-modal');
    if (!modal) return;

    // Fill modal fields
    const nameEl = document.getElementById('modal-dose-med-name');
    const amtEl = document.getElementById('modal-dose-amount');
    const timeEl = document.getElementById('modal-dose-time');
    const instrEl = document.getElementById('modal-dose-instructions');

    if (nameEl) nameEl.textContent = med.name;
    if (amtEl) amtEl.textContent = `${med.dosage} (${med.form_type || 'Oral'})`;
    if (timeEl) timeEl.textContent = formatTime12Hour(timeStr);
    if (instrEl) instrEl.textContent = med.instructions || 'Take as instructed.';

    // Reset explicit checkbox
    const cb = document.getElementById('modal-ack-checkbox');
    if (cb) {
      cb.checked = false;
      cb.disabled = false;
    }

    // Play synthesized chime
    this.playReminderChime();

    // Show desktop notification if allowed
    if (this.notificationsAllowed && document.hidden) {
      try {
        new Notification(`Medication Reminder: ${med.name}`, {
          body: `Scheduled for ${formatTime12Hour(timeStr)}: ${med.dosage}. Please confirm intake.`,
          icon: 'favicon.ico',
          tag: `med_${med.id}_${timeStr}`
        });
      } catch (e) {
        console.warn('Desktop notification dispatch failed:', e);
      }
    }

    // Open modal
    Modal.open('dose-reminder-modal');
  },

  /**
   * Synthesize audio chime using Web Audio API (Pure JS, zero external dependencies)
   */
  playReminderChime() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!this.audioContext) {
        this.audioContext = new AudioCtx();
      }
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume();
      }

      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, this.audioContext.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.15); // A5

      gain.gain.setValueAtTime(0.25, this.audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(this.audioContext.destination);

      osc.start();
      osc.stop(this.audioContext.currentTime + 0.6);
    } catch (e) {
      // Browsers may block audio before first user interaction
    }
  },

  /**
   * Modal Button Handlers & Checkbox Acknowledgement
   */
  initReminderModal() {
    const cb = document.getElementById('modal-ack-checkbox');
    const snooze5Btn = document.getElementById('modal-snooze-5');
    const snooze10Btn = document.getElementById('modal-snooze-10');
    const snooze15Btn = document.getElementById('modal-snooze-15');
    const dismissBtn = document.getElementById('modal-dismiss-btn');
    const missedBtn = document.getElementById('modal-missed-btn');

    // 1. EXPLICIT CHECKBOX INTAKE ACKNOWLEDGEMENT
    if (cb && !cb.dataset.bound) {
      cb.dataset.bound = 'true';
      cb.addEventListener('change', async () => {
        if (cb.checked && this.currentModalDoseKey) {
          const [medId, timeStr] = this.currentModalDoseKey.split('_');
          const med = (typeof activeMedicines !== 'undefined' ? activeMedicines : []).find(m => m.id === medId);
          if (!med) return;

          const confirmed = confirm(`Confirm intake of ${med.name} (${med.dosage}) scheduled at ${formatTime12Hour(timeStr)}?`);

          if (confirmed) {
            cb.disabled = true;
            await this.acknowledgeDose(med, timeStr);
            Modal.close('dose-reminder-modal');
          } else {
            cb.checked = false;
          }
        }
      });
    }

    // 2. SNOOZE ACTIONS (5, 10, 15 min) - Dose strictly remains PENDING
    const handleSnooze = (minutes) => {
      if (!this.currentModalDoseKey) return;
      const [medId, timeStr] = this.currentModalDoseKey.split('_');
      const med = (typeof activeMedicines !== 'undefined' ? activeMedicines : []).find(m => m.id === medId);
      const name = med ? med.name : 'Medication';

      this.snoozedDoses[this.currentModalDoseKey] = {
        snoozedUntil: Date.now() + minutes * 60 * 1000,
        intervalMins: minutes
      };

      Modal.close('dose-reminder-modal');
      Toast.show(
        `Reminder for ${name} snoozed for ${minutes} minutes. Dose remains PENDING.`,
        'warning',
        'Snoozed',
        3500
      );
    };

    if (snooze5Btn && !snooze5Btn.dataset.bound) {
      snooze5Btn.dataset.bound = 'true';
      snooze5Btn.addEventListener('click', () => handleSnooze(5));
    }
    if (snooze10Btn && !snooze10Btn.dataset.bound) {
      snooze10Btn.dataset.bound = 'true';
      snooze10Btn.addEventListener('click', () => handleSnooze(10));
    }
    if (snooze15Btn && !snooze15Btn.dataset.bound) {
      snooze15Btn.dataset.bound = 'true';
      snooze15Btn.addEventListener('click', () => handleSnooze(15));
    }

    // 3. DISMISS ACTION - Does NOT mark dose as taken, suppresses popup for 5 min
    if (dismissBtn && !dismissBtn.dataset.bound) {
      dismissBtn.dataset.bound = 'true';
      dismissBtn.addEventListener('click', () => {
        if (this.currentModalDoseKey) {
          // Suppress alert for 5 minutes so it doesn't pop up again immediately
          this.dismissedDoses[this.currentModalDoseKey] = Date.now() + 5 * 60 * 1000;
        }
        Modal.close('dose-reminder-modal');
        Toast.show(
          'Reminder dismissed. Dismissing does NOT mark medicine as taken. Status remains PENDING.',
          'info',
          'Dismissed',
          3500
        );
      });
    }

    // 4. MARK MISSED ACTION
    if (missedBtn && !missedBtn.dataset.bound) {
      missedBtn.dataset.bound = 'true';
      missedBtn.addEventListener('click', () => {
        if (!this.currentModalDoseKey) return;
        const [medId, timeStr] = this.currentModalDoseKey.split('_');
        const med = (typeof activeMedicines !== 'undefined' ? activeMedicines : []).find(m => m.id === medId);
        if (!med) return;

        const confirmed = confirm(`Are you sure you want to mark ${med.name} scheduled at ${formatTime12Hour(timeStr)} as MISSED?`);
        if (confirmed) {
          this.recordMissedDose(med, timeStr, 'Marked missed by user');
          Modal.close('dose-reminder-modal');
        }
      });
    }
  },

  /**
   * Explicitly Acknowledge a Dose as TAKEN
   */
  async acknowledgeDose(med, timeStr) {
    const doseKey = `${med.id}_${timeStr}`;

    // Prevent duplicate acknowledgement
    if (this.acknowledgedDoses[doseKey]) {
      Toast.show(`Dose for ${med.name} at ${timeStr} is already recorded as TAKEN.`, 'info', 'Already Recorded');
      return;
    }

    const nowIso = new Date().toISOString();
    const scheduledIso = `${nowIso.split('T')[0]}T${timeStr}:00Z`;

    // 1. Generate Deterministic Canonical SHA-256 Event Hash (Web Crypto API)
    const canonicalPayload = `v1|${med.id}|${scheduledIso}|${nowIso}|TAKEN`;
    const eventHash = await this.generateSha256(canonicalPayload);

    const eventRecord = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'evt_' + Date.now(),
      medId: med.id,
      medName: med.name,
      dosage: med.dosage,
      time: timeStr,
      scheduled_for: scheduledIso,
      acknowledged_at: nowIso,
      status: 'TAKEN',
      event_hash: eventHash,
      blockchain_status: 'PENDING_VERIFICATION'
    };

    // Store in active cache & local storage
    this.acknowledgedDoses[doseKey] = eventRecord;
    delete this.snoozedDoses[doseKey];
    delete this.dismissedDoses[doseKey];
    this.savePersistedEvent(eventRecord);

    // Save to Supabase or queue in OfflineEngine IndexedDB
    const user = StorageHelper.get('med_app_user', {});
    if (navigator.onLine && typeof SupabaseService !== 'undefined' && user.id && SupabaseService.hasActiveConfig()) {
      try {
        await SupabaseService.recordMedicationEvent(user.id, eventRecord);
      } catch (err) {
        console.warn('[Reminders] Network failure recording event, queuing offline:', err);
        if (typeof OfflineEngine !== 'undefined') {
          await OfflineEngine.queueOfflineEvent(eventRecord);
        }
      }
    } else if (typeof OfflineEngine !== 'undefined') {
      await OfflineEngine.queueOfflineEvent(eventRecord);
    }

    // Update Dashboard UI Immediately
    this.updateTimelineCardStatus(med.id, timeStr, 'TAKEN', nowIso, eventHash);
    if (typeof updateDashboardCounters === 'function') {
      updateDashboardCounters();
    }

    if (typeof window.loadAndRenderHistory === 'function') {
      window.loadAndRenderHistory();
    }

    Toast.show(
      `Recorded ${med.name} as TAKEN. Adherence updated.`,
      'success',
      'Dose Confirmed',
      4000
    );
  },

  /**
   * Record a Dose as MISSED
   */
  async recordMissedDose(med, timeStr, reason = '') {
    const doseKey = `${med.id}_${timeStr}`;

    // Prevent duplicate recording
    if (this.missedDoses[doseKey] || this.acknowledgedDoses[doseKey]) {
      return;
    }

    const nowIso = new Date().toISOString();
    const scheduledIso = `${nowIso.split('T')[0]}T${timeStr}:00Z`;

    const canonicalPayload = `v1|${med.id}|${scheduledIso}|${nowIso}|MISSED`;
    const eventHash = await this.generateSha256(canonicalPayload);

    const eventRecord = {
      id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'evt_' + Date.now(),
      medId: med.id,
      medName: med.name,
      dosage: med.dosage,
      time: timeStr,
      scheduled_for: scheduledIso,
      acknowledged_at: null,
      status: 'MISSED',
      notes: reason,
      event_hash: eventHash,
      blockchain_status: 'PENDING_VERIFICATION'
    };

    this.missedDoses[doseKey] = eventRecord;
    delete this.snoozedDoses[doseKey];
    delete this.dismissedDoses[doseKey];
    this.savePersistedEvent(eventRecord);

    const user = StorageHelper.get('med_app_user', {});
    if (navigator.onLine && typeof SupabaseService !== 'undefined' && user.id && SupabaseService.hasActiveConfig()) {
      try {
        await SupabaseService.recordMedicationEvent(user.id, eventRecord);
      } catch (err) {
        console.warn('[Reminders] Network failure recording missed event, queuing offline:', err);
        if (typeof OfflineEngine !== 'undefined') {
          await OfflineEngine.queueOfflineEvent(eventRecord);
        }
      }
    } else if (typeof OfflineEngine !== 'undefined') {
      await OfflineEngine.queueOfflineEvent(eventRecord);
    }

    this.updateTimelineCardStatus(med.id, timeStr, 'MISSED', null, eventHash);
    if (typeof updateDashboardCounters === 'function') {
      updateDashboardCounters();
    }

    if (typeof window.loadAndRenderHistory === 'function') {
      window.loadAndRenderHistory();
    }

    Toast.show(`Marked ${med.name} (${formatTime12Hour(timeStr)}) as MISSED.`, 'error', 'Missed Dose Logged');
  },

  /**
   * Update visual state of dose card in Today's Timeline
   */
  updateTimelineCardStatus(medId, timeStr, status, ackTime = null, hash = null) {
    const container = document.getElementById('today-timeline-container');
    if (!container) return;

    const cards = container.querySelectorAll('.dose-card');
    cards.forEach(card => {
      const cardTime = card.getAttribute('data-time');
      const cardId = card.getAttribute('data-medicine-id');

      if (cardTime === timeStr && (!cardId || cardId === medId)) {
        card.classList.remove('status-pending', 'status-taken', 'status-missed');
        card.classList.add(`status-${status.toLowerCase()}`);

        const badge = card.querySelector('.dose-status-badge');
        if (badge) {
          badge.className = `badge badge-${status.toLowerCase()} dose-status-badge`;
          badge.innerHTML = `<span class="badge-dot"></span> ${status}`;
        }

        const cb = card.querySelector('.dose-checkbox');
        const cbLabel = card.querySelector('.checkbox-ack-label');
        if (cb) {
          cb.checked = (status === 'TAKEN');
          cb.disabled = true;
        }

        if (cbLabel) {
          cbLabel.textContent = status === 'TAKEN' ? 'Confirmed Taken' : 'Marked as Missed';
        }

        // Hide snooze and missed buttons once acknowledged or missed
        const actionZone = card.querySelector('.dose-actions-secondary');
        if (actionZone) {
          actionZone.style.display = 'none';
        }
      }
    });
  },

  /**
   * Generate SHA-256 Hash using browser Web Crypto API
   */
  async generateSha256(message) {
    try {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return '0x' + hashHex;
    } catch (e) {
      let hash = 0;
      for (let i = 0; i < message.length; i++) {
        hash = (hash << 5) - hash + message.charCodeAt(i);
        hash |= 0;
      }
      return '0x' + Math.abs(hash).toString(16).padStart(64, '0');
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  ReminderEngine.init();
});
