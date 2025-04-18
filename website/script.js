// Snow animation
function createSnow() {
    const snowContainer = document.querySelector('.snow-container');
    const snowflakeCount = 100; // Increased number of snowflakes

    for (let i = 0; i < snowflakeCount; i++) {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snow');
        
        // Random size between 5px and 15px
        const size = Math.random() * 10 + 5;
        snowflake.style.width = `${size}px`;
        snowflake.style.height = `${size}px`;
        
        // Random position
        snowflake.style.left = `${Math.random() * 100}%`;
        
        // Random animation duration between 5s and 15s
        const duration = Math.random() * 10 + 5;
        snowflake.style.animationDuration = `${duration}s`;
        
        // Random delay
        snowflake.style.animationDelay = `${Math.random() * 5}s`;
        
        snowContainer.appendChild(snowflake);
    }
}

// Create snow when the page loads
window.addEventListener('load', createSnow); 