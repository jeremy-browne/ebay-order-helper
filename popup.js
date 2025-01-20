// popup.js
document.addEventListener('DOMContentLoaded', () => {
    const policiesContainer = document.getElementById('policiesContainer');
    const addPolicyBtn = document.getElementById('addPolicyBtn');
    const saveStatus = document.getElementById('saveStatus');

    const openOrdersBtn = document.getElementById('openOrdersBtn');
    const getOrderInfoBtn = document.getElementById('getOrderInfoBtn');

    // Load existing policies from storage on popup open
    chrome.storage.sync.get(['shippingPolicies'], (result) => {
        const shippingPolicies = result.shippingPolicies || [];
        shippingPolicies.forEach(policy => {
            createPolicyRow(policy.name, policy.cost);
        });
    });

    // Create new policy row on click
    addPolicyBtn.addEventListener('click', () => {
        createPolicyRow('', '');
    });

    // Example: tell the background script to open orders
    openOrdersBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'openOrders' });
    });

    // Example: ask the background script to have the content script copy order info
    getOrderInfoBtn.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: 'getOrderInfo' });
    });

    /**
     * Create one row with name/cost inputs and a remove button
     */
    function createPolicyRow(nameValue, costValue) {
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
    function savePolicies() {
        const rows = policiesContainer.querySelectorAll('.policy-row');
        const shippingPolicies = Array.from(rows).map(row => {
            const inputs = row.querySelectorAll('input');
            return {
                name: inputs[0].value.trim(),
                cost: inputs[1].value.trim()
            };
        });

        chrome.storage.sync.set({ shippingPolicies }, () => {
            saveStatus.textContent = 'Saved!';
            setTimeout(() => {
                saveStatus.textContent = '';
            }, 1000);
        });
    }
});
