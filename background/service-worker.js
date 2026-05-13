chrome.runtime.onInstalled.addListener(() => {
  console.log("TabStick Extension Installed.");
});

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length > 0) {
      const tab = tabs[0];
      if (tab.url && !tab.url.startsWith('chrome://') && !tab.url.startsWith('chrome-extension://')) {
        if (command === 'add-note') {
          chrome.tabs.sendMessage(tab.id, { action: 'CREATE_NOTE' }).catch(err => {
            console.log("Could not send message to tab, it might not have the content script injected.", err);
          });
        } else if (command === 'toggle-notes') {
          chrome.tabs.sendMessage(tab.id, { action: 'TOGGLE_NOTES' }).catch(err => {
            console.log("Could not send message to tab.", err);
          });
        }
      }
    }
  });
});
