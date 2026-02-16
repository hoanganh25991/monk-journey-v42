import { UIComponent } from '../UIComponent.js';
import { JOYSTICK } from '../config/input.js';

/**
 * Virtual Joystick UI component
 * Provides touch controls for mobile devices
 */
export class VirtualJoystickUI extends UIComponent {
    /**
     * Create a new VirtualJoystickUI component
     * @param {Object} game - Reference to the game instance
     */
    constructor(game) {
        super('virtual-joystick-container', game);
        this.joystickBase = null;
        this.joystickHandle = null;
        
        // Initialize joystick state
        this.joystickState = {
            active: false,
            touchId: null,  // Track which touch owns the joystick (for multi-touch: joystick + skill)
            centerX: 0,
            centerY: 0,
            currentX: 0,
            currentY: 0,
            direction: { x: 0, y: 0 }
        };
    }
    
    /**
     * Initialize the component
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        // Get joystick configuration from INPUT_CONFIG
        const joystickConfig = JOYSTICK;
        const sizeMultiplier = joystickConfig.sizeMultiplier;
        const baseSize = joystickConfig.baseSize;
        const handleSize = joystickConfig.handleSize;
        
        // Apply size multiplier to joystick container
        const scaledBaseSize = baseSize * sizeMultiplier;
        this.container.style.width = `${scaledBaseSize}px`;
        this.container.style.height = `${scaledBaseSize}px`;
        
        const template = `
            <div id="virtual-joystick-base"></div>
            <div id="virtual-joystick-handle" style="width: ${handleSize * sizeMultiplier}px; height: ${handleSize * sizeMultiplier}px;"></div>
        `;
        
        // Render the template
        this.render(template);
        
        // Store references to elements we need to update
        this.joystickBase = document.getElementById('virtual-joystick-base');
        this.joystickHandle = document.getElementById('virtual-joystick-handle');
        
        // Set up touch event listeners
        this.setupJoystickEvents();
        
        return true;
    }
    
    /**
     * Set up joystick event listeners
     */
    setupJoystickEvents() {
        // Touch start event
        // Use changedTouches (not touches[0]) - when holding skill on right, touches[0] is the
        // skill finger; we need the touch that just landed on the joystick
        // passive: false is REQUIRED on real Android - without it, preventDefault() is ignored
        // and Chrome fires touchcancel ~200ms later, killing joystick movement
        this.container.addEventListener('touchstart', (event) => {
            event.preventDefault();
            if (event.changedTouches.length > 0) {
                const touch = event.changedTouches[0];
                this.handleJoystickStart(touch.clientX, touch.clientY, touch.identifier);
            }
        }, { passive: false });
        
        // Mouse down event (for testing on desktop)
        this.container.addEventListener('mousedown', (event) => {
            event.preventDefault();
            this.handleJoystickStart(event.clientX, event.clientY);
            
            // Add global mouse move and up events
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
        });
        
        // Touch move event
        // Use targetTouches (not touches[0]) - ensures we use the touch on the joystick when holding skill
        // passive: false required so preventDefault() works on real Android
        this.container.addEventListener('touchmove', (event) => {
            event.preventDefault();
            if (this.joystickState.active && event.targetTouches.length > 0) {
                const touch = this.findJoystickTouch(event.targetTouches);
                if (touch) {
                    this.handleJoystickMove(touch.clientX, touch.clientY);
                }
            }
        }, { passive: false });
        
        // Touch end event - only end if our tracked touch lifted
        this.container.addEventListener('touchend', (event) => {
            event.preventDefault();
            if (this.isJoystickTouchEnded(event.changedTouches)) {
                this.handleJoystickEnd();
            }
        }, { passive: false });
        
        // Touch cancel event
        this.container.addEventListener('touchcancel', (event) => {
            event.preventDefault();
            if (this.isJoystickTouchEnded(event.changedTouches)) {
                this.handleJoystickEnd();
            }
        }, { passive: false });
        
        // Mouse move handler (defined as property to allow removal)
        this.handleMouseMove = (event) => {
            event.preventDefault();
            if (this.joystickState.active) {
                this.handleJoystickMove(event.clientX, event.clientY);
            }
        };
        
        // Mouse up handler (defined as property to allow removal)
        this.handleMouseUp = (event) => {
            event.preventDefault();
            this.handleJoystickEnd();
            
            // Remove global mouse move and up events
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('mouseup', this.handleMouseUp);
        };
    }
    
    /**
     * Handle joystick start event
     * @param {number} clientX - X position of touch/mouse
     * @param {number} clientY - Y position of touch/mouse
     * @param {number} [touchId] - Touch identifier (for multi-touch; null for mouse)
     */
    handleJoystickStart(clientX, clientY, touchId = null) {
        // Get joystick container position
        const rect = this.container.getBoundingClientRect();
        
        // Set joystick state
        this.joystickState.active = true;
        this.joystickState.touchId = touchId;
        this.joystickState.centerX = rect.left + rect.width / 2;
        this.joystickState.centerY = rect.top + rect.height / 2;
        
        // Update joystick position
        this.handleJoystickMove(clientX, clientY);
    }

    /**
     * Find our tracked touch in a TouchList (for multi-touch: joystick + skill)
     * @param {TouchList} touchList - targetTouches or similar
     * @returns {Touch|null}
     */
    findJoystickTouch(touchList) {
        if (this.joystickState.touchId === null) {
            return touchList[0] || null;
        }
        return Array.from(touchList).find(t => t.identifier === this.joystickState.touchId) || null;
    }

    /**
     * Check if our tracked touch ended in changedTouches
     * @param {TouchList} changedTouches
     * @returns {boolean}
     */
    isJoystickTouchEnded(changedTouches) {
        if (this.joystickState.touchId === null) {
            return changedTouches.length > 0;
        }
        return Array.from(changedTouches).some(t => t.identifier === this.joystickState.touchId);
    }
    
    /**
     * Handle joystick move event
     * @param {number} clientX - X position of touch/mouse
     * @param {number} clientY - Y position of touch/mouse
     */
    handleJoystickMove(clientX, clientY) {
        if (!this.joystickState.active) return;
        
        // Calculate distance from center
        const deltaX = clientX - this.joystickState.centerX;
        const deltaY = clientY - this.joystickState.centerY;
        
        // Calculate distance
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Get joystick container radius
        const rect = this.container.getBoundingClientRect();
        const radius = rect.width / 2;
        
        // Limit distance to radius
        const limitedDistance = Math.min(distance, radius);
        
        // Calculate normalized direction
        const normalizedX = deltaX / distance;
        const normalizedY = deltaY / distance;
        
        // Calculate new position
        const newX = normalizedX * limitedDistance;
        const newY = normalizedY * limitedDistance;
        
        // Update joystick handle position
        this.joystickHandle.style.transform = `translate(calc(-50% + ${newX}px), calc(-50% + ${newY}px))`;
        
        // Update joystick state
        this.joystickState.currentX = newX;
        this.joystickState.currentY = newY;
        
        // Update direction (normalized)
        this.joystickState.direction = {
            x: newX / radius,
            y: newY / radius
        };
    }
    
    /**
     * Handle joystick end event
     */
    handleJoystickEnd() {
        // Reset joystick state
        this.joystickState.active = false;
        this.joystickState.touchId = null;
        this.joystickState.direction = { x: 0, y: 0 };
        
        // Reset joystick handle position
        this.joystickHandle.style.transform = 'translate(-50%, -50%)';
    }
    
    /**
     * Get the current joystick direction
     * @returns {Object} - Direction vector {x, y}
     */
    getJoystickDirection() {
        return this.joystickState.direction;
    }
}