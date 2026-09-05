let isEditingEnabled = false;
let selectedElement = null;
const editedElements = new Map();
let isDragging = false;
let dragOffsetX = 0;
let dragOffsetY = 0;
let isDragModeEnabled = false;
let outlinesHidden = false;

// Initialize
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'toggleEdit':
      toggleEditMode();
      break;
    case 'toggleDrag':
      toggleDragMode();
      break;
    case 'saveWork':
      saveWork();
      break;
    case 'loadWork':
      loadWork();
      break;
    case 'resetAll':
      resetAll();
      break;
    case 'toggleOutlines':
      toggleClickOutlines();
      break;
  }
  sendResponse({ status: 'ok' });
});

function toggleEditMode() {
  isEditingEnabled = !isEditingEnabled;
  if (isEditingEnabled) {
    enableEditMode();
  } else {
    disableEditMode();
  }
}

function toggleDragMode() {
  isDragModeEnabled = !isDragModeEnabled;
  if (isDragModeEnabled) {
    showNotification('Drag mode enabled! Select an element and click "Drag & Move"', 'success');
  } else {
    showNotification('Drag mode disabled', 'info');
  }
}

function enableEditMode() {
  document.body.style.cursor = 'crosshair';
  document.addEventListener('click', handleElementClick, true);
  document.addEventListener('mouseover', handleElementHover, true);
  document.addEventListener('mousedown', handleElementMouseDown, true);
  document.addEventListener('mousemove', handleElementMouseMove, true);
  document.addEventListener('mouseup', handleElementMouseUp, true);
  showNotification('EasyInspect enabled! Click any element to edit.', 'success');
}

function disableEditMode() {
  document.body.style.cursor = 'default';
  document.removeEventListener('click', handleElementClick, true);
  document.removeEventListener('mouseover', handleElementHover, true);
  document.removeEventListener('mousedown', handleElementMouseDown, true);
  document.removeEventListener('mousemove', handleElementMouseMove, true);
  document.removeEventListener('mouseup', handleElementMouseUp, true);
  if (selectedElement) {
    removeSelectionHighlight();
  }
  showNotification('EasyInspect disabled', 'info');
}

function handleElementHover(e) {
  if (!isEditingEnabled || isDragging) return;
  if (isEasyInspectElement(e.target)) return;
  if (e.target === document.body || e.target === document.documentElement) return;
  e.target.style.outline = '2px dashed #667eea';
}

function handleElementClick(e) {
  if (!isEditingEnabled || isDragging) return;
  if (isEasyInspectElement(e.target)) return;
  
  e.preventDefault();
  e.stopPropagation();
  
  if (e.target === document.body || e.target === document.documentElement) return;
  
  selectElement(e.target);
}

function handleElementMouseDown(e) {
  if (!isEditingEnabled || !selectedElement || !isDragging) return;
  if (isEasyInspectElement(e.target)) return;
  if (e.target !== selectedElement) return;
  
  document.body.style.cursor = 'grabbing';
  
  const rect = selectedElement.getBoundingClientRect();
  dragOffsetX = e.clientX - rect.left;
  dragOffsetY = e.clientY - rect.top;
  
  e.preventDefault();
  e.stopPropagation();
}

function handleElementMouseMove(e) {
  if (!isDragging || !selectedElement) return;
  
  selectedElement.style.position = 'fixed';
  selectedElement.style.left = (e.clientX - dragOffsetX) + 'px';
  selectedElement.style.top = (e.clientY - dragOffsetY) + 'px';
  selectedElement.style.zIndex = '10000';
  
  e.preventDefault();
  e.stopPropagation();
}

function handleElementMouseUp(e) {
  if (!isDragging) return;
  
  isDragging = false;
  document.body.style.cursor = 'crosshair';
  
  // Store the position
  if (selectedElement) {
    storeEdit(selectedElement, 'position', {
      left: selectedElement.style.left,
      top: selectedElement.style.top,
      position: 'fixed'
    });
  }
  
  e.preventDefault();
  e.stopPropagation();
}

function isEasyInspectElement(element) {
  let current = element;
  while (current && current !== document.body) {
    if (current.id === 'easyinspect-menu' || 
        current.classList.contains('easyinspect-menu') ||
        current.id === 'easyinspect-notification' ||
        current.classList.contains('easyinspect-notification') ||
        current.id === 'easyinspect-file-input' ||
        current.id === 'easyinspect-color-menu' ||
        current.classList.contains('easyinspect-color-menu') ||
        current.id === 'easyinspect-opacity-menu' ||
        current.classList.contains('easyinspect-opacity-menu') ||
        current.id === 'easyinspect-rotation-menu' ||
        current.classList.contains('easyinspect-rotation-menu') ||
        current.id === 'easyinspect-border-modal' ||
        current.classList.contains('easyinspect-border-modal') ||
        current.id === 'easyinspect-shadow-modal' ||
        current.classList.contains('easyinspect-shadow-modal')) {
      return true;
    }
    current = current.parentElement;
  }
  return false;
}

