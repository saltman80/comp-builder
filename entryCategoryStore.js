;(function(){
  const ENTRY_KEY = 'entries';
  const mutationQueue = [];
  let isMutating = false;

  function processQueueInternal() {
    if (isMutating || mutationQueue.length === 0) return;
    isMutating = true;
    const operation = mutationQueue.shift();
    operation(() => {
      isMutating = false;
      processQueueInternal();
    });
  }

  function enqueueMutationInternal(operation) {
    mutationQueue.push(operation);
    processQueueInternal();
  }

  function getAllEntries(callback) {
    chrome.storage.local.get([ENTRY_KEY], result => {
      if (chrome.runtime.lastError) {
        callback(chrome.runtime.lastError);
        return;
      }
      const entries = Array.isArray(result[ENTRY_KEY]) ? result[ENTRY_KEY] : [];
      callback(null, entries);
    });
  }

  function saveEntry(entry, callback) {
    enqueueMutationInternal(done => {
      getAllEntries((err, entries) => {
        if (err) {
          if (typeof callback === 'function') callback(err);
          done();
          return;
        }
        const updated = [...entries, entry];
        chrome.storage.local.set({ [ENTRY_KEY]: updated }, () => {
          const storageError = chrome.runtime.lastError;
          if (typeof callback === 'function') {
            if (storageError) callback(storageError);
            else callback(null, updated);
          }
          done();
        });
      });
    });
  }

  function deleteEntry(id, callback) {
    enqueueMutationInternal(done => {
      getAllEntries((err, entries) => {
        if (err) {
          if (typeof callback === 'function') callback(err);
          done();
          return;
        }
        const updated = entries.filter(e => e.id !== id);
        chrome.storage.local.set({ [ENTRY_KEY]: updated }, () => {
          const storageError = chrome.runtime.lastError;
          if (typeof callback === 'function') {
            if (storageError) callback(storageError);
            else callback(null, updated);
          }
          done();
        });
      });
    });
  }

  function getCategories(callback) {
    getAllEntries((err, entries) => {
      if (err) {
        callback(err);
        return;
      }
      const categoriesSet = new Set();
      entries.forEach(e => {
        if (e.category) categoriesSet.add(e.category);
      });
      const categories = Array.from(categoriesSet);
      callback(null, categories);
    });
  }

  window.entryCategoryStore = {
    getAllEntries,
    saveEntry,
    deleteEntry,
    getCategories
  };
})();