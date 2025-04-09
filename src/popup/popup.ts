import { ShippingPolicy, StorageResult } from '../shared/types';

document.addEventListener('DOMContentLoaded', () => {
  const policiesContainer = document.getElementById('policiesContainer');
  const addPolicyBtn = document.getElementById('addPolicyBtn');
  const saveStatus = document.getElementById('saveStatus');
  const settingsLink = document.querySelector('a[href="settings.html"]');

  if (!policiesContainer || !addPolicyBtn || !saveStatus) {
    console.error('Required DOM elements not found');
    return;
  }

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

  if (settingsLink) {
    settingsLink.addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({
        url: chrome.runtime.getURL('settings.html')
      });
    });
  }

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