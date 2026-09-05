// Background service worker for Code-Sender (EasyInspect)
chrome.runtime.onInstalled.addListener(() => {
  console.log('Code-Sender (EasyInspect) extension installed!');
  
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
  
  // Handle sending code to Code-Receiver
  if (request.action === 'sendCodeToReceiver') {
    try {
      // Find all Code-Receiver extension IDs (we'll broadcast to all)
      chrome.runtime.sendMessage(
        request.receiverId, // You'll need to provide the Code-Receiver extension ID
        {
          action: 'sendCodeToReceiver',
          code: request.code
        },
        (response) => {
          if (chrome.runtime.lastError) {
            console.log('Code-Receiver not found or not responding');
            sendResponse({ status: 'error', message: 'Code-Receiver not installed' });
          } else {
            sendResponse({ status: 'success', message: 'Code sent to receiver' });
          }
        }
      );
    } catch (err) {
      sendResponse({ status: 'error', message: String(err) });
    }
    return true;
  }
});
