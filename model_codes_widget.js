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
    this._loadDemoData();
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
    const periodSet = new Map();
    rows.forEach(r => { if (!periodSet.has(r.yearMonth)) periodSet.set(r.yearMonth, periodSet.size); });
    this._periods = [...periodSet.keys()];

    const groupMap = new Map();
    rows.forEach(r => {
      const key = [r.material, r.fecha, r.docDate, r.frozen].join('||');
      if (!groupMap.has(key)) groupMap.set(key, { material:r.material, fecha:r.fecha, docDate:r.docDate, frozen:r.frozen, cells:{} });
      groupMap.get(key).cells[r.yearMonth] = { qty:r.qty, codTexto:r.codTexto, codFondo:r.codFondo };
    });
    this._rowGroups = [...groupMap.values()];
  }

  // ── Render ────────────────────────────────────────────────────
  _renderTable() {
    if (this._rowGroups.length === 0) { this._showState('Sin datos.', false); return; }
    this._hideState();

    const hr1   = this._shadow.getElementById('headerRow1');
    const hr2   = this._shadow.getElementById('headerRow2');
    const tbody = this._shadow.getElementById('tableBody');
    hr1.innerHTML = ''; hr2.innerHTML = ''; tbody.innerHTML = '';

    const DIMS = ['Material', 'Fecha Entrega', 'Document Date', 'Frozen End'];

    DIMS.forEach(h => {
      const th = document.createElement('th'); th.textContent = h; th.className = 'dim-header';
      hr1.appendChild(th);
      const th2 = document.createElement('th'); th2.className = 'dim-header';
      hr2.appendChild(th2);
    });

    const thM = document.createElement('th');
    thM.textContent = 'Measures — Quantity'; thM.colSpan = this._periods.length;
    hr1.appendChild(thM);

    this._periods.forEach(p => {
      const th = document.createElement('th'); th.textContent = p; hr2.appendChild(th);
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

      this._periods.forEach(p => {
        const cell  = group.cells[p];
        const tdC   = document.createElement('td'); tdC.className = 'qty-cell';
        const inner = document.createElement('div'); inner.className = 'qty-inner';

        if (!cell || cell.qty === null || cell.qty === undefined) {
          inner.textContent = '–'; inner.classList.add('empty');
          inner.style.background = DEFAULT_BG; inner.style.color = DEFAULT_TEXT;
        } else {
          inner.textContent      = typeof cell.qty === 'number'
            ? cell.qty.toLocaleString('es-ES', { minimumFractionDigits:0, maximumFractionDigits:3 })
            : cell.qty;
          inner.style.color      = TEXT_COLOR[cell.codTexto] ?? DEFAULT_TEXT;
          inner.style.background = BG_COLOR[cell.codFondo]   ?? DEFAULT_BG;
          inner.addEventListener('mouseenter', e => this._showTooltip(e, group, p, cell));
          inner.addEventListener('mousemove',  e => this._moveTooltip(e));
          inner.addEventListener('mouseleave', () => this._hideTooltip());
        }
        tdC.appendChild(inner); tr.appendChild(tdC);
      });

      tbody.appendChild(tr);
    });

    const colored = this._rows.filter(r => r.codTexto || r.codFondo).length;
    this._shadow.getElementById('footerSummary').textContent =
      `${this._rowGroups.length} filas · ${this._periods.length} períodos · ${colored} celdas con código`;
  }

  // ── Demo data ─────────────────────────────────────────────────
  _loadDemoData() {
    this._processRows([
      { material:'ES/TH1088', fecha:'01.11.2025', docDate:'25.10.2025', frozen:'Apr 25, 2026', yearMonth:'September 2025', qty:null,  codTexto:'',  codFondo:'4' },
      { material:'ES/TH1088', fecha:'01.11.2025', docDate:'25.10.2025', frozen:'Apr 25, 2026', yearMonth:'November 2025',  qty:10342, codTexto:'1', codFondo:''  },
      { material:'ES/TH1088', fecha:'01.11.2025', docDate:'25.10.2025', frozen:'Apr 25, 2026', yearMonth:'September 2026', qty:null,  codTexto:'',  codFondo:''  },
      { material:'ES/TH1089', fecha:'15.09.2025', docDate:'01.02.2025', frozen:'Apr 25, 2026', yearMonth:'September 2025', qty:19500, codTexto:'3', codFondo:'2' },
      { material:'ES/TH1089', fecha:'15.09.2025', docDate:'01.02.2025', frozen:'Apr 25, 2026', yearMonth:'November 2025',  qty:null,  codTexto:'',  codFondo:''  },
      { material:'ES/TH1089', fecha:'15.09.2025', docDate:'01.02.2025', frozen:'Apr 25, 2026', yearMonth:'September 2026', qty:null,  codTexto:'',  codFondo:''  },
      { material:'ES/TH1089', fecha:'01.09.2026', docDate:'15.10.2025', frozen:'Mar 26, 2026', yearMonth:'September 2025', qty:null,  codTexto:'',  codFondo:''  },
      { material:'ES/TH1089', fecha:'01.09.2026', docDate:'15.10.2025', frozen:'Mar 26, 2026', yearMonth:'November 2025',  qty:null,  codTexto:'',  codFondo:''  },
      { material:'ES/TH1089', fecha:'01.09.2026', docDate:'15.10.2025', frozen:'Mar 26, 2026', yearMonth:'September 2026', qty:20897, codTexto:'2', codFondo:'4' },
    ]);
    this._renderTable();
  }

  // ── Tooltip ───────────────────────────────────────────────────
  _showTooltip(e, group, period, cell) {
    const tt       = this._shadow.getElementById('tooltip');
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
    tt.style.left = Math.min(e.clientX + 16, window.innerWidth - 300) + 'px';
    tt.style.top  = Math.max(e.clientY - 10, 8) + 'px';
  }
  _hideTooltip() { this._shadow.getElementById('tooltip').classList.remove('visible'); }

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
    el.textContent = msg; el.className = 'state-msg' + (isError ? ' error' : '');
    el.style.display = 'flex';
    this._shadow.getElementById('tableWrapper').style.display = 'none';
  }
  _hideState() {
    this._shadow.getElementById('stateMsg').style.display = 'none';
    this._shadow.getElementById('tableWrapper').style.display = '';
  }
}

customElements.define('com-yourcompany-modelcodes', ModelCodesWidget);
