/**
 * Medicines Management & Schedule Controller
 * Module 03: Complete CRUD Operations, Dynamic Timings, and Modals
 */

let activeMedicines = [];

document.addEventListener('DOMContentLoaded', async () => {
  initScheduleFrequencyHandler('med-frequency', 'timings-container', 'add-timing-btn');
  initScheduleFrequencyHandler('edit-med-frequency', 'edit-timings-container', 'edit-add-timing-btn');
  initLiveMedicinePreview();
  initAddMedicineForm();
  initEditMedicineForm();
  initMedicineSearch();
  await loadAndRenderMedications();
});

// Dynamic Timings Generator based on Frequency
function initScheduleFrequencyHandler(freqSelectId, timingsContainerId, addBtnId) {
  const freqSelect = document.getElementById(freqSelectId);
  const timingsContainer = document.getElementById(timingsContainerId);
  const addTimingBtn = document.getElementById(addBtnId);

  if (!freqSelect || !timingsContainer) return;

  function renderTimings(frequency, existingTimes = null) {
    timingsContainer.innerHTML = '';

    let defaultTimes = [];
    if (existingTimes && existingTimes.length > 0) {
      defaultTimes = existingTimes;
    } else if (frequency === 'once_daily') {
      defaultTimes = ['08:00'];
    } else if (frequency === 'twice_daily') {
      defaultTimes = ['08:00', '20:00'];
    } else if (frequency === 'thrice_daily') {
      defaultTimes = ['08:00', '14:00', '20:00'];
    } else if (frequency === 'custom') {
      defaultTimes = ['09:00'];
    }

    defaultTimes.forEach((timeVal, idx) => {
      addTimingInput(timeVal, idx + 1, frequency === 'custom' || defaultTimes.length > 1);
    });

    if (addTimingBtn) {
      addTimingBtn.style.display = frequency === 'custom' ? 'inline-flex' : 'none';
    }
  }

  function addTimingInput(val = '09:00', index = 1, canRemove = false) {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 timing-row';
    row.style.marginBottom = '0.5rem';

    row.innerHTML = `
      <span class="text-sm text-muted font-medium" style="min-width: 65px;">Dose ${index}:</span>
      <input type="time" class="form-control med-time-input" value="${val}" required style="max-width: 160px;">
      ${canRemove ? '<button type="button" class="btn btn-secondary btn-sm remove-timing-btn" title="Remove dose">&times;</button>' : ''}
    `;

    if (canRemove) {
      row.querySelector('.remove-timing-btn').addEventListener('click', () => {
        row.remove();
        updateTimingLabels();
      });
    }

    timingsContainer.appendChild(row);
  }

  function updateTimingLabels() {
    const rows = timingsContainer.querySelectorAll('.timing-row');
    rows.forEach((r, idx) => {
      const span = r.querySelector('span');
      if (span) span.textContent = `Dose ${idx + 1}:`;
    });
  }

  if (addTimingBtn) {
    addTimingBtn.addEventListener('click', () => {
      const currentCount = timingsContainer.querySelectorAll('.timing-row').length;
      addTimingInput('12:00', currentCount + 1, true);
    });
  }

  freqSelect.addEventListener('change', (e) => {
    renderTimings(e.target.value);
  });

  // Initial render
  renderTimings(freqSelect.value || 'once_daily');
}

// Live Medicine Card Preview
function initLiveMedicinePreview() {
  const nameInput = document.getElementById('med-name');
  const dosageInput = document.getElementById('med-dosage');
  const typeSelect = document.getElementById('med-type');
  const instructionsInput = document.getElementById('med-instructions');

  const previewName = document.getElementById('preview-name');
  const previewDosage = document.getElementById('preview-dosage');
  const previewType = document.getElementById('preview-type');
  const previewInstructions = document.getElementById('preview-instructions');

  if (!nameInput) return;

  nameInput.addEventListener('input', () => {
    if (previewName) previewName.textContent = nameInput.value.trim() || 'Medicine Name';
  });

  if (dosageInput && previewDosage) {
    dosageInput.addEventListener('input', () => {
      previewDosage.textContent = dosageInput.value.trim() ? `Dosage: ${dosageInput.value.trim()}` : 'Dosage: 1 Tablet';
    });
  }

  if (typeSelect && previewType) {
    typeSelect.addEventListener('change', () => {
      previewType.textContent = typeSelect.options[typeSelect.selectedIndex].text;
    });
  }

  if (instructionsInput && previewInstructions) {
    instructionsInput.addEventListener('input', () => {
      previewInstructions.textContent = instructionsInput.value.trim() ? `Instructions: ${instructionsInput.value.trim()}` : 'Take after meal with water';
    });
  }
}

