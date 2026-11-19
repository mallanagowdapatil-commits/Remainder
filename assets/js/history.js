/**
 * MediTrack Pro - Medication History Controller
 * Module 05: Comprehensive Event Logging, Filtering & CSV Export
 */

let allHistoryEvents = [];

document.addEventListener('DOMContentLoaded', async () => {
  initHistoryFilters();
  initHistoryDateRange();
  initCSVExport();
  await loadAndRenderHistory();
});

/**
 * Seed initial historical records if none exist
 */
function ensureSampleHistoryEvents() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const yest = new Date();
  yest.setDate(yest.getDate() - 1);
  const yestStr = yest.toISOString().split('T')[0];

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

  let storedEvents = StorageHelper.get(`med_events_${todayStr}`, []);

  if (!storedEvents || storedEvents.length === 0) {
    storedEvents = [
      {
        id: 'hist-1',
        medId: 'med-sample-3',
        medName: 'Thyroxine Sodium',
        dosage: '50 mcg',
        time: '07:00',
        scheduled_for: `${todayStr}T07:00:00Z`,
        acknowledged_at: `${todayStr}T07:04:12Z`,
        status: 'TAKEN',
        event_hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
        blockchain_status: 'VERIFIED'
      },
      {
        id: 'hist-2',
        medId: 'med-sample-1',
        medName: 'Vitamin D3',
        dosage: '1000 IU',
        time: '09:00',
        scheduled_for: `${todayStr}T09:00:00Z`,
        acknowledged_at: null,
        status: 'PENDING',
        event_hash: null,
        blockchain_status: 'NOT_YET_RECORDED'
      },
      {
        id: 'hist-3',
        medId: 'med-sample-2',
        medName: 'Metformin HCl',
        dosage: '500 mg',
        time: '13:30',
        scheduled_for: `${todayStr}T13:30:00Z`,
        acknowledged_at: null,
        status: 'PENDING',
        event_hash: null,
        blockchain_status: 'NOT_YET_RECORDED'
      },
      {
        id: 'hist-4',
        medId: 'med-sample-4',
        medName: 'Atorvastatin',
        dosage: '10 mg',
        time: '21:00',
        scheduled_for: `${yestStr}T21:00:00Z`,
        acknowledged_at: `${yestStr}T21:12:05Z`,
        status: 'TAKEN',
        event_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        blockchain_status: 'VERIFIED'
      },
      {
        id: 'hist-5',
        medId: 'med-sample-2',
        medName: 'Metformin HCl',
        dosage: '500 mg',
        time: '14:00',
        scheduled_for: `${yestStr}T14:00:00Z`,
        acknowledged_at: null,
        status: 'MISSED',
        event_hash: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
        blockchain_status: 'VERIFIED',
        notes: 'Deadline expired (60 mins)'
      },
      {
        id: 'hist-6',
        medId: 'med-sample-3',
        medName: 'Thyroxine Sodium',
        dosage: '50 mcg',
        time: '07:00',
        scheduled_for: `${yestStr}T07:00:00Z`,
        acknowledged_at: `${yestStr}T07:02:30Z`,
        status: 'TAKEN',
        event_hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
        blockchain_status: 'VERIFIED'
      },
      {
        id: 'hist-7',
        medId: 'med-sample-1',
        medName: 'Vitamin D3',
        dosage: '1000 IU',
        time: '09:00',
        scheduled_for: `${twoDaysAgoStr}T09:00:00Z`,
        acknowledged_at: `${twoDaysAgoStr}T09:05:44Z`,
        status: 'TAKEN',
        event_hash: 'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
        blockchain_status: 'VERIFIED'
      }
    ];

    StorageHelper.set(`med_events_${todayStr}`, storedEvents);
  }

  return storedEvents;
}

/**
 * Load events and trigger Reports calculation
 */
async function loadAndRenderHistory() {
  const user = StorageHelper.get('med_app_user', {});
  const userId = user.id || null;

  ensureSampleHistoryEvents();

  if (typeof SupabaseService !== 'undefined' && SupabaseService.hasActiveConfig() && userId) {
    const remoteEvents = await SupabaseService.getMedicationEvents(userId);
    if (remoteEvents && remoteEvents.length > 0) {
      allHistoryEvents = remoteEvents.map(e => ({
        id: e.id,
        medName: e.medications ? e.medications.name : 'Medication',
        dosage: e.medications ? e.medications.dosage : '',
        time: e.scheduled_for ? e.scheduled_for.substring(11, 16) : '08:00',
        scheduled_for: e.scheduled_for,
        acknowledged_at: e.acknowledged_at,
        status: e.status,
        event_hash: e.event_hash,
        blockchain_status: e.blockchain_status,
        notes: e.notes
      }));
    } else {
      const today = new Date().toISOString().split('T')[0];
      allHistoryEvents = StorageHelper.get(`med_events_${today}`, []);
    }
  } else {
    const today = new Date().toISOString().split('T')[0];
    allHistoryEvents = StorageHelper.get(`med_events_${today}`, []);
  }

  renderHistoryTable(allHistoryEvents);

  if (typeof ReportsEngine !== 'undefined') {
    ReportsEngine.updateReportsUI(allHistoryEvents);
  }
}

/**
 * Render Historical Events Table
 */