function selectElement(element) {
  if (selectedElement) {
    removeSelectionHighlight();
  }
  
  selectedElement = element;
  element.style.outline = '3px solid #667eea';
  element.style.position = 'relative';
  
  showEditMenu(element);
}

function removeSelectionHighlight() {
  if (selectedElement) {
    selectedElement.style.outline = '';
  }
}

function showEditMenu(element) {
  let existingMenu = document.getElementById('easyinspect-menu');
  if (existingMenu) {
    existingMenu.remove();
  }

  const menu = document.createElement('div');
  menu.id = 'easyinspect-menu';
  menu.className = 'easyinspect-menu';
  
  const rect = element.getBoundingClientRect();
  menu.style.position = 'fixed';
  menu.style.top = (rect.bottom + 10) + 'px';
  menu.style.left = rect.left + 'px';
  menu.style.zIndex = '999999';
  menu.style.background = 'white';
  menu.style.border = '2px solid #667eea';
  menu.style.borderRadius = '8px';
  menu.style.padding = '10px';
  menu.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
  menu.style.fontFamily = 'Segoe UI, sans-serif';
  menu.style.fontSize = '13px';
  menu.style.pointerEvents = 'auto';
  menu.style.maxWidth = '250px';

  const buttonStyle = `
    margin: 5px 5px 5px 0;
    padding: 8px 12px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    background: #667eea;
    color: white;
    font-weight: bold;
    transition: all 0.2s;
    font-size: 12px;
  `;

  menu.innerHTML = `
    <div style="margin-bottom: 8px; font-weight: bold; color: #667eea;">Edit Element</div>
    <button id="edit-text-btn" style="${buttonStyle}">✏️ Edit Text</button>
    <button id="edit-color-btn" style="${buttonStyle}">🎨 Change Color</button>
    <button id="edit-size-btn" style="${buttonStyle}">📏 Resize</button>
    <button id="drag-move-btn" style="${buttonStyle}">↔️ Drag & Move</button>
    <button id="rotate-btn" style="${buttonStyle}">🔁 Rotate</button>
    <button id="opacity-btn" style="${buttonStyle}">👁️ Opacity</button>
    <button id="shadow-btn" style="${buttonStyle}">✨ Add Shadow</button>
    <button id="border-btn" style="${buttonStyle}">▭ Add Border</button>
    <button id="invert-color-btn" style="${buttonStyle}">🔄 Invert Colors</button>
    <button id="replace-image-btn" style="${buttonStyle}">🖼️ Replace Image</button>
    <button id="duplicate-btn" style="${buttonStyle}">📋 Duplicate</button>
    <button id="copy-html-btn" style="${buttonStyle}">💾 Copy HTML</button>
    <button id="close-menu-btn" style="${buttonStyle.replace('#667eea', '#f56565')}">✕ Close</button>
  `;

  document.body.appendChild(menu);

  menu.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.getElementById('edit-text-btn').addEventListener('click', () => editText(element));
  document.getElementById('edit-color-btn').addEventListener('click', () => editColor(element));
  document.getElementById('edit-size-btn').addEventListener('click', () => editSize(element));
  document.getElementById('drag-move-btn').addEventListener('click', () => enableElementDrag(element, menu));
  document.getElementById('rotate-btn').addEventListener('click', () => rotateElement(element));
  document.getElementById('opacity-btn').addEventListener('click', () => changeOpacity(element));
  document.getElementById('shadow-btn').addEventListener('click', () => addShadow(element));
  document.getElementById('border-btn').addEventListener('click', () => addBorder(element));
  document.getElementById('invert-color-btn').addEventListener('click', () => invertColor(element));
  document.getElementById('replace-image-btn').addEventListener('click', () => replaceImage(element));
  document.getElementById('duplicate-btn').addEventListener('click', () => duplicateElement(element));
  document.getElementById('copy-html-btn').addEventListener('click', () => copyHTML(element));
  document.getElementById('close-menu-btn').addEventListener('click', () => menu.remove());
}

