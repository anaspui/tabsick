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

  // Listen for storage changes to update real-time
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
