/**
 * GameplayTab.js
 * Manages the gameplay settings tab UI component
 */

import { SettingsTab } from './SettingsTab.js';
import { STORAGE_KEYS } from '../../config/storage-keys.js';
import { DIFFICULTY_SCALING } from '../../config/game-balance.js';

export class GameplayTab extends SettingsTab {
    /**
     * Create a gameplay settings tab
     * @param {import('../../game/Game.js').Game} game - The game instance
     * @param {SettingsMenu} settingsMenu - The parent settings menu
     */
    constructor(game, settingsMenu) {
        super('game', game, settingsMenu);
        
        // Game settings elements
        this.difficultySelect = document.getElementById('difficulty-select');
        this.customSkillsCheckbox = document.getElementById('custom-skills-checkbox');
        
        // Camera settings
        this.cameraZoomSlider = document.getElementById('camera-zoom-slider');
        this.cameraZoomValue = document.getElementById('camera-zoom-value');
        
        // New Game button
        this.newGameButton = document.getElementById('new-game-button');

        // Performance settings (merged from PerformanceTab)
        this.minimalModeCheckbox = document.getElementById('minimal-mode-checkbox');
        this.fpsSlider = document.getElementById('fps-slider');
        this.fpsValue = document.getElementById('fps-value');
        this.showPerformanceInfoCheckbox = document.getElementById('show-performance-info-checkbox');
        this.debugModeCheckbox = document.getElementById('debug-mode-checkbox');
        this.logEnabledCheckbox = document.getElementById('log-enabled-checkbox');

        this.init();
    }
    
    /**
     * Initialize the gameplay settings
     * @returns {boolean} - True if initialization was successful
     */
    init() {
        this.initializeDifficultySettings();
        this.initializePerformanceSettings();
        return true;
    }

    /**
     * Initialize performance settings (merged from PerformanceTab)
     * @private
     */
    initializePerformanceSettings() {
        if (this.minimalModeCheckbox) {
            const isMinimal = localStorage.getItem(STORAGE_KEYS.MINIMAL_MODE) === 'true';
            this.minimalModeCheckbox.checked = isMinimal;
            this.minimalModeCheckbox.addEventListener('change', () => {
                const isMinimal = this.minimalModeCheckbox.checked;
                localStorage.setItem(STORAGE_KEYS.MINIMAL_MODE, isMinimal.toString());
                localStorage.setItem(STORAGE_KEYS.QUALITY_LEVEL, isMinimal ? 'minimal' : 'ultra');
                if (this.game && this.game.performanceManager) {
                    this.game.performanceManager.applyQualitySettings(isMinimal ? 'minimal' : 'ultra');
                    if (this.game.hudManager && this.game.hudManager.showNotification) {
                        this.game.hudManager.showNotification(
                            isMinimal ? 'Low-end tablet mode enabled — restart game for full effect' : 'Low-end tablet mode disabled — restart game for full effect',
                            3000
                        );
                    }
                }
            });
        }
        if (this.fpsSlider && this.fpsValue) {
            const targetFPS = parseInt(localStorage.getItem(STORAGE_KEYS.TARGET_FPS)) || 60;
            this.fpsSlider.value = targetFPS;
            this.fpsValue.textContent = targetFPS;
            this.fpsSlider.addEventListener('input', () => {
                const value = parseInt(this.fpsSlider.value);
                this.fpsValue.textContent = value;
                localStorage.setItem(STORAGE_KEYS.TARGET_FPS, value);
                if (this.game && this.game.performanceManager) {
                    this.game.performanceManager.setTargetFPS(value);
                }
            });
        }
        if (this.showPerformanceInfoCheckbox) {
            const showPerformanceInfo = localStorage.getItem(STORAGE_KEYS.SHOW_PERFORMANCE_INFO) === 'true';
            this.showPerformanceInfoCheckbox.checked = showPerformanceInfo;
            this.showPerformanceInfoCheckbox.addEventListener('change', () => {
                localStorage.setItem(STORAGE_KEYS.SHOW_PERFORMANCE_INFO, this.showPerformanceInfoCheckbox.checked.toString());
                if (this.game && this.game.performanceManager) {
                    this.game.performanceManager.applyPerformanceInfoVisibility();
                }
            });
        }
        if (this.debugModeCheckbox) {
            const debugMode = localStorage.getItem(STORAGE_KEYS.DEBUG_MODE) === 'true';
            this.debugModeCheckbox.checked = debugMode;
            this.debugModeCheckbox.addEventListener('change', () => {
                localStorage.setItem(STORAGE_KEYS.DEBUG_MODE, this.debugModeCheckbox.checked);
                if (this.game) this.game.debugMode = this.debugModeCheckbox.checked;
            });
        }
        if (this.logEnabledCheckbox) {
            const logEnabled = localStorage.getItem(STORAGE_KEYS.LOG_ENABLED) === 'true';
            this.logEnabledCheckbox.checked = logEnabled;
            this.logEnabledCheckbox.addEventListener('change', () => {
                localStorage.setItem(STORAGE_KEYS.LOG_ENABLED, this.logEnabledCheckbox.checked);
            });
        }
    }
    
