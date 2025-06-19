const toastSystemNotificationManager = (() => {
  if (!chrome.notifications) throw new Error('chrome.notifications API not available');
  let defaultIconUrl = chrome.runtime.getURL('icon-128.png');
  let defaultOptions = {
    type: 'basic',
    title: '',
    message: '',
    iconUrl: defaultIconUrl,
    buttons: [],
    requireInteraction: false,
    priority: 0
  };
  let activeNotifications = new Set();
  let idCounter = 0;
  const clickCallbacks = {};
  const buttonClickCallbacks = {};

  chrome.notifications.onClicked.addListener(notificationId => {
    if (clickCallbacks[notificationId]) {
      try {
        clickCallbacks[notificationId]();
      } catch (err) {
        console.error(`Error in click callback for notification ${notificationId}:`, err);
      }
    }
    clear(notificationId);
  });

  chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    const key = `${notificationId}_${buttonIndex}`;
    if (buttonClickCallbacks[key]) {
      try {
        buttonClickCallbacks[key]();
      } catch (err) {
        console.error(`Error in button click callback for notification ${notificationId}, button ${buttonIndex}:`, err);
      }
    }
  });

  chrome.notifications.onClosed.addListener(notificationId => {
    activeNotifications.delete(notificationId);
    delete clickCallbacks[notificationId];
    Object.keys(buttonClickCallbacks).forEach(k => {
      if (k.startsWith(notificationId + '_')) delete buttonClickCallbacks[k];
    });
  });

  function generateId(prefix = 'toast') {
    idCounter++;
    return `${prefix}_${Date.now()}_${idCounter}`;
  }

  function show(options = {}, onClick, onButtonClickHandlers = {}) {
    let id = options.id;
    if (id) {
      if (activeNotifications.has(id)) {
        console.warn(`Notification ID "${id}" is already in use; generating a new unique ID.`);
        id = generateId();
      }
    } else {
      id = generateId();
    }
    const notifOptions = {
      type: options.type || defaultOptions.type,
      title: options.title || defaultOptions.title,
      message: options.message || defaultOptions.message,
      iconUrl: options.iconUrl || defaultOptions.iconUrl,
      buttons: Array.isArray(options.buttons) ? options.buttons : defaultOptions.buttons,
      requireInteraction: options.requireInteraction !== undefined ? options.requireInteraction : defaultOptions.requireInteraction,
      priority: options.priority !== undefined ? options.priority : defaultOptions.priority
    };
    if (onClick) clickCallbacks[id] = onClick;
    if (Array.isArray(notifOptions.buttons)) {
      notifOptions.buttons.forEach((_, idx) => {
        const handler = onButtonClickHandlers[idx];
        if (handler) buttonClickCallbacks[`${id}_${idx}`] = handler;
      });
    }
    chrome.notifications.create(id, notifOptions, createdId => {
      if (createdId) activeNotifications.add(createdId);
    });
    return id;
  }

  function clear(id) {
    if (!id) return;
    chrome.notifications.clear(id, () => {});
  }

  function clearAll() {
    activeNotifications.forEach(id => {
      chrome.notifications.clear(id, () => {});
    });
  }

  function setDefaultIcon(iconPath) {
    defaultIconUrl = chrome.runtime.getURL(iconPath);
    defaultOptions.iconUrl = defaultIconUrl;
  }

  return {
    showInfo(title, message, opts, onClick, onButtons) {
      return show({ ...opts, type: 'basic', title, message }, onClick, onButtons);
    },
    showSuccess(title, message, opts, onClick, onButtons) {
      return show({ ...opts, type: 'basic', title, message }, onClick, onButtons);
    },
    showError(title, message, opts, onClick, onButtons) {
      return show({ ...opts, type: 'basic', title, message }, onClick, onButtons);
    },
    showNotification: show,
    clear,
    clearAll,
    setDefaultIcon
  };
})();
export default toastSystemNotificationManager;