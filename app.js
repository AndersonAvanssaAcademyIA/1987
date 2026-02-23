const fileInput = document.getElementById('fileInput');
const processButton = document.getElementById('processButton');
const downloadButton = document.getElementById('downloadButton');
const summary = document.getElementById('summary');
const preview = document.getElementById('preview');

let selectedFile = null;
let outputWorkbook = null;
let outputFilename = '';

fileInput.addEventListener('change', () => {
  selectedFile = fileInput.files?.[0] ?? null;
  processButton.disabled = !selectedFile;
  downloadButton.disabled = true;
  outputWorkbook = null;

  const fileName = selectedFile ? selectedFile.name : 'nenhum';
  summary.innerHTML = `
    <li>Arquivo: ${fileName}</li>
    <li>Abas processadas: 0</li>
    <li>Células com limpeza de HTML: 0</li>
  `;
  preview.textContent = 'Arquivo pronto para processamento.';
  preview.classList.add('muted');
});

processButton.addEventListener('click', async () => {
  if (!selectedFile) return;

  const buffer = await selectedFile.arrayBuffer();
  const workbook = XLSX.read(buffer, {
    type: 'array',
    cellHTML: false,
    cellStyles: true,
  });

  const changes = [];
  let cleanedCellCount = 0;

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet['!ref']) continue;

    const range = XLSX.utils.decode_range(sheet['!ref']);

    for (let row = range.s.r; row <= range.e.r; row += 1) {
      for (let col = range.s.c; col <= range.e.c; col += 1) {
        const address = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = sheet[address];
        if (!cell || typeof cell.v !== 'string') continue;

        const original = cell.v;
        const cleaned = sanitizeHtmlToPlainText(original);

        if (cleaned !== original) {
          cell.v = cleaned;
          cell.t = 's';
          cleanedCellCount += 1;

          if (changes.length < 30) {
            changes.push({
              sheet: sheetName,
              address,
              original,
              cleaned,
            });
          }
        }
      }
    }
  }

  outputWorkbook = workbook;
  outputFilename = buildOutputFilename(selectedFile.name);
  downloadButton.disabled = false;

  summary.innerHTML = `
    <li>Arquivo: ${selectedFile.name}</li>
    <li>Abas processadas: ${workbook.SheetNames.length}</li>
    <li>Células com limpeza de HTML: ${cleanedCellCount}</li>
  `;

  if (changes.length === 0) {
    preview.textContent = 'Nenhuma célula com HTML detectada. A planilha já está limpa.';
    preview.classList.add('muted');
  } else {
    preview.classList.remove('muted');
    preview.innerHTML = changes
      .map(
        (change) => `
          <div class="diff">
            <strong>${escapeHtml(change.sheet)}!${change.address}</strong>
            <div><em>Antes:</em> ${escapeHtml(trimText(change.original))}</div>
            <div><em>Depois:</em> ${escapeHtml(trimText(change.cleaned))}</div>
          </div>
        `
      )
      .join('');
  }
});

downloadButton.addEventListener('click', () => {
  if (!outputWorkbook) return;
  XLSX.writeFile(outputWorkbook, outputFilename, { compression: true });
});

function sanitizeHtmlToPlainText(input) {
  let text = input
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/p\s*>/gi, '\n')
    .replace(/<\s*p\b[^>]*>/gi, '')
    .replace(/<\s*\/div\s*>/gi, '\n')
    .replace(/<\s*div\b[^>]*>/gi, '');

  const parser = new DOMParser();
  const parsed = parser.parseFromString(text, 'text/html');
  text = parsed.documentElement.textContent || '';

  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function buildOutputFilename(inputName) {
  const extMatch = inputName.match(/(\.[^.]*)$/);
  const ext = extMatch ? extMatch[1] : '.xlsx';
  const basename = extMatch ? inputName.slice(0, -ext.length) : inputName;
  return `${basename}-revisada${ext}`;
}

function trimText(value, maxLength = 220) {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, maxLength)}...`;
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
