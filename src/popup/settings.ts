import { ShippingPolicy } from '../shared/types';

const PREDEFINED_POLICIES = [
  // Australia Post Letters - Standard
  "Australia Post Domestic Regular Letter Untracked",
  "Australia Post Domestic Regular Letter With Tracking",
  "Australia Post Domestic Priority Letter",
  "Australia Post Domestic Priority Letter With Tracking",

  // Australia Post Letters - Express
  "Australia Post Domestic Express Letter",

  // Australia Post Parcels - Standard
  "Australia Post Standard Parcel",
  "Australia Post Standard Parcel + Signature",
  "Australia Post Standard Parcel + Registered",

  // Australia Post Parcels - Express
  "Australia Post Express Parcel",
  "Australia Post Parcel Express + Signature",

  // Australia Post Boxes/Satchels - Standard
  "Australia Post Standard Small Box/Satchel",
  "Australia Post Standard Medium Box/Satchel",
  "Australia Post Standard Large Box/Satchel",
  "Australia Post Standard Extra Large Box/Satchel",
  "Australia Post Standard Small Box/Satchel + Signature",
  "Australia Post Standard Medium Box/Satchel + Signature",
  "Australia Post Standard Large Box/Satchel + Signature",
  "Australia Post Standard Extra Large Box/Satchel + Signature",

  // Australia Post Boxes/Satchels - Express
  "Australia Post Express Small Box/Satchel",
  "Australia Post Express Medium Box/Satchel",
  "Australia Post Express Large Box/Satchel",
  "Australia Post Express Extra Large Box/Satchel",
  "Australia Post Express Small Box/Satchel + Signature",
  "Australia Post Express Medium Box/Satchel + Signature",
  "Australia Post Express Large Box/Satchel + Signature",
  "Australia Post Express Extra Large Box/Satchel + Signature",

  // Courier Services - Standard
  "Courier (Tracked)",
  "Standard Parcel Delivery",
  "Standard Parcel Delivery - Registered",

  // Courier Services - Express
  "Couriers Please",
  "Express Parcel Delivery",
  "DHL",
  "Aramex (formerly Fastway)",
  "Star Track Express",
  "TNT",
  "Toll Consumer Delivery",

  // Interparcel Services
  "AU Interparcel Standard",
  "AU Interparcel Express",

  // Sendle Services
  "Sendle Parcel Delivery",
  "Sendle 250g Parcel with tracking",
  "Sendle Express",

  // eBay Services
  "eBay Postage Labels",
  "eBay SpeedPAK Economy",
  "eBay SpeedPAK Standard",
  "eBay SpeedPAK Expedited",
  "eBay SpeedPAK Express",

  // International Shipping - Standard
  "Economy Shipping from Greater China to worldwide",
  "Standard Shipping from Greater China to worldwide",
  "UBI Smart Parcel",
  "Toll Global Economy",
  "Standard delivery from outside AU",

  // International Shipping - Express
  "Expedited Shipping from Greater China to worldwide",
  "TNT International Express",
  "Express delivery from outside AU",

  // International Shipping - Economy
  "Economy delivery from outside AU",

  // Special Services
  "Express Delivery with Age Verification",
  "Standard Delivery with Age Verification",
  "Freight: Large and bulky items"
];

document.addEventListener('DOMContentLoaded', async () => {
  const policiesContainer = document.getElementById('policiesContainer');
  const addPolicyBtn = document.getElementById('addPolicyBtn');
  const saveBtn = document.getElementById('saveBtn');
  const statusMsg = document.getElementById('statusMsg');

  if (!policiesContainer || !addPolicyBtn || !saveBtn || !statusMsg) {
    console.error('Required elements not found');
    return;
  }

  // Load existing policies
  let policies: ShippingPolicy[] = [];
  try {
    const result = await chrome.storage.sync.get('shippingPolicies');
    policies = result.shippingPolicies || [];
  } catch (error) {
    console.error('Error loading policies:', error);
    showStatus('Error loading policies', true);
  }

  function createPolicyRow(policy?: ShippingPolicy): HTMLDivElement {
    const row = document.createElement('div');
    row.className = 'policy-row';

    // Create select for policy name
    const nameSelect = document.createElement('select');
    nameSelect.className = 'policy-name';
    
    // Add empty option
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '-- Select a shipping policy --';
    nameSelect.appendChild(emptyOption);

    // Add predefined policies
    PREDEFINED_POLICIES.forEach(policyName => {
      const option = document.createElement('option');
      option.value = policyName;
      option.textContent = policyName;
      if (policy && policy.name === policyName) {
        option.selected = true;
      }
      nameSelect.appendChild(option);
    });

    // Create cost input
    const costInput = document.createElement('input');
    costInput.type = 'text';
    costInput.className = 'policy-cost';
    costInput.placeholder = 'Cost';
    costInput.value = policy?.cost || '';

    // Create color picker
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'policy-color';
    colorInput.value = policy?.color || '#ffebeb';  // Light red default color

    // Create remove button
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '✕';
    removeBtn.className = 'remove-btn';
    removeBtn.onclick = () => row.remove();

    // Add validation for cost input
    costInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      const value = target.value;
      
      // Allow only numbers, single decimal point, and minus sign at start
      if (/^-?\d*\.?\d*$/.test(value)) {
        // Valid input, keep it
        return;
      }
      
      // Invalid input, revert to previous valid state
      target.value = value.slice(0, -1);
    });

    row.appendChild(nameSelect);
    row.appendChild(costInput);
    row.appendChild(colorInput);
    row.appendChild(removeBtn);
    return row;
  }

  // Add existing policies
  policies.forEach(policy => {
    policiesContainer.appendChild(createPolicyRow(policy));
  });

  // Add new policy button
  addPolicyBtn.onclick = () => {
    policiesContainer.appendChild(createPolicyRow());
  };

  function showStatus(message: string, isError = false) {
    if (!statusMsg) return;  // Early return if statusMsg is null
    
    statusMsg.textContent = message;
    statusMsg.className = isError ? 'error' : 'success';
    setTimeout(() => {
      if (!statusMsg) return;  // Check again in case element was removed
      statusMsg.textContent = '';
      statusMsg.className = '';
    }, 3000);
  }

  // Save button handler
  saveBtn.onclick = async () => {
    const policyRows = document.querySelectorAll('.policy-row');
    const newPolicies: ShippingPolicy[] = [];

    policyRows.forEach((row, index) => {
      const nameSelect = row.querySelector('.policy-name') as HTMLSelectElement;
      const costInput = row.querySelector('.policy-cost') as HTMLInputElement;
      const colorInput = row.querySelector('.policy-color') as HTMLInputElement;

      if (nameSelect.value && costInput.value) {
        newPolicies.push({
          id: `policy-${index}`,
          name: nameSelect.value,
          cost: costInput.value,
          color: colorInput.value
        });
      }
    });

    try {
      await chrome.storage.sync.set({ shippingPolicies: newPolicies });
      showStatus('Settings saved successfully');
    } catch (error) {
      console.error('Error saving policies:', error);
      showStatus('Error saving settings', true);
    }
  };
}); 