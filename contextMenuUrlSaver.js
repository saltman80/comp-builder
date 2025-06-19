const CONTEXT_MENU_ID = 'comp_builder_save_url';
const MAX_ENTRIES = 500;

let storageQueue = [];
let processingQueue = false;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: CONTEXT_MENU_ID,
    title: 'Save URL to Comp Builder',
    contexts: ['page', 'link']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return;
  const url = info.linkUrl || info.pageUrl || '';
  const title = tab && tab.title ? tab.title : url;
  const entry = {
    id: uuidv4(),
    url: url,
    title: title,
    tags: [],
    category: '',
    createdAt: new Date().toISOString()
  };
  enqueueStorageOp(() => cm_saveEntry(entry));
});

function enqueueStorageOp(op) {
  storageQueue.push(op);
  cm_processQueue();
}

async function cm_processQueue() {
  if (processingQueue) return;
  processingQueue = true;
  while (storageQueue.length) {
    const op = storageQueue.shift();
    try {
      await op();
    } catch (e) {
      console.error('Error processing storage operation', e);
    }
  }
  processingQueue = false;
}

function cm_saveEntry(entry) {
  return new Promise(resolve => {
    chrome.storage.local.get({ entries: [] }, (result) => {
      if (chrome.runtime.lastError) {
        handleError('Storage get failed', chrome.runtime.lastError);
        return resolve();
      }
      let entries = Array.isArray(result.entries) ? result.entries : [];
      entries.unshift(entry);
      if (entries.length > MAX_ENTRIES) {
        entries = entries.slice(0, MAX_ENTRIES);
      }
      chrome.storage.local.set({ entries }, () => {
        if (chrome.runtime.lastError) {
          handleError('Storage set failed', chrome.runtime.lastError);
          return resolve();
        }
        chrome.notifications.create(entry.id, {
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'URL Saved',
          message: entry.title
        }, () => {
          if (chrome.runtime.lastError) {
            handleError('Notification failed', chrome.runtime.lastError);
          }
          resolve();
        });
      });
    });
  });
}

function handleError(context, error) {
  console.error(context, error);
  const id = 'error_' + Date.now();
  chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Comp Builder Error',
    message: `${context}: ${error.message || error}`
  }, () => {
    // no-op
  });
}

function uuidv4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = crypto.getRandomValues(new Uint8Array(1))[0] & 0xf;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}