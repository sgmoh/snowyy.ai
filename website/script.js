// Snow animation
function createSnow() {
    const snowContainer = document.querySelector('.snow-container');
    const snowflakeCount = 555; // Increased to 555 snowflakes

    for (let i = 0; i < snowflakeCount; i++) {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snow');
        
        // Smaller size between 2px and 6px
        const size = Math.random() * 4 + 2;
        snowflake.style.width = `${size}px`;
        snowflake.style.height = `${size}px`;
        
        // Random position across the entire screen
        snowflake.style.left = `${Math.random() * 100}%`;
        snowflake.style.top = `${Math.random() * 100}%`; // Start from random vertical position
        
        // Faster animation duration between 3s and 8s
        const duration = Math.random() * 5 + 3;
        snowflake.style.animationDuration = `${duration}s`;
        
        // Random delay
        snowflake.style.animationDelay = `${Math.random() * 2}s`;
        
        // Random opacity for depth
        snowflake.style.opacity = Math.random() * 0.7 + 0.3;
        
        snowContainer.appendChild(snowflake);
    }
}

// Create snow when the page loads
window.addEventListener('load', createSnow);

// Create new snowflakes periodically
setInterval(() => {
    const snowContainer = document.querySelector('.snow-container');
    // Create 3 snowflakes at once
    for (let i = 0; i < 3; i++) {
        const snowflake = document.createElement('div');
        snowflake.classList.add('snow');
        
        // Smaller size between 2px and 6px
        const size = Math.random() * 4 + 2;
        snowflake.style.width = `${size}px`;
        snowflake.style.height = `${size}px`;
        
        // Random position across the entire screen
        snowflake.style.left = `${Math.random() * 100}%`;
        snowflake.style.top = `${Math.random() * 100}%`;
        
        // Faster animation duration between 3s and 8s
        const duration = Math.random() * 5 + 3;
        snowflake.style.animationDuration = `${duration}s`;
        
        // Random opacity for depth
        snowflake.style.opacity = Math.random() * 0.7 + 0.3;
        
        snowContainer.appendChild(snowflake);
        
        // Remove snowflake after animation completes
        setTimeout(() => {
            snowflake.remove();
        }, duration * 1000);
    }
}, 50); // Create new snowflakes every 50ms (faster) 