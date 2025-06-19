function escapeCsvValue(value) {
    if (value == null) return '';
    let str = String(value);
    // Mitigate CSV injection by prefixing dangerous leading characters
    if (/^[=+\-@]/.test(str)) {
      str = '\'' + str;
    }
    // Escape quotes and wrap in quotes if needed
    if (/["\r\n,]/.test(str)) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  function exportToCsv(entries) {
    const header = ['ID', 'URL', 'Tag', 'Category', 'Timestamp'];
    const rows = entries.map(e => [
      e.id,
      e.url,
      e.tag,
      e.category,
      typeof e.timestamp === 'number' ? new Date(e.timestamp).toISOString() : e.timestamp
    ]);
    const csvArray = [header, ...rows];
    const csvContent = '\uFEFF' + csvArray
      .map(row => row.map(escapeCsvValue).join(','))
      .join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const filename = `entries_${Date.now()}.csv`;

    if (chrome && chrome.downloads && chrome.downloads.download) {
      chrome.downloads.download({ url, filename }, () => {
        // Revoke URL after download is initiated
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      });
    } else {
      // Fallback for contexts without chrome.downloads
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  }

  function downloadEntriesCsv() {
    chrome.storage.local.get({ entries: [] }, result => {
      const entries = Array.isArray(result.entries) ? result.entries : [];
      exportToCsv(entries);
    });
  }

  window.downloadEntriesCsv = downloadEntriesCsv;