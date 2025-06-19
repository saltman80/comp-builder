function generateUUID() {
    const buffer = new Uint8Array(16);
    crypto.getRandomValues(buffer);
    buffer[6] = (buffer[6] & 0x0f) | 0x40;
    buffer[8] = (buffer[8] & 0x3f) | 0x80;
    const hex = Array.from(buffer).map(b => b.toString(16).padStart(2, '0'));
    return `${hex[0]}${hex[1]}${hex[2]}${hex[3]}-${hex[4]}${hex[5]}-${hex[6]}${hex[7]}-${hex[8]}${hex[9]}-${hex[10]}${hex[11]}${hex[12]}${hex[13]}${hex[14]}${hex[15]}`;
}

function getCurrentTimestamp() {
    return new Date().toISOString();
}

function prepareData(entries) {
    if (!Array.isArray(entries)) return [];
    const timestamp = getCurrentTimestamp();
    return entries.map(entry => ({
        ...entry,
        uuid: generateUUID(),
        timestamp
    }));
}

function convertToCSV(dataArray) {
    if (!Array.isArray(dataArray) || dataArray.length === 0) return '';
    // collect all unique headers across all rows
    const headerSet = new Set();
    dataArray.forEach(row => {
        Object.keys(row).forEach(key => headerSet.add(key));
    });
    const headers = Array.from(headerSet);
    const escapeValue = value => {
        if (value == null) return '';
        let str;
        if (Array.isArray(value)) {
            str = value.join(';');
        } else if (typeof value === 'object') {
            str = JSON.stringify(value);
        } else {
            str = String(value);
        }
        if (/[",\r\n]/.test(str)) {
            str = '"' + str.replace(/"/g, '""') + '"';
        }
        return str;
    };
    const lines = [];
    lines.push(headers.join(','));
    for (const row of dataArray) {
        const line = headers.map(header => escapeValue(row[header])).join(',');
        lines.push(line);
    }
    return lines.join('\r\n');
}

function downloadCSV(dataArray, filename = 'export.csv') {
    const csvContent = convertToCSV(dataArray);
    if (!csvContent) return;
    const blob = new Blob(['\ufeff', csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export {
    generateUUID,
    getCurrentTimestamp,
    prepareData,
    convertToCSV,
    downloadCSV
}