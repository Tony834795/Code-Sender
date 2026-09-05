// Background service worker for EasyInspect
chrome.runtime.onInstalled.addListener(() => {
  console.log('EasyInspect extension installed!');
  
  // Initialize storage
  chrome.storage.local.get(['easyinspect_edits'], (result) => {
    if (!result.easyinspect_edits) {
      chrome.storage.local.set({ easyinspect_edits: {} });
    }
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getEdits') {
    chrome.storage.local.get(['easyinspect_edits'], (result) => {
      sendResponse(result.easyinspect_edits || {});
    });
    return true;
  }
});
