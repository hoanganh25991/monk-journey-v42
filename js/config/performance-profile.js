/**
 * Performance Profile Configuration
 *
 * Simple switch: normal | minimal
 * Minimal mode targets low-end tablets for smooth 60 FPS (vs ~20 FPS on normal).
 *
 * Based on optimizations from ENTITIES-LOAD-OPTIMIZATION-PLAN and PERFORMANCE-ENHANCEMENT-PLAN.
 */

/**
 * Terrain resolution by distance (chunks from player)
 * Lower resolution = fewer vertices = better performance
 */
export const TERRAIN_LOD = {
    normal: {
        nearResolution: 24,
        midResolution: 16,
        farResolution: 12,
        bufferResolution: 8
    },
    minimal: {
        nearResolution: 12,
        midResolution: 8,
        farResolution: 6,
        bufferResolution: 4
    }
};

/**
 * View distance in chunks - fewer chunks = less geometry
 */
export const VIEW_DISTANCE = {
    normal: 3,
    minimal: 2
};

/**
 * Buffer distance (chunks pre-generated ahead of player)
 */
export const BUFFER_DISTANCE = {
    normal: 5,
    minimal: 3
};

/**
 * Max chunks to process per frame - lower = smoother on weak devices
 */
export const CHUNKS_PER_FRAME = {
    normal: 2,
    minimal: 1
};

/**
 * Environment object count multiplier per chunk (0–1)
 */
export const ENVIRONMENT_DENSITY_MULTIPLIER = {
    normal: 1.0,
    minimal: 0.25
};

/**
 * Structure probability multiplier (0–1)
 */
export const STRUCTURE_DENSITY_MULTIPLIER = {
    normal: 1.0,
    minimal: 0.2
};

/**
 * Max structure chunks generated per frame
 */
export const STRUCTURE_CHUNKS_PER_FRAME = {
    normal: 2,
    minimal: 1
};

/**
 * Max environment chunks generated per frame
 */
export const ENV_CHUNKS_PER_FRAME = {
    normal: 2,
    minimal: 1
};

/**
 * Shadow casting - disable for minimal (biggest GPU win)
 */
export const SHADOW_CASTER_DISTANCE = {
    normal: Infinity,
    minimal: 0
};

/**
 * Get profile config for minimal mode
 * @param {boolean} isMinimal - Whether minimal mode is enabled
 * @returns {Object} Merged profile config
 */
export function getPerformanceProfile(isMinimal) {
    const level = isMinimal ? 'minimal' : 'normal';
    return {
        terrainLod: TERRAIN_LOD[level],
        viewDistance: VIEW_DISTANCE[level],
        bufferDistance: BUFFER_DISTANCE[level],
        chunksPerFrame: CHUNKS_PER_FRAME[level],
        environmentDensity: ENVIRONMENT_DENSITY_MULTIPLIER[level],
        structureDensity: STRUCTURE_DENSITY_MULTIPLIER[level],
        structureChunksPerFrame: STRUCTURE_CHUNKS_PER_FRAME[level],
        envChunksPerFrame: ENV_CHUNKS_PER_FRAME[level],
        shadowCasterDistance: SHADOW_CASTER_DISTANCE[level]
    };
}
