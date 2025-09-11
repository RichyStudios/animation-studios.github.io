// STUNNING VISUAL EFFECTS JAVASCRIPT

// Create floating particles
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    
    for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 8 + 's';
        particle.style.animationDuration = (Math.random() * 3 + 5) + 's';
        particlesContainer.appendChild(particle);
    }
}

// Create matrix rain effect
function createMatrixRain() {
    const matrixContainer = document.getElementById('matrixRain');
    const chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    
    for (let i = 0; i < 100; i++) {
        const char = document.createElement('div');
        char.className = 'matrix-char';
        char.textContent = chars[Math.floor(Math.random() * chars.length)];
        char.style.left = Math.random() * 100 + '%';
        char.style.animationDelay = Math.random() * 3 + 's';
        char.style.animationDuration = (Math.random() * 2 + 2) + 's';
        matrixContainer.appendChild(char);
    }
}

// Add click ripple effect
function addRippleEffect() {
    document.addEventListener('click', function(e) {
        const ripple = document.createElement('div');
        ripple.style.position = 'fixed';
        ripple.style.left = e.clientX + 'px';
        ripple.style.top = e.clientY + 'px';
        ripple.style.width = '0px';
        ripple.style.height = '0px';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(0, 255, 255, 0.5)';
        ripple.style.transform = 'translate(-50%, -50%)';
        ripple.style.animation = 'rippleEffect 0.6s ease-out';
        ripple.style.pointerEvents = 'none';
        ripple.style.zIndex = '9999';
        
        document.body.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
}

// Add CSS for ripple effect
const rippleCSS = `
@keyframes rippleEffect {
    0% {
        width: 0px;
        height: 0px;
        opacity: 1;
    }
    100% {
        width: 200px;
        height: 200px;
        opacity: 0;
    }
}
`;

// Add hover sound effects (visual feedback)
function addHoverEffects() {
    const buttons = document.querySelectorAll('.menu-btn, .tool-btn, .action-btn, .playback-btn');
    
    buttons.forEach(button => {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-3px) scale(1.05)';
            this.style.filter = 'brightness(1.2)';
            
            // Create sparkle effect
            for (let i = 0; i < 5; i++) {
                const sparkle = document.createElement('div');
                sparkle.style.position = 'absolute';
                sparkle.style.width = '4px';
                sparkle.style.height = '4px';
                sparkle.style.background = '#00ffff';
                sparkle.style.borderRadius = '50%';
                sparkle.style.pointerEvents = 'none';
                sparkle.style.left = Math.random() * this.offsetWidth + 'px';
                sparkle.style.top = Math.random() * this.offsetHeight + 'px';
                sparkle.style.animation = 'sparkleFloat 1s ease-out forwards';
                sparkle.style.boxShadow = '0 0 6px #00ffff';
                
                this.appendChild(sparkle);
                
                setTimeout(() => sparkle.remove(), 1000);
            }
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = '';
            this.style.filter = '';
        });
    });
}

// Pulsing background effect
function addPulsingBackground() {
    let hue = 0;
    setInterval(() => {
        hue = (hue + 1) % 360;
        document.body.style.filter = `hue-rotate(${hue}deg)`;
    }, 100);
}

// Initialize all effects
document.addEventListener('DOMContentLoaded', function() {
    // Add ripple CSS
    const style = document.createElement('style');
    style.textContent = rippleCSS;
    document.head.appendChild(style);
    
    // Initialize effects
    createParticles();
    createMatrixRain();
    addRippleEffect();
    addHoverEffects();
    
    // Add glowing cursor trail
    let mouseTrail = [];
    document.addEventListener('mousemove', function(e) {
        const trail = document.createElement('div');
        trail.style.position = 'fixed';
        trail.style.left = e.clientX + 'px';
        trail.style.top = e.clientY + 'px';
        trail.style.width = '6px';
        trail.style.height = '6px';
        trail.style.background = '#00ffff';
        trail.style.borderRadius = '50%';
        trail.style.pointerEvents = 'none';
        trail.style.zIndex = '9998';
        trail.style.boxShadow = '0 0 10px #00ffff';
        trail.style.animation = 'trailFade 0.5s ease-out forwards';
        
        document.body.appendChild(trail);
        mouseTrail.push(trail);
        
        if (mouseTrail.length > 10) {
            const oldTrail = mouseTrail.shift();
            oldTrail.remove();
        }
        
        setTimeout(() => trail.remove(), 500);
    });
    
    // Add trail fade animation
    const trailCSS = `
    @keyframes trailFade {
        0% { opacity: 1; transform: scale(1); }
        100% { opacity: 0; transform: scale(0); }
    }
    `;
    style.textContent += trailCSS;
});

// Screen shake effect for dramatic actions
function screenShake() {
    document.body.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        document.body.style.animation = '';
    }, 500);
}

// Add shake CSS
const shakeCSS = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
    20%, 40%, 60%, 80% { transform: translateX(2px); }
}
`;

// Add to existing style
document.addEventListener('DOMContentLoaded', function() {
    const existingStyle = document.querySelector('style') || document.createElement('style');
    existingStyle.textContent += shakeCSS;
    if (!document.querySelector('style')) {
        document.head.appendChild(existingStyle);
    }
});