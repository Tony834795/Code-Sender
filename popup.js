document.getElementById('toggleBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleEdit' }, () => {
      if (chrome.runtime.lastError) console.warn('toggleEdit message failed:', chrome.runtime.lastError.message);
    });
  });
});

document.getElementById('dragBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleDrag' }, () => {
      if (chrome.runtime.lastError) console.warn('toggleDrag message failed:', chrome.runtime.lastError.message);
    });
  });
});

document.getElementById('saveBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'saveWork' }, () => {
      if (chrome.runtime.lastError) console.warn('saveWork message failed:', chrome.runtime.lastError.message);
    });
  });
});

document.getElementById('loadBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'loadWork' }, () => {
      if (chrome.runtime.lastError) console.warn('loadWork message failed:', chrome.runtime.lastError.message);
    });
  });
});

document.getElementById('resetBtn').addEventListener('click', () => {
  if (!confirm('Are you sure you want to reset all edits?')) return;
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, { action: 'resetAll' }, () => {
      if (chrome.runtime.lastError) console.warn('resetAll message failed:', chrome.runtime.lastError.message);
    });
  });
});

// More reliable toggle: inject the toggle function directly into the page
const hideBtn = document.getElementById('hideOutlinesBtn');
if (hideBtn) {
  hideBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (!tabId) {
        console.error('No active tab found');
        return;
      }

      chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const STYLE_ID = 'easyinspect-hide-outlines-style';
          // Create the stylesheet if it doesn't exist
          let styleEl = document.getElementById(STYLE_ID);
          if (!styleEl) {
            styleEl = document.createElement('style');
            styleEl.id = STYLE_ID;
            styleEl.textContent = `
              /* Remove outlines/box-shadows applied by the extension or page (use !important to override inline styles) */
              .easyinspect-hide-click-outlines * {
                outline: none !important;
                box-shadow: none !important;
              }
              /* Preserve keyboard focus visibility for accessibility */
              .easyinspect-hide-click-outlines *:focus-visible {
                outline: auto !important;
                box-shadow: initial !important;
              }
            `;
            document.head.appendChild(styleEl);
          }

          // Toggle the class on documentElement and return the new state
          const root = document.documentElement;
          const nowHidden = root.classList.toggle('easyinspect-hide-click-outlines');
          return nowHidden;
        }
      }, (results) => {
        if (chrome.runtime.lastError) {
          console.error('Injection failed:', chrome.runtime.lastError.message);
          return;
        }
        try {
          const nowHidden = results && results[0] && results[0].result;
          hideBtn.textContent = nowHidden ? 'Show Outlines' : 'Hide Outlines';
        } catch (err) {
          console.error('Couldn\'t read injection result', err);
        }
      });
    });
  });
}