// Fetch & Render Active Medications List
async function loadAndRenderMedications() {
  const container = document.getElementById('meds-grid-container');
  if (!container) return;

  const user = StorageHelper.get('med_app_user', {});
  const userId = user.id || null;

  activeMedicines = await SupabaseService.getMedications(userId);

  renderMedicationCards(activeMedicines);

  // Trigger sync of Dashboard overview today's schedule
  if (typeof renderDashboardScheduleTimeline === 'function') {
    renderDashboardScheduleTimeline(activeMedicines);
  }
}

function renderMedicationCards(medicines) {
  const container = document.getElementById('meds-grid-container');
  const emptyNotice = document.getElementById('meds-empty-notice');
  if (!container) return;

  container.innerHTML = '';

  if (!medicines || medicines.length === 0) {
    if (emptyNotice) emptyNotice.style.display = 'block';
    return;
  }

  if (emptyNotice) emptyNotice.style.display = 'none';

  medicines.forEach(med => {
    const card = document.createElement('div');
    card.className = 'med-card';
    card.setAttribute('data-id', med.id);

    const timingTagsHtml = (med.timings || ['08:00'])
      .map(t => `<span class="med-time-tag">${formatTime12Hour(t)}</span>`)
      .join('');

    const freqLabels = {
      'once_daily': 'Once Daily (1x)',
      'twice_daily': 'Twice Daily (2x)',
      'thrice_daily': 'Three Times Daily (3x)',
      'custom': 'Custom Timing'
    };

    card.innerHTML = `
      <div>
        <div class="med-card-header">
          <div>
            <h4 class="font-bold">${escapeHtml(med.name)}</h4>
            <span class="text-xs text-muted">${freqLabels[med.frequency] || 'Daily'}</span>
          </div>
          <span class="med-type-pill">${escapeHtml(med.form_type || 'Tablet')}</span>
        </div>
        <div class="text-sm font-semibold" style="margin-top: 0.5rem; color: var(--color-primary-hover);">
          Dosage: ${escapeHtml(med.dosage)}
        </div>
        <p class="text-xs text-muted" style="margin-top: 0.25rem;">
          ${escapeHtml(med.instructions || 'No special instructions recorded.')}
        </p>
        <div class="med-times-list">
          ${timingTagsHtml}
        </div>
      </div>

      <div style="border-top: 1px solid var(--color-neutral-100); padding-top: 0.75rem;">
        <div class="flex justify-between items-center text-xs text-muted" style="margin-bottom: 0.75rem;">
          <span>Remind: ${med.reminder_interval_mins || 10}m</span>
          <span>Deadline: ${med.confirmation_deadline_mins || 60}m</span>
        </div>
        <div class="flex gap-2">
          <button class="btn btn-secondary btn-sm flex-1 view-med-btn" data-id="${med.id}">Details</button>
          <button class="btn btn-outline btn-sm edit-med-btn" data-id="${med.id}">Edit</button>
          <button class="btn btn-outline btn-sm delete-med-btn" style="color: var(--color-danger); border-color: var(--color-danger);" data-id="${med.id}" title="Delete medication">&times;</button>
        </div>
      </div>
    `;

    // Attach Action Listeners
    card.querySelector('.view-med-btn').addEventListener('click', () => viewMedicineDetails(med.id));
    card.querySelector('.edit-med-btn').addEventListener('click', () => openEditMedicineModal(med.id));
    card.querySelector('.delete-med-btn').addEventListener('click', () => deleteMedicine(med.id, med.name));

    container.appendChild(card);
  });
}

