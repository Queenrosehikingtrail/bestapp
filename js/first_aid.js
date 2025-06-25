// first_aid.js - Simple placeholder to prevent 404 errors
// This file contains basic first aid information for hikers

document.addEventListener('DOMContentLoaded', function() {
    console.log("First aid information module loaded");
    
    // Initialize first aid content if the container exists
    const firstAidContainer = document.getElementById('first-aid-content');
    if (firstAidContainer) {
        initFirstAidContent(firstAidContainer);
    }
});

/**
 * Initialize first aid content in the specified container
 * @param {HTMLElement} container - The container element
 */
function initFirstAidContent(container) {
    // Basic first aid information for hikers
    const firstAidInfo = [
        {
            title: "Blisters",
            content: "Clean the area, apply antiseptic, cover with moleskin or bandage. Prevent by wearing proper footwear and moisture-wicking socks."
        },
        {
            title: "Sprains",
            content: "Remember RICE: Rest, Ice, Compression, Elevation. Immobilize the joint and seek medical attention for severe sprains."
        },
        {
            title: "Dehydration",
            content: "Symptoms include thirst, headache, dry mouth, and dizziness. Treat by resting in shade and drinking water with electrolytes."
        },
        {
            title: "Heat Exhaustion",
            content: "Move to a cool place, remove excess clothing, drink cool water, and apply cool compresses to neck and forehead."
        },
        {
            title: "Hypothermia",
            content: "Remove wet clothing, provide warm drinks, use body heat or warm blankets. Seek immediate help for severe cases."
        }
    ];
    
    // Create and append first aid information to the container
    firstAidInfo.forEach(item => {
        const section = document.createElement('div');
        section.className = 'first-aid-section';
        
        const title = document.createElement('h3');
        title.textContent = item.title;
        
        const content = document.createElement('p');
        content.textContent = item.content;
        
        section.appendChild(title);
        section.appendChild(content);
        container.appendChild(section);
    });
}
