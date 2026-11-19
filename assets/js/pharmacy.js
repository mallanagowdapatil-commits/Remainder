/**
 * MediTrack - Verified Online Pharmacy Access Directory
 * Verified links to authorized Indian digital healthcare & pharmacy platforms.
 * Note: External ordering, billing, and prescription validation occur on official third-party portals.
 */

const PharmacyModule = {
  // Verified Pharmacy Platforms
  partners: [
    {
      id: 'apollo',
      name: 'Apollo Pharmacy',
      badge: 'Authorized Retailer',
      homeUrl: 'https://www.apollopharmacy.in',
      searchUrlBase: 'https://www.apollopharmacy.in/search-medicines/',
      description: 'One of India\'s largest healthcare networks providing home delivery for prescription medicines and wellness essentials.',
      availabilityNotice: 'Online ordering available on their official site.',
      color: '#f97316'
    },
    {
      id: 'medplus',
      name: 'MedPlus Mart',
      badge: 'Authorized Retailer',
      homeUrl: 'https://www.medplusmart.com',
      searchUrlBase: 'https://www.medplusmart.com/searchProduct?query=',
      description: 'Extensive retail pharmacy chain offering genuine branded medicines, generic options, and neighborhood store pickup.',
      availabilityNotice: 'Online ordering available on their official site.',
      color: '#ef4444'
    },
    {
      id: 'tata1mg',
      name: 'Tata 1mg',
      badge: 'Authorized Healthcare Platform',
      homeUrl: 'https://www.1mg.com',
      searchUrlBase: 'https://www.1mg.com/search/all?name=',
      description: 'Comprehensive digital healthcare platform for online medicines, lab tests, and doctor consultations across India.',
      availabilityNotice: 'Online ordering available on their official site.',
      color: '#ff6f61'
    },
    {
      id: 'pharmeasy',
      name: 'PharmEasy',
      badge: 'Authorized Pharmacy',
      homeUrl: 'https://pharmeasy.in',
      searchUrlBase: 'https://pharmeasy.in/search/all?name=',
      description: 'Online healthcare delivery service connecting patients with verified local pharmacies for door-to-door medication refills.',
      availabilityNotice: 'Online ordering available on their official site.',
      color: '#10847e'
    },
    {
      id: 'netmeds',
      name: 'Netmeds',
      badge: 'Authorized Pharmacy',
      homeUrl: 'https://www.netmeds.com',
      searchUrlBase: 'https://www.netmeds.com/catalogsearch/result?q=',
      description: 'Trusted online medication provider serving pin codes across India with verified prescription processing.',
      availabilityNotice: 'Online ordering available on their official site.',
      color: '#24aeb1'
    }
  ],

  init() {
    this.renderPharmacyDirectory();
    this.renderRefillRecommendations();
    this.bindSearchForm();
    console.log('[PharmacyModule] Verified pharmacy directory initialized.');
  },

  /**
   * Render Pharmacy Cards Grid
   */
  renderPharmacyDirectory() {
    const container = document.getElementById('pharmacy-directory-grid');
    if (!container) return;

    container.innerHTML = this.partners.map(p => `
      <div class="card pharmacy-partner-card" style="display: flex; flex-direction: column; justify-content: space-between; border: 1px solid var(--color-neutral-200); padding: 1.5rem;">
        <div>
          <div class="flex justify-between items-center" style="margin-bottom: 0.75rem;">
            <div class="flex items-center gap-2">
              <div style="width: 36px; height: 36px; border-radius: var(--radius-md); background: ${p.color}15; color: ${p.color}; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem;">
                ${p.name[0]}
              </div>
              <div>
                <h4 style="margin: 0; font-size: 1.05rem;">${escapeHtml(p.name)}</h4>
                <span class="text-xs text-muted">${escapeHtml(p.badge)}</span>
              </div>
            </div>
          </div>
          <p class="text-xs text-muted" style="line-height: 1.5; margin-bottom: 0.75rem;">
            ${escapeHtml(p.description)}
          </p>
          <div class="text-xs" style="color: var(--color-teal); font-weight: 500; margin-bottom: 1.25rem;">
            ${escapeHtml(p.availabilityNotice)}
          </div>
        </div>

        <div>
          <a href="${p.homeUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm" style="width: 100%; text-align: center; display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem;">
            <span>Visit Pharmacy</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
          </a>
        </div>
      </div>
    `).join('');
  },

  /**
   * Render Active Medications for Quick Refill Search
   */
  renderRefillRecommendations() {
    const container = document.getElementById('pharmacy-refill-list');
    if (!container) return;

    const medicines = StorageHelper.get('med_app_medicines', []);
    const activeMeds = medicines.filter(m => m.is_active !== false);

    if (activeMeds.length === 0) {
      container.innerHTML = `
        <div class="card text-center text-muted" style="padding: 2rem;">
          <p class="text-xs">No active medications scheduled. Add a medication to see one-click refill search options.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = activeMeds.map(med => `
      <div class="card" style="margin-bottom: 0.75rem; padding: 1rem; border: 1px solid var(--color-neutral-200); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
        <div>
          <h4 style="margin: 0; font-size: 0.95rem;">${escapeHtml(med.name)}</h4>
          <span class="text-xs text-muted">Dosage: ${escapeHtml(med.dosage)} • Form: ${escapeHtml(med.form_type || 'Tablet')}</span>
        </div>
        <div class="flex gap-2" style="flex-wrap: wrap;">
          ${this.partners.slice(0, 3).map(p => `
            <a href="${p.searchUrlBase}${encodeURIComponent(med.name)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm" style="font-size: 0.75rem;">
              Search ${escapeHtml(p.name)}
            </a>
          `).join('')}
        </div>
      </div>
    `).join('');
  },

  /**
   * Bind Custom Medicine Search
   */
  bindSearchForm() {
    const form = document.getElementById('pharmacy-custom-search-form');
    const input = document.getElementById('pharmacy-custom-search-input');
    const partnerSelect = document.getElementById('pharmacy-partner-select');

    if (!form || !input) return;

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = input.value.trim();
      if (!query) {
        Toast.show('Please enter a medicine name to search.', 'warning', 'Search');
        return;
      }

      const partnerId = partnerSelect ? partnerSelect.value : 'apollo';
      const partner = this.partners.find(p => p.id === partnerId) || this.partners[0];
      const searchUrl = `${partner.searchUrlBase}${encodeURIComponent(query)}`;

      window.open(searchUrl, '_blank', 'noopener,noreferrer');
      Toast.show(`Opening ${partner.name} search for "${query}"...`, 'info', 'Redirecting');
    });
  }
};

document.addEventListener('DOMContentLoaded', () => {
  PharmacyModule.init();
});
