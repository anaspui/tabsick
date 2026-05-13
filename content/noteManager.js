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
      createdAt: Date.now(),
      updatedAt: Date.now(),
      rotation: (Math.random() * 4) - 2 
    };

    notesData.push(newNote);
    createNoteElement(newNote);
    saveNotesData();
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

    const minBtn = document.createElement('button');
    minBtn.className = 'btn';
    minBtn.textContent = '─';
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
    if (minimized) {
      bodyArea.style.display = 'none';
      host.style.height = '28px';
    } else {
      bodyArea.style.display = 'block';
      const noteId = host.id;
      const note = notesData.find(n => n.id === noteId);
      if (note) {
         host.style.height = note.height + 'px';
      }
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
    noteElements.forEach(el => {
      el.style.display = isHidden ? 'none' : 'block';
    });
  }

  return {
    init,
    renderNotes,
    createNewNote,
    clearAll,
    toggleVisibility
  };
})();
