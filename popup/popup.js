document.addEventListener('DOMContentLoaded', async () => {
  const urlDisplay = document.getElementById('url-display');
  const noteCountEl = document.getElementById('note-count');
  const btnAdd = document.getElementById('btn-add');
  const btnToggle = document.getElementById('btn-toggle');
  const btnClear = document.getElementById('btn-clear');
  const actionsDiv = document.querySelector('.actions');
  const statsDiv = document.getElementById('stats');
  const errorMsg = document.getElementById('error-msg');

  let activeTab = null;
  let isHidden = false;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTab = tab;

  if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('https://chrome.google.com/webstore')) {
    urlDisplay.textContent = 'Invalid Page';
    actionsDiv.style.display = 'none';
    statsDiv.style.display = 'none';
    errorMsg.style.display = 'block';
    return;
  }

  const urlObj = new URL(tab.url);
  urlDisplay.textContent = urlObj.hostname + urlObj.pathname;
  const notes = await StorageUtil.getNotes(tab.url);
  noteCountEl.textContent = notes.length;

  const isContentScriptReady = await checkContentScript(tab.id);
  if (!isContentScriptReady) {
    errorMsg.textContent = "Please refresh the page to use TabStick here.";
    errorMsg.style.display = 'block';
    actionsDiv.style.opacity = '0.5';
    actionsDiv.style.pointerEvents = 'none';
  }

  btnAdd.addEventListener('click', async () => {
    try {
      await chrome.tabs.sendMessage(activeTab.id, { action: 'CREATE_NOTE' });
      noteCountEl.textContent = parseInt(noteCountEl.textContent) + 1;
    } catch (e) {
      console.error("Failed to add note:", e);
    }
  });

  btnToggle.addEventListener('click', async () => {
    try {
      await chrome.tabs.sendMessage(activeTab.id, { action: 'TOGGLE_NOTES' });
      isHidden = !isHidden;
      btnToggle.textContent = isHidden ? 'Show Notes' : 'Hide Notes';
    } catch (e) {
      console.error("Failed to toggle notes:", e);
    }
  });

  btnClear.addEventListener('click', async () => {
    if (confirm("Are you sure you want to clear all notes on this page?")) {
      try {
        await chrome.tabs.sendMessage(activeTab.id, { action: 'CLEAR_NOTES' });
        noteCountEl.textContent = '0';
      } catch (e) {
        console.error("Failed to clear notes:", e);
      }
    }
  });

});

async function checkContentScript(tabId) {
  try {
    const res = await chrome.tabs.sendMessage(tabId, { action: 'GET_COUNT' });
    return res && res.success;
  } catch (e) {
    return false;
  }
}
