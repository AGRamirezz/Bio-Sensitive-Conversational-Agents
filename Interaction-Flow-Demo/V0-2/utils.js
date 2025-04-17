/**
 * utils.js
 *
 * Contains general utility functions used across the application.
 */

// --- Pulse Effect Functions ---

/**
 * Adds a visual pulse effect to a global array.
 * Relies on a global `pulseEffects` array.
 * @param {number} x X position of the rectangle center for the pulse.
 * @param {number} y Y position of the rectangle center for the pulse.
 * @param {number} startRadius Initial size factor (e.g., 0).
 * @param {number} endRadius Final size factor (e.g., 20).
 * @param {number} duration Duration in milliseconds.
 * @param {p5.Color} pulseColor The color of the pulse effect.
 */
function addPulseEffect(x, y, startRadius, endRadius, duration, pulseColor) {
  // Ensure pulseEffects array exists globally
  if (typeof pulseEffects === 'undefined') {
      console.error("pulseEffects array is not defined globally.");
      return;
  }
  pulseEffects.push({
    x: x,
    y: y,
    startTime: millis(),
    startRadius: startRadius,
    endRadius: endRadius,
    duration: duration,
    color: pulseColor
  });
}

/**
 * Updates the state of all active pulse effects (e.g., fades them out).
 * Relies on a global `pulseEffects` array.
 * Should be called once per frame in the main draw loop.
 */
function updatePulseEffects() {
  // Ensure pulseEffects array exists globally
  if (typeof pulseEffects === 'undefined') {
    // console.warn("pulseEffects array is not defined globally. Skipping update.");
    return; // Silently return if not defined
  }
  let currentTime = millis();
  // Filter out expired effects
  pulseEffects = pulseEffects.filter(effect => currentTime < effect.startTime + effect.duration);
}

/**
 * Draws all active pulse effects onto the main canvas.
 * Relies on a global `pulseEffects` array.
 * Should be called in the main draw loop after background is drawn.
 */
function drawPulseEffects() {
    // Ensure pulseEffects array exists globally
    if (typeof pulseEffects === 'undefined') {
        return; // Silently return if not defined
    }

    let currentTime = millis();
    noFill();
    strokeWeight(2); // Constant stroke weight for simplicity

    pulseEffects.forEach(effect => {
        let elapsed = currentTime - effect.startTime;
        let progress = constrain(elapsed / effect.duration, 0, 1); // Ensure progress stays between 0 and 1

        // Interpolate radius and alpha
        let currentRadius = lerp(effect.startRadius, effect.endRadius, progress);
        let currentAlpha = lerp(255, 0, progress); // Fade out alpha

        // Ensure color object is valid before accessing levels
        let pulseColor;
        if (effect.color && typeof effect.color.setAlpha === 'function') {
             pulseColor = color(red(effect.color), green(effect.color), blue(effect.color)); // Create base color
             pulseColor.setAlpha(currentAlpha); // Set interpolated alpha
        } else {
             pulseColor = color(255, 255, 255, currentAlpha); // Default white if color is invalid
        }

        stroke(pulseColor);
        // Draw an ellipse centered at the effect's x, y
        ellipse(effect.x, effect.y, currentRadius * 2, currentRadius * 2);
    });
}

// --- Formatting Functions ---

/**
 * Formats a timestamp (milliseconds since epoch) into HH:MM string.
 * @param {number} timestamp Milliseconds since epoch.
 * @returns {string} Formatted time string or empty string if timestamp is invalid.
 */
function formatTimestamp(timestamp) {
  if (!timestamp || typeof timestamp !== 'number') return "";
  const date = new Date(timestamp);
  // Check if date is valid before formatting
  if (isNaN(date.getHours())) return "";
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

// --- Other Utility Functions can be added below ---
