/**
 * MediTrack Pro - Adherence Reports & Analytics Engine
 * Module 05: Mathematical Compliance Analytics & Vanilla SVG Visualizations
 * 
 * CORE ACADEMIC FORMULA:
 * Adherence Percentage = Taken / (Taken + Missed) * 100
 * Pending doses are shown separately and excluded from the resolved-dose denominator.
 */

const ReportsEngine = {
  /**
   * Compute comprehensive adherence metrics from event logs
   */
  calculateMetrics(events) {
    if (!events || events.length === 0) {
      return {
        total: 0,
        taken: 0,
        missed: 0,
        pending: 0,
        resolvedTotal: 0,
        adherencePercentage: 100, // Default 100% when no resolved non-compliance
        dailyTrend: []
      };
    }

    let taken = 0;
    let missed = 0;
    let pending = 0;

    const dayMap = {}; // 'YYYY-MM-DD' -> { taken: 0, missed: 0, pending: 0 }

    // Initialize last 7 days in map
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayKey = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString([], { weekday: 'short' });
      dayMap[dayKey] = { date: dayKey, label: dayLabel, taken: 0, missed: 0, pending: 0 };
    }

    events.forEach(ev => {
      const status = (ev.status || 'PENDING').toUpperCase();
      const dateKey = (ev.scheduled_for || new Date().toISOString()).split('T')[0];

      if (status === 'TAKEN') {
        taken++;
        if (dayMap[dateKey]) dayMap[dateKey].taken++;
      } else if (status === 'MISSED') {
        missed++;
        if (dayMap[dateKey]) dayMap[dateKey].missed++;
      } else {
        pending++;
        if (dayMap[dateKey]) dayMap[dateKey].pending++;
      }
    });

    const total = events.length;
    const resolvedTotal = taken + missed;

    // Strict Formula: Taken / (Taken + Missed) * 100
    let adherencePercentage = 100;
    if (resolvedTotal > 0) {
      adherencePercentage = Math.round((taken / resolvedTotal) * 100);
    }

    const dailyTrend = Object.values(dayMap);

    return {
      total,
      taken,
      missed,
      pending,
      resolvedTotal,
      adherencePercentage,
      dailyTrend
    };
  },

  /**
   * Render Vanilla SVG Gauge Ring for Adherence
   */
  renderGaugeSVG(percentage) {
    const radius = 45;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    let color = 'var(--color-success)';
    if (percentage < 50) color = 'var(--color-danger)';
    else if (percentage < 80) color = 'var(--color-warning)';

    return `
      <div style="position: relative; width: 120px; height: 120px; margin: 0 auto;">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="${radius}" fill="none" stroke="var(--color-neutral-200)" stroke-width="10" />
          <circle cx="60" cy="60" r="${radius}" fill="none" stroke="${color}" stroke-width="10"
            stroke-dasharray="${circumference}" stroke-dashoffset="${strokeDashoffset}"
            stroke-linecap="round" transform="rotate(-90 60 60)" style="transition: stroke-dashoffset 0.6s ease;" />
        </svg>
        <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;">
          <span style="font-size: 1.5rem; font-weight: 800; color: var(--color-neutral-900); line-height: 1;">${percentage}%</span>
          <span style="font-size: 0.65rem; font-weight: 600; color: var(--color-neutral-500); text-transform: uppercase;">Score</span>
        </div>
      </div>
    `;
  },

  /**
   * Render Vanilla SVG 7-Day Trend Bar Chart
   */
  renderWeeklyChartSVG(dailyTrend) {
    const width = 340;
    const height = 140;
    const padding = { top: 15, bottom: 25, left: 20, right: 15 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Find maximum count in a single day to scale bars
    let maxCount = 4;
    dailyTrend.forEach(d => {
      const sum = d.taken + d.missed + d.pending;
      if (sum > maxCount) maxCount = sum;
    });

    const barWidth = 24;
    const step = chartWidth / dailyTrend.length;

    let barsHtml = '';
    dailyTrend.forEach((d, i) => {
      const x = padding.left + i * step + (step - barWidth) / 2;
      const takenHeight = (d.taken / maxCount) * chartHeight;
      const missedHeight = (d.missed / maxCount) * chartHeight;

      const takenY = padding.top + chartHeight - takenHeight;
      const missedY = takenY - missedHeight;

      // Taken bar (green)
      if (d.taken > 0) {
        barsHtml += `<rect x="${x}" y="${takenY}" width="${barWidth}" height="${takenHeight}" rx="3" fill="var(--color-success)" />`;
      }

      // Missed bar (red)
      if (d.missed > 0) {
        barsHtml += `<rect x="${x}" y="${missedY}" width="${barWidth}" height="${missedHeight}" rx="3" fill="var(--color-danger)" />`;
      }

      // Empty baseline indicator
      if (d.taken === 0 && d.missed === 0) {
        barsHtml += `<rect x="${x}" y="${padding.top + chartHeight - 4}" width="${barWidth}" height="4" rx="2" fill="var(--color-neutral-200)" />`;
      }

      // Day label
      barsHtml += `<text x="${x + barWidth / 2}" y="${height - 6}" font-size="10" font-weight="600" fill="var(--color-neutral-500)" text-anchor="middle">${d.label}</text>`;
    });

    return `
      <svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="overflow: visible;">
        <!-- Baseline Grid Line -->
        <line x1="${padding.left}" y1="${padding.top + chartHeight}" x2="${width - padding.right}" y2="${padding.top + chartHeight}" stroke="var(--color-neutral-200)" stroke-width="1" />
        ${barsHtml}
      </svg>
    `;
  },

  /**
   * Update all reports widgets in dashboard UI
   */
  updateReportsUI(events) {
    const metrics = this.calculateMetrics(events);

    // 1. Update Metric Cards
    const totalDosesEl = document.getElementById('report-total-doses');
    const takenDosesEl = document.getElementById('report-taken-doses');
    const missedDosesEl = document.getElementById('report-missed-doses');
    const pendingDosesEl = document.getElementById('report-pending-doses');
    const rateEl = document.getElementById('report-adherence-rate');

    if (totalDosesEl) totalDosesEl.textContent = metrics.total;
    if (takenDosesEl) takenDosesEl.textContent = metrics.taken;
    if (missedDosesEl) missedDosesEl.textContent = metrics.missed;
    if (pendingDosesEl) pendingDosesEl.textContent = metrics.pending;
    if (rateEl) rateEl.textContent = `${metrics.adherencePercentage}%`;

    // 2. Render Gauge SVG
    const gaugeContainer = document.getElementById('adherence-gauge-container');
    if (gaugeContainer) {
      gaugeContainer.innerHTML = this.renderGaugeSVG(metrics.adherencePercentage);
    }

    // 3. Render Weekly Chart SVG
    const weeklyChartContainer = document.getElementById('weekly-chart-container');
    if (weeklyChartContainer) {
      weeklyChartContainer.innerHTML = this.renderWeeklyChartSVG(metrics.dailyTrend);
    }

    // 4. Update Header Overview Stat as well
    const statAdherenceRate = document.getElementById('stat-adherence-rate');
    if (statAdherenceRate) {
      statAdherenceRate.textContent = `${metrics.adherencePercentage}%`;
    }
  }
};

window.ReportsEngine = ReportsEngine;