// Add New Medication Form Submission
function initAddMedicineForm() {
  const form = document.getElementById('add-medicine-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('med-name').value.trim();
    const dosage = document.getElementById('med-dosage').value.trim();
    const formType = document.getElementById('med-type').value;
    const frequency = document.getElementById('med-frequency').value;
    const startDate = document.getElementById('med-start-date').value;
    const endDate = document.getElementById('med-end-date').value || null;
    const reminderInterval = document.getElementById('med-reminder-interval').value;
    const deadline = document.getElementById('med-deadline').value;
    const instructions = document.getElementById('med-instructions').value.trim();

    if (!name || !dosage || !startDate) {
      Toast.show('Please fill in required fields: Name, Dosage, and Start Date.', 'error', 'Form Error');
      return;
    }

    // Collect all schedule timings
    const timeInputs = form.querySelectorAll('.med-time-input');
    const timings = Array.from(timeInputs).map(inp => inp.value).filter(Boolean);

    if (timings.length === 0) {
      Toast.show('Please specify at least one dose timing slot.', 'error', 'Form Error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Saving Schedule...';

    const user = StorageHelper.get('med_app_user', {});
    const userId = user.id || null;

    const newMed = {
      name,
      dosage,
      form_type: formType,
      frequency,
      timings,
      start_date: startDate,
      end_date: endDate,
      reminder_interval_mins: reminderInterval,
      confirmation_deadline_mins: deadline,
      instructions
    };

    const res = await SupabaseService.addMedication(userId, newMed);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Save Medication Schedule';

    if (res.success) {
      Toast.show(`Medication "${name}" (${dosage}) scheduled successfully!`, 'success', 'Medicine Saved');
      form.reset();
      document.getElementById('med-frequency').dispatchEvent(new Event('change'));

      await loadAndRenderMedications();

      // Navigate to My Medicines View
      setTimeout(() => {
        const medsTab = document.querySelector('.menu-link[data-target="medicines-view"]');
        if (medsTab) medsTab.click();
      }, 700);
    } else {
      Toast.show('Failed to save medication.', 'error', 'Error');
    }
  });
}

// Open Edit Medicine Modal & Pre-fill
function openEditMedicineModal(medId) {
  const med = activeMedicines.find(m => m.id === medId);
  if (!med) return;

  document.getElementById('edit-med-id').value = med.id;
  document.getElementById('edit-med-name').value = med.name;
  document.getElementById('edit-med-dosage').value = med.dosage;
  document.getElementById('edit-med-type').value = med.form_type || 'tablet';
  document.getElementById('edit-med-frequency').value = med.frequency || 'once_daily';
  document.getElementById('edit-med-start-date').value = med.start_date || '';
  document.getElementById('edit-med-end-date').value = med.end_date || '';
  document.getElementById('edit-med-reminder-interval').value = med.reminder_interval_mins || 10;
  document.getElementById('edit-med-deadline').value = med.confirmation_deadline_mins || 60;
  document.getElementById('edit-med-instructions').value = med.instructions || '';

  // Render Timings
  const timingsContainer = document.getElementById('edit-timings-container');
  timingsContainer.innerHTML = '';
  (med.timings || ['08:00']).forEach((t, idx) => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 timing-row';
    row.style.marginBottom = '0.5rem';
    row.innerHTML = `
      <span class="text-sm text-muted font-medium" style="min-width: 65px;">Dose ${idx + 1}:</span>
      <input type="time" class="form-control med-time-input" value="${t}" required style="max-width: 160px;">
      <button type="button" class="btn btn-secondary btn-sm remove-timing-btn">&times;</button>
    `;
    row.querySelector('.remove-timing-btn').addEventListener('click', () => row.remove());
    timingsContainer.appendChild(row);
  });

  Modal.open('edit-med-modal');
}

