const NoteManager = (function() {
  const THEMES = {
    sunflower: { bg: '#FFF176', accent: '#F9A825' },
    peach:     { bg: '#FFCCBC', accent: '#FF7043' },
    mint:      { bg: '#C8E6C9', accent: '#43A047' },
    sky:       { bg: '#B3E5FC', accent: '#0288D1' },
    lavender:  { bg: '#E1BEE7', accent: '#8E24AA' },
    snow:      { bg: '#FAFAFA', accent: '#90A4AE' }
  };
  const THEME_KEYS = Object.keys(THEMES);

  const EYE_OPEN_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
  const EYE_CLOSED_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
  const CHECKLIST_SVG = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"></polyline><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>`;

  const shadowStyle = `
    @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=DM+Sans:wght@400;500&display=swap');

    :host {
      all: initial; /* CSS Reset */
      position: fixed;
      z-index: 2147483647;
      box-sizing: border-box;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.15));
      transition: filter 0.2s;
    }

    :host(:focus-within), :host(:hover) {
      filter: drop-shadow(0 8px 24px rgba(0,0,0,0.25));
      z-index: 2147483647; /* Ensure it stays on top */
    }

    .note-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      border-radius: 12px;
      overflow: hidden;
      font-family: 'DM Sans', sans-serif;
    }

    .header-bar {
      height: 28px;
      display: flex;
      align-items: center;
      padding: 0 8px;
      cursor: move;
      user-select: none;
    }

    .color-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      cursor: pointer;
      margin-right: auto;
      border: 1px solid rgba(0,0,0,0.1);
    }

    .btn {
      background: none;
      border: none;
      color: rgba(0,0,0,0.5);
      cursor: pointer;
      font-size: 14px;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
    }

    .btn:hover {
      background: rgba(0,0,0,0.1);
      color: #000;
    }

    .body-area {
      flex: 1;
      position: relative;
      background: inherit;
    }

    textarea {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      background: transparent;
      border: none;
      resize: none;
      padding: 12px;
      font-family: 'Caveat', cursive, sans-serif;
      font-size: 20px;
      line-height: 1.4;
      color: #333;
      outline: none;
    }

    .checklist-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      box-sizing: border-box;
      padding: 12px;
      padding-bottom: 24px;
      overflow-y: auto;
      font-family: 'Caveat', cursive, sans-serif;
      font-size: 20px;
      color: #333;
      display: none;
      flex-direction: column;
      gap: 4px;
    }
    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .checklist-item input[type="checkbox"] {
      width: 18px;
      height: 18px;
      cursor: pointer;
      margin-top: 6px;
    }
    .checklist-text {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-family: inherit;
      font-size: inherit;
      color: inherit;
      line-height: 1.4;
      min-width: 0;
      word-wrap: break-word;
      white-space: pre-wrap;
    }
    .checklist-item.checked .checklist-text {
      text-decoration: line-through;
      opacity: 0.6;
    }
    .add-item-btn {
      background: transparent;
      border: none;
      cursor: pointer;
      font-family: inherit;
      font-size: 18px;
      color: rgba(0,0,0,0.5);
      text-align: left;
      padding: 4px 0;
      margin-top: 4px;
      outline: none;
    }
    .add-item-btn:hover {
      color: #000;
    }
    .checklist-container::-webkit-scrollbar,
    textarea::-webkit-scrollbar {
      width: 6px;
    }
    .checklist-container::-webkit-scrollbar-thumb,
    textarea::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.2);
      border-radius: 3px;
    }

    .resize-handle {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 16px;
      height: 16px;
      cursor: nwse-resize;
      background: linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.1) 50%);
      border-bottom-right-radius: 12px;
    }
  `;

  let notesData = [];
  const noteElements = new Map();
  let currentUrl = '';
  let isHidden = false;
  let currentZIndex = 100000;

  function init(url) {
    currentUrl = url;
  }

  function renderNotes(notes) {
    notesData = notes;
    notesData.forEach(note => createNoteElement(note));
  }

  function createNewNote() {
    const id = 'note_' + Math.random().toString(36).substr(2, 9);
    // center
    const x = Math.max(0, (window.innerWidth - 220) / 2 + (Math.random() * 40 - 20));
    const y = Math.max(0, (window.innerHeight - 160) / 2 + (Math.random() * 40 - 20));
    
    const newNote = {
      id,
      x,
      y,
      width: 220,
      height: 160,
      color: 'sunflower',
      content: '',
      minimized: false,
      isChecklist: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      rotation: (Math.random() * 4) - 2 
    };

    notesData.push(newNote);
    createNoteElement(newNote);
    saveNotesData();
    
    const host = noteElements.get(id);
    if (host && !isHidden) {
      focusNote(host);
    }
  }

  function createNoteElement(note) {
    if (noteElements.has(note.id)) return; 

    const host = document.createElement('div');
    host.id = note.id;
    
    updateHostStyle(host, note);
    if (note.rotation === undefined) note.rotation = (Math.random() * 4) - 2;
    host.style.transform = `rotate(${note.rotation}deg)`;

    const shadow = host.attachShadow({ mode: 'open' });
    
    const style = document.createElement('style');
    style.textContent = shadowStyle;
    shadow.appendChild(style);

    const container = document.createElement('div');
    container.className = 'note-container';
    shadow.appendChild(container);

    const header = document.createElement('div');
    header.className = 'header-bar';
    container.appendChild(header);

    const colorDot = document.createElement('div');
    colorDot.className = 'color-dot';
    header.appendChild(colorDot);

    const toggleChecklistBtn = document.createElement('button');
    toggleChecklistBtn.className = 'btn';
    toggleChecklistBtn.innerHTML = CHECKLIST_SVG;
    toggleChecklistBtn.title = "Toggle Checklist";
    header.appendChild(toggleChecklistBtn);

    const minBtn = document.createElement('button');
    minBtn.className = 'btn min-btn';
    minBtn.innerHTML = note.minimized ? EYE_CLOSED_SVG : EYE_OPEN_SVG;
    minBtn.title = "Minimize/Show";
    header.appendChild(minBtn);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn';
    closeBtn.textContent = '✕';
    header.appendChild(closeBtn);

    const bodyArea = document.createElement('div');
    bodyArea.className = 'body-area';
    container.appendChild(bodyArea);

    const textarea = document.createElement('textarea');
    textarea.value = note.content || '';
    bodyArea.appendChild(textarea);

    const checklistContainer = document.createElement('div');
    checklistContainer.className = 'checklist-container';
    bodyArea.appendChild(checklistContainer);

    const resizeHandle = document.createElement('div');
    resizeHandle.className = 'resize-handle';
    bodyArea.appendChild(resizeHandle);

    applyTheme(container, header, colorDot, note.color);
    applyMinimizedState(host, bodyArea, note.minimized);

    if (isHidden) {
      host.style.display = 'none';
    }

    document.body.appendChild(host);
    noteElements.set(note.id, host);
    bringToFront(host);

    host.addEventListener('mousedown', () => bringToFront(host));

    setupDrag(header, host, note);
    setupResize(resizeHandle, host, note);
    
    let debounceTimer;
    textarea.addEventListener('input', (e) => {
      note.content = e.target.value;
      note.updatedAt = Date.now();
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => saveNotesData(), 500);
    });

    function renderChecklist() {
      checklistContainer.innerHTML = '';
      const items = textToChecklist(note.content || '');
      
      items.forEach((item, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `checklist-item ${item.checked ? 'checked' : ''}`;
        
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = item.checked;
        
        const textDiv = document.createElement('div');
        textDiv.className = 'checklist-text';
        textDiv.contentEditable = 'true';
        textDiv.textContent = item.text;
        
        cb.addEventListener('change', () => {
          item.checked = cb.checked;
          if (cb.checked) itemDiv.classList.add('checked');
          else itemDiv.classList.remove('checked');
          updateNoteContentFromChecklist(items);
        });
        
        textDiv.addEventListener('input', () => {
          item.text = textDiv.textContent;
          updateNoteContentFromChecklist(items);
        });

        textDiv.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            items.splice(index + 1, 0, { text: '', checked: false });
            updateNoteContentFromChecklist(items);
            renderChecklist();
            const nextDiv = checklistContainer.children[index + 1]?.querySelector('.checklist-text');
            if (nextDiv) {
              nextDiv.focus();
              const sel = host.shadowRoot.getSelection();
              if (sel) {
                 const range = document.createRange();
                 range.selectNodeContents(nextDiv);
                 range.collapse(true);
                 sel.removeAllRanges();
                 sel.addRange(range);
              }
            }
          } else if (e.key === 'Backspace' && textDiv.textContent === '') {
            e.preventDefault();
            if (items.length > 1) {
              items.splice(index, 1);
              updateNoteContentFromChecklist(items);
              renderChecklist();
              const prevDiv = checklistContainer.children[Math.max(0, index - 1)]?.querySelector('.checklist-text');
              if (prevDiv) {
                prevDiv.focus();
                const sel = host.shadowRoot.getSelection();
                if (sel) {
                  const range = document.createRange();
                  range.selectNodeContents(prevDiv);
                  range.collapse(false);
                  sel.removeAllRanges();
                  sel.addRange(range);
                }
              }
            }
          }
        });

        itemDiv.appendChild(cb);
        itemDiv.appendChild(textDiv);
        checklistContainer.appendChild(itemDiv);
      });

      const addBtn = document.createElement('button');
      addBtn.className = 'add-item-btn';
      addBtn.textContent = '+ Add item';
      addBtn.addEventListener('click', () => {
        items.push({ text: '', checked: false });
        updateNoteContentFromChecklist(items);
        renderChecklist();
        const lastDiv = checklistContainer.lastElementChild.previousElementSibling.querySelector('.checklist-text');
        if (lastDiv) {
          lastDiv.focus();
          const sel = host.shadowRoot.getSelection();
          if (sel) {
             const range = document.createRange();
             range.selectNodeContents(lastDiv);
             range.collapse(true);
             sel.removeAllRanges();
             sel.addRange(range);
          }
        }
      });
      checklistContainer.appendChild(addBtn);
    }

    function updateNoteContentFromChecklist(items) {
      note.content = checklistToText(items);
      note.updatedAt = Date.now();
      textarea.value = note.content;
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => saveNotesData(), 500);
    }

    function applyChecklistState() {
      if (note.isChecklist) {
        textarea.style.display = 'none';
        checklistContainer.style.display = 'flex';
        renderChecklist();
      } else {
        textarea.style.display = 'block';
        checklistContainer.style.display = 'none';
      }
    }

    toggleChecklistBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      bringToFront(host);
      note.isChecklist = !note.isChecklist;
      applyChecklistState();
      saveNotesData();
    });

    applyChecklistState();

    colorDot.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      bringToFront(host);
      let idx = THEME_KEYS.indexOf(note.color);
      note.color = THEME_KEYS[(idx + 1) % THEME_KEYS.length];
      applyTheme(container, header, colorDot, note.color);
      saveNotesData();
    });

    minBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      bringToFront(host);
      note.minimized = !note.minimized;
      applyMinimizedState(host, bodyArea, note.minimized);
      saveNotesData();
    });

    closeBtn.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      host.remove();
      noteElements.delete(note.id);
      notesData = notesData.filter(n => n.id !== note.id);
      saveNotesData();
    });
  }

  function applyTheme(container, header, colorDot, colorKey) {
    const theme = THEMES[colorKey] || THEMES['sunflower'];
    container.style.backgroundColor = theme.bg;
    header.style.backgroundColor = theme.accent;
    colorDot.style.backgroundColor = theme.bg;
  }

  function applyMinimizedState(host, bodyArea, minimized) {
    const minBtn = host.shadowRoot.querySelector('.min-btn');
    if (minimized) {
      bodyArea.style.display = 'none';
      host.style.height = '28px';
      if(minBtn) minBtn.innerHTML = EYE_CLOSED_SVG;
    } else {
      bodyArea.style.display = 'block';
      const noteId = host.id;
      const note = notesData.find(n => n.id === noteId);
      if (note) {
         host.style.height = note.height + 'px';
      }
      if(minBtn) minBtn.innerHTML = EYE_OPEN_SVG;
    }
  }

  function updateHostStyle(host, note) {
    host.style.left = note.x + 'px';
    host.style.top = note.y + 'px';
    host.style.width = note.width + 'px';
    if (!note.minimized) {
      host.style.height = note.height + 'px';
    } else {
      host.style.height = '28px';
    }
  }

  function setupDrag(dragHandle, host, note) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    dragHandle.addEventListener('mousedown', (e) => {
      if (e.target.tagName && e.target.tagName.toLowerCase() === 'button' || e.target.classList.contains('color-dot')) {
        return; 
      }
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialX = note.x;
      initialY = note.y;
      document.body.classList.add('tabstick-dragging');
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      note.x = initialX + dx;
      note.y = initialY + dy;

      note.x = Math.max(0, Math.min(note.x, window.innerWidth - note.width));
      note.y = Math.max(0, Math.min(note.y, window.innerHeight - 28));

      updateHostStyle(host, note);
    });

    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        document.body.classList.remove('tabstick-dragging');
        saveNotesData();
      }
    });
  }

  function setupResize(resizeHandle, host, note) {
    let isResizing = false;
    let startX, startY, initialW, initialH;

    resizeHandle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      initialW = note.width;
      initialH = note.height;
      document.body.classList.add('tabstick-resizing');
      e.stopPropagation(); 
    });

    document.addEventListener('mousemove', (e) => {
      if (!isResizing) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      note.width = Math.max(160, initialW + dx);
      note.height = Math.max(100, initialH + dy);

      updateHostStyle(host, note);
    });

    document.addEventListener('mouseup', () => {
      if (isResizing) {
        isResizing = false;
        document.body.classList.remove('tabstick-resizing');
        saveNotesData();
      }
    });
  }

  function bringToFront(host) {
    currentZIndex++;
    host.style.zIndex = currentZIndex;
  }

  function saveNotesData() {
    StorageUtil.saveNotes(currentUrl, notesData);
  }

  function clearAll() {
    notesData.forEach(note => {
      const el = noteElements.get(note.id);
      if (el) el.remove();
    });
    noteElements.clear();
    notesData = [];
    StorageUtil.clearNotes(currentUrl);
  }

  function toggleVisibility() {
    isHidden = !isHidden;
    let topNoteElement = null;
    let maxZ = -1;
    noteElements.forEach(el => {
      el.style.display = isHidden ? 'none' : 'block';
      if (!isHidden) {
        const z = parseInt(el.style.zIndex || 0);
        if (z > maxZ) {
          maxZ = z;
          topNoteElement = el;
        }
      }
    });

    if (!isHidden && topNoteElement) {
      focusNote(topNoteElement);
    }
  }

  function focusNote(host) {
    if (!host) return;
    setTimeout(() => {
      const checklistContainer = host.shadowRoot.querySelector('.checklist-container');
      if (checklistContainer && checklistContainer.style.display !== 'none') {
        const texts = host.shadowRoot.querySelectorAll('.checklist-text');
        if (texts.length > 0) {
          const lastText = texts[texts.length - 1];
          lastText.focus();
          const sel = host.shadowRoot.getSelection();
          if (sel) {
            const range = document.createRange();
            range.selectNodeContents(lastText);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
          }
        }
      } else {
        const textarea = host.shadowRoot.querySelector('textarea');
        if (textarea) {
          textarea.focus();
          textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        }
      }
    }, 10);
  }

  function textToChecklist(text) {
    if (!text) return [{ text: '', checked: false }];
    const lines = text.split('\n');
    const items = [];
    for (let line of lines) {
      let checked = false;
      let val = line;
      if (val.startsWith('[x] ') || val.startsWith('[X] ')) {
        checked = true;
        val = val.substring(4);
      } else if (val.startsWith('[ ] ')) {
        checked = false;
        val = val.substring(4);
      }
      items.push({ text: val, checked });
    }
    if (items.length === 0) items.push({ text: '', checked: false });
    return items;
  }

  function checklistToText(items) {
    return items.map(item => (item.checked ? '[x] ' : '[ ] ') + item.text).join('\n');
  }

  return {
    init,
    renderNotes,
    createNewNote,
    clearAll,
    toggleVisibility
  };
})();
