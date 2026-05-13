const StorageUtil = (function() {
  function normalizeUrl(urlStr) {
    try {
      const url = new URL(urlStr);
      return `${url.protocol}//${url.hostname}${url.pathname}`;
    } catch (e) {
      return urlStr;
    }
  }

  function getStorageKey(url) {
    return `notes::${normalizeUrl(url)}`;
  }

  async function getNotes(url) {
    const key = getStorageKey(url);
    const result = await chrome.storage.local.get(key);
    return result[key] || [];
  }

  async function saveNotes(url, notes) {
    const key = getStorageKey(url);
    await chrome.storage.local.set({ [key]: notes });
  }

  async function clearNotes(url) {
    const key = getStorageKey(url);
    await chrome.storage.local.remove(key);
  }

  return {
    normalizeUrl,
    getNotes,
    saveNotes,
    clearNotes
  };
})();