    /**
     * Initialize difficulty settings
     * @private
     */
    initializeDifficultySettings() {
        if (this.difficultySelect) {
            // Clear existing options
            while (this.difficultySelect.options.length > 0) {
                this.difficultySelect.remove(0);
            }
            
            // Add difficulty options from DIFFICULTY_SCALING.difficultyLevels
            for (const [key, settings] of Object.entries(DIFFICULTY_SCALING.difficultyLevels)) {
                const option = document.createElement('option');
                option.value = key;
                option.textContent = settings.name;
                this.difficultySelect.appendChild(option);
            }
            
            // Set current difficulty (default to 'basic')
            const currentDifficulty = localStorage.getItem(STORAGE_KEYS.DIFFICULTY) || 'basic';
            console.debug(`Loading difficulty setting: ${currentDifficulty}`);
            this.difficultySelect.value = currentDifficulty;
            
            // If the value wasn't set correctly (e.g., if the stored value is invalid),
            // explicitly set it to 'basic'
            if (!this.difficultySelect.value) {
                console.debug('Invalid difficulty setting detected, defaulting to basic');
                this.difficultySelect.value = 'basic';
                localStorage.setItem(STORAGE_KEYS.DIFFICULTY, 'basic');
            }
            
            // Add change event listener
            this.difficultySelect.addEventListener('change', () => {
                const selectedDifficulty = this.difficultySelect.value;
                localStorage.setItem(STORAGE_KEYS.DIFFICULTY, selectedDifficulty);
                
                // Apply difficulty settings immediately if game is available
                if (this.game && this.game.enemyManager) {
                    this.game.enemyManager.setDifficulty(selectedDifficulty);
                    
                    // Show notification if HUD manager is available
                    if (this.game.hudManager) {
                        const difficultyName = DIFFICULTY_SCALING.difficultyLevels[selectedDifficulty].name;
                        this.game.hudManager.showNotification(`Difficulty changed to ${difficultyName}`);
                    }
                }
            });
        }
        
        if (this.customSkillsCheckbox) {
            // Set current custom skills state (default is false)
            const customSkillsEnabled = localStorage.getItem(STORAGE_KEYS.CUSTOM_SKILLS) === 'true';
            this.customSkillsCheckbox.checked = customSkillsEnabled;
            
            // Add change event listener
            this.customSkillsCheckbox.addEventListener('change', () => {
                localStorage.setItem(STORAGE_KEYS.CUSTOM_SKILLS, this.customSkillsCheckbox.checked);
                
                // Apply custom skills settings immediately if game is available
                if (this.game && this.game.player && this.game.player.skills) {
                    this.game.player.skills.updateCustomSkillsVisibility();
                }
            });
        }
        
        // Initialize camera zoom slider if it exists
        if (this.cameraZoomSlider) {
            // Set min, max and default values
            this.cameraZoomSlider.min = 10;  // Closest zoom (10 units)
            this.cameraZoomSlider.max = 100;  // Furthest zoom (100 units)
            this.cameraZoomSlider.step = 1;  // 1 unit increments
            
            // Get stored zoom value or use default
            const storedZoom = localStorage.getItem(STORAGE_KEYS.CAMERA_ZOOM);
            const defaultZoom = 20; // Default camera distance
            const currentZoom = storedZoom ? parseInt(storedZoom) : defaultZoom;
            
            // Set the slider to the current zoom value
            this.cameraZoomSlider.value = currentZoom;
            
            // Update the display value
            if (this.cameraZoomValue) {
                this.cameraZoomValue.textContent = currentZoom;
            }
            
            // Add event listener for zoom changes
            this.cameraZoomSlider.addEventListener('input', () => {
                const zoomValue = parseInt(this.cameraZoomSlider.value);
                
                // Update the display value
                if (this.cameraZoomValue) {
                    this.cameraZoomValue.textContent = zoomValue;
                }
                
                // Store the zoom value
                localStorage.setItem(STORAGE_KEYS.CAMERA_ZOOM, zoomValue);
                
                // Apply zoom immediately if game is available
                if (this.game && this.game.hudManager && this.game.hudManager.components && this.game.hudManager.components.cameraControlUI) {
                    // Use the new setCameraDistance method
                    this.game.hudManager.components.cameraControlUI.setCameraDistance(zoomValue);
                }
            });
        }
        
        // Initialize New Game button if it exists
        if (this.newGameButton) {
            this.newGameButton.addEventListener('click', () => {
                // Confirm before starting a new game
                if (confirm('Are you sure you want to start a new game? Your current progress will be lost.')) {
                    // Close the settings menu
                    if (this.settingsMenu) {
                        this.settingsMenu.hide();
                    }
                    
                    // Start a new game
                    if (this.game) {
                        console.debug('Starting a new game...');
                        
                        // First, delete all player state data from localStorage
                        if (this.game.saveManager) {
                            console.debug('Removing player state data from localStorage...');
                            const saveDeleted = this.game.saveManager.deleteSave();
                            if (saveDeleted) {
                                console.debug('Player state data successfully removed');
                            } else {
                                console.warn('Failed to remove player state data');
                            }
                        }
                        
                        window.location.reload();
                    }
                }
            });
        }
    }
    
