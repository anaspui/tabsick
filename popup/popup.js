const tabPromise = chrome.tabs.query({ active: true, currentWindow: true }).then(tabs => tabs[0]);
const dataPromise = tabPromise.then(async (tab) => {
  if (!tab || !tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('https://chrome.google.com/webstore')) {
    return { tab, valid: false, notes: [], isReady: false };
  }
  const [notes, isReady] = await Promise.all([
    StorageUtil.getNotes(tab.url),
    checkContentScript(tab.id)
  ]);
  return { tab, valid: true, notes, isReady };
});

document.addEventListener('DOMContentLoaded', async () => {
  const urlDisplay = document.getElementById('url-display');
  const noteCountEl = document.getElementById('note-count');
  const btnAdd = document.getElementById('btn-add');
  const btnToggle = document.getElementById('btn-toggle');
  const btnClear = document.getElementById('btn-clear');
  const actionsDiv = document.querySelector('.actions');
  const statsDiv = document.getElementById('stats');
  const errorMsg = document.getElementById('error-msg');
  const btnExport = document.getElementById('btn-export');
  const btnImport = document.getElementById('btn-import');
  const fileImport = document.getElementById('file-import');
  const btnExplore = document.getElementById('btn-explore');
  const toggleGlassMode = document.getElementById('toggle-glass-mode');

  let activeTab = null;
  let isHidden = false;

  const data = await dataPromise;
  activeTab = data.tab;

  btnExport.addEventListener('click', async () => {
    try {
      const allData = await StorageUtil.getAllData();
      const dataStr = JSON.stringify(allData, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tabstick-backup.json';
      a.click();
      
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Failed to export data:", e);
      alert("Failed to export data.");
    }
  });

  btnImport.addEventListener('click', () => {
    fileImport.click();
  });

  if (btnExplore) {
    btnExplore.addEventListener('click', async () => {
      try {
        const windowInfo = await chrome.windows.getCurrent();
        await chrome.sidePanel.open({ windowId: windowInfo.id });
        window.close();
      } catch (e) {
        console.error("Failed to open side panel:", e);
      }
    });
  }

  fileImport.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        await StorageUtil.importData(importedData);
        alert("Data imported successfully!");
        window.close();
      } catch (err) {
        console.error("Import failed:", err);
        alert("Failed to import data: " + err.message);
      }
      fileImport.value = ''; 
    };
    reader.readAsText(file);
  });

  if (!data.valid) {
    urlDisplay.textContent = 'Invalid Page';
    actionsDiv.style.display = 'none';
    statsDiv.style.display = 'none';
    errorMsg.style.display = 'block';
    return;
  }

  const urlObj = new URL(activeTab.url);
  urlDisplay.textContent = urlObj.hostname + urlObj.pathname;
  noteCountEl.textContent = data.notes.length;

  if (!data.isReady) {
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

  const isGlassMode = await StorageUtil.getGlassMode();
  toggleGlassMode.checked = isGlassMode;

  toggleGlassMode.addEventListener('change', async (e) => {
    const isChecked = e.target.checked;
    await StorageUtil.setGlassMode(isChecked);
    try {
      await chrome.tabs.sendMessage(activeTab.id, { action: 'SET_GLASS_MODE', value: isChecked });
    } catch (err) {
      console.error("Failed to update glass mode:", err);
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
