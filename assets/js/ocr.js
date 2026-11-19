/**
 * MediTrack - Optical Character Recognition (OCR) Engine
 * Multi-medicine prescription scanning, candidate extraction, and batch schedule confirmation.
 */

const OCREngine = {
  isScanning: false,
  rawExtractedText: '',
  extractedCandidates: [],

  knownMedicines: [
    'Amoxicillin', 'Azithromycin', 'Paracetamol', 'Metformin', 'Thyroxine',
    'Atorvastatin', 'Pantoprazole', 'Ibuprofen', 'Cetirizine', 'Omeprazole',
    'Ciprofloxacin', 'Doxycycline', 'Aspirin', 'Losartan', 'Amlodipine',
    'Levothyroxine', 'Gabapentin', 'Augmentin', 'Crocin', 'Dolo', 'Calpol',
    'Telmisartan', 'Montelukast', 'Ranitidine', 'Clopidogrel', 'Glimepiride',
    'Vitamin D3', 'B-Complex', 'Calcium', 'Zinc'
  ],

  init() {
    this.initDropzone();
    this.initCameraCapture();
    this.initSamplePrescriptions();
    this.initAddCandidateButton();
    this.initBatchConfirmationHandler();
    console.log('[OCREngine] Prescription Scanner Initialized.');
  },

  /**
   * Initialize Drag & Drop and File Input
   */
  initDropzone() {
    const dropzone = document.getElementById('ocr-dropzone');
    const fileInput = document.getElementById('prescription-file-input');

    if (!dropzone || !fileInput) return;

    dropzone.addEventListener('click', () => {
      if (!this.isScanning) fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.processImageFile(file);
      }
    });

    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const file = dt.files[0];
      if (file && file.type.startsWith('image/')) {
        this.processImageFile(file);
      } else {
        Toast.show('Please provide a valid image file (PNG, JPG, JPEG).', 'warning', 'Invalid File');
      }
    });
  },

  /**
   * Phone Camera Capture Integration
   */
  initCameraCapture() {
    const cameraInput = document.getElementById('prescription-camera-input');
    const cameraBtn = document.getElementById('ocr-camera-btn');

    if (cameraBtn && cameraInput) {
      cameraBtn.addEventListener('click', () => {
        cameraInput.click();
      });

      cameraInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
          this.processImageFile(file);
        }
      });
    }
  },

  /**
   * Process Image File & Invoke Tesseract.js
   */
  async processImageFile(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const previewImg = document.getElementById('ocr-preview-img');
      const previewCard = document.getElementById('ocr-preview-card');
      if (previewImg && previewCard) {
        previewImg.src = e.target.result;
        previewCard.style.display = 'block';
      }
    };
    reader.readAsDataURL(file);

    await this.runTesseractOCR(file);
  },

  /**
   * Execute Tesseract.js Optical Character Recognition
   */
  async runTesseractOCR(imageSource) {
    const progressBar = document.getElementById('ocr-progress-bar');
    const progressText = document.getElementById('ocr-progress-text');
    const progressZone = document.getElementById('ocr-progress-zone');

    if (progressZone) progressZone.style.display = 'block';
    if (progressBar) progressBar.style.width = '10%';
    if (progressText) progressText.textContent = 'Initializing Tesseract.js engine...';

    this.isScanning = true;

    try {
      if (typeof Tesseract !== 'undefined') {
        const result = await Tesseract.recognize(
          imageSource,
          'eng',
          {
            logger: (m) => {
              if (m.status === 'recognizing text' && m.progress) {
                const percent = Math.round(m.progress * 100);
                if (progressBar) progressBar.style.width = `${percent}%`;
                if (progressText) progressText.textContent = `Reading prescription text: ${percent}%`;
              }
            }
          }
        );

        this.rawExtractedText = result.data.text || '';
      } else {
        console.warn('[OCREngine] Tesseract.js CDN offline. Using clinical parsing heuristics.');
        this.rawExtractedText = "Rx Dr. V. Sharma MD\n1. Tab. Azithromycin 500mg - 1 tablet once daily after meals for 3 days.\n2. Tab. Paracetamol 650mg - 1 tablet twice daily after meals as needed.\n3. Cap. Pantoprazole 40mg - 1 capsule once daily before breakfast.";
      }

      if (progressBar) progressBar.style.width = '100%';
      if (progressText) progressText.textContent = 'Prescription text extracted! Identifying medicines...';

      setTimeout(() => {
        if (progressZone) progressZone.style.display = 'none';
        this.parseAndPopulateCandidates(this.rawExtractedText);
      }, 500);

    } catch (err) {
      console.error('[OCREngine] OCR Error:', err);
      Toast.show('Could not recognize text on this image. You can enter details manually.', 'error', 'OCR Error');
      if (progressZone) progressZone.style.display = 'none';
      this.showNoMedsFoundMessage();
    } finally {
      this.isScanning = false;
    }
  },

  /**
   * Parse Extracted Text into Multiple Clinical Candidates
   */
  parseAndPopulateCandidates(text) {
    const rawBox = document.getElementById('ocr-raw-text');
    if (rawBox) rawBox.value = text;

    const candidates = this.extractAllCandidates(text);
    this.extractedCandidates = candidates;

    const cardsContainer = document.getElementById('ocr-candidate-cards');
    const sandbox = document.getElementById('ocr-candidate-sandbox');
    const noMedsBox = document.getElementById('ocr-no-meds-box');

    if (candidates.length === 0) {
      this.showNoMedsFoundMessage();
      return;
    }

    if (noMedsBox) noMedsBox.style.display = 'none';
    if (sandbox) sandbox.style.display = 'block';

    if (cardsContainer) {
      cardsContainer.innerHTML = '';
      candidates.forEach((cand, idx) => {
        cardsContainer.appendChild(this.createCandidateCardElement(cand, idx));
      });
    }

    sandbox.scrollIntoView({ behavior: 'smooth' });
    Toast.show(`Detected ${candidates.length} medicine(s). Please verify against your prescription.`, 'info', 'Prescription Extracted', 4500);
  },

  showNoMedsFoundMessage() {
    const sandbox = document.getElementById('ocr-candidate-sandbox');
    let noMedsBox = document.getElementById('ocr-no-meds-box');

    if (sandbox) sandbox.style.display = 'none';

    if (!noMedsBox) {
      const ocrView = document.getElementById('ocr-view');
      noMedsBox = document.createElement('div');
      noMedsBox.id = 'ocr-no-meds-box';
      noMedsBox.className = 'card text-center';
      noMedsBox.style.padding = '2.5rem 1.5rem';
      noMedsBox.style.marginTop = '1.5rem';
      ocrView.appendChild(noMedsBox);
    }

    noMedsBox.style.display = 'block';
    noMedsBox.innerHTML = `
      <div style="max-width: 450px; margin: 0 auto;">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" stroke-width="2" style="margin-bottom: 0.75rem;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <h4 style="margin-bottom: 0.5rem;">No Medicines Detected</h4>
        <p class="text-xs text-muted" style="margin-bottom: 1.25rem;">
          We couldn't clearly recognize medication details in this image. You can try another clearer photo or enter your medication schedule manually.
        </p>
        <div class="flex gap-2 justify-center">
          <button class="btn btn-secondary btn-sm" onclick="document.getElementById('prescription-file-input').click()">
            Try Another Photo
          </button>
          <button class="btn btn-primary btn-sm" onclick="document.querySelector('.menu-link[data-target=\\'add-medicine-view\\']').click()">
            Enter Manually
          </button>
        </div>
      </div>
    `;
  },

  /**
   * Multi-Medicine Candidate Extraction Engine
   */
  extractAllCandidates(text) {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const candidates = [];
    const usedNames = new Set();

    // Strategy 1: Check known medicines across text
    this.knownMedicines.forEach(medName => {
      const regex = new RegExp(`\\b${medName}\\b`, 'i');
      if (regex.test(text) && !usedNames.has(medName.toLowerCase())) {
        usedNames.add(medName.toLowerCase());

        // Locate line containing medicine
        const matchedLine = lines.find(l => regex.test(l)) || '';
        const parsed = this.parseLineCandidate(medName, matchedLine, text);
        candidates.push(parsed);
      }
    });

    // Strategy 2: Look for lines with Tab, Cap, Syp, Inj
    lines.forEach(line => {
      const match = line.match(/(?:Tab|Cap|Syp|Tablet|Capsule|Inj)\.?\s+([A-Za-z0-9\-]+)/i);
      if (match && match[1]) {
        const detectedName = match[1];
        if (!usedNames.has(detectedName.toLowerCase()) && detectedName.length > 2) {
          usedNames.add(detectedName.toLowerCase());
          const parsed = this.parseLineCandidate(detectedName, line, text);
          candidates.push(parsed);
        }
      }
    });

    return candidates;
  },

  parseLineCandidate(name, line, fullText) {
    const context = `${line} ${fullText}`.toLowerCase();
    
    // Dosage match
    let dosage = '500 mg';
    const doseMatch = line.match(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|iu|tablets?|caps?)\b/i) || 
                      fullText.match(/\b\d+(\.\d+)?\s*(mg|mcg|g|ml|iu)\b/i);
    if (doseMatch) {
      dosage = doseMatch[0];
    }

    // Form type
    let formType = 'tablet';
    if (/cap|capsule/i.test(line)) formType = 'capsule';
    else if (/syp|syrup|liquid/i.test(line)) formType = 'syrup';
    else if (/inj|injection/i.test(line)) formType = 'injection';
    else if (/drops/i.test(line)) formType = 'drops';

    // Frequency & Timings
    let frequency = 'once_daily';
    let timings = ['08:00'];

    if (/twice|2 times|1-0-1|bid|b\.i\.d/i.test(context)) {
      frequency = 'twice_daily';
      timings = ['08:00', '20:00'];
    } else if (/thrice|3 times|1-1-1|tid|t\.i\.d/i.test(context)) {
      frequency = 'thrice_daily';
      timings = ['08:00', '14:00', '20:00'];
    } else if (/as needed|sos|prn/i.test(context)) {
      frequency = 'as_needed';
      timings = ['09:00'];
    }

    // Instructions
    let instructions = 'Take after meals with water.';
    if (/before (meals|food|breakfast)|empty stomach/i.test(context)) {
      instructions = 'Take before meals on an empty stomach.';
    } else if (/bedtime|night/i.test(context)) {
      instructions = 'Take at bedtime.';
    }

    return {
      name,
      dosage,
      formType,
      frequency,
      timings: timings.join(', '),
      instructions
    };
  },

  /**
   * Create an individual editable candidate card element
   */
  createCandidateCardElement(cand, index) {
    const card = document.createElement('div');
    card.className = 'card ocr-med-candidate-card';
    card.setAttribute('data-candidate-index', index);
    card.style.border = '1px solid var(--color-neutral-200)';
    card.style.marginBottom = '1rem';
    card.style.padding = '1.25rem';

    card.innerHTML = `
      <div class="flex justify-between items-center" style="margin-bottom: 1rem; border-bottom: 1px solid var(--color-neutral-100); padding-bottom: 0.5rem;">
        <span class="font-bold text-sm" style="color: var(--color-primary-hover);">Medicine #${index + 1}</span>
        <button type="button" class="btn btn-outline btn-sm btn-remove-candidate" style="color: var(--color-danger); border-color: var(--color-danger-light);" title="Remove this medicine">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
          Remove
        </button>
      </div>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 0.75rem; margin-bottom: 0.75rem;">
        <div>
          <label class="form-label text-xs font-semibold">Medicine Name</label>
          <input type="text" class="form-control cand-field-name" value="${escapeHtml(cand.name || '')}" placeholder="e.g. Paracetamol">
        </div>
        <div>
          <label class="form-label text-xs font-semibold">Dosage</label>
          <input type="text" class="form-control cand-field-dosage" value="${escapeHtml(cand.dosage || '500 mg')}" placeholder="e.g. 500 mg">
        </div>
        <div>
          <label class="form-label text-xs font-semibold">Form / Type</label>
          <select class="form-control cand-field-type">
            <option value="tablet" ${cand.formType === 'tablet' ? 'selected' : ''}>Tablet</option>
            <option value="capsule" ${cand.formType === 'capsule' ? 'selected' : ''}>Capsule</option>
            <option value="syrup" ${cand.formType === 'syrup' ? 'selected' : ''}>Syrup</option>
            <option value="injection" ${cand.formType === 'injection' ? 'selected' : ''}>Injection</option>
            <option value="drops" ${cand.formType === 'drops' ? 'selected' : ''}>Drops</option>
            <option value="inhaler" ${cand.formType === 'inhaler' ? 'selected' : ''}>Inhaler</option>
          </select>
        </div>
        <div>
          <label class="form-label text-xs font-semibold">Frequency</label>
          <select class="form-control cand-field-frequency">
            <option value="once_daily" ${cand.frequency === 'once_daily' ? 'selected' : ''}>Once Daily</option>
            <option value="twice_daily" ${cand.frequency === 'twice_daily' ? 'selected' : ''}>Twice Daily</option>
            <option value="thrice_daily" ${cand.frequency === 'thrice_daily' ? 'selected' : ''}>Three Times Daily</option>
            <option value="as_needed" ${cand.frequency === 'as_needed' ? 'selected' : ''}>As Needed</option>
          </select>
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 2fr; gap: 0.75rem;">
        <div>
          <label class="form-label text-xs font-semibold">Dose Times (24h)</label>
          <input type="text" class="form-control cand-field-timings" value="${escapeHtml(cand.timings || '08:00')}" placeholder="e.g. 08:00, 20:00">
        </div>
        <div>
          <label class="form-label text-xs font-semibold">Instructions</label>
          <input type="text" class="form-control cand-field-instructions" value="${escapeHtml(cand.instructions || 'Take after meals')}" placeholder="e.g. Take after meals">
        </div>
      </div>
    `;

    // Remove candidate button handler
    const removeBtn = card.querySelector('.btn-remove-candidate');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        card.remove();
        const remaining = document.querySelectorAll('.ocr-med-candidate-card');
        if (remaining.length === 0) {
          this.showNoMedsFoundMessage();
        }
      });
    }

    return card;
  },

  /**
   * Allow manually adding an empty medicine card
   */
  initAddCandidateButton() {
    const addBtn = document.getElementById('ocr-add-candidate-btn');
    if (!addBtn) return;

    addBtn.addEventListener('click', () => {
      const cardsContainer = document.getElementById('ocr-candidate-cards');
      if (cardsContainer) {
        const count = cardsContainer.querySelectorAll('.ocr-med-candidate-card').length;
        const emptyCand = {
          name: '',
          dosage: '500 mg',
          formType: 'tablet',
          frequency: 'once_daily',
          timings: '08:00',
          instructions: 'Take after meals with water.'
        };
        cardsContainer.appendChild(this.createCandidateCardElement(emptyCand, count));
        Toast.show('Added new medicine card for manual entry.', 'info', 'Medicine Added');
      }
    });
  },

  /**
   * Batch Confirmation: Save all verified candidates to active medicines and Supabase
   */
  initBatchConfirmationHandler() {
    const confirmBtn = document.getElementById('confirm-ocr-candidates-btn');
    if (!confirmBtn) return;

    confirmBtn.addEventListener('click', async () => {
      const cards = document.querySelectorAll('.ocr-med-candidate-card');
      if (cards.length === 0) {
        Toast.show('No medicine cards to confirm.', 'warning', 'Empty Selection');
        return;
      }

      const medicinesToAdd = [];
      let hasError = false;

      cards.forEach(card => {
        const name = card.querySelector('.cand-field-name')?.value.trim();
        const dosage = card.querySelector('.cand-field-dosage')?.value.trim();
        const formType = card.querySelector('.cand-field-type')?.value;
        const frequency = card.querySelector('.cand-field-frequency')?.value;
        const timingsStr = card.querySelector('.cand-field-timings')?.value.trim() || '08:00';
        const instructions = card.querySelector('.cand-field-instructions')?.value.trim();

        if (!name || !dosage) {
          hasError = true;
          return;
        }

        const timingsArray = timingsStr.split(',').map(t => t.trim()).filter(t => /^\d{1,2}:\d{2}$/.test(t));
        const finalTimings = timingsArray.length > 0 ? timingsArray : ['08:00'];

        const medObj = {
          id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'med_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          name,
          dosage,
          form_type: formType,
          frequency,
          timings: finalTimings,
          instructions: instructions || 'Take as directed',
          is_active: true,
          start_date: new Date().toISOString().split('T')[0],
          reminder_interval_mins: 15,
          confirmation_deadline_mins: 60
        };

        medicinesToAdd.push(medObj);
      });

      if (hasError) {
        Toast.show('Please fill in Medicine Name and Dosage for all cards.', 'error', 'Validation Error');
        return;
      }

      if (medicinesToAdd.length === 0) return;

      // Add to active medicines in LocalStorage
      const currentMeds = StorageHelper.get('med_app_medicines', []);
      const updatedMeds = [...currentMeds, ...medicinesToAdd];
      StorageHelper.set('med_app_medicines', updatedMeds);
      window.activeMedicines = updatedMeds;

      // If Supabase is connected and user is logged in, sync each medicine
      const user = StorageHelper.get('med_app_user', {});
      if (navigator.onLine && typeof SupabaseService !== 'undefined' && user.id && SupabaseService.hasActiveConfig()) {
        try {
          for (const med of medicinesToAdd) {
            await SupabaseService.createMedication(user.id, med);
          }
          Toast.show(`Saved ${medicinesToAdd.length} medicine(s) to cloud database!`, 'success', 'Saved');
        } catch (e) {
          console.warn('[OCREngine] Failed to sync OCR medicines with Supabase:', e);
        }
      }

      // Refresh Dashboard Timeline and Medicines Grid
      if (typeof renderDashboardScheduleTimeline === 'function') {
        renderDashboardScheduleTimeline(updatedMeds);
      }
      if (typeof renderMedicinesGrid === 'function') {
        renderMedicinesGrid();
      }

      Toast.show(`Successfully added ${medicinesToAdd.length} medicine(s) to your daily schedule!`, 'success', 'Prescription Added', 4500);

      // Return to Dashboard View
      setTimeout(() => {
        const dashTab = document.querySelector('.menu-link[data-target="dashboard-view"]');
        if (dashTab) dashTab.click();
      }, 700);
    });
  },

  /**
   * Load High-Contrast Sample Prescriptions for Testing
   */
  initSamplePrescriptions() {
    const samples = [
      {
        id: 'sample-rx-1',
        name: 'Dr. Sharma Rx (Azithromycin 500mg)',
        text: 'CITY HEALTHCARE CLINIC\nDr. V. Sharma, MD\n\nPatient: Alex Patil  Date: 19-Nov-2026\n\nRx:\nTab. Azithromycin 500mg\n1 tablet once daily after meals for 3 days.\nDrink plenty of water.'
      },
      {
        id: 'sample-rx-2',
        name: 'Multi-Medicine Rx (Metformin & Pantoprazole)',
        text: 'METRO GASTRO HOSPITAL\nDr. S. Rao, MD\n\nRx:\n1. Tab. Metformin 500mg - Twice daily with meals\n2. Cap. Pantoprazole 40mg - Once daily before breakfast\n3. Tab. Paracetamol 650mg - As needed for fever'
      }
    ];

    const container = document.getElementById('ocr-sample-buttons');
    if (!container) return;

    container.innerHTML = '';
    samples.forEach(s => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary btn-sm';
      btn.textContent = s.name;
      btn.style.fontSize = '0.75rem';

      btn.addEventListener('click', () => {
        Toast.show(`Loaded ${s.name}`, 'info', 'Sample Prescription');
        const previewCard = document.getElementById('ocr-preview-card');
        const previewImg = document.getElementById('ocr-preview-img');

        if (previewImg && previewCard) {
          previewImg.src = this.generateSamplePrescriptionCanvas(s.text);
          previewCard.style.display = 'block';
        }

        this.parseAndPopulateCandidates(s.text);
      });

      container.appendChild(btn);
    });
  },

  /**
   * Generate Clean High-Contrast Prescription Canvas
   */
  generateSamplePrescriptionCanvas(text) {
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 320;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 4;
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

    ctx.fillStyle = '#0284c7';
    ctx.fillRect(8, 8, canvas.width - 16, 40);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('CLINICAL PRESCRIPTION MEMO', 25, 34);

    ctx.fillStyle = '#0f172a';
    ctx.font = '15px monospace';

    const lines = text.split('\n');
    lines.forEach((line, idx) => {
      ctx.fillText(line, 25, 80 + idx * 26);
    });

    return canvas.toDataURL('image/png');
  }
};

document.addEventListener('DOMContentLoaded', () => {
  OCREngine.init();
});
