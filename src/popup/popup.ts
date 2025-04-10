import { ShippingPolicy, StorageResult, MessageAction } from '../shared/types';

console.log('Popup script loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM Content Loaded');
  
  // Get elements that exist in both popup and settings pages
  const settingsLink = document.querySelector('a[href="settings.html"]');
  const buttonVisibilityToggle = document.getElementById('buttonVisibility') as HTMLInputElement;
  console.log('Toggle element found:', buttonVisibilityToggle);

  if (!buttonVisibilityToggle) {
    console.error('Button visibility toggle not found');
    return;
  }

  // Get elements that only exist in settings page
  const policiesContainer = document.getElementById('policiesContainer');
  const addPolicyBtn = document.getElementById('addPolicyBtn');
  const saveStatus = document.getElementById('saveStatus');

  // Only proceed with settings-specific code if we're on the settings page
  if (policiesContainer && addPolicyBtn && saveStatus) {
    // Load existing policies from storage on popup open
    chrome.storage.sync.get(['shippingPolicies'], (result: StorageResult) => {
      try {
        const shippingPolicies = result.shippingPolicies || [];
        shippingPolicies.forEach((policy: ShippingPolicy) => {
          createPolicyRow(policy.name, policy.cost);
        });
      } catch (error) {
        console.error('Error loading shipping policies:', error);
        showStatus('Error loading policies', 'error');
      }
    });

    // Create new policy row on click
    addPolicyBtn.addEventListener('click', () => {
      createPolicyRow('', '');
    });

    // Open settings in new tab
    if (settingsLink) {
      settingsLink.addEventListener('click', (e) => {
        e.preventDefault();
        chrome.tabs.create({
          url: chrome.runtime.getURL('settings.html')
        });
      });
    }
  }

  // Load saved button visibility state
  chrome.storage.sync.get(['buttonVisibility'], function(result) {
    console.log('Loaded button visibility from storage:', result);
    // Default to true if not set
    const isVisible = result.buttonVisibility === undefined ? true : result.buttonVisibility;
    buttonVisibilityToggle.checked = isVisible;
    
    // Send initial state to content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        try {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: MessageAction.UPDATE_BUTTON_VISIBILITY,
            data: { visible: isVisible }
          }, (response) => {
            if (chrome.runtime.lastError) {
              console.log('Content script not ready yet:', chrome.runtime.lastError);
            }
          });
        } catch (error) {
          console.log('Content script not ready yet:', error);
        }
      }
    });
  });

  // Add click event listener directly to the toggle
  buttonVisibilityToggle.addEventListener('change', (e) => {
    console.log('Toggle state changed:', buttonVisibilityToggle.checked);
    const isVisible = buttonVisibilityToggle.checked;
    chrome.storage.sync.set({ buttonVisibility: isVisible }, () => {
      console.log('Button visibility saved to storage:', isVisible);
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          try {
            chrome.tabs.sendMessage(tabs[0].id, { 
              action: MessageAction.UPDATE_BUTTON_VISIBILITY,
              data: { visible: isVisible }
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.log('Content script not ready yet:', chrome.runtime.lastError);
              }
            });
          } catch (error) {
            console.log('Content script not ready yet:', error);
          }
        }
      });
    });
  });

  /**
   * Create one row with name/cost inputs and a remove button
   */
  function createPolicyRow(nameValue: string, costValue: string): void {
    if (!policiesContainer) return;

    const rowDiv = document.createElement('div');
    rowDiv.className = 'policy-row';

    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Policy Name';
    nameInput.value = nameValue;

    const costInput = document.createElement('input');
    costInput.type = 'text';
    costInput.placeholder = 'Cost (e.g. -1.50)';
    costInput.value = costValue;

    // Remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = 'X';
    removeBtn.className = 'button';
    removeBtn.style.marginLeft = '5px';
    removeBtn.addEventListener('click', () => {
      rowDiv.remove();
      savePolicies();
    });

    // Whenever user modifies an input, save
    nameInput.addEventListener('change', savePolicies);
    costInput.addEventListener('change', savePolicies);

    // Append to row
    rowDiv.appendChild(nameInput);
    rowDiv.appendChild(costInput);
    rowDiv.appendChild(removeBtn);

    // Add row to container
    policiesContainer.appendChild(rowDiv);
  }

  /**
   * Gather all rows and save them to chrome.storage.sync
   */
  function savePolicies(): void {
    if (!policiesContainer) return;

    try {
      const rows = policiesContainer.querySelectorAll('.policy-row');
      const shippingPolicies: ShippingPolicy[] = Array.from(rows).map(row => {
        const inputs = row.querySelectorAll('input');
        return {
          id: crypto.randomUUID(),
          name: inputs[0].value.trim(),
          cost: inputs[1].value.trim(),
          color: '#ffebeb' // Default light red color
        };
      });

      chrome.storage.sync.set({ shippingPolicies }, () => {
        if (chrome.runtime.lastError) {
          showStatus('Error saving policies: ' + chrome.runtime.lastError.message, 'error');
        } else {
          showStatus('Saved!', 'success');
        }
      });
    } catch (error) {
      console.error('Error saving policies:', error);
      showStatus('Error saving policies', 'error');
    }
  }

  /**
   * Show a status message to the user
   */
  function showStatus(message: string, type: 'success' | 'error'): void {
    if (saveStatus) {
      saveStatus.textContent = message;
      saveStatus.className = `status-message ${type}`;
      setTimeout(() => {
        if (saveStatus) {
          saveStatus.textContent = '';
          saveStatus.className = 'status-message';
        }
      }, 3000);
    }
  }
}); 