/* ================= ORDER JOURNEY ANIMATION - APP.JS ================= */

// State Machine
const states = [
    "idle",      // 0 - Initial state
    "walk",      // 1 - Boy walks to box
    "pickup",    // 2 - Boy picks up box
    "load",      // 3 - Places box in van
    "close",     // 4 - Van door closes
    "drive",     // 5 - Van moves out
    "done"       // 6 - Show CTA
];

let currentState = 0;
let isAnimating = false;

// DOM Elements
const stage = document.querySelector('.animation-stage');
const boy = document.getElementById('deliveryBoy');
const box = document.getElementById('packageBox');
const van = document.getElementById('deliveryVan');
const message = document.getElementById('messageText');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const cta = document.getElementById('journeyCTA');

// Messages for each state
const stateMessages = {
    idle: "Click Start to begin the journey!",
    walk: "Delivery boy heading to pick up your order...",
    pickup: "Carefully picking up your package...",
    load: "Loading package into delivery van...",
    close: "Securing the package safely...",
    drive: "On the way to your doorstep!",
    done: "Your Order is Packed & Ready!"
};

/* --------------------------------------------------
   MAIN CONTROLLER FUNCTIONS
-------------------------------------------------- */

function startJourney() {
    if (isAnimating) return;

    isAnimating = true;
    currentState = 0;

    // Hide start button, show reset
    startBtn.style.display = 'none';
    resetBtn.style.display = 'inline-flex';

    // Hide CTA if visible
    cta.style.display = 'none';

    // Start the animation sequence
    nextStep();
}

function nextStep() {
    if (currentState >= states.length) {
        isAnimating = false;
        return;
    }

    const state = states[currentState];

    // Update message
    updateMessage(stateMessages[state]);

    // Execute state action
    executeState(state);

    currentState++;
}

function executeState(state) {
    // Remove all state classes
    stage.classList.remove('state-walk', 'state-pickup', 'state-load', 'state-close', 'state-drive');

    switch (state) {
        case 'idle':
            setTimeout(() => nextStep(), 1000);
            break;

        case 'walk':
            // Add walking animation class
            stage.classList.add('state-walk');

            // Move boy to box position
            animateBoyWalk();

            setTimeout(() => nextStep(), 2500);
            break;

        case 'pickup':
            // Remove walking animation
            stage.classList.remove('state-walk');

            // Add pickup animation
            stage.classList.add('state-pickup');

            // Boy bends down animation
            boy.style.transform = 'scaleY(0.9)';

            setTimeout(() => {
                boy.style.transform = 'scaleY(1)';
                nextStep();
            }, 1500);
            break;

        case 'load':
            // Boy walks to van with box
            stage.classList.add('state-walk');
            stage.classList.add('state-load');

            // Move boy to van
            animateBoyToVan();

            setTimeout(() => nextStep(), 2000);
            break;

        case 'close':
            // Remove walking
            stage.classList.remove('state-walk', 'state-load');

            // Close van door
            stage.classList.add('state-close');

            setTimeout(() => nextStep(), 1000);
            break;

        case 'drive':
            // Van drives away
            stage.classList.add('state-drive');

            setTimeout(() => nextStep(), 3500);
            break;

        case 'done':
            // Show CTA
            showCTA();
            isAnimating = false;
            break;
    }
}

/* --------------------------------------------------
   ANIMATION HELPERS
-------------------------------------------------- */

function animateBoyWalk() {
    // Move boy from shop to box
    let position = 220;
    const target = 400;
    const speed = 3;

    const walkInterval = setInterval(() => {
        position += speed;
        boy.style.left = position + 'px';

        if (position >= target) {
            clearInterval(walkInterval);
        }
    }, 16); // 60fps
}

function animateBoyToVan() {
    // Move boy from box to van
    let position = parseInt(boy.style.left) || 400;
    const target = window.innerWidth > 768 ? 700 : 500;
    const speed = 4;

    const walkInterval = setInterval(() => {
        position += speed;
        boy.style.left = position + 'px';

        if (position >= target) {
            clearInterval(walkInterval);
        }
    }, 16); // 60fps
}

function updateMessage(text) {
    message.style.opacity = '0';

    setTimeout(() => {
        message.textContent = text;
        message.style.opacity = '1';
    }, 300);
}

function showCTA() {
    cta.style.display = 'block';

    // Confetti effect (optional)
    createConfetti();
}

function createConfetti() {
    const colors = ['#ff8c00', '#22c55e', '#3b82f6', '#fbbf24', '#ec4899'];

    for (let i = 0; i < 30; i++) {
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.left = Math.random() * 100 + '%';
        confetti.style.top = '-10px';
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';

        document.body.appendChild(confetti);

        const fallDuration = 2 + Math.random() * 2;
        const sway = (Math.random() - 0.5) * 200;

        confetti.animate([
            { transform: 'translateY(0) translateX(0) rotate(0deg)', opacity: 1 },
            { transform: `translateY(${window.innerHeight}px) translateX(${sway}px) rotate(${Math.random() * 360}deg)`, opacity: 0 }
        ], {
            duration: fallDuration * 1000,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        });

        setTimeout(() => confetti.remove(), fallDuration * 1000);
    }
}

/* --------------------------------------------------
   RESET FUNCTION
-------------------------------------------------- */

function resetJourney() {
    // Stop any ongoing animations
    isAnimating = false;
    currentState = 0;

    // Remove all state classes
    stage.classList.remove('state-walk', 'state-pickup', 'state-load', 'state-close', 'state-drive');

    // Reset positions
    boy.style.left = '220px';
    boy.style.transform = 'scaleY(1)';
    box.style.left = '450px';
    van.style.right = '100px';

    // Reset message
    updateMessage(stateMessages.idle);

    // Hide CTA
    cta.style.display = 'none';

    // Show start button, hide reset
    startBtn.style.display = 'inline-flex';
    resetBtn.style.display = 'none';
}

/* --------------------------------------------------
   AUTO-PLAY ON SCROLL (OPTIONAL)
-------------------------------------------------- */

function checkScrollTrigger() {
    const section = document.getElementById('orderJourney');
    if (!section) return;

    const rect = section.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

    if (isVisible && !isAnimating && currentState === 0) {
        // Auto-start once when scrolled into view
        setTimeout(() => {
            if (!isAnimating) {
                startJourney();
            }
        }, 500);
    }
}

// Optional: Auto-play on scroll (uncomment to enable)
// window.addEventListener('scroll', checkScrollTrigger);
// window.addEventListener('load', checkScrollTrigger);

/* --------------------------------------------------
   MOBILE TAP TO START
-------------------------------------------------- */

if (window.innerWidth <= 768) {
    stage.addEventListener('click', function () {
        if (!isAnimating && currentState === 0) {
            startJourney();
        }
    });
}

/* --------------------------------------------------
   INITIALIZATION
-------------------------------------------------- */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Order Journey Animation Loaded!');

    // Set initial message
    updateMessage(stateMessages.idle);

    // Optional: Auto-play after 2 seconds
    // setTimeout(() => startJourney(), 2000);
});

/* --------------------------------------------------
   PERFORMANCE OPTIMIZATION
-------------------------------------------------- */

// Lazy load section (if needed)
if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('loaded');
            }
        });
    }, {
        threshold: 0.1
    });

    const section = document.getElementById('orderJourney');
    if (section) {
        observer.observe(section);
    }
}

// Prevent animation jank on resize
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        if (!isAnimating) {
            resetJourney();
        }
    }, 250);
});
