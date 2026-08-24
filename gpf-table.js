(() => {
  const DATA_URL = 'engineering-data/gpf-fmea-obd/gpf-fmea-obd.json';
  const tbody = document.getElementById('gpf-diagnostic-table-body');
  const status = document.getElementById('gpf-table-status');

  if (!tbody) return;

  const valueOrDash = (value) => {
    if (value === undefined || value === null || value === '') return '—';
    if (Array.isArray(value)) return value.length ? value.join('\n') : '—';
    return String(value);
  };

  const normalizeRows = (fn) => {
    const modes = Array.isArray(fn.failure_modes) ? fn.failure_modes : [];
    const causes = Array.isArray(fn.possible_causes) ? fn.possible_causes : [];
    const effects = Array.isArray(fn.effects) ? fn.effects : [];
    const monitors = Array.isArray(fn.obd_monitor_concepts) ? fn.obd_monitor_concepts : [];

    // Supports a future object-based JSON format such as:
    // {"failure_mode":"...","possible_cause":"...","effect":"...","obd_monitor":"..."}
    if (modes.some((mode) => mode && typeof mode === 'object' && !Array.isArray(mode))) {
      return modes.map((mode, index) => ({
        failureMode: valueOrDash(mode.failure_mode ?? mode.name),
        possibleCause: valueOrDash(mode.possible_causes ?? mode.possible_cause ?? mode.cause),
        effect: valueOrDash(mode.effect ?? mode.example_effect ?? effects[index]),
        monitor: valueOrDash(mode.obd_monitor ?? mode.obd_monitor_concept ?? mode.monitor ?? monitors[index])
      }));
    }

    const rowCount = Math.max(modes.length, causes.length, effects.length, monitors.length);

    return Array.from({ length: rowCount }, (_, index) => ({
      failureMode: valueOrDash(modes[index]),
      possibleCause: valueOrDash(causes[index]),
      effect: valueOrDash(effects[index]),
      monitor: valueOrDash(monitors[index])
    }));
  };

  const addCell = (row, text, className) => {
    const cell = document.createElement('td');
    cell.textContent = text;
    if (text.includes('\n')) cell.style.whiteSpace = 'pre-line';
    if (className) cell.className = className;
    if (text === '—') cell.classList.add('data-missing');
    row.appendChild(cell);
    return cell;
  };

  const render = (data) => {
    tbody.replaceChildren();
    const failureModes = Array.isArray(data.failure_modes) ? data.failure_modes : [];

    failureModes.forEach((item) => {
      const causes = Array.isArray(item.cause) && item.cause.length ? item.cause : [item.cause];

      causes.forEach((cause, index) => {
        const tr = document.createElement('tr');

        if (index === 0) {
          const sharedCells = [
            addCell(tr, valueOrDash(item.id), 'failure-id-cell'),
            addCell(tr, valueOrDash(item.failure_mode), 'failure-mode-cell'),
            addCell(tr, valueOrDash(item.function), 'function-cell')
          ];
          sharedCells.forEach((cell) => { cell.rowSpan = causes.length; });
        }

        addCell(tr, valueOrDash(cause), 'cause-cell');

        if (index === 0) {
          const effectCell = addCell(tr, valueOrDash(item.effect), 'effect-cell');
          const obdCell = addCell(tr, valueOrDash(item.obd), 'obd-cell');
          effectCell.rowSpan = causes.length;
          obdCell.rowSpan = causes.length;
        }

        tbody.appendChild(tr);
      });
    });

    if (!tbody.children.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 6;
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
    td.colSpan = 6;
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