function renderHistoryTable(events) {
  const tbody = document.getElementById('history-table-body');
  const emptyNotice = document.getElementById('history-empty-notice');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!events || events.length === 0) {
    if (emptyNotice) emptyNotice.style.display = 'block';
    return;
  }

  if (emptyNotice) emptyNotice.style.display = 'none';

  events.forEach(ev => {
    const tr = document.createElement('tr');
    tr.className = 'history-row';
    tr.setAttribute('data-status', (ev.status || 'PENDING').toLowerCase());

    const schedDate = new Date(ev.scheduled_for || Date.now());
    const schedDateFormatted = schedDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    const schedTimeFormatted = formatTime12Hour(ev.time || '08:00');

    let ackFormatted = '-';
    if (ev.status === 'TAKEN' && ev.acknowledged_at) {
      const ackDate = new Date(ev.acknowledged_at);
      ackFormatted = `${ackDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ✓`;
    } else if (ev.status === 'MISSED') {
      ackFormatted = `<span class="text-xs text-muted font-medium">${escapeHtml(ev.notes || 'Missed')}</span>`;
    } else {
      ackFormatted = `<span class="text-xs text-muted">Awaiting Action</span>`;
    }

    const statusBadgeClass = {
      'TAKEN': 'badge-taken',
      'PENDING': 'badge-pending',
      'MISSED': 'badge-missed'
    }[ev.status] || 'badge-pending';

    let bcBadgeHtml = '';
    if (ev.blockchain_status === 'VERIFIED') {
      bcBadgeHtml = `<span class="badge badge-verified" title="Hash matched on Sepolia testnet">✓ On-Chain Verified</span>`;
    } else if (ev.status === 'TAKEN' || ev.status === 'MISSED') {
      bcBadgeHtml = `<span class="badge badge-pending" title="Queued for Sepolia smart contract">Queued on Ack</span>`;
    } else {
      bcBadgeHtml = `<span class="text-xs text-muted">Not Yet Recorded</span>`;
    }

    const hashPreview = ev.event_hash
      ? `<button class="btn btn-secondary btn-sm" style="font-family: var(--font-family-mono); font-size: 0.7rem; padding: 0.2rem 0.4rem;" onclick="viewEventHashDetails('${ev.event_hash}')">${ev.event_hash.substring(0, 8)}... ↗</button>`
      : `<span class="text-xs text-muted">-</span>`;

    tr.innerHTML = `
      <td class="font-bold">${escapeHtml(ev.medName || 'Medication')}</td>
      <td>${escapeHtml(ev.dosage || '-')}</td>
      <td>${schedDateFormatted}, ${schedTimeFormatted}</td>
      <td>${ackFormatted}</td>
      <td>
        <span class="badge ${statusBadgeClass}">
          <span class="badge-dot"></span> ${ev.status}
        </span>
      </td>
      <td>${bcBadgeHtml}</td>
      <td style="text-align: right;">${hashPreview}</td>
    `;

    tbody.appendChild(tr);
  });
}

/**
 * Filter Buttons (All, Taken, Pending, Missed)
 */
function initHistoryFilters() {
  const buttons = document.querySelectorAll('.history-filter-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.remove('btn-secondary');
      btn.classList.add('btn-primary');

      const filter = btn.getAttribute('data-filter');
      filterHistory(filter, getActiveDateRange());
    });
  });
}

function initHistoryDateRange() {
  const rangeSelect = document.getElementById('history-date-range');
  if (rangeSelect) {
    rangeSelect.addEventListener('change', () => {
      const activeFilterBtn = document.querySelector('.history-filter-btn.btn-primary');
      const filter = activeFilterBtn ? activeFilterBtn.getAttribute('data-filter') : 'all';
      filterHistory(filter, rangeSelect.value);
    });
  }
}

function getActiveDateRange() {
  const select = document.getElementById('history-date-range');
  return select ? select.value : 'all';
}

function filterHistory(statusFilter, dateRange) {
  let filtered = [...allHistoryEvents];

  // 1. Status Filter
  if (statusFilter && statusFilter !== 'all') {
    filtered = filtered.filter(e => (e.status || '').toLowerCase() === statusFilter.toLowerCase());
  }

  // 2. Date Range Filter
  const now = new Date();
  if (dateRange === 'today') {
    const todayStr = now.toISOString().split('T')[0];
    filtered = filtered.filter(e => (e.scheduled_for || '').startsWith(todayStr));
  } else if (dateRange === '7days') {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(now.getDate() - 7);
    filtered = filtered.filter(e => new Date(e.scheduled_for) >= sevenDaysAgo);
  }

  renderHistoryTable(filtered);
}

/**
 * Export Medication History to CSV
 */
function initCSVExport() {
  const exportBtn = document.getElementById('export-history-csv-btn');
  if (!exportBtn) return;

  exportBtn.addEventListener('click', () => {
    if (!allHistoryEvents || allHistoryEvents.length === 0) {
      Toast.show('No history records available to export.', 'warning', 'Export');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Medicine Name,Dosage,Scheduled Date Time,Acknowledgement Time,Status,Blockchain Status,Event SHA-256 Hash\n';

    allHistoryEvents.forEach(e => {
      const row = [
        `"${e.medName || ''}"`,
        `"${e.dosage || ''}"`,
        `"${e.scheduled_for || ''}"`,
        `"${e.acknowledged_at || ''}"`,
        `"${e.status || ''}"`,
        `"${e.blockchain_status || ''}"`,
        `"${e.event_hash || ''}"`
      ];
      csvContent += row.join(',') + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `medication_adherence_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    Toast.show('Medication adherence report exported successfully to CSV.', 'success', 'Export Complete');
  });
}

function viewEventHashDetails(hash) {
  alert(
    `CANONICAL SHA-256 EVENT HASH:\n\n${hash}\n\n` +
    `Cryptographic Verification Rule:\nThis deterministic hash proves that this medication event was acknowledged and timestamped without post-hoc modification.`
  );
}

window.loadAndRenderHistory = loadAndRenderHistory;
