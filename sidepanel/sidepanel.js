document.addEventListener('DOMContentLoaded', async () => {
  const notesContainer = document.getElementById('notes-container');
  const searchInput = document.getElementById('search-input');
  const emptyState = document.getElementById('empty-state');

  let allData = {};

  async function loadData() {
    allData = await StorageUtil.getAllData();
    renderNotes();
  }

  function renderNotes(filterText = '') {
    notesContainer.innerHTML = '';
    let hasNotes = false;

    const lowerFilter = filterText.toLowerCase();

    for (const [key, notes] of Object.entries(allData)) {
      if (!Array.isArray(notes) || notes.length === 0) continue;

      const url = key.replace('notes::', '');
      const matchingNotes = notes.filter(note => {
        const textMatch = note.content && note.content.toLowerCase().includes(lowerFilter);
        const urlMatch = url.toLowerCase().includes(lowerFilter);
        return textMatch || urlMatch;
      });

      if (matchingNotes.length > 0) {
        hasNotes = true;
        
        const groupDiv = document.createElement('div');
        groupDiv.className = 'url-group';

        const urlTitle = document.createElement('a');
        urlTitle.className = 'url-title';
        urlTitle.textContent = url;
        urlTitle.href = '#';
        urlTitle.addEventListener('click', (e) => {
          e.preventDefault();
          chrome.tabs.create({ url: url });
        });

        groupDiv.appendChild(urlTitle);

        matchingNotes.forEach(note => {
          const noteCard = document.createElement('div');
          noteCard.className = 'note-card';
          
          const noteText = document.createElement('div');
          noteText.className = 'note-text';
          noteText.textContent = note.content || 'Empty note';
          
          const deleteBtn = document.createElement('button');
          deleteBtn.className = 'delete-btn';
          deleteBtn.innerHTML = '&#10005;'; // X mark
          deleteBtn.title = 'Delete note';
          
          let confirmState = false;
          let resetTimeout;

          deleteBtn.addEventListener('click', async () => {
            if (!confirmState) {
              confirmState = true;
              deleteBtn.textContent = 'Sure?';
              deleteBtn.classList.add('confirming');
              
              resetTimeout = setTimeout(() => {
                confirmState = false;
                deleteBtn.innerHTML = '&#10005;';
                deleteBtn.classList.remove('confirming');
              }, 3000);
            } else {
              clearTimeout(resetTimeout);
              const updatedNotes = notes.filter(n => n.id !== note.id);
              await StorageUtil.saveNotes(url, updatedNotes);
            }
          });

          noteCard.appendChild(noteText);
          noteCard.appendChild(deleteBtn);
          groupDiv.appendChild(noteCard);
        });

        notesContainer.appendChild(groupDiv);
      }
    }

    if (hasNotes) {
      emptyState.style.display = 'none';
      notesContainer.style.display = 'block';
    } else {
      emptyState.style.display = 'block';
      notesContainer.style.display = 'none';
    }
  }

  searchInput.addEventListener('input', (e) => {
    renderNotes(e.target.value);
  });

  const btnGroupTabs = document.getElementById('btn-group-tabs');
  if (btnGroupTabs) {
    btnGroupTabs.addEventListener('click', async () => {
      if (btnGroupTabs.disabled) return;
      
      btnGroupTabs.disabled = true;
      const originalText = btnGroupTabs.textContent;
      btnGroupTabs.textContent = 'Grouping...';

      try {
        const currentData = await StorageUtil.getAllData();
        const urlsWithNotes = new Set(
          Object.keys(currentData)
            .filter(k => k.startsWith('notes::'))
            .map(k => k.replace('notes::', ''))
            .filter(url => Array.isArray(currentData['notes::' + url]) && currentData['notes::' + url].length > 0)
        );

        if (urlsWithNotes.size === 0) {
          btnGroupTabs.textContent = 'No notes found';
          setTimeout(() => {
            btnGroupTabs.disabled = false;
            btnGroupTabs.textContent = originalText;
          }, 2000);
          return;
        }

        const normalizeUrl = (u) => {
          if (!u) return '';
          try {
            const parsed = new URL(u);
            let host = parsed.hostname.toLowerCase().replace(/^www\./, '');
            let path = parsed.pathname;
            
            path = path.replace(/\/index\.(php|html|htm|aspx|jsp)\/?$/i, '');
            if (path.endsWith('/') && path.length > 1) {
              path = path.slice(0, -1);
            }
            if (path === '/') path = '';
            
            let search = parsed.search;
            if (search) {
              const params = new URLSearchParams(search);
              params.sort();
              search = '?' + params.toString();
            }
            
            return host + path + search;
          } catch (e) {
            let str = u.toLowerCase().trim();
            try { str = decodeURIComponent(str); } catch(err) {}
            str = str.split('#')[0];
            str = str.replace(/\/index\.(php|html|htm|aspx|jsp)\/?$/i, '');
            str = str.replace(/\/$/, '');
            str = str.replace(/^https?:\/\//, '');
            str = str.replace(/^www\./, '');
            return str;
          }
        };

        const normalizedUrlsWithNotes = new Map();
        for (const url of urlsWithNotes) {
          normalizedUrlsWithNotes.set(normalizeUrl(url), url);
        }

        const existingTabIds = [];
        const openNormalizedUrls = new Set();

        const allTabs = await chrome.tabs.query({});
        allTabs.forEach(t => {
          const tUrlNorm = normalizeUrl(t.url);
          const tPendNorm = normalizeUrl(t.pendingUrl);
          
          if (normalizedUrlsWithNotes.has(tUrlNorm) || normalizedUrlsWithNotes.has(tPendNorm)) {
            existingTabIds.push(t.id);
          }
          if (tUrlNorm) openNormalizedUrls.add(tUrlNorm);
          if (tPendNorm) openNormalizedUrls.add(tPendNorm);
        });

        for (const [normUrl, originalUrl] of normalizedUrlsWithNotes.entries()) {
          if (openNormalizedUrls.has(normUrl)) continue;

          const parts = normUrl.split('/');
          const host = parts[0];
          const pathEtc = normUrl.substring(host.length) || '/*';

          const patterns = [
            `*://${host}${pathEtc.startsWith('/') ? '' : '/'}${pathEtc}${pathEtc.endsWith('*') ? '' : '*'}`,
            `*://www.${host}${pathEtc.startsWith('/') ? '' : '/'}${pathEtc}${pathEtc.endsWith('*') ? '' : '*'}`
          ];
          
          for (const p of patterns) {
            try {
              const matchingTabs = await chrome.tabs.query({ url: p });
              if (matchingTabs.length > 0) {
                matchingTabs.forEach(mt => {
                  existingTabIds.push(mt.id);
                });
                openNormalizedUrls.add(normUrl);
                break;
              }
            } catch (e) {

            }
          }
        }

        const urlsToOpen = [];
        const processedNorms = new Set();
        
        for (const [normUrl, originalUrl] of normalizedUrlsWithNotes.entries()) {
          if (!openNormalizedUrls.has(normUrl) && !processedNorms.has(normUrl)) {
            urlsToOpen.push(originalUrl);
            processedNorms.add(normUrl);
          }
        }

        const newTabIds = [];
        for (const url of urlsToOpen) {
          const newTab = await chrome.tabs.create({ url: url, active: false });
          newTabIds.push(newTab.id);
        }

        const allTabIdsToGroup = [...new Set([...existingTabIds, ...newTabIds])];

        if (allTabIdsToGroup.length > 0) {
          const currentWin = await chrome.windows.getCurrent();
          await chrome.tabs.move(allTabIdsToGroup, { windowId: currentWin.id, index: -1 });

          const groupOptions = { tabIds: allTabIdsToGroup };
          const existingGroups = await chrome.tabGroups.query({ title: 'TabStick', windowId: currentWin.id });
          
          if (existingGroups.length > 0) {
            groupOptions.groupId = existingGroups[0].id;
          }

          const groupId = await chrome.tabs.group(groupOptions);
          await chrome.tabGroups.update(groupId, { title: 'TabStick', color: 'yellow' });
        }
      } catch (err) {
        console.error("Error grouping tabs:", err);
      } finally {
        btnGroupTabs.disabled = false;
        btnGroupTabs.textContent = originalText;
      }
    });
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local') {
      let shouldReload = false;
      for (let key in changes) {
        if (key.startsWith('notes::')) {
          shouldReload = true;
          break;
        }
      }
      if (shouldReload) {
        loadData();
      }
    }
  });

  loadData();
});
