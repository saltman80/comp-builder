const storageService = window.entryCategoryStore;
const downloadEntriesCsv = window.downloadEntriesCsv;

function init() {
  storageService.getCategories(renderCategoryOptions);
  renderEntriesList();
  bind('#save-url-btn', 'click', onSaveClick);
  bind('#export-csv-btn', 'click', onExportClick);
}

function renderCategoryOptions(categories) {
  const select = document.querySelector('#category-select');
  if (!select) return;
  select.innerHTML = '';
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });
}

function renderEntries(entries) {
  const container = document.querySelector('#entries-list');
  if (!container) return;
  container.innerHTML = '';
  if (!entries || entries.length === 0) {
    container.textContent = 'No entries saved.';
    return;
  }
  entries.forEach(entry => {
    const item = document.createElement('div');
    item.className = 'entry-item';
    const link = document.createElement('a');
    link.href = entry.url;
    link.textContent = entry.tag || entry.url;
    link.target = '_blank';
    const info = document.createElement('span');
    info.textContent = ` [${entry.category}] (${new Date(entry.timestamp).toLocaleString()}) `;
    const delBtn = document.createElement('button');
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => onDeleteClick(entry.id));
    item.appendChild(link);
    item.appendChild(info);
    item.appendChild(delBtn);
    container.appendChild(item);
  });
}

function renderEntriesList() {
  storageService.getAllEntries(renderEntries);
}

function onSaveClick() {
  getCurrentTabUrl(url => {
    if (!url) {
      alert('Unable to retrieve the current tab URL.');
      return;
    }
    promptForEntryDetails((tag, category) => {
      const entry = {
        id: Date.now().toString(),
        url,
        tag,
        category,
        timestamp: new Date().toISOString()
      };
      storageService.saveEntry(entry, renderEntriesList);
    });
  });
}

function onExportClick() {
  storageService.getAllEntries(entries => {
    if (entries && entries.length) {
      downloadEntriesCsv(entries);
    } else {
      alert('No entries to export.');
    }
  });
}

function onDeleteClick(entryId) {
  storageService.deleteEntry(entryId, renderEntriesList);
}

function bind(selector, event, handler) {
  const el = document.querySelector(selector);
  if (el) el.addEventListener(event, handler);
}

function getCurrentTabUrl(callback) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const tab = tabs && tabs[0];
    callback(tab && tab.url);
  });
}

function promptForEntryDetails(callback) {
  const tagInput = prompt('Enter a tag or note for this entry:');
  if (tagInput === null) {
    alert('Entry creation cancelled.');
    return;
  }
  const categoryInput = prompt('Enter a category for this entry:');
  if (categoryInput === null) {
    alert('Entry creation cancelled.');
    return;
  }
  const tag = tagInput.trim();
  const category = categoryInput.trim();
  if (!tag || !category) {
    alert('Both tag and category are required. Entry not saved.');
    return;
  }
  callback(tag, category);
}

document.addEventListener('DOMContentLoaded', init);