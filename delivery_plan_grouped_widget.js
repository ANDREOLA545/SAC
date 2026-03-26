/**
 * SAC Custom Widget — Delivery Plan Agrupado por Material
 * Web Component (main) — compatible con SAP Analytics Cloud Optimized Stories
 *
 * Feeds esperados en myDataBinding:
 *   feed_material, feed_molecule, feed_country, feed_vendor, feed_planner,
 *   feed_yearmonth, feed_cod_texto, feed_cod_fondo, feed_qty
 *
 * Lógica de agregación por material + mes:
 *   - 1 pedido  → color según estado (cod_texto)
 *   - >1 pedido → texto negro + icono ⚠️ amarillo (múltiples entradas)
 *   - Cantidad  → suma de todas las cantidades del mes
 *   - Fondo     → peor código de fondo del mes (restricción > frozen > planificación)
 */

const TEMPLATE_GRP = document.createElement('template');
TEMPLATE_GRP.innerHTML = `
<style>
  :host {
    display: block; width: 100%; height: 100%;
    font-family: "72", "72full", Arial, Helvetica, sans-serif;
    font-size: 13px; color: #32363a;
    overflow: auto;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .root { padding: 0; background: #fff; }

  .widget-header {
    display: flex; align-items: center; justify-content: flex-end;
    padding: 6px 8px 4px; gap: 16px; flex-wrap: wrap;
    border-bottom: 1px solid #e5e5e5; background: #fff;
  }
  .legend { display: flex; gap: 16px; flex-wrap: wrap; align-items: center; }
  .legend-group { display: flex; align-items: center; gap: 10px; }
  .legend-group-title { font-size: 11px; color: #6a6d70; font-weight: 600; }
  .legend-items { display: flex; gap: 10px; flex-wrap: wrap; }
  .legend-item  { display: flex; align-items: center; gap: 5px; font-size: 11px; color: #32363a; }
  .legend-dot   { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; border: 1px solid rgba(0,0,0,0.15); }
  .legend-swatch{ width: 16px; height: 10px; border-radius: 2px; border: 1px solid rgba(0,0,0,0.15); flex-shrink: 0; }
  .ld-txt0 { background: #8a9ab5; }
  .ld-txt1 { background: #32363a; }
  .ld-txt2 { background: #107e3e; }
  .ld-txt3 { background: #0a6ed1; }
  .ld-txt4 { background: #bb0000; }
  .ld-alert{ background: #e9730c; }
  .ld-bg2  { background: #e8ecf0; }
  .ld-bg3  { background: #d1e8f5; }
  .ld-bg4  { background: #ffd0e0; }

  .state-msg { display: flex; align-items: center; justify-content: center; height: 80px; font-size: 12px; color: #6a6d70; }
  .state-msg.error { color: #bb0000; }

  .table-wrapper { overflow-x: auto; background: #fff; width: 100%; }
  table { border-collapse: collapse; width: 100%; min-width: 600px; }

  thead tr.header-row-1 th {
    background: #1873b4; color: #fff;
    font-size: 12px; font-weight: 600;
    padding: 6px 8px; text-align: center;
    border-right: 1px solid rgba(255,255,255,0.2);
    white-space: nowrap;
    position: sticky; top: 0; z-index: 5;
  }
  thead tr.header-row-1 th.dim-header {
    text-align: left; background: #fff; color: #32363a;
    border-right: 1px solid #e5e5e5; border-bottom: 1px solid #e5e5e5;
  }
  thead tr.header-row-2 th {
    background: #c0daf5; color: #32363a;
    font-size: 12px; font-weight: 600;
    padding: 5px 8px; text-align: center;
    border-right: 1px solid #a8c8e8;
    border-bottom: 2px solid #1873b4;
    white-space: nowrap;
    position: sticky; top: 29px; z-index: 5;
  }
  thead tr.header-row-2 th.dim-header {
    background: #fff; color: #32363a; text-align: left;
    border-right: 1px solid #e5e5e5; border-bottom: 2px solid #1873b4;
  }

  tbody tr { border-bottom: 1px solid #e5e5e5; }
  tbody tr:hover { background: #f5f5f5 !important; }
  tbody tr:last-child { border-bottom: none; }

  td.dim-cell {
    padding: 5px 8px; font-size: 12px; white-space: nowrap;
    border-right: 1px solid #e5e5e5; color: #32363a; background: #fff;
  }
  td.dim-cell.material { font-weight: 600; color: #0a6ed1; min-width: 80px; }
  td.dim-cell.molecule { color: #32363a; min-width: 100px; }
  td.dim-cell.country  { color: #32363a; min-width: 50px; text-align: center; }
  td.dim-cell.vendor   { color: #32363a; min-width: 120px; }
  td.dim-cell.planner  { color: #32363a; min-width: 80px; }

  td.qty-cell {
    padding: 0; text-align: right;
    border-right: 1px solid #e5e5e5; min-width: 85px;
  }
  td.qty-cell:last-child { border-right: none; }
  .qty-inner {
    display: flex; align-items: center; justify-content: flex-end;
    padding: 5px 8px; height: 100%;
    font-size: 12px; font-weight: 600;
    position: relative;
  }
  .qty-inner.empty { color: #aaaaaa; font-weight: 400; }

  /* Icono de alerta para múltiples pedidos */
  .alert-icon {
    position: absolute; top: 3px; left: 5px;
    font-size: 11px; line-height: 1;
    color: #e9730c;
  }

  .tooltip {
    position: fixed; background: #fff;
    border: 1px solid #d9d9d9; border-radius: 4px;
    padding: 8px 12px; font-size: 12px; color: #32363a;
    pointer-events: none; z-index: 9999;
    opacity: 0; transition: opacity 0.1s;
    box-shadow: 0 4px 16px rgba(0,0,0,0.15);
    white-space: nowrap;
  }
  .tooltip.visible { opacity: 1; }
  .tt-title { font-weight: 600; margin-bottom: 5px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  .tt-row   { display: flex; gap: 10px; margin-bottom: 2px; }
  .tt-label { color: #6a6d70; min-width: 90px; font-size: 11px; }
  .tt-value { font-weight: 600; font-size: 11px; }
  .tt-red   { color: #bb0000; }
  .tt-blue  { color: #0a6ed1; }
  .tt-green { color: #107e3e; }
  .tt-gray  { color: #6a6d70; }
  .tt-orange{ color: #e9730c; }
</style>

<div class="root">
  <div class="widget-header">
    <div class="legend">
      <div class="legend-group">
        <span class="legend-group-title">Texto:</span>
        <div class="legend-items">
          <div class="legend-item"><div class="legend-dot ld-txt0"></div>Forecast</div>
          <div class="legend-item"><div class="legend-dot ld-txt1"></div>Sin confirmación</div>
          <div class="legend-item"><div class="legend-dot ld-txt2"></div>On Time</div>
          <div class="legend-item"><div class="legend-dot ld-txt3"></div>Delay parcial</div>
          <div class="legend-item"><div class="legend-dot ld-txt4"></div>Retrasado</div>
          <div class="legend-item"><div class="legend-dot ld-alert"></div>⚠ Múltiples pedidos</div>
        </div>
      </div>
      <div class="legend-group">
        <span class="legend-group-title">Fondo:</span>
        <div class="legend-items">
          <div class="legend-item"><div class="legend-swatch ld-bg2"></div>Frozen</div>
          <div class="legend-item"><div class="legend-swatch ld-bg3"></div>Planificación</div>
          <div class="legend-item"><div class="legend-swatch ld-bg4"></div>Restricción</div>
        </div>
      </div>
    </div>
  </div>

  <div class="state-msg" id="grpStateMsg">Cargando datos…</div>

  <div class="table-wrapper" id="grpTableWrapper" style="display:none;">
    <table>
      <thead>
        <tr class="header-row-1" id="grpHeaderRow1"></tr>
        <tr class="header-row-2" id="grpHeaderRow2"></tr>
      </thead>
      <tbody id="grpTableBody"></tbody>
    </table>
  </div>
</div>

<div class="tooltip" id="grpTooltip"></div>
`;

