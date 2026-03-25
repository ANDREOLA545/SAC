/**
 * SAC Custom Widget — Model Codes Delivery View
 * Web Component (main) — compatible con SAP Analytics Cloud Optimized Stories
 *
 * Feeds esperados en myDataBinding:
 *   feed_material, feed_fecha, feed_docdate, feed_frozen,
 *   feed_yearmonth, feed_cod_texto, feed_cod_fondo, feed_qty
 */

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
<style>
  /* ── SAC-native look ── */
  :host { display: block; width: 100%; height: 100%; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* Fuente SAP — usa la misma que SAC si está disponible, si no fallback a Arial */
  :host { font-family: "72", "72full", Arial, Helvetica, sans-serif; font-size: 13px; color: #32363a; }

  .root { padding: 0; background: #fff; min-height: 100%; }

  /* ── Leyenda (cabecera del widget) ── */
  .widget-header {
    display: flex; align-items: center; justify-content: flex-end;
    padding: 6px 8px 4px; gap: 16px; flex-wrap: wrap;
    border-bottom: 1px solid #e5e5e5;
    background: #fff;
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
  .ld-bg2  { background: #e8ecf0; }
  .ld-bg3  { background: #d1e8f5; }
  .ld-bg4  { background: #ffd0e0; }

  /* ── Estado loading/error ── */
  .state-msg { display: flex; align-items: center; justify-content: center; height: 80px; font-size: 12px; color: #6a6d70; }
  .state-msg.error { color: #bb0000; }

  /* ── Tabla ── */
  .table-wrapper { overflow-x: auto; background: #fff; }
  table { border-collapse: collapse; width: 100%; min-width: 600px; }

  /* Cabecera fila 1 — "Measures" — azul SAP oscuro */
  thead tr.header-row-1 th {
    background: #1873b4;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    padding: 6px 8px;
    text-align: center;
    border-right: 1px solid rgba(255,255,255,0.2);
    white-space: nowrap;
  }
  thead tr.header-row-1 th.dim-header {
    text-align: left;
    background: #fff;
    color: #32363a;
    border-right: 1px solid #e5e5e5;
    border-bottom: 1px solid #e5e5e5;
  }

  /* Cabecera fila 2 — meses — azul SAP claro */
  thead tr.header-row-2 th {
    background: #c0daf5;
    color: #32363a;
    font-size: 12px;
    font-weight: 600;
    padding: 5px 8px;
    text-align: center;
    border-right: 1px solid #a8c8e8;
    border-bottom: 2px solid #1873b4;
    white-space: nowrap;
  }
  thead tr.header-row-2 th.dim-header {
    background: #fff;
    color: #32363a;
    text-align: left;
    border-right: 1px solid #e5e5e5;
    border-bottom: 2px solid #1873b4;
  }

  /* Filas de datos */
  tbody tr { border-bottom: 1px solid #e5e5e5; }
  tbody tr:hover { background: #f5f5f5 !important; }
  tbody tr:last-child { border-bottom: none; }

  /* Celdas dimensión (columnas fijas) */
  td.dim-cell {
    padding: 5px 8px;
    font-size: 12px;
    white-space: nowrap;
    border-right: 1px solid #e5e5e5;
    color: #32363a;
    background: #fff;
  }
  td.dim-cell.material { font-weight: 600; color: #0a6ed1; min-width: 90px; }
  td.dim-cell.date     { color: #32363a; min-width: 85px; }
  td.dim-cell.frozen   { color: #32363a; min-width: 85px; }
  td.dim-cell.frozen-active { color: #bb0000; font-weight: 600; }

  /* Celdas de cantidad */
  td.qty-cell {
    padding: 0;
    text-align: right;
    border-right: 1px solid #e5e5e5;
    min-width: 85px;
  }
  td.qty-cell:last-child { border-right: none; }
  .qty-inner {
    display: flex; align-items: center; justify-content: flex-end;
    padding: 5px 8px; height: 100%;
    font-size: 12px; font-weight: 400;
    position: relative;
  }
  .qty-inner.empty { color: #aaaaaa; }

  /* ── Tooltip ── */
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
  .tt-title { font-weight: 600; margin-bottom: 5px; color: #32363a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  .tt-row   { display: flex; gap: 10px; margin-bottom: 2px; }
  .tt-label { color: #6a6d70; min-width: 90px; font-size: 11px; }
  .tt-value { font-weight: 600; font-size: 11px; }
  .tt-red   { color: #bb0000; }
  .tt-blue  { color: #0a6ed1; }
  .tt-green { color: #107e3e; }
  .tt-gray  { color: #6a6d70; }
  .tt-orange{ color: #e76500; }
</style>

<div class="root">
  <!-- Leyenda superior -->
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

  <div class="state-msg" id="stateMsg">Cargando datos…</div>

  <div class="table-wrapper" id="tableWrapper" style="display:none;">
    <table>
      <thead>
        <tr class="header-row-1" id="headerRow1"></tr>
        <tr class="header-row-2" id="headerRow2"></tr>
      </thead>
      <tbody id="tableBody"></tbody>
    </table>
  </div>
</div>

<div class="tooltip" id="tooltip"></div>
`;

// ── Color maps — esquema completo según requerimientos ────────
const TEXT_COLOR = {
  '0': '#8a9ab5',   // gris   — forecast / sin pedido
  '1': '#32363a',   // negro  — open order sin confirmación
  '2': '#107e3e',   // verde  — on time
  '3': '#0a6ed1',   // azul   — delay parcial / bajo stock seguridad
  '4': '#bb0000',   // rojo   — no cumple 1ª confirmada / OOS
};
const BG_COLOR = {
  '2': '#e8ecf0',   // gris claro  — frozen period
  '3': '#d1e8f5',   // azul claro  — período planificación
  '4': '#ffd0e0',   // rosa/rojo   — restricción fabricación
};
const DEFAULT_TEXT = '#1a2233';
const DEFAULT_BG   = 'transparent';

class ModelCodesWidget extends HTMLElement {
  constructor() {
    super();
    this._shadow = this.attachShadow({ mode: 'open' });
    this._shadow.appendChild(TEMPLATE.content.cloneNode(true));
    this._rows      = [];
    this._periods   = [];
    this._rowGroups = [];
    this._ready     = false;
  }

  connectedCallback() {
    this._ready = true;
    // Defer to ensure shadow DOM is fully attached
    setTimeout(() => this._loadDemoData(), 0);
  }

  // ── SAC Lifecycle ─────────────────────────────────────────────
  onCustomWidgetBeforeUpdate(changedProperties) {
    this._showState('Cargando…', false);
  }

  onCustomWidgetAfterUpdate(changedProperties) {
    try {
      // From debug: SAC passes data via changedProperties.myDataBinding
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
      console.error('[ModelCodesWidget]', err);
      this._showState('Error: ' + err.message, true);
    }
  }


  // ── Data extraction ───────────────────────────────────────────
  _extractRows(db) {
    const data = Array.isArray(db) ? db : (db.data ?? []);
    if (!Array.isArray(data) || data.length === 0) return [];

    const keys = Object.keys(data[0]);

    // SAC uses technical dimension IDs as row keys, not feed IDs.
    // We try: (1) feed ID exact, (2) feed ID prefix, (3) technical ID, (4) any key containing the term
    const feedVal = (row, feedId, ...techIds) => {
      const k = keys.find(k => k === feedId)
             ?? keys.find(k => k.startsWith(feedId))
             ?? techIds.reduce((found, tid) => found ?? keys.find(k => k.includes(tid)), undefined)
             ?? keys.find(k => k.includes(feedId));
      const val = k ? row[k] : undefined;
      return val;
    };

    return data.map(row => {
      const qtyItem = feedVal(row, 'feed_qty');
      return {
        material:  this._label(feedVal(row, 'feed_material',  'MATERIAL', 'Material')),
        fecha:     this._label(feedVal(row, 'feed_fecha',     'NE_F_ENTR', 'FENTR')),
        docDate:   this._label(feedVal(row, 'feed_docdate',   'NE_FECONF', 'FECONF', 'DOCDATE')),
        frozen:    this._label(feedVal(row, 'feed_frozen',    'NE_FROZ', 'FROZ')),
        yearMonth: this._label(feedVal(row, 'feed_yearmonth', '0CALMONTH', 'CALMONTH')),
        yearMonthId: this._id(feedVal(row, 'feed_yearmonth', '0CALMONTH', 'CALMONTH')),
        qty:       qtyItem?.rawValue ?? qtyItem?.raw ?? (typeof qtyItem === 'number' ? qtyItem : null),
        codTexto:  this._normalizeCode(feedVal(row, 'feed_cod_texto', 'NE_CODE_IB', 'CODE_IB', 'CODES-NE_CODE_IB')),
        codFondo:  this._normalizeCode(feedVal(row, 'feed_cod_fondo', 'NE_CODE_BG', 'CODE_BG', 'CODES-NE_CODE_BG')),
      };
    });
  }

  _label(item) {
    if (!item && item !== 0) return '';
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    return item.label ?? item.id ?? item.formattedValue ?? item.rawValue ?? '';
  }

  // Get the technical ID of a SAC dimension value (used for CalMonth sorting)
  _id(item) {
    if (!item && item !== 0) return '';
    if (typeof item === 'string' || typeof item === 'number') return String(item);
    return item.id ?? item.label ?? item.rawValue ?? '';
  }

  // Normalize SAC dimension value → clean digit string ("1","2","3","4")
  _normalizeCode(item) {
    if (!item && item !== 0) return '';
    const candidates = [
      item?.label,
      item?.id,
      item?.rawValue,
      item?.formattedValue,
      (typeof item === 'string' || typeof item === 'number') ? item : null,
    ];
    for (const c of candidates) {
      if (c === null || c === undefined) continue;
      const s = String(c).trim().replace(/^0+(\d)/, '$1');
      if (s !== '' && s !== 'null' && s !== 'undefined' && s !== '0' && s.toLowerCase() !== 'totals') return s;
    }
    return '';
  }

  // ── Data processing ───────────────────────────────────────────
  _processRows(rows) {
    this._rows = rows;

    // ── Build period structure ────────────────────────────────
    // CalMonth from SAC can arrive in multiple formats:
    //   "09.2025"  (MM.YYYY — most common from BW)
    //   "202509"   (YYYYMM)
    //   "2025-09"  (YYYY-MM)
    // We normalize all to YYYYMM integer for sorting/comparison.

    const todayNum = this._todayYYYYMM();

    // Build unique periods using BOTH id (for sorting) and label (for display/lookup)
    // yearMonthId: "09.2025" or "202509" — used for sorting
    // yearMonth:   "October 2025"        — used as cell key and display label

    const periodMap = new Map(); // label → { label, id, num }
    rows.forEach(r => {
      if (!r.yearMonth || periodMap.has(r.yearMonth)) return;
      const num = this._parseYYYYMM(r.yearMonthId || r.yearMonth);
      periodMap.set(r.yearMonth, { label: r.yearMonth, id: r.yearMonthId, num });
    });

    const sorted = [...periodMap.values()]
      .filter(p => p.num !== null)
      .sort((a, b) => a.num - b.num);

    const pastNorm   = sorted.filter(p => p.num < todayNum);
    const futureNorm = sorted.filter(p => p.num >= todayNum).slice(0, 13);

    // Store as label strings (used as cell keys in _rowGroups)
    this._pastPeriods   = pastNorm.map(p => p.label);
    this._futurePeriods = futureNorm.map(p => p.label);
    this._periods       = [...this._pastPeriods, ...this._futurePeriods];

    // ── Group rows ────────────────────────────────────────────
    const groupMap = new Map();
    rows.forEach(r => {
      const key = [r.material, r.fecha, r.docDate, r.frozen].join('||');
      if (!groupMap.has(key)) groupMap.set(key, { material:r.material, fecha:r.fecha, docDate:r.docDate, frozen:r.frozen, cells:{}, pastCell:{ qty:null, codTexto:'', codFondo:'' } });
      const g = groupMap.get(key);
      if (this._pastPeriods.includes(r.yearMonth)) {
        // Aggregate PAST: sum qty, keep worst codTexto, any codFondo
        const prev = g.pastCell;
        const prevQty = prev.qty ?? 0;
        const newQty  = r.qty ?? 0;
        prev.qty = (prev.qty === null && r.qty === null) ? null : prevQty + newQty;
        // worst text color: higher number = worse state
        if (!prev.codTexto || (r.codTexto && r.codTexto > prev.codTexto)) prev.codTexto = r.codTexto;
        if (!prev.codFondo || (r.codFondo && r.codFondo > prev.codFondo)) prev.codFondo = r.codFondo;
      } else {
        g.cells[r.yearMonth] = { qty:r.qty, codTexto:r.codTexto, codFondo:r.codFondo };
      }
    });
    this._rowGroups = [...groupMap.values()];
  }

  // Returns current month as YYYYMM integer (e.g. 202503)
  _todayYYYYMM() {
    const d = new Date();
    return d.getFullYear() * 100 + (d.getMonth() + 1);
  }

  // Parse any SAC CalMonth format → YYYYMM integer, or null if unrecognized
  // Handles: "09.2025" (MM.YYYY), "202509" (YYYYMM), "2025-09" (YYYY-MM)
  _parseYYYYMM(raw) {
    if (!raw) return null;
    const s = String(raw).trim();
    // MM.YYYY  e.g. "09.2025"
    const dotMatch = s.match(/^(\d{1,2})\.(\d{4})$/);
    if (dotMatch) return parseInt(dotMatch[2]) * 100 + parseInt(dotMatch[1]);
    // YYYYMM   e.g. "202509"
    if (/^\d{6}$/.test(s)) return parseInt(s);
    // YYYY-MM  e.g. "2025-09"
    const dashMatch = s.match(/^(\d{4})-(\d{2})$/);
    if (dashMatch) return parseInt(dashMatch[1]) * 100 + parseInt(dashMatch[2]);
    return null;
  }

  // Format CalMonth value → readable label e.g. "Sep 2025"
  // If already readable text ("October 2025"), returns as-is.
  // If numeric format ("09.2025", "202509"), converts to "Sep 2025".
  _formatPeriod(raw) {
    if (!raw) return '';
    // If it looks like readable text already (contains letters), return as-is
    if (/[a-zA-Z]/.test(String(raw))) return String(raw);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const num = this._parseYYYYMM(raw);
    if (!num) return raw;
    const y = Math.floor(num / 100);
    const m = (num % 100) - 1;
    return `${months[m]} ${y}`;
  }

  // ── Render ────────────────────────────────────────────────────
  _renderTable() {
    if (this._rowGroups.length === 0) { this._showState('Sin datos.', false); return; }
    this._hideState();

    const hr1   = this._shadow.getElementById('headerRow1');
    const hr2   = this._shadow.getElementById('headerRow2');
    const tbody = this._shadow.getElementById('tableBody');
    if (!hr1 || !hr2 || !tbody) { console.error('[ModelCodes] Table DOM elements not found'); return; }
    hr1.innerHTML = ''; hr2.innerHTML = ''; tbody.innerHTML = '';

    const DIMS = ['Material', 'Fecha Entrega', 'Document Date', 'Frozen End'];

    // Number of visible period columns: PAST (if any) + future periods
    const hasPast = this._pastPeriods.length > 0;
    const totalCols = (hasPast ? 1 : 0) + this._futurePeriods.length;

    DIMS.forEach(h => {
      const th = document.createElement('th'); th.textContent = h; th.className = 'dim-header';
      hr1.appendChild(th);
      const th2 = document.createElement('th'); th2.className = 'dim-header';
      hr2.appendChild(th2);
    });

    // Header row 1 — "Measures — Quantity" spanning all period cols
    const thM = document.createElement('th');
    thM.textContent = 'Measures — Quantity'; thM.colSpan = totalCols;
    hr1.appendChild(thM);

    // Header row 2 — PAST col + individual months
    if (hasPast) {
      const thP = document.createElement('th');
      thP.textContent = 'PAST';
      thP.style.cssText = 'background:#e8e8e8;color:#32363a;font-style:italic;';
      hr2.appendChild(thP);
    }
    this._futurePeriods.forEach(p => {
      const th = document.createElement('th');
      th.textContent = this._formatPeriod(p);
      hr2.appendChild(th);
    });

    const today = new Date();

    this._rowGroups.forEach(group => {
      const tr = document.createElement('tr');
      const frozenDate   = this._parseDate(group.frozen);
      const frozenActive = frozenDate && frozenDate >= today;

      [
        { val: group.material, cls: 'material' },
        { val: group.fecha,    cls: 'date'     },
        { val: group.docDate,  cls: 'date'     },
        { val: group.frozen,   cls: 'frozen' + (frozenActive ? ' frozen-active' : '') },
      ].forEach(({ val, cls }) => {
        const td = document.createElement('td');
        td.className = `dim-cell ${cls}`; td.textContent = val || '—';
        tr.appendChild(td);
      });

      // ── PAST column ──────────────────────────────────────────
      if (hasPast) {
        const pastCell = group.pastCell;
        const tdP   = document.createElement('td'); tdP.className = 'qty-cell';
        const innerP = document.createElement('div'); innerP.className = 'qty-inner';
        innerP.style.background = '#f5f5f5';
        if (!pastCell || pastCell.qty === null) {
          innerP.textContent = '–'; innerP.classList.add('empty');
        } else {
          innerP.textContent = typeof pastCell.qty === 'number'
            ? pastCell.qty.toLocaleString('es-ES', { minimumFractionDigits:0, maximumFractionDigits:3 })
            : pastCell.qty;
          innerP.style.color = TEXT_COLOR[pastCell.codTexto] ?? DEFAULT_TEXT;
          if (BG_COLOR[pastCell.codFondo]) innerP.style.background = BG_COLOR[pastCell.codFondo];
        }
        tdP.appendChild(innerP); tr.appendChild(tdP);
      }

      // ── Future period columns (ordered) ──────────────────────
      this._futurePeriods.forEach(p => {
        const cell  = group.cells[p];
        const tdC   = document.createElement('td'); tdC.className = 'qty-cell';
        const inner = document.createElement('div'); inner.className = 'qty-inner';

        if (!cell || cell.qty === null || cell.qty === undefined) {
          inner.textContent = '–'; inner.classList.add('empty');
          // Always apply background even if no qty
          inner.style.background = BG_COLOR[cell?.codFondo] ?? DEFAULT_BG;
          inner.style.color = DEFAULT_TEXT;
        } else {
          inner.textContent      = typeof cell.qty === 'number'
            ? cell.qty.toLocaleString('es-ES', { minimumFractionDigits:0, maximumFractionDigits:3 })
            : cell.qty;
          inner.style.color      = TEXT_COLOR[cell.codTexto] ?? DEFAULT_TEXT;
          inner.style.background = BG_COLOR[cell.codFondo]   ?? DEFAULT_BG;
          inner.addEventListener('mouseenter', e => this._showTooltip(e, group, this._formatPeriod(p), cell));
          inner.addEventListener('mousemove',  e => this._moveTooltip(e));
          inner.addEventListener('mouseleave', () => this._hideTooltip());
        }
        tdC.appendChild(inner); tr.appendChild(tdC);
      });

      tbody.appendChild(tr);
    });

    // summary (footer removed from template)
    const fs = this._shadow.getElementById('footerSummary');
    if (fs) fs.textContent = `${this._rowGroups.length} filas · ${this._periods.length} períodos`;
  }

  // ── Demo data ─────────────────────────────────────────────────
  _loadDemoData() {
    this._processRows([
      { material:'ES/TH1088', fecha:'01.11.2025', docDate:'25.10.2025', frozen:'Apr 25, 2026', yearMonth:'202509', qty:null,  codTexto:'',  codFondo:'4' },
      { material:'ES/TH1088', fecha:'01.11.2025', docDate:'25.10.2025', frozen:'Apr 25, 2026', yearMonth:'202511', qty:10342, codTexto:'2', codFondo:''  },
      { material:'ES/TH1088', fecha:'01.11.2025', docDate:'25.10.2025', frozen:'Apr 25, 2026', yearMonth:'202604', qty:null,  codTexto:'',  codFondo:'4' },
      { material:'ES/TH1088', fecha:'01.11.2025', docDate:'25.10.2025', frozen:'Apr 25, 2026', yearMonth:'202606', qty:5000,  codTexto:'3', codFondo:'2' },
      { material:'ES/TH1089', fecha:'15.09.2025', docDate:'01.02.2025', frozen:'Apr 25, 2026', yearMonth:'202409', qty:19500, codTexto:'3', codFondo:'2' },
      { material:'ES/TH1089', fecha:'15.09.2025', docDate:'01.02.2025', frozen:'Apr 25, 2026', yearMonth:'202502', qty:8000,  codTexto:'1', codFondo:''  },
      { material:'ES/TH1089', fecha:'15.09.2025', docDate:'01.02.2025', frozen:'Apr 25, 2026', yearMonth:'202504', qty:null,  codTexto:'',  codFondo:''  },
      { material:'ES/TH1089', fecha:'01.09.2026', docDate:'15.10.2025', frozen:'Mar 26, 2026', yearMonth:'202503', qty:null,  codTexto:'',  codFondo:''  },
      { material:'ES/TH1089', fecha:'01.09.2026', docDate:'15.10.2025', frozen:'Mar 26, 2026', yearMonth:'202507', qty:null,  codTexto:'',  codFondo:''  },
      { material:'ES/TH1089', fecha:'01.09.2026', docDate:'15.10.2025', frozen:'Mar 26, 2026', yearMonth:'202609', qty:20897, codTexto:'3', codFondo:'4' },
    ]);
    this._renderTable();
  }

  // ── Tooltip ───────────────────────────────────────────────────
  _showTooltip(e, group, period, cell) {
    const tt       = this._shadow.getElementById('tooltip');
    if (!tt) return;
    const txtClass = { '1':'tt-red','2':'tt-blue','3':'tt-green' }[cell.codTexto] ?? 'tt-gray';
    const bgClass  = cell.codFondo === '4' ? 'tt-red' : cell.codFondo ? 'tt-gray' : 'tt-gray';
    const qty      = typeof cell.qty === 'number'
      ? cell.qty.toLocaleString('es-ES', { minimumFractionDigits:0, maximumFractionDigits:3 })
      : cell.qty;

    tt.innerHTML = `
      <div class="tt-title">${group.material} · ${period}</div>
      <div class="tt-row"><span class="tt-label">Quantity</span><span class="tt-value">${qty}</span></div>
      <div class="tt-row"><span class="tt-label">Fecha Entrega</span><span class="tt-value">${group.fecha||'—'}</span></div>
      <div class="tt-row"><span class="tt-label">Frozen End</span><span class="tt-value">${group.frozen||'—'}</span></div>
      <div class="tt-row"><span class="tt-label">Cód. Texto</span><span class="tt-value ${txtClass}">${cell.codTexto ? 'Código '+cell.codTexto : 'Sin código'}</span></div>
      <div class="tt-row"><span class="tt-label">Cód. Fondo</span><span class="tt-value ${bgClass}">${cell.codFondo ? 'Código '+cell.codFondo : 'Sin código'}</span></div>
    `;
    tt.classList.add('visible');
    this._moveTooltip(e);
  }
  _moveTooltip(e) {
    const tt = this._shadow.getElementById('tooltip');
    if (!tt) return;
    tt.style.left = Math.min(e.clientX + 16, window.innerWidth - 300) + 'px';
    tt.style.top  = Math.max(e.clientY - 10, 8) + 'px';
  }
  _hideTooltip() { const tt = this._shadow.getElementById('tooltip'); if (tt) tt.classList.remove('visible'); }

  // ── Helpers ───────────────────────────────────────────────────
  _parseDate(str) {
    if (!str) return null;
    const d = new Date(str);
    if (!isNaN(d)) return d;
    const p = str.split('.');
    return p.length === 3 ? new Date(`${p[2]}-${p[1]}-${p[0]}`) : null;
  }

  _showState(msg, isError) {
    const el = this._shadow.getElementById('stateMsg');
    const tw = this._shadow.getElementById('tableWrapper');
    if (!el || !tw) return;
    el.textContent = msg; el.className = 'state-msg' + (isError ? ' error' : '');
    el.style.display = 'flex';
    tw.style.display = 'none';
  }
  _hideState() {
    const sm = this._shadow.getElementById('stateMsg');
    const tw2 = this._shadow.getElementById('tableWrapper');
    if (sm) sm.style.display = 'none';
    if (tw2) tw2.style.display = '';
  }
}

customElements.define('com-yourcompany-modelcodes', ModelCodesWidget);