function enableElementDrag(element, menu) {
  if (!isDragModeEnabled) {
    showNotification('Enable dragging from the main menu first!', 'warning');
    return;
  }

  isDragging = true;
  menu.remove();
  showNotification('Now drag the element! Release to finish.', 'info');
  document.body.style.cursor = 'grab';
}

function editText(element) {
  if (!element.textContent) {
    alert('This element has no text to edit');
    return;
  }

  const newText = prompt('Edit text:', element.textContent);
  if (newText !== null) {
    element.textContent = newText;
    storeEdit(element, 'text', newText);
    showNotification('Text updated!', 'success');
  }
}

function editColor(element) {
  const colorMenu = document.createElement('div');
  colorMenu.id = 'easyinspect-color-menu';
  colorMenu.className = 'easyinspect-color-menu';
  colorMenu.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 9999999;
    font-family: Segoe UI, sans-serif;
    pointer-events: auto;
  `;

  colorMenu.innerHTML = `
    <div style="margin-bottom: 15px; font-weight: bold; color: #667eea; font-size: 16px;">Change Color</div>
    <div style="margin-bottom: 10px;">
      <label style="display: block; margin-bottom: 5px; color: #333;">Background Color:</label>
      <input type="color" id="bg-color-picker" value="#ffffff" style="width: 100%; height: 40px; cursor: pointer; border: none; border-radius: 5px;">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; color: #333;">Text Color:</label>
      <input type="color" id="text-color-picker" value="#000000" style="width: 100%; height: 40px; cursor: pointer; border: none; border-radius: 5px;">
    </div>
    <div style="display: flex; gap: 10px;">
      <button id="apply-color-btn" style="flex: 1; padding: 10px; background: #48bb78; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Apply</button>
      <button id="cancel-color-btn" style="flex: 1; padding: 10px; background: #f56565; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Cancel</button>
    </div>
  `;

  document.body.appendChild(colorMenu);

  colorMenu.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.getElementById('apply-color-btn').addEventListener('click', () => {
    const bgColor = document.getElementById('bg-color-picker').value;
    const textColor = document.getElementById('text-color-picker').value;
    
    element.style.backgroundColor = bgColor;
    element.style.color = textColor;
    
    storeEdit(element, 'bgColor', bgColor);
    storeEdit(element, 'textColor', textColor);
    
    document.body.removeChild(colorMenu);
    showNotification('Colors changed!', 'success');
  });

  document.getElementById('cancel-color-btn').addEventListener('click', () => {
    document.body.removeChild(colorMenu);
  });
}

function editSize(element) {
  const currentWidth = element.offsetWidth;
  const currentHeight = element.offsetHeight;
  
  const newWidth = prompt('Enter width (px):', currentWidth);
  if (newWidth !== null) {
    element.style.width = newWidth + 'px';
    const newHeight = prompt('Enter height (px):', currentHeight);
    if (newHeight !== null) {
      element.style.height = newHeight + 'px';
      storeEdit(element, 'size', { width: newWidth, height: newHeight });
      showNotification('Size updated!', 'success');
    }
  }
}

function rotateElement(element) {
  const currentRotation = element.style.transform.match(/rotate\(([^)]+)deg\)/) 
    ? element.style.transform.match(/rotate\(([^)]+)deg\)/)[1] 
    : '0';
  
  const newRotation = prompt('Enter rotation (0-360 degrees):', currentRotation);
  if (newRotation !== null && !isNaN(newRotation)) {
    element.style.transform = `rotate(${newRotation}deg)`;
    storeEdit(element, 'rotation', newRotation);
    showNotification(`Element rotated ${newRotation}°!`, 'success');
  }
}

function changeOpacity(element) {
  const currentOpacity = element.style.opacity || '1';
  const newOpacity = prompt('Enter opacity (0-1):', currentOpacity);
  
  if (newOpacity !== null && !isNaN(newOpacity) && newOpacity >= 0 && newOpacity <= 1) {
    element.style.opacity = newOpacity;
    storeEdit(element, 'opacity', newOpacity);
    showNotification(`Opacity set to ${(newOpacity * 100).toFixed(0)}%!`, 'success');
  } else {
    showNotification('Please enter a value between 0 and 1', 'warning');
  }
}

function addShadow(element) {
  const shadowModal = document.createElement('div');
  shadowModal.id = 'easyinspect-shadow-modal';
  shadowModal.className = 'easyinspect-shadow-modal';
  shadowModal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 9999999;
    font-family: Segoe UI, sans-serif;
    pointer-events: auto;
  `;

  shadowModal.innerHTML = `
    <div style="margin-bottom: 15px; font-weight: bold; color: #667eea; font-size: 16px;">Add Shadow</div>
    <div style="margin-bottom: 10px;">
      <label style="display: block; margin-bottom: 5px; color: #333;">Shadow Value:</label>
      <input type="text" id="shadow-input" value="0 4px 6px rgba(0,0,0,0.1)" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box;">
      <small style="color: #999;">Example: 0 4px 6px rgba(0,0,0,0.2)</small>
    </div>
    <div style="display: flex; gap: 10px;">
      <button id="apply-shadow-btn" style="flex: 1; padding: 10px; background: #48bb78; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Apply</button>
      <button id="cancel-shadow-btn" style="flex: 1; padding: 10px; background: #f56565; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Cancel</button>
    </div>
  `;

  document.body.appendChild(shadowModal);

  shadowModal.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.getElementById('apply-shadow-btn').addEventListener('click', () => {
    const shadowValue = document.getElementById('shadow-input').value;
    element.style.boxShadow = shadowValue;
    storeEdit(element, 'shadow', shadowValue);
    
    document.body.removeChild(shadowModal);
    showNotification('Shadow added!', 'success');
  });

  document.getElementById('cancel-shadow-btn').addEventListener('click', () => {
    document.body.removeChild(shadowModal);
  });
}

