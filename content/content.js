

(async function() {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  async function init() {
    const url = window.location.href;
    NoteManager.init(url);

    const isGlassMode = await StorageUtil.getGlassMode();
    NoteManager.setGlassMode(isGlassMode);

    const notes = await StorageUtil.getNotes(url);
    NoteManager.renderNotes(notes);
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'CREATE_NOTE') {
      NoteManager.createNewNote();
      sendResponse({ success: true });
    } else if (request.action === 'CLEAR_NOTES') {
      NoteManager.clearAll();
      sendResponse({ success: true });
    } else if (request.action === 'TOGGLE_NOTES') {
      NoteManager.toggleVisibility();
      sendResponse({ success: true });
    } else if (request.action === 'GET_COUNT') {
      // alive???
      sendResponse({ success: true });
    } else if (request.action === 'SET_GLASS_MODE') {
      NoteManager.setGlassMode(request.value);
      sendResponse({ success: true });
    }
  });

})();
