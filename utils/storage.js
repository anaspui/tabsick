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

  async function getAllData() {
    const data = await chrome.storage.local.get(null);
    const notesData = {};
    for (const key in data) {
      if (key.startsWith('notes::')) {
        notesData[key] = data[key];
      }
    }
    return notesData;
  }

  async function importData(importedData) {
    if (typeof importedData !== 'object' || importedData === null) {
      throw new Error("Invalid import data format.");
    }
    
    const validData = {};
    for (const key in importedData) {
      if (key.startsWith('notes::') && Array.isArray(importedData[key])) {
        validData[key] = importedData[key];
      }
    }
    
    await chrome.storage.local.set(validData);
  }

  async function getGlassMode() {
    const res = await chrome.storage.local.get('setting::glassMode');
    return res['setting::glassMode'] || false;
  }

  async function setGlassMode(value) {
    await chrome.storage.local.set({ 'setting::glassMode': value });
  }

  return {
    normalizeUrl,
    getNotes,
    saveNotes,
    clearNotes,
    getAllData,
    importData,
    getGlassMode,
    setGlassMode
  };
})();