function addBorder(element) {
  const borderModal = document.createElement('div');
  borderModal.id = 'easyinspect-border-modal';
  borderModal.className = 'easyinspect-border-modal';
  borderModal.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    z-index: 9999999;
    font-family: Segoe UI, sans-serif;
    pointer-events: auto;
  `;

  borderModal.innerHTML = `
    <div style="margin-bottom: 15px; font-weight: bold; color: #667eea; font-size: 16px;">Add Border</div>
    <div style="margin-bottom: 10px;">
      <label style="display: block; margin-bottom: 5px; color: #333;">Border Width (px):</label>
      <input type="number" id="border-width" value="2" min="0" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box;">
    </div>
    <div style="margin-bottom: 10px;">
      <label style="display: block; margin-bottom: 5px; color: #333;">Border Color:</label>
      <input type="color" id="border-color" value="#000000" style="width: 100%; height: 40px; cursor: pointer; border: none; border-radius: 5px;">
    </div>
    <div style="margin-bottom: 15px;">
      <label style="display: block; margin-bottom: 5px; color: #333;">Border Style:</label>
      <select id="border-style" style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 5px; box-sizing: border-box;">
        <option value="solid">Solid</option>
        <option value="dashed">Dashed</option>
        <option value="dotted">Dotted</option>
        <option value="double">Double</option>
      </select>
    </div>
    <div style="display: flex; gap: 10px;">
      <button id="apply-border-btn" style="flex: 1; padding: 10px; background: #48bb78; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Apply</button>
      <button id="cancel-border-btn" style="flex: 1; padding: 10px; background: #f56565; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">Cancel</button>
    </div>
  `;

  document.body.appendChild(borderModal);

  borderModal.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  document.getElementById('apply-border-btn').addEventListener('click', () => {
    const width = document.getElementById('border-width').value;
    const color = document.getElementById('border-color').value;
    const style = document.getElementById('border-style').value;
    
    element.style.border = `${width}px ${style} ${color}`;
    storeEdit(element, 'border', `${width}px ${style} ${color}`);
    
    document.body.removeChild(borderModal);
    showNotification('Border added!', 'success');
  });

  document.getElementById('cancel-border-btn').addEventListener('click', () => {
    document.body.removeChild(borderModal);
  });
}

function invertColor(element) {
  element.style.filter = element.style.filter === 'invert(1)' ? 'invert(0)' : 'invert(1)';
  storeEdit(element, 'invert', element.style.filter);
  showNotification('Colors inverted!', 'success');
}

function replaceImage(element) {
  if (element.tagName !== 'IMG') {
    alert('This element is not an image');
    return;
  }

  const fileInput = document.createElement('input');
  fileInput.id = 'easyinspect-file-input';
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.style.display = 'none';

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        element.src = event.target.result;
        element.style.objectFit = 'cover';
        storeEdit(element, 'image', event.target.result);
        showNotification('Image replaced!', 'success');
      };
      reader.readAsDataURL(file);
    }
  });

  document.body.appendChild(fileInput);
  fileInput.click();
  
  setTimeout(() => {
    document.body.removeChild(fileInput);
  }, 1000);
}

function duplicateElement(element) {
  const clone = element.cloneNode(true);
  clone.style.outline = 'none';
  
  const currentTop = element.style.top ? parseFloat(element.style.top) : 0;
  const currentLeft = element.style.left ? parseFloat(element.style.left) : 0;
  
  clone.style.top = (currentTop + 20) + 'px';
  clone.style.left = (currentLeft + 20) + 'px';
  clone.style.position = 'fixed';
  
  element.parentNode.insertBefore(clone, element.nextSibling);
  showNotification('Element duplicated!', 'success');
}

function copyHTML(element) {
  const html = element.outerHTML;
  const textArea = document.createElement('textarea');
  textArea.value = html;
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  document.body.removeChild(textArea);
  showNotification('HTML copied to clipboard!', 'success');
}

function storeEdit(element, type, value) {
  const elementId = getElementIdentifier(element);
  if (!editedElements.has(elementId)) {
    editedElements.set(elementId, {});
  }
  editedElements.get(elementId)[type] = value;
}

function getElementIdentifier(element) {
  return `${element.tagName}:${element.className}:${element.id}:${(element.textContent || '').substring(0, 20)}`;
}

function saveWork() {
  const edits = {};
  editedElements.forEach((value, key) => {
    edits[key] = value;
  });

  chrome.storage.local.set({
    easyinspect_edits: edits,
    easyinspect_url: window.location.href,
    easyinspect_timestamp: new Date().toISOString()
  }, () => {
    showNotification('Work saved! ✓', 'success');
  });
}

function loadWork() {
  chrome.storage.local.get(['easyinspect_edits', 'easyinspect_url'], (result) => {
    if (!result.easyinspect_edits) {
      showNotification('No saved work found', 'info');
      return;
    }

    if (result.easyinspect_url !== window.location.href) {
      showNotification('Saved work is for a different page', 'warning');
      return;
    }

    Object.keys(result.easyinspect_edits).forEach(elementId => {
      const edits = result.easyinspect_edits[elementId];
      const element = findElementByIdentifier(elementId);
      
      if (element) {
        if (edits.text) element.textContent = edits.text;
        if (edits.bgColor) element.style.backgroundColor = edits.bgColor;
        if (edits.textColor) element.style.color = edits.textColor;
        if (edits.size) {
          element.style.width = edits.size.width + 'px';
          element.style.height = edits.size.height + 'px';
        }
        if (edits.rotation) element.style.transform = `rotate(${edits.rotation}deg)`;
        if (edits.opacity) element.style.opacity = edits.opacity;
        if (edits.shadow) element.style.boxShadow = edits.shadow;
        if (edits.border) element.style.border = edits.border;
        if (edits.invert) element.style.filter = edits.invert;
        if (edits.image) element.src = edits.image;
        if (edits.position) {
          element.style.position = edits.position.position;
          element.style.left = edits.position.left;
          element.style.top = edits.position.top;
          element.style.zIndex = '10000';
        }
      }
    });

    showNotification('Work loaded! ✓', 'success');
  });
}

function findElementByIdentifier(identifier) {
  const parts = identifier.split(':');
  const tag = parts[0] || '*';
  const className = parts[1] || '';
  const id = parts[2] || '';
  // text snippet not used for matching currently
  let elements = document.querySelectorAll(tag);
  
  for (let elem of elements) {
    if (elem.className === className && elem.id === id) {
      return elem;
    }
  }
  
  return null;
}

function resetAll() {
  editedElements.clear();
  chrome.storage.local.remove(['easyinspect_edits', 'easyinspect_url', 'easyinspect_timestamp']);
  location.reload();
  showNotification('All edits reset!', 'info');
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.id = 'easyinspect-notification';
  notification.className = 'easyinspect-notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#48bb78' : type === 'warning' ? '#ed8936' : '#4299e1'};
    color: white;
    padding: 15px 20px;
    border-radius: 5px;
    font-family: Segoe UI, sans-serif;
    font-weight: bold;
    z-index: 999999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
    pointer-events: none;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function rgbToHex(rgb) {
  if (!rgb) return '#000000';
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return '#000000';
  
  return '#' + result.slice(0, 3).map(x => {
    const hex = parseInt(x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Toggle function to hide click-generated outlines (and override inline outline styles).
function toggleClickOutlines() {
  const STYLE_ID = 'easyinspect-hide-outlines-style';
  let styleEl = document.getElementById(STYLE_ID);

  // Create the stylesheet once if not present
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

  outlinesHidden = !outlinesHidden;
  if (outlinesHidden) {
    document.documentElement.classList.add('easyinspect-hide-click-outlines');
    showNotification('Click outlines hidden', 'success');
  } else {
    document.documentElement.classList.remove('easyinspect-hide-click-outlines');
    showNotification('Click outlines visible', 'info');
  }
}

// Add animations to styles
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);