// Edit Form Submission
function initEditMedicineForm() {
  const form = document.getElementById('edit-med-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const medId = document.getElementById('edit-med-id').value;
    const name = document.getElementById('edit-med-name').value.trim();
    const dosage = document.getElementById('edit-med-dosage').value.trim();
    const formType = document.getElementById('edit-med-type').value;
    const frequency = document.getElementById('edit-med-frequency').value;
    const startDate = document.getElementById('edit-med-start-date').value;
    const endDate = document.getElementById('edit-med-end-date').value || null;
    const reminderInterval = document.getElementById('edit-med-reminder-interval').value;
    const deadline = document.getElementById('edit-med-deadline').value;
    const instructions = document.getElementById('edit-med-instructions').value.trim();

    const timeInputs = form.querySelectorAll('.med-time-input');
    const timings = Array.from(timeInputs).map(inp => inp.value).filter(Boolean);

    const user = StorageHelper.get('med_app_user', {});
    const userId = user.id || null;

    const updatedMed = {
      name,
      dosage,
      form_type: formType,
      frequency,
      timings,
      start_date: startDate,
      end_date: endDate,
      reminder_interval_mins: reminderInterval,
      confirmation_deadline_mins: deadline,
      instructions
    };

    Toast.show(`Updating ${name}...`, 'info', 'Updating');
    await SupabaseService.updateMedication(userId, medId, updatedMed);

    Modal.close('edit-med-modal');
    Toast.show(`Medication "${name}" updated successfully.`, 'success', 'Updated');
    await loadAndRenderMedications();
  });
}

// Delete Medicine
async function deleteMedicine(medId, medName) {
  const confirmed = confirm(
    `Are you sure you want to delete "${medName}"?\n\n` +
    `This will deactivate this prescription and cancel any future scheduled reminders.`
  );

  if (confirmed) {
    const user = StorageHelper.get('med_app_user', {});
    const userId = user.id || null;

    Toast.show(`Deleting ${medName}...`, 'info', 'Deleting');
    await SupabaseService.deleteMedication(userId, medId);

    Toast.show(`"${medName}" has been removed.`, 'success', 'Deleted');
    await loadAndRenderMedications();
  }
}

// View Details Modal
function viewMedicineDetails(medId) {
  const med = activeMedicines.find(m => m.id === medId);
  if (!med) return;

  const content = document.getElementById('med-details-content');
  if (!content) return;

  const timingsStr = (med.timings || []).map(formatTime12Hour).join(', ');

  content.innerHTML = `
    <div style="margin-bottom: 1.25rem;">
      <h3 style="font-size: 1.35rem; color: var(--color-neutral-900); margin-bottom: 0.25rem;">
        ${escapeHtml(med.name)}
      </h3>
      <span class="badge badge-taken">${escapeHtml(med.form_type || 'Tablet')}</span>
    </div>

    <div class="flex flex-col gap-2 text-sm">
      <div><strong>Dosage:</strong> ${escapeHtml(med.dosage)}</div>
      <div><strong>Frequency:</strong> ${med.frequency ? med.frequency.replace('_', ' ').toUpperCase() : 'ONCE DAILY'}</div>
      <div><strong>Scheduled Dosing Times:</strong> ${timingsStr || 'None'}</div>
      <div><strong>Start Date:</strong> ${med.start_date || 'N/A'}</div>
      <div><strong>End Date:</strong> ${med.end_date || 'Indefinite / Ongoing'}</div>
      <div><strong>Reminder Interval:</strong> Every ${med.reminder_interval_mins || 10} minutes</div>
      <div><strong>Confirmation Deadline:</strong> ${med.confirmation_deadline_mins || 60} minutes</div>
      <div><strong>Instructions & Precautions:</strong></div>
      <div style="padding: 0.75rem; background-color: var(--color-neutral-100); border-radius: var(--radius-sm); font-size: 0.85rem;">
        ${escapeHtml(med.instructions || 'No special medical instructions.')}
      </div>
    </div>
  `;

  Modal.open('med-details-modal');
}

// Search and Filter Active Medications
function initMedicineSearch() {
  const searchInput = document.getElementById('med-search-input');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const filtered = activeMedicines.filter(m => {
      const matchName = (m.name || '').toLowerCase().includes(query);
      const matchDosage = (m.dosage || '').toLowerCase().includes(query);
      const matchType = (m.form_type || '').toLowerCase().includes(query);
      return matchName || matchDosage || matchType;
    });

    renderMedicationCards(filtered);
  });
}

// Helper Utilities
function formatTime12Hour(time24) {
  if (!time24) return '';
  const parts = time24.split(':');
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1] || '00';
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours < 10 ? '0' + hours : hours;
  return `${strHours}:${minutes} ${ampm}`;
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