    /**
     * Save the gameplay settings
     */
    saveSettings() {
        if (this.difficultySelect) {
            // Save difficulty, defaulting to 'basic' if no valid selection
            const difficulty = this.difficultySelect.value || 'basic';
            localStorage.setItem(STORAGE_KEYS.DIFFICULTY, difficulty);
            
            // Update game difficulty if game is available
            if (this.game) {
                this.game.difficulty = difficulty;
                
                // Apply to enemy manager if available
                if (this.game.enemyManager) {
                    this.game.enemyManager.setDifficulty(difficulty);
                }
            }
        }
        
        if (this.customSkillsCheckbox) {
            localStorage.setItem(STORAGE_KEYS.CUSTOM_SKILLS, this.customSkillsCheckbox.checked);
        }
        
        if (this.cameraZoomSlider) {
            localStorage.setItem(STORAGE_KEYS.CAMERA_ZOOM, this.cameraZoomSlider.value);
        }
        if (this.minimalModeCheckbox) {
            const isMinimal = this.minimalModeCheckbox.checked;
            localStorage.setItem(STORAGE_KEYS.MINIMAL_MODE, isMinimal.toString());
            localStorage.setItem(STORAGE_KEYS.QUALITY_LEVEL, isMinimal ? 'minimal' : 'ultra');
        }
        if (this.fpsSlider) localStorage.setItem(STORAGE_KEYS.TARGET_FPS, this.fpsSlider.value);
        if (this.showPerformanceInfoCheckbox) localStorage.setItem(STORAGE_KEYS.SHOW_PERFORMANCE_INFO, this.showPerformanceInfoCheckbox.checked.toString());
        if (this.debugModeCheckbox) localStorage.setItem(STORAGE_KEYS.DEBUG_MODE, this.debugModeCheckbox.checked);
        if (this.logEnabledCheckbox) localStorage.setItem(STORAGE_KEYS.LOG_ENABLED, this.logEnabledCheckbox.checked);
    }
    
    /**
     * Reset the gameplay settings to defaults
     */
    resetToDefaults() {
        if (this.difficultySelect) {
            this.difficultySelect.value = 'basic';
            console.debug('Reset difficulty to basic');
        }
        
        if (this.customSkillsCheckbox) {
            this.customSkillsCheckbox.checked = false;
        }
        
        if (this.cameraZoomSlider) {
            this.cameraZoomSlider.value = 20;
            if (this.cameraZoomValue) this.cameraZoomValue.textContent = 20;
        }
        if (this.minimalModeCheckbox) this.minimalModeCheckbox.checked = false;
        if (this.fpsSlider && this.fpsValue) {
            this.fpsSlider.value = 60;
            this.fpsValue.textContent = 60;
        }
        if (this.showPerformanceInfoCheckbox) this.showPerformanceInfoCheckbox.checked = false;
        if (this.debugModeCheckbox) this.debugModeCheckbox.checked = false;
        if (this.logEnabledCheckbox) this.logEnabledCheckbox.checked = false;
        this.saveSettings();
    }
}