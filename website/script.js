document.addEventListener('DOMContentLoaded', () => {
    const snowContainer = document.querySelector('.snow-container');
    
    function createSnowflake() {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake';
        
        // Random size between 2 and 4 pixels for thinner snow
        const size = Math.random() * 2 + 2;
        snowflake.style.width = `${size}px`;
        snowflake.style.height = `${size}px`;
        
        // Random position across the entire width
        snowflake.style.left = `${Math.random() * 100}%`;
        
        // Random starting position from top (some start below the top)
        snowflake.style.top = `${Math.random() * -15}%`;
        
        // Random animation duration between 3 and 8 seconds for faster falling
        const duration = Math.random() * 5 + 3;
        snowflake.style.animationDuration = `${duration}s`;
        
        // Random delay for more natural appearance
        snowflake.style.animationDelay = `${Math.random() * 2}s`;
        
        // Random opacity for depth effect
        snowflake.style.opacity = Math.random() * 0.5 + 0.1;
        
        snowContainer.appendChild(snowflake);
        
        // Remove snowflake after animation completes
        setTimeout(() => {
            snowflake.remove();
        }, duration * 1000);
    }
    
    // Create more initial snowflakes
    for (let i = 0; i < 250; i++) {
        createSnowflake();
    }
    
    // Create multiple snowflakes per interval
    setInterval(() => {
        for (let i = 0; i < 3; i++) {
            createSnowflake();
        }
    }, 50);
}); 