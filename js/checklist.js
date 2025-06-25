// checklist.js - Simple placeholder to prevent 404 errors
// This file contains hiking checklist functionality

document.addEventListener('DOMContentLoaded', function() {
    console.log("Hiking checklist module loaded");
    
    // Initialize checklist if the container exists
    const checklistContainer = document.getElementById('checklist-container');
    if (checklistContainer) {
        initChecklist(checklistContainer);
    }
});

/**
 * Initialize hiking checklist in the specified container
 * @param {HTMLElement} container - The container element
 */
function initChecklist(container) {
    // Basic hiking checklist items
    const checklistItems = [
        { category: "Essentials", items: [
            "Backpack",
            "Water bottle/hydration system",
            "Food and snacks",
            "Navigation (map, compass, GPS)",
            "First aid kit",
            "Sun protection (hat, sunglasses, sunscreen)",
            "Rain gear/emergency shelter",
            "Knife or multi-tool",
            "Fire starter",
            "Headlamp/flashlight"
        ]},
        { category: "Clothing", items: [
            "Moisture-wicking shirts",
            "Quick-dry pants/shorts",
            "Insulating layer (fleece, down)",
            "Waterproof/windproof jacket",
            "Hiking boots/shoes",
            "Extra socks",
            "Gloves/mittens (if cold)",
            "Warm hat/sun hat"
        ]},
        { category: "Optional", items: [
            "Trekking poles",
            "Camera",
            "Binoculars",
            "Field guides",
            "Insect repellent",
            "Portable charger",
            "Toilet paper/trowel",
            "Whistle"
        ]}
    ];
    
    // Create and append checklist to the container
    checklistItems.forEach(category => {
        const section = document.createElement('div');
        section.className = 'checklist-section';
        
        const title = document.createElement('h3');
        title.textContent = category.category;
        section.appendChild(title);
        
        const list = document.createElement('ul');
        list.className = 'checklist-items';
        
        category.items.forEach(item => {
            const listItem = document.createElement('li');
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = 'item-' + item.toLowerCase().replace(/\s+/g, '-');
            
            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            label.textContent = item;
            
            listItem.appendChild(checkbox);
            listItem.appendChild(label);
            list.appendChild(listItem);
        });
        
        section.appendChild(list);
        container.appendChild(section);
    });
    
    // Add save/load functionality
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Checklist';
    saveButton.className = 'checklist-save-button';
    saveButton.addEventListener('click', saveChecklist);
    
    const resetButton = document.createElement('button');
    resetButton.textContent = 'Reset Checklist';
    resetButton.className = 'checklist-reset-button';
    resetButton.addEventListener('click', resetChecklist);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'checklist-buttons';
    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(resetButton);
    
    container.appendChild(buttonContainer);
    
    // Load saved checklist state if available
    loadChecklist();
}

/**
 * Save checklist state to localStorage
 */
function saveChecklist() {
    const checkboxes = document.querySelectorAll('.checklist-items input[type="checkbox"]');
    const checkedItems = {};
    
    checkboxes.forEach(checkbox => {
        checkedItems[checkbox.id] = checkbox.checked;
    });
    
    localStorage.setItem('hiking-checklist', JSON.stringify(checkedItems));
    alert('Checklist saved!');
}

/**
 * Load checklist state from localStorage
 */
function loadChecklist() {
    const savedChecklist = localStorage.getItem('hiking-checklist');
    
    if (savedChecklist) {
        const checkedItems = JSON.parse(savedChecklist);
        
        for (const id in checkedItems) {
            const checkbox = document.getElementById(id);
            if (checkbox) {
                checkbox.checked = checkedItems[id];
            }
        }
    }
}

/**
 * Reset checklist (uncheck all items)
 */
function resetChecklist() {
    if (confirm('Are you sure you want to reset the checklist?')) {
        const checkboxes = document.querySelectorAll('.checklist-items input[type="checkbox"]');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });
        
        localStorage.removeItem('hiking-checklist');
    }
}