// ── Color maps ─────────────────────────────────────────────────
const GRP_TEXT_COLOR = {
  '0': '#8a9ab5',  // gris   — forecast
  '1': '#32363a',  // negro  — sin confirmación
  '2': '#107e3e',  // verde  — on time
  '3': '#0a6ed1',  // azul   — delay parcial
  '4': '#bb0000',  // rojo   — retrasado / OOS
};
const GRP_BG_COLOR = {
  '2': '#e8ecf0',  // gris  — frozen
  '3': '#d1e8f5',  // azul  — planificación
  '4': '#ffd0e0',  // rosa  — restricción
};
// Priority for background codes (higher = worse = wins)
const BG_PRIORITY = { '4': 3, '2': 2, '3': 1, '': 0 };
// Priority for text codes (higher = worse = wins)
const TXT_PRIORITY = { '4': 5, '3': 4, '1': 3, '2': 2, '0': 1, '': 0 };

const GRP_DEFAULT_TEXT = '#32363a';
const GRP_DEFAULT_BG   = 'transparent';

// ═══════════════════════════════════════════════════════════════
class DeliveryPlanGrouped extends HTMLElement {
  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });
    this._shadow.appendChild(TEMPLATE_GRP.content.cloneNode(true));
    this._rows      = [];
    this._periods   = [];
    this._pastPeriods   = [];
    this._futurePeriods = [];
    this._rowGroups = [];
  }

  connectedCallback() {
    setTimeout(() => this._loadDemoData(), 0);
  }

  // ── SAC Lifecycle ─────────────────────────────────────────────
  onCustomWidgetBeforeUpdate(changedProperties) {
    this._showState('Cargando…', false);
  }

  onCustomWidgetAfterUpdate(changedProperties) {
    try {
      const db = changedProperties?.myDataBinding
              ?? changedProperties?.dataBinding
              ?? null;
      if (!db) { this._loadDemoData(); return; }
      const rows = this._extractRows(db);
      if (!rows || rows.length === 0) {
        this._showState('Sin datos. Verifica el data binding y los filtros.', true);
        return;
      }
      this._processRows(rows);
      this._renderTable();
    } catch (err) {
      console.error('[DeliveryPlanGrouped]', err);
      this._showState('Error: ' + err.message, true);
    }
  }

  // ── Data extraction ───────────────────────────────────────────
  _extractRows(db) {
    const binding = db.myDataBinding ?? db;
    const data    = Array.isArray(binding) ? binding : (binding.data ?? []);
    if (!Array.isArray(data) || data.length === 0) return [];

    const keys = Object.keys(data[0]);
    const feedVal = (row, id, ...aliases) => {
      const k = keys.find(k => k === id)
             ?? keys.find(k => k.startsWith(id))
             ?? aliases.reduce((f, a) => f ?? keys.find(k => k.includes(a)), undefined);
      return k ? row[k] : undefined;
    };

    return data.map(row => {
      const qtyItem = feedVal(row, 'feed_qty');
      return {
        material:  this._label(feedVal(row, 'feed_material',  'MATERIAL')),
        molecule:  this._label(feedVal(row, 'feed_molecule',  'MOLECULE', 'MOLEC')),
        country:   this._label(feedVal(row, 'feed_country',   'COUNTRY',  '0COUNTRY')),
        vendor:    this._label(feedVal(row, 'feed_vendor',    'VENDOR',   'LIFNR')),
        planner:   this._label(feedVal(row, 'feed_planner',   'PLANNER',  'MRP')),
        yearMonth: this._label(feedVal(row, 'feed_yearmonth', '0CALMONTH', 'CALMONTH')),
        yearMonthId: this._id(feedVal(row, 'feed_yearmonth', '0CALMONTH', 'CALMONTH')),
        qty:       qtyItem?.rawValue ?? qtyItem?.raw ?? (typeof qtyItem === 'number' ? qtyItem : null),
        codTexto:  this._normalizeCode(feedVal(row, 'feed_cod_texto', 'NE_CODE_IB', 'CODE_IB')),
        codFondo:  this._normalizeCode(feedVal(row, 'feed_cod_fondo', 'NE_CODE_BG', 'CODE_BG')),
      };
    });
  }

  _label(item) {
    if (!item && item !== 0) return '';
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    return item.label ?? item.id ?? item.formattedValue ?? item.rawValue ?? '';
  }

  _id(item) {
    if (!item && item !== 0) return '';
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    return item.id ?? item.label ?? item.rawValue ?? '';
  }

  _normalizeCode(item) {
    if (!item && item !== 0) return '';
    const candidates = [item?.label, item?.id, item?.rawValue, item?.formattedValue,
      (typeof item === 'string' || typeof item === 'number') ? item : null];
    for (const c of candidates) {
      if (c === null || c === undefined) continue;
      const s = String(c).trim().replace(/^0+(\d)/, '$1');
      if (s !== '' && s !== 'null' && s !== 'undefined' && s !== '0' && s.toLowerCase() !== 'totals') return s;
    }
    return '';
  }

  // ── Data processing — aggregate by material ───────────────────
  _processRows(rows) {
    this._rows = rows;
    const todayNum = this._todayYYYYMM();

    // Build sorted period list
    const periodMap = new Map();
    rows.forEach(r => {
      if (!r.yearMonth || periodMap.has(r.yearMonth)) return;
      const num = this._parseYYYYMM(r.yearMonthId || r.yearMonth);
      periodMap.set(r.yearMonth, { label: r.yearMonth, num });
    });
    const sorted = [...periodMap.values()].filter(p => p.num !== null).sort((a, b) => a.num - b.num);
    this._pastPeriods   = sorted.filter(p => p.num < todayNum).map(p => p.label);
    this._futurePeriods = sorted.filter(p => p.num >= todayNum).slice(0, 13).map(p => p.label);
    this._periods       = [...this._pastPeriods, ...this._futurePeriods];

    // Aggregate by material (+ molecule, country, vendor, planner as attributes)
    const groupMap = new Map();
    rows.forEach(r => {
      // Group key: material + country (same material can have different countries)
      const key = `${r.material}||${r.country}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          material: r.material,
          molecule: r.molecule,
          country:  r.country,
          vendor:   r.vendor,
          planner:  r.planner,
          cells: {},     // period → { qty, codTexto, codFondo, count }
          pastCell: { qty: null, codTexto: '', codFondo: '', count: 0 },
        });
      }
      const g = groupMap.get(key);

      // Update dimension attributes (take last non-empty value)
      if (r.molecule && !g.molecule) g.molecule = r.molecule;
      if (r.vendor   && !g.vendor)   g.vendor   = r.vendor;
      if (r.planner  && !g.planner)  g.planner  = r.planner;

      const isPast = this._pastPeriods.includes(r.yearMonth);
      const target = isPast ? g.pastCell : (g.cells[r.yearMonth] = g.cells[r.yearMonth] ?? { qty: null, codTexto: '', codFondo: '', count: 0 });

      // Aggregate quantity
      if (r.qty !== null && r.qty !== undefined) {
        const n = typeof r.qty === 'number' ? r.qty : parseFloat(String(r.qty).replace(/[^0-9.-]/g, ''));
        target.qty = (target.qty ?? 0) + (isNaN(n) ? 0 : n);
      }
      target.count = (target.count || 0) + 1;

      // Worst background (higher priority wins)
      if ((BG_PRIORITY[r.codFondo] ?? 0) > (BG_PRIORITY[target.codFondo] ?? 0)) {
        target.codFondo = r.codFondo;
      }
      // Worst text color (higher priority wins)
      if ((TXT_PRIORITY[r.codTexto] ?? 0) > (TXT_PRIORITY[target.codTexto] ?? 0)) {
        target.codTexto = r.codTexto;
      }
    });

    this._rowGroups = [...groupMap.values()];
  }

  // ── Render ────────────────────────────────────────────────────
  _renderTable() {
    if (this._rowGroups.length === 0) { this._showState('Sin datos.', false); return; }
    this._hideState();

    const hr1   = this._shadow.getElementById('grpHeaderRow1');
    const hr2   = this._shadow.getElementById('grpHeaderRow2');
    const tbody = this._shadow.getElementById('grpTableBody');
    if (!hr1 || !hr2 || !tbody) { console.error('[DeliveryPlanGrouped] DOM elements not found'); return; }
    hr1.innerHTML = ''; hr2.innerHTML = ''; tbody.innerHTML = '';

    const DIMS = ['Material', 'Molécula', 'País', 'Vendor / CMO', 'Planner'];
    const hasPast = this._pastPeriods.length > 0;
    const totalCols = (hasPast ? 1 : 0) + this._futurePeriods.length;

    DIMS.forEach(h => {
      const th1 = document.createElement('th'); th1.textContent = h; th1.className = 'dim-header'; hr1.appendChild(th1);
      const th2 = document.createElement('th'); th2.className = 'dim-header'; hr2.appendChild(th2);
    });

    const thM = document.createElement('th');
    thM.textContent = 'Measures — Quantity'; thM.colSpan = totalCols;
    hr1.appendChild(thM);

    if (hasPast) {
      const thP = document.createElement('th');
      thP.textContent = 'PAST'; thP.style.cssText = 'background:#e8e8e8;color:#32363a;font-style:italic;';
      hr2.appendChild(thP);
    }
    this._futurePeriods.forEach(p => {
      const th = document.createElement('th'); th.textContent = this._formatPeriod(p); hr2.appendChild(th);
    });

    this._rowGroups.forEach(group => {
      const tr = document.createElement('tr');

      // Dimension cells
      [
        { val: group.material, cls: 'material' },
        { val: group.molecule, cls: 'molecule'  },
        { val: group.country,  cls: 'country'   },
        { val: group.vendor,   cls: 'vendor'    },
        { val: group.planner,  cls: 'planner'   },
      ].forEach(({ val, cls }) => {
        const td = document.createElement('td');
        td.className = `dim-cell ${cls}`; td.textContent = val || '—';
        tr.appendChild(td);
      });

      // PAST column
      if (hasPast) {
        const pc = group.pastCell;
        const tdP = document.createElement('td'); tdP.className = 'qty-cell';
        const inp = document.createElement('div'); inp.className = 'qty-inner';
        inp.style.background = '#f5f5f5';
        if (pc.qty === null) {
          inp.textContent = '–'; inp.classList.add('empty');
        } else {
          inp.textContent = this._fmtQty(pc.qty);
          if (pc.count > 1) {
            inp.style.color = GRP_DEFAULT_TEXT;
            const icon = document.createElement('span'); icon.className = 'alert-icon'; icon.textContent = '⚠';
            inp.appendChild(icon);
          } else {
            inp.style.color = GRP_TEXT_COLOR[pc.codTexto] ?? GRP_DEFAULT_TEXT;
          }
          if (GRP_BG_COLOR[pc.codFondo]) inp.style.background = GRP_BG_COLOR[pc.codFondo];
        }
        tdP.appendChild(inp); tr.appendChild(tdP);
      }

      // Future period columns
      this._futurePeriods.forEach(p => {
        const cell = group.cells[p];
        const tdC  = document.createElement('td'); tdC.className = 'qty-cell';
        const inner = document.createElement('div'); inner.className = 'qty-inner';

        if (!cell || cell.qty === null) {
          inner.textContent = '–'; inner.classList.add('empty');
          inner.style.background = GRP_BG_COLOR[cell?.codFondo] ?? GRP_DEFAULT_BG;
        } else {
          inner.textContent = this._fmtQty(cell.qty);
          if (cell.count > 1) {
            // Multiple orders — black text + warning icon
            inner.style.color = GRP_DEFAULT_TEXT;
            const icon = document.createElement('span'); icon.className = 'alert-icon'; icon.textContent = '⚠';
            inner.appendChild(icon);
          } else {
            inner.style.color = GRP_TEXT_COLOR[cell.codTexto] ?? GRP_DEFAULT_TEXT;
          }
          inner.style.background = GRP_BG_COLOR[cell.codFondo] ?? GRP_DEFAULT_BG;
          inner.addEventListener('mouseenter', e => this._showTooltip(e, group, this._formatPeriod(p), cell));
          inner.addEventListener('mousemove',  e => this._moveTooltip(e));
          inner.addEventListener('mouseleave', () => this._hideTooltip());
        }
        tdC.appendChild(inner); tr.appendChild(tdC);
      });

      tbody.appendChild(tr);
    });
  }

  // ── Demo data ─────────────────────────────────────────────────
  _loadDemoData() {
    this._processRows([
      { material:'TH1088', molecule:'TRAZODONE',    country:'IE', vendor:'ZENTIVA KS',        planner:'Elena',  yearMonth:'November 2025',  yearMonthId:'11.2025', qty:10342, codTexto:'2', codFondo:'' },
      { material:'TH1088', molecule:'TRAZODONE',    country:'IE', vendor:'ZENTIVA KS',        planner:'Elena',  yearMonth:'March 2026',     yearMonthId:'03.2026', qty:10342, codTexto:'2', codFondo:'2' },
      { material:'TH1089', molecule:'TRAZODONE',    country:'IE', vendor:'ZENTIVA KS',        planner:'Elena',  yearMonth:'November 2025',  yearMonthId:'11.2025', qty:19500, codTexto:'4', codFondo:'4' },
      { material:'TH1089', molecule:'TRAZODONE',    country:'IE', vendor:'ZENTIVA KS',        planner:'Elena',  yearMonth:'November 2025',  yearMonthId:'11.2025', qty:5000,  codTexto:'3', codFondo:'4' },
      { material:'TH1083', molecule:'CHLORPROMAZINE',country:'FR',vendor:'ADRAGOS PHARMA',    planner:'Elena',  yearMonth:'January 2026',   yearMonthId:'01.2026', qty:22000, codTexto:'2', codFondo:'3' },
      { material:'TH1083', molecule:'CHLORPROMAZINE',country:'FR',vendor:'ADRAGOS PHARMA',    planner:'Elena',  yearMonth:'June 2026',      yearMonthId:'06.2026', qty:22000, codTexto:'3', codFondo:'' },
      { material:'TH0512', molecule:'UBLITUXIMAB',  country:'NL', vendor:'SK PHARMA',         planner:'Rocío',  yearMonth:'October 2025',   yearMonthId:'10.2025', qty:1200,  codTexto:'1', codFondo:'4' },
      { material:'TH0512', molecule:'UBLITUXIMAB',  country:'NL', vendor:'SK PHARMA',         planner:'Rocío',  yearMonth:'January 2026',   yearMonthId:'01.2026', qty:1257,  codTexto:'2', codFondo:'3' },
    ]);
    this._renderTable();
  }

  // ── Tooltip ───────────────────────────────────────────────────
  _showTooltip(e, group, period, cell) {
    const tt = this._shadow.getElementById('grpTooltip');
    if (!tt) return;
    const isMulti = cell.count > 1;
    const txtLabel = isMulti ? `⚠ ${cell.count} pedidos` : (cell.codTexto ? `Código ${cell.codTexto}` : 'Sin código');
    const txtClass = isMulti ? 'tt-orange' : ({ '2':'tt-green','3':'tt-blue','4':'tt-red','0':'tt-gray','1':'' }[cell.codTexto] ?? '');
    tt.innerHTML = `
      <div class="tt-title">${group.material} · ${period}</div>
      <div class="tt-row"><span class="tt-label">Cantidad total</span><span class="tt-value">${this._fmtQty(cell.qty)}</span></div>
      <div class="tt-row"><span class="tt-label">Molécula</span><span class="tt-value">${group.molecule || '—'}</span></div>
      <div class="tt-row"><span class="tt-label">País</span><span class="tt-value">${group.country || '—'}</span></div>
      <div class="tt-row"><span class="tt-label">Vendor</span><span class="tt-value">${group.vendor || '—'}</span></div>
      <div class="tt-row"><span class="tt-label">Estado texto</span><span class="tt-value ${txtClass}">${txtLabel}</span></div>
      <div class="tt-row"><span class="tt-label">Cód. Fondo</span><span class="tt-value">${cell.codFondo ? `Código ${cell.codFondo}` : 'Sin código'}</span></div>
    `;
    tt.classList.add('visible');
    this._moveTooltip(e);
  }
  _moveTooltip(e) {
    const tt = this._shadow.getElementById('grpTooltip');
    if (!tt) return;
    tt.style.left = Math.min(e.clientX + 16, window.innerWidth - 300) + 'px';
    tt.style.top  = Math.max(e.clientY - 10, 8) + 'px';
  }
  _hideTooltip() {
    const tt = this._shadow.getElementById('grpTooltip');
    if (tt) tt.classList.remove('visible');
  }

  // ── Helpers ───────────────────────────────────────────────────
  _fmtQty(qty) {
    if (qty === null || qty === undefined) return '–';
    const n = typeof qty === 'number' ? qty : parseFloat(String(qty).replace(/[^0-9.-]/g, ''));
    if (isNaN(n)) return String(qty);
    return n.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 3 });
  }

  _todayYYYYMM() {
    const d = new Date();
    return d.getFullYear() * 100 + (d.getMonth() + 1);
  }

  _parseYYYYMM(raw) {
    if (!raw) return null;
    const s = String(raw).trim();
    const MONTHS = { january:1,february:2,march:3,april:4,may:5,june:6,july:7,august:8,september:9,october:10,november:11,december:12,jan:1,feb:2,mar:3,apr:4,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12 };
    const t1 = s.match(/^([A-Za-z]+)\s+(\d{4})$/);
    if (t1) { const m = MONTHS[t1[1].toLowerCase()]; if (m) return parseInt(t1[2]) * 100 + m; }
    const t2 = s.match(/^(\d{4})\s+([A-Za-z]+)$/);
    if (t2) { const m = MONTHS[t2[2].toLowerCase()]; if (m) return parseInt(t2[1]) * 100 + m; }
    const dot = s.match(/^(\d{1,2})\.(\d{4})$/);
    if (dot) return parseInt(dot[2]) * 100 + parseInt(dot[1]);
    if (/^\d{6}$/.test(s)) return parseInt(s);
    const dash = s.match(/^(\d{4})-(\d{2})$/);
    if (dash) return parseInt(dash[1]) * 100 + parseInt(dash[2]);
    return null;
  }

  _formatPeriod(raw) {
    if (!raw) return '';
    if (/[a-zA-Z]/.test(String(raw))) return String(raw);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const num = this._parseYYYYMM(raw);
    if (!num) return raw;
    return `${months[(num % 100) - 1]} ${Math.floor(num / 100)}`;
  }

  _showState(msg, isError) {
    const el = this._shadow.getElementById('grpStateMsg');
    const tw = this._shadow.getElementById('grpTableWrapper');
    if (!el || !tw) return;
    el.textContent = msg; el.className = 'state-msg' + (isError ? ' error' : '');
    el.style.display = 'flex'; tw.style.display = 'none';
  }
  _hideState() {
    const el = this._shadow.getElementById('grpStateMsg');
    const tw = this._shadow.getElementById('grpTableWrapper');
    if (el) el.style.display = 'none';
    if (tw) tw.style.display = '';
  }
}

customElements.define('com-yourcompany-deliverygrp', DeliveryPlanGrouped);
