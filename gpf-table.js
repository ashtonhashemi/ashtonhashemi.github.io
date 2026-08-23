(() => {
  const DATA_URL = 'engineering-data/gpf-fmea-obd/gpf-fmea-obd.json';
  const tbody = document.getElementById('gpf-diagnostic-table-body');
  const status = document.getElementById('gpf-table-status');

  if (!tbody) return;

  const valueOrDash = (value) => {
    if (value === undefined || value === null || value === '') return '—';
    return String(value);
  };

  const normalizeRows = (fn) => {
    const modes = Array.isArray(fn.failure_modes) ? fn.failure_modes : [];

    // Supports a future object-based JSON format such as:
    // {"failure_mode":"...","effect":"...","obd_monitor":"..."}
    if (modes.some((mode) => mode && typeof mode === 'object' && !Array.isArray(mode))) {
      return modes.map((mode) => ({
        failureMode: valueOrDash(mode.failure_mode ?? mode.name),
        effect: valueOrDash(mode.effect ?? mode.example_effect),
        monitor: valueOrDash(mode.obd_monitor ?? mode.obd_monitor_concept ?? mode.monitor)
      }));
    }

    const effects = Array.isArray(fn.effects) ? fn.effects : [];
    const monitors = Array.isArray(fn.obd_monitor_concepts) ? fn.obd_monitor_concepts : [];
    const rowCount = Math.max(modes.length, effects.length, monitors.length);

    return Array.from({ length: rowCount }, (_, index) => ({
      failureMode: valueOrDash(modes[index]),
      effect: valueOrDash(effects[index]),
      monitor: valueOrDash(monitors[index])
    }));
  };

  const addCell = (row, text, className) => {
    const cell = document.createElement('td');
    cell.textContent = text;
    if (className) cell.className = className;
    if (text === '—') cell.classList.add('data-missing');
    row.appendChild(cell);
    return cell;
  };

  const render = (data) => {
    tbody.replaceChildren();
    const functions = Array.isArray(data.functions) ? data.functions : [];

    functions.forEach((fn) => {
      const rows = normalizeRows(fn);
      if (!rows.length) return;

      rows.forEach((item, index) => {
        const tr = document.createElement('tr');

        if (index === 0) {
          const functionCell = addCell(tr, valueOrDash(fn.name), 'function-cell');
          functionCell.rowSpan = rows.length;
          const strong = document.createElement('strong');
          strong.textContent = functionCell.textContent;
          functionCell.replaceChildren(strong);
        }

        addCell(tr, item.failureMode);
        addCell(tr, item.effect);
        addCell(tr, item.monitor);
        tbody.appendChild(tr);
      });
    });

    if (!tbody.children.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 4;
      td.textContent = 'No diagnostic rows are defined in the JSON source.';
      tr.appendChild(td);
      tbody.appendChild(tr);
    }

    if (status) {
      status.textContent = 'Live from gpf-fmea-obd.json';
      status.classList.remove('table-status-error');
    }
  };

  const showError = (error) => {
    tbody.replaceChildren();
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.textContent = 'Could not load the JSON source. Check gpf-fmea-obd.json for valid JSON syntax.';
    tr.appendChild(td);
    tbody.appendChild(tr);

    if (status) {
      status.textContent = 'JSON load error';
      status.classList.add('table-status-error');
    }
    console.error('GPF diagnostic table:', error);
  };

  fetch(`${DATA_URL}?v=${Date.now()}`, { cache: 'no-store' })
    .then((response) => {
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return response.json();
    })
    .then(render)
    .catch(showError);
})();
