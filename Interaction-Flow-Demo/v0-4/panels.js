/**
 * panels.js
 *
 * Contains all specific Panel subclass implementations for the UI.
 * Extends the base Panel class defined in ui_components.js.
 */

// --- Helper Function (for EEGPanel) ---
/**
 * Draws a single wave form onto a p5.Graphics buffer.
 * @param {p5.Graphics} g The graphics buffer to draw on.
 * @param {Array<number>} waveData Array of normalized wave data points (-1 to 1).
 * @param {number} x Starting X position within the graphics buffer.
 * @param {number} y Center Y position for the wave within the graphics buffer.
 * @param {number} w Width available for the wave.
 * @param {number} h Maximum height/amplitude range for the wave.
 * @param {p5.Color} waveColor Color of the wave.
 */
function drawWave(g, waveData, x, y, w, h, waveColor) {
    if (!waveData || waveData.length === 0) return;

    g.noFill();
    g.stroke(waveColor);
    // Revert: Use a hardcoded default stroke weight
    const weight = 1.5;
    g.strokeWeight(weight);

    g.beginShape();
    for (let i = 0; i < waveData.length; i++) {
        const waveX = x + map(i, 0, waveData.length - 1, 0, w);
        // Map data value (assuming range -1 to 1) to vertical position
        const waveY = y + map(waveData[i], -1, 1, -h / 2, h / 2);
        g.vertex(waveX, waveY);
    }
    g.endShape();
}


// --- EEG Panel ---
/**
 * Panel for displaying simulated EEG brainwave data.
 */
class EEGPanel extends Panel {
  /**
   * Creates an EEGPanel instance.
   * @param {string} title Panel title.
   * @param {number} x X position.
   * @param {number} y Y position.
   * @param {number} w Width.
   * @param {number} h Height.
   * @param {object} bioSignalDataRef Reference to the global bioSignalData object.
   */
  constructor(title, x, y, w, h, bioSignalDataRef) {
    super(title, x, y, w, h); // Call the base Panel constructor
    this.bioSignalData = bioSignalDataRef; // Store reference to the data source

    // Revert: Define colors for each wave type using hardcoded defaults
    this.waveColors = [
      color(100, 200, 255), // Alpha (Blue)
      color(255, 100, 100),  // Beta (Red)
      color(100, 255, 100), // Theta (Green)
      color(200, 150, 255)  // Delta (Purple)
    ];
    this.waveNames = ["Alpha", "Beta", "Theta", "Delta"];

    // Revert: Constants for layout within the panel's graphics buffer
    this.padding = 15;
    this.labelAreaWidth = 50; // Space for wave name labels
    this.waveAreaMarginTop = 40; // Space below title
    this.waveAreaMarginBottom = 10; // Space above bottom edge
  }

  /**
   * Draws the EEG waves onto the panel's graphics buffer.
   */
  draw() {
    this.drawBase(); // Draw background and title first

    const g = this.graphics; // Use the panel's graphics buffer
    const waveAreaX = this.padding + this.labelAreaWidth;
    const waveAreaY = this.waveAreaMarginTop;
    const waveAreaW = this.w - this.padding * 2 - this.labelAreaWidth;
    const waveAreaH = this.h - this.waveAreaMarginTop - this.waveAreaMarginBottom;
    const numWaves = this.waveNames.length;
    const waveHeight = waveAreaH / numWaves; // Height allocated for each wave

    g.push(); // Isolate drawing styles
    g.translate(waveAreaX, waveAreaY); // Move origin to the wave drawing area

    // Draw each wave
    for (let i = 0; i < numWaves; i++) {
      const waveY = waveHeight * (i + 0.5); // Center Y for this wave
      const waveName = this.waveNames[i];
      const waveData = this.bioSignalData.eeg[waveName.toLowerCase()]; // Get data array
      const waveColor = this.waveColors[i];

      // Draw wave name label
      g.fill(this.textColor); // Use panel's text color
      g.textAlign(RIGHT, CENTER);
      g.textSize(12); // Example size
      g.text(waveName, -this.padding / 2, waveY); // Position label to the left

      // Draw the wave form itself
      // Pass the available width and half the allocated height (for amplitude)
      drawWave(g, waveData, 0, waveY, waveAreaW, waveHeight * 0.8, waveColor);
    }

    g.pop(); // Restore previous drawing styles/transformations
  }

  /**
   * Overrides the base Panel's drawBase method to custom position the title.
   * This helps avoid overlap with the toggle button and demo indicator.
   */
  drawBase() {
    // Skip the parent class's implementation to have full control
    // Create our own version without calling super.drawBase()
    
    const g = this.graphics;
    
    // Clear previous frame and draw background
    g.clear();
    g.fill(30, 30, 40, 240); // Default panel background color
    g.noStroke();
    g.rect(0, 0, this.w, this.h, 8); // Panel rounding

    // Draw title if it exists - but centered to avoid both button and demo indicator
    if (this.title) {
      g.fill(220); // Light text color
      g.textSize(14);
      g.textAlign(CENTER, TOP);
      // Position title centered horizontally instead of left-aligned
      g.text(this.title, this.w / 2, 10);
    }
  }
}


// --- State Panel ---
/**
 * Panel for displaying cognitive state metrics (engagement, emotion, etc.).
 */
class StatePanel extends Panel {
  /**
   * Creates a StatePanel instance.
   * @param {string} title Panel title.
   * @param {number} x X position.
   * @param {number} y Y position.
   * @param {number} w Width.
   * @param {number} h Height.
   * @param {object} bioSignalDataRef Reference to the global bioSignalData object.
   */
  constructor(title, x, y, w, h, bioSignalDataRef) {
    super(title, x, y, w, h);
    this.bioSignalData = bioSignalDataRef;

    // Revert: Define colors using hardcoded defaults
    this.emotionColors = {
      neutral: color(200, 200, 200),
      happy: color(255, 223, 0),
      confused: color(255, 140, 0),
      frustrated: color(255, 60, 60)
    };
    this.engagementColor = color(75, 207, 250);
    this.attentionColor = color(100, 255, 100);
    this.cognitiveLoadColor = color(200, 150, 255);

    // Revert: Layout constants
    this.padding = 15;
    this.barHeight = 20;
    this.barSpacing = 15;
    this.labelWidth = 100; // Space for labels like "Engagement"
    this.valueWidth = 40; // Space for numeric value display
    this.contentMarginTop = 40; // Space below title
  }

  /**
   * Draws the state indicators (bars, emotion text) onto the panel's graphics buffer.
   */
  draw() {
    this.drawBase(); // Draw background and title

    const g = this.graphics;
    const startY = this.contentMarginTop;
    const barAreaX = this.padding + this.labelWidth;
    const barAreaW = this.w - this.padding * 2 - this.labelWidth - this.valueWidth;

    g.push();
    g.translate(0, startY); // Start drawing below the title area

    // 1. Emotion Display
    g.fill(this.textColor);
    g.textAlign(LEFT, CENTER);
    g.textSize(14);
    g.text("Emotion:", this.padding, this.barHeight / 2);
    
    // Get the current emotion - try using the global currentEmotion if available
    let currentEmotion = this.bioSignalData.emotion || 'neutral';
    
    // Check if window.currentEmotion is available, which is more reliable
    if (typeof window.currentEmotion === 'string' && 
        window.currentEmotion !== undefined && 
        window.currentEmotion !== '') {
      currentEmotion = window.currentEmotion;
      
      // Also update the bioSignalData to keep things in sync
      if (this.bioSignalData) {
        this.bioSignalData.emotion = currentEmotion;
      }
    }
    
    let emotionColor = this.emotionColors[currentEmotion] || this.textColor;
    g.fill(emotionColor);
    g.textAlign(RIGHT, CENTER);
    g.text(currentEmotion.toUpperCase(), this.w - this.padding, this.barHeight / 2);
    let currentY = this.barHeight + this.barSpacing;

    // 2. Engagement Bar
    this.drawBar(g, "Engagement", this.bioSignalData.engagement, this.engagementColor, currentY, barAreaX, barAreaW);
    currentY += this.barHeight + this.barSpacing;

    // 3. Attention Bar
    this.drawBar(g, "Attention", this.bioSignalData.attention, this.attentionColor, currentY, barAreaX, barAreaW);
    currentY += this.barHeight + this.barSpacing;

    // 4. Cognitive Load Bar
    this.drawBar(g, "Cognitive Load", this.bioSignalData.cognitiveLoad, this.cognitiveLoadColor, currentY, barAreaX, barAreaW);

    g.pop();
  }

  /** Helper to draw a labeled bar */
  drawBar(g, label, value, barColor, y, barX, barW) {
    // Draw Label
    g.fill(this.textColor);
    g.textAlign(LEFT, CENTER);
    g.textSize(12);
    g.text(label, this.padding, y + this.barHeight / 2);

    // Draw Bar Background
    g.fill(50); // Dark background for the bar
    g.noStroke();
    g.rect(barX, y, barW, this.barHeight, 5); // Rounded corners

    // Draw Bar Value
    g.fill(barColor);
    const valueWidth = barW * constrain(value, 0, 1); // Map value (0-1) to width
    g.rect(barX, y, valueWidth, this.barHeight, 5);

    // Draw Value Text
    g.fill(this.textColor);
    g.textAlign(RIGHT, CENTER);
    g.text(nf(value, 1, 2), this.w - this.padding, y + this.barHeight / 2); // Format to 2 decimal places
  }
}


// --- Webcam Panel ---
/**
 * Panel for displaying webcam feed with face detection and emotion analysis.
 * Can display either a simulated face (when webcam is inactive) or
 * a real webcam feed with emotion detection overlay (when active).
 */
class WebcamPanel extends Panel {
  /**
   * Creates a WebcamPanel instance.
   * @param {string} title Panel title.
   * @param {number} x X position.
   * @param {number} y Y position.
   * @param {number} w Width.
   * @param {number} h Height.
   * @param {object} bioSignalDataRef Reference to the global bioSignalData object.
   */
  constructor(title, x, y, w, h, bioSignalDataRef) {
    super(title, x, y, w, h);
    this.bioSignalData = bioSignalDataRef || {}; // Ensure we have at least an empty object
    
    // Panel colors and styling
    this.placeholderTextColor = color(150);
    this.padding = 10;
    this.contentMarginTop = 30; // Space below title
    
    // Webcam state variables
    this.isWebcamActive = false;    // Whether webcam is currently active
    this.isConnected = false;       // Whether we're connected to the server
    this.currentFrame = null;       // Current webcam frame as image object
    
    // Emotion analysis data
    this.lastEmotionData = {
      emotion: 'neutral',
      score: 0,
      emotions: {},
      faces_detected: 0
    };
    
    // Add telemetry throttling variables
    this.lastEmotionLogTime = 0;         // Last time an emotion was logged
    this.emotionLogThreshold = 3000;     // Minimum time between logs (3 seconds)
    this.lastLoggedEmotion = null;       // Last emotion that was logged
    this.emotionChangeThreshold = 0.2;   // Minimum confidence change to log same emotion again
    
    // Add emotion trend tracking
    this.emotionTrendData = null;        // Data from the aggregate endpoint
    this.emotionTransitionCounter = {};  // Counter for consistent emotions before state change
    
    // Socket connection for webcam data
    this.socket = null;
    
    // Button for toggling webcam - now fully implemented
    this.toggleButton = {
      x: 0,           // Will be set in draw()
      y: 0,           // Will be set in draw()
      width: 110,     // Adjusted width to better fit text without icon
      height: 30,     // Button height
      label: "Enable Webcam",
      isHovered: false,
      isEnabled: true
    };
    
    // Demo mode indicator
    this.demoIndicator = null;
    
    // Face visualization colors - don't initialize here, will initialize in draw
    this.faceColor = null;
    this.outlineColor = null;
    this.featureColor = null;
    this.trackingPointColor = null;
    
    // Flag to track if colors have been initialized
    this.colorsInitialized = false;
  }

  /**
   * Initialize the face colors - should be called during draw when p5 is ready
   */
  initializeColors() {
    if (!this.colorsInitialized) {
      try {
        // Use explicit arguments for color to avoid any issues with arguments object
        this.faceColor = color(220, 220, 220, 120); // Translucent face color
        this.outlineColor = color(75, 207, 250);    // Same as accentColor1
        this.featureColor = color(75, 207, 250);    // Same as accentColor1
        this.trackingPointColor = color(75, 207, 250, 200); // Slightly transparent tracking points
        
        // Enhanced button colors with better contrast
        this.buttonColor = color(75, 207, 250);     // Button color - bright blue
        this.buttonHoverColor = color(131, 56, 236); // Button hover color - purple (accentColor2)
        this.buttonDisabledColor = color(100, 100, 100); // Disabled button color - gray
        
        // Verify colors were created successfully
        if (this.faceColor && this.outlineColor && this.featureColor && this.trackingPointColor) {
          this.colorsInitialized = true;
          console.log("WebcamPanel colors initialized successfully");
        } else {
          console.error("Failed to initialize one or more WebcamPanel colors");
        }
      } catch (e) {
        console.error("Error initializing WebcamPanel colors:", e);
      }
    }
  }

  /**
   * Updates the panel state - used for animations and transitions.
   */
  update() {
    // Update button hover state
    if (this.toggleButton && this.colorsInitialized) {
      // Check if mouse is over the panel
      const mx = mouseX - this.x;
      const my = mouseY - this.y;
      
      // Only check hover if mouse is within the panel bounds
      if (mx >= 0 && mx <= this.w && my >= 0 && my <= this.h) {
        // Check if mouse is over button
        this.toggleButton.isHovered = (
          mx >= this.toggleButton.x && 
          mx <= this.toggleButton.x + this.toggleButton.width &&
          my >= this.toggleButton.y && 
          my <= this.toggleButton.y + this.toggleButton.height
        );
        
        // If hover state changed, mark panel as dirty to redraw
        if (this.toggleButton.isHovered !== this.lastHoverState) {
          this.markDirty();
          this.lastHoverState = this.toggleButton.isHovered;
        }
      } else {
        // Mouse is outside panel, ensure button is not hovered
        if (this.toggleButton.isHovered) {
          this.toggleButton.isHovered = false;
          this.markDirty();
          this.lastHoverState = false;
        }
      }
      
      // Update button label based on webcam state
      if (this.toggleButton.label !== (this.isWebcamActive ? "Disable Webcam" : "Enable Webcam")) {
        this.toggleButton.label = this.isWebcamActive ? "Disable Webcam" : "Enable Webcam";
        this.markDirty();
      }
    }
  }

  /**
   * Sets up the frame capture loop for emotion analysis.
   * This captures frames at regular intervals for processing.
   */
  setupFrameCapture() {
    // Clear any existing capture interval
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
    }
    
    // Create a canvas for frame capture
    if (!this.captureCanvas) {
      this.captureCanvas = document.createElement('canvas');
      this.captureCanvas.width = 640;
      this.captureCanvas.height = 480;
      this.captureContext = this.captureCanvas.getContext('2d');
    }
    
    // Set up the capture interval (10 FPS is usually enough for emotion analysis)
    this.captureInterval = setInterval(() => {
      if (!this.isWebcamActive || !this.videoElement || !this.captureContext) return;
      
      try {
        // Capture current frame to canvas
        this.captureContext.drawImage(
          this.videoElement, 
          0, 0, 
          this.captureCanvas.width, 
          this.captureCanvas.height
        );
        
        // Convert canvas to image for display - use p5.js loadImage to ensure compatibility
        const dataUrl = this.captureCanvas.toDataURL('image/jpeg', 0.7);
        
        // Use p5.js loadImage instead of directly creating an image
        // This ensures the image is properly loaded before display
        if (window.loadImage) {
          window.loadImage(dataUrl, img => {
            if (img && img.width > 0) {
              this.currentFrame = img;
              this.markDirty();
            } else {
              console.error("Failed to load image from webcam frame");
            }
          });
        } else {
          // Fallback to traditional Image if p5.js loadImage not available
          const newFrame = new Image();
          newFrame.onload = () => {
            this.currentFrame = newFrame;
            this.markDirty();
          };
          newFrame.src = dataUrl;
        }
        
        // Send this frame to the backend for analysis
        this.sendFrameForAnalysis(dataUrl);
      } catch (e) {
        console.error("Error capturing webcam frame:", e);
      }
    }, 100); // 100ms interval = 10 FPS
  }
  
  /**
   * Draws the panel content.
   */
  draw() {
    this.drawBase(); // Draw background and title using our custom method
    
    // Initialize colors if not done yet
    this.initializeColors();
    
    // Exit early if colors failed to initialize
    if (!this.colorsInitialized) {
      return;
    }

    const g = this.graphics;
    
    // Get available content area
    const contentX = this.padding;
    const contentY = this.contentMarginTop;
    const contentWidth = this.w - this.padding * 2;
    const contentHeight = this.h - this.contentMarginTop - this.padding;
    
    // Position the toggle button in the top-right corner instead of bottom-right
    this.toggleButton.x = contentWidth - this.toggleButton.width - 10;
    this.toggleButton.y = 10; // Place it aligned with the title
    
    // Draw content area border
    g.noFill();
    g.stroke(this.placeholderTextColor);
    g.strokeWeight(1);
    g.rect(contentX, contentY, contentWidth, contentHeight);
    
    // Draw webcam content or simulated face based on state
    if (this.isWebcamActive) {
      if (this.currentFrame && this.currentFrame.width) {
        // Display the webcam frame
        try {
          // Calculate dimensions to maintain aspect ratio
          const imgWidth = this.currentFrame.width;
          const imgHeight = this.currentFrame.height;
          
          // Check if width and height are valid before proceeding
          if (imgWidth && imgHeight && typeof imgWidth === 'number' && typeof imgHeight === 'number') {
            // Calculate separate ratios for width and height to allow aspect ratio modification
            const widthRatio = (contentWidth * 0.75) / imgWidth; // Use 0.75 instead of 0.9 to make webcam feed less wide
            const heightRatio = contentHeight / imgHeight; // Maintain vertical fit
            
            // Use different ratios for width and height (allowing aspect ratio distortion)
            const displayWidth = imgWidth * widthRatio;
            const displayHeight = imgHeight * heightRatio;
            
            // Center the image in the content area
            const offsetX = contentX + (contentWidth - displayWidth) / 2;
            const offsetY = contentY + (contentHeight - displayHeight) / 2;
            
            // Draw the image using the p5.js image function
            g.push();
            g.imageMode(CORNER);
            g.image(
              this.currentFrame, 
              offsetX, 
              offsetY, 
              displayWidth, 
              displayHeight
            );
            g.pop();
            
            // Add a processing/active indicator
            this.drawActiveIndicator(g, offsetX + displayWidth - 20, offsetY + 20);
            
            // Draw face detection rectangles and emotion labels if available
            if (this.lastEmotionData && this.lastEmotionData.face_locations && this.lastEmotionData.face_locations.length > 0) {
              // Draw rectangles for each detected face
              for (let i = 0; i < this.lastEmotionData.face_locations.length; i++) {
                const [x, y, w, h] = this.lastEmotionData.face_locations[i];
                // Scale coordinates to the display size
                const scaledX = offsetX + (x / imgWidth) * displayWidth;
                const scaledY = offsetY + (y / imgHeight) * displayHeight;
                const scaledW = (w / imgWidth) * displayWidth;
                const scaledH = (h / imgHeight) * displayHeight;
                
                // Get emotion color based on detected emotion
                const emotion = this.lastEmotionData.emotion;
                const emotionColor = this.getEmotionColor(emotion);
                
                // Draw rectangle around face with animation effect
                const pulseAmount = (sin(millis() * 0.005) + 1) * 0.5; // 0 to 1
                g.push();
                
                // Draw background rectangle with slight transparency
                g.fill(emotionColor.levels[0], emotionColor.levels[1], emotionColor.levels[2], 30);
                g.rect(scaledX, scaledY, scaledW, scaledH, 5);
                
                // Draw rectangle border
                g.noFill();
                g.stroke(emotionColor);
                g.strokeWeight(2 + pulseAmount);
                g.rect(scaledX, scaledY, scaledW, scaledH, 5);
                
                // Draw corner highlights for better visibility
                g.strokeWeight(3);
                const cornerSize = 10;
                // Top-left corner
                g.line(scaledX, scaledY, scaledX + cornerSize, scaledY);
                g.line(scaledX, scaledY, scaledX, scaledY + cornerSize);
                // Top-right corner
                g.line(scaledX + scaledW, scaledY, scaledX + scaledW - cornerSize, scaledY);
                g.line(scaledX + scaledW, scaledY, scaledX + scaledW, scaledY + cornerSize);
                // Bottom-left corner
                g.line(scaledX, scaledY + scaledH, scaledX + cornerSize, scaledY + scaledH);
                g.line(scaledX, scaledY + scaledH, scaledX, scaledY + scaledH - cornerSize);
                // Bottom-right corner
                g.line(scaledX + scaledW, scaledY + scaledH, scaledX + scaledW - cornerSize, scaledY + scaledH);
                g.line(scaledX + scaledW, scaledY + scaledH, scaledX + scaledW, scaledY + scaledH - cornerSize);
                
                // Draw emotion label with better visual styling
                if (this.lastEmotionData.emotions) {
                  const emotions = this.lastEmotionData.emotions;
                  const confidence = emotions[emotion] || 0;
                  
                  // Check if confidence is already in percentage scale (> 1.0)
                  // DeepFace returns values on a 0-100 scale, not 0-1
                  let scoreDisplay;
                  if (confidence > 1.0) {
                    // Already in percentage scale, don't multiply again
                    scoreDisplay = Math.min(Math.round(confidence), 100);
                  } else {
                    // Standard 0-1 scale, convert to percentage
                    scoreDisplay = Math.round(confidence * 100);
                  }
                  
                  const labelText = `${emotion.toUpperCase()} (${scoreDisplay}%)`;
                  
                  // Background for the label at the top of the face box
                  const labelPadding = 5;
                  const labelWidth = g.textWidth(labelText) + labelPadding * 2;
                  const labelHeight = 22;
                  const labelX = scaledX + (scaledW - labelWidth) / 2; // Center the label on the face
                  const labelY = scaledY - labelHeight - 5; // Position above the face
                  
                  // Draw label background
                  g.fill(emotionColor.levels[0], emotionColor.levels[1], emotionColor.levels[2], 220);
                  g.noStroke();
                  g.rect(labelX, labelY, labelWidth, labelHeight, 3);
                  
                  // Draw label text
                  g.fill(255);
                  g.textAlign(CENTER, CENTER);
                  g.textSize(14);
                  g.textStyle(BOLD);
                  g.text(labelText, labelX + labelWidth/2, labelY + labelHeight/2);
                  g.textStyle(NORMAL);
                }
                
                g.pop();
              }
              
              // Display number of faces detected
              const faceCount = this.lastEmotionData.face_locations.length;
              g.fill(220);
              g.textAlign(LEFT, TOP);
              g.textSize(14);
              g.text(`Faces: ${faceCount}`, offsetX + 10, offsetY + 10);
            } else {
              // No faces detected message (only show if webcam is working)
              if (frameCount % 30 < 15) { // Blink the message
                g.push();
                g.fill(220, 200);
                g.textAlign(CENTER, TOP);
                g.textSize(16);
                g.text("No faces detected", offsetX + displayWidth/2, offsetY + 20);
                g.pop();
              }
            }
          } else {
            throw new Error("Invalid image dimensions");
          }
        } catch (e) {
          console.error("Error drawing webcam frame:", e);
          g.fill(this.placeholderTextColor);
          g.textAlign(CENTER, CENTER);
          g.textSize(16);
          g.text("Initializing Webcam Feed...", this.w / 2, this.h / 2);
        }
      } else {
        // Webcam is active but no frame is available yet
        g.fill(this.placeholderTextColor);
        g.textAlign(CENTER, CENTER);
        g.textSize(16);
        g.text("Initializing Webcam...", this.w / 2, this.h / 2);
        
        // Draw a loading spinner
        this.drawLoadingSpinner(g, this.w / 2, this.h / 2 + 30);
      }
      
      // If there's an error message, draw it
      if (this.errorMessage) {
        this.drawErrorMessage(g, this.errorMessage, contentX, contentY, contentWidth, contentHeight);
      }
    } else {
      // Draw simulated face
      try {
        this.drawSimulatedFace(
          contentX + contentWidth / 2,  // Center X
          contentY + contentHeight / 2,  // Center Y
          Math.min(contentWidth, contentHeight) * 0.7  // Face size (70% of smaller dimension)
        );
      } catch (e) {
        // If face drawing fails, show an error message
        console.error("Error drawing simulated face:", e);
        g.fill(this.placeholderTextColor);
        g.textAlign(CENTER, CENTER);
        g.textSize(16);
        g.text("[Face Visualization Error]", this.w / 2, this.h / 2);
      }
    }
    
    // Draw toggle button
    this.drawToggleButton(g);
    
    // Draw demo mode indicator if in demo mode
    this.drawDemoIndicator(g);
  }
  
  /**
   * Draws a loading spinner animation.
   * @param {p5.Graphics} g The graphics buffer to draw on
   * @param {number} x Center X position
   * @param {number} y Center Y position
   */
  drawLoadingSpinner(g, x, y) {
    const radius = 20;
    const numArcs = 8;
    const arcLength = TWO_PI / numArcs * 0.6;
    
    g.push();
    g.translate(x, y);
    g.rotate(millis() * 0.005); // Rotate based on time
    
    for (let i = 0; i < numArcs; i++) {
      const alpha = map(i, 0, numArcs, 50, 255);
      g.noFill();
      g.stroke(this.outlineColor.levels[0], this.outlineColor.levels[1], this.outlineColor.levels[2], alpha);
      g.strokeWeight(3);
      g.arc(0, 0, radius * 2, radius * 2, i * TWO_PI / numArcs, i * TWO_PI / numArcs + arcLength);
    }
    
    g.pop();
  }
  
  /**
   * Draws an active indicator that pulses.
   * @param {p5.Graphics} g The graphics buffer to draw on
   * @param {number} x X position
   * @param {number} y Y position
   */
  drawActiveIndicator(g, x, y) {
    const pulseAmount = (sin(millis() * 0.01) + 1) * 0.5; // 0 to 1
    const size = 8 + pulseAmount * 4;
    
    g.fill(0, 255, 0, 150 + pulseAmount * 100);
    g.noStroke();
    g.ellipse(x, y, size, size);
    
    // Draw "Live" text
    g.fill(255);
    g.textAlign(RIGHT, CENTER);
    g.textSize(12);
    g.text("LIVE", x - 10, y);
  }
  
  /**
   * Draws an error message box.
   * @param {p5.Graphics} g The graphics buffer to draw on
   * @param {string} message The error message to display
   * @param {number} x X position
   * @param {number} y Y position
   * @param {number} w Width of the content area
   * @param {number} h Height of the content area
   */
  drawErrorMessage(g, message, x, y, w, h) {
    // Draw semi-transparent error banner at the bottom
    const bannerHeight = 40;
    const bannerY = y + h - bannerHeight;
    
    // Banner background with attention-grabbing animation
    const pulseAmount = (sin(millis() * 0.005) + 1) * 0.5; // 0 to 1 pulse
    const baseAlpha = 180;
    const pulseAlpha = baseAlpha + pulseAmount * 75; // Pulse between 180-255 alpha
    
    // Red background for error
    g.fill(255, 50, 50, pulseAlpha);
    g.noStroke();
    g.rect(x, bannerY, w, bannerHeight);
    
    // Draw error icon (X)
    const iconSize = 20;
    const iconX = x + 15;
    const iconY = bannerY + bannerHeight/2;
    g.stroke(255);
    g.strokeWeight(3);
    g.line(iconX - iconSize/2, iconY - iconSize/2, iconX + iconSize/2, iconY + iconSize/2);
    g.line(iconX + iconSize/2, iconY - iconSize/2, iconX - iconSize/2, iconY + iconSize/2);
    
    // Draw error message text
    g.fill(255);
    g.noStroke();
    g.textAlign(LEFT, CENTER);
    g.textSize(14);
    g.text(message, iconX + iconSize/2 + 10, bannerY + bannerHeight/2);
    
    // Add help text about restarting servers if appropriate
    if (message.includes("connect") || message.includes("500") || message.includes("server")) {
      const helpText = "Try restarting the face analysis server";
      g.textAlign(RIGHT, CENTER);
      g.textSize(12);
      g.text(helpText, x + w - 10, bannerY + bannerHeight/2 + 12);
    }
    
    // Add a timestamp of when the error occurred if not already showing
    if (!this.errorTimestamp) {
      this.errorTimestamp = Date.now();
    }
    const timeAgo = Math.floor((Date.now() - this.errorTimestamp) / 1000);
    g.textAlign(RIGHT, CENTER);
    g.textSize(10);
    g.text(`${timeAgo}s ago`, x + w - 10, bannerY + bannerHeight/2 - 12);
  }
  
  /**
   * Draws the webcam toggle button.
   * @param {p5.Graphics} g The graphics buffer to draw on.
   */
  drawToggleButton(g) {
    // Set button color based on state
    let buttonFillColor;
    
    if (!this.toggleButton.isEnabled) {
      buttonFillColor = this.buttonDisabledColor;
    } else if (this.toggleButton.isHovered) {
      buttonFillColor = this.buttonHoverColor;
    } else {
      buttonFillColor = this.buttonColor;
    }
    
    // Add subtle shadow effect for depth
    g.drawingContext.shadowOffsetX = 0;
    g.drawingContext.shadowOffsetY = 2;
    g.drawingContext.shadowBlur = 4;
    g.drawingContext.shadowColor = 'rgba(0,0,0,0.2)';
    
    // Draw button background with gradient
    const gradient = g.drawingContext.createLinearGradient(
      this.toggleButton.x, 
      this.toggleButton.y, 
      this.toggleButton.x, 
      this.toggleButton.y + this.toggleButton.height
    );
    
    if (this.toggleButton.isHovered) {
      // Hover gradient (purple)
      gradient.addColorStop(0, 'rgba(131, 56, 236, 0.9)');
      gradient.addColorStop(1, 'rgba(131, 56, 236, 0.7)');
    } else {
      // Normal gradient (blue)
      gradient.addColorStop(0, 'rgba(75, 207, 250, 0.9)');
      gradient.addColorStop(1, 'rgba(75, 207, 250, 0.7)');
    }
    
    g.drawingContext.fillStyle = gradient;
    g.rect(
      this.toggleButton.x, 
      this.toggleButton.y, 
      this.toggleButton.width, 
      this.toggleButton.height, 
      5 // Rounded corners
    );
    
    // Reset shadow
    g.drawingContext.shadowOffsetX = 0;
    g.drawingContext.shadowOffsetY = 0;
    g.drawingContext.shadowBlur = 0;
    
    // Draw button label
    g.fill(255);
    g.textAlign(CENTER, CENTER);
    g.textSize(14);
    g.text(
      this.toggleButton.label, 
      this.toggleButton.x + this.toggleButton.width/2, 
      this.toggleButton.y + this.toggleButton.height/2
    );
    
    // If webcam is active, add a small "recording" indicator
    if (this.isWebcamActive) {
      // Add a subtle glow around the indicator
      g.drawingContext.shadowOffsetX = 0;
      g.drawingContext.shadowOffsetY = 0;
      g.drawingContext.shadowBlur = 6;
      g.drawingContext.shadowColor = 'rgba(255,0,0,0.5)';
      
      g.fill(255, 0, 0);
      g.ellipse(
        this.toggleButton.x + this.toggleButton.width - 10, 
        this.toggleButton.y + 10, 
        6, 6
      );
      
      // Reset shadow
      g.drawingContext.shadowOffsetX = 0;
      g.drawingContext.shadowOffsetY = 0;
      g.drawingContext.shadowBlur = 0;
    }
  }
  
  /**
   * Toggles webcam on/off.
   */
  toggleWebcam() {
    // If the button is disabled, do nothing
    if (!this.toggleButton.isEnabled) return;
    
    if (this.isWebcamActive) {
      console.log("⚠️ TOGGLING WEBCAM: TURNING OFF");
      this.stopWebcam();
    } else {
      console.log("⚠️ TOGGLING WEBCAM: TURNING ON");
      this.startWebcam();
    }
  }
  
  /**
   * Starts the webcam stream.
   */
  startWebcam() {
    if (this.isWebcamActive) return; // Already active
    
    console.log("Starting webcam...");
    
    // Check if browser supports getUserMedia
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("Browser doesn't support getUserMedia");
      this.showErrorMessage("Your browser doesn't support webcam access");
      return;
    }
    
    // Check if we're in demo mode and exit if so
    if (typeof window.demoMode !== 'undefined' && window.demoMode) {
      this.showErrorMessage("Please exit demo mode before enabling webcam");
      return;
    }
    
    // CRITICAL INITIALIZATION: Clear any pending state
    if (this.pendingAnalysis) {
      this.pendingAnalysis = false;
    }
    
    // Reset bioSignalData in a clean state
    if (this.bioSignalData) {
      // Keep initial emotion as neutral to ensure a fresh start
      this.bioSignalData.currentEmotion = 'neutral';
      this.bioSignalData.emotion = 'neutral';
      
      // Initialize with reasonable default values
      this.bioSignalData.engagement = 0.5;
      this.bioSignalData.attention = 0.5;
      this.bioSignalData.cognitiveLoad = 0.5;
    } else {
      // Create bioSignalData if it doesn't exist
      this.bioSignalData = {
        currentEmotion: 'neutral',
        emotion: 'neutral',
        engagement: 0.5,
        attention: 0.5,
        cognitiveLoad: 0.5
      };
    }
    
    // Request webcam access with video only (no audio)
    navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: "user" // Front camera
      },
      audio: false
    })
    .then(stream => {
      // Create video element to display webcam feed
      this.videoElement = document.createElement('video');
      this.videoElement.srcObject = stream;
      this.videoElement.autoplay = true;
      this.videoElement.style.display = 'none'; // Hide the actual element
      document.body.appendChild(this.videoElement);
      
      // Store the stream for later stopping
      this.webcamStream = stream;
      
      // Mark as active
      this.isWebcamActive = true;
      this.toggleButton.label = "Disable Webcam";
      
      // CRITICAL FIX: Enable webcam control of cognitive state
      // Set the flag to control cognitive state via webcam
      webcamControlsState = true;
      console.log("🎥 WEBCAM MODE ENABLED: webcamControlsState =", webcamControlsState);
      
      // Reset last webcam update time to force immediate update
      lastWebcamUpdate = 0;
      console.log("🎥 Reset lastWebcamUpdate to force immediate update");
      
      // Add telemetry message
      if (typeof window.addBackendMessage === 'function') {
        window.addBackendMessage("Webcam control of cognitive state enabled", "system");
        window.addBackendMessage("Webcam will now detect emotions and control cognitive state", "cognitive");
      }
      
      // Force a redraw
      this.markDirty();
      
      console.log("Webcam started successfully");
      
      // Set up the frame capture loop for later use with emotion analysis
      this.setupFrameCapture();
      
      // Start trend tracking
      this.startTrendTracking();
    })
    .catch(error => {
      console.error("Error accessing webcam:", error);
      
      // Show appropriate error message based on error type
      if (error.name === 'NotAllowedError') {
        this.showErrorMessage("Webcam access denied. Please enable camera permissions.");
      } else if (error.name === 'NotFoundError') {
        this.showErrorMessage("No webcam detected on your device.");
      } else {
        this.showErrorMessage("Error accessing webcam: " + error.message);
      }
    });
  }
  
  /**
   * Stops the webcam stream.
   */
  stopWebcam() {
    if (!this.isWebcamActive) return; // Not active
    
    console.log("Stopping webcam...");
    
    // Stop all tracks in the stream
    if (this.webcamStream) {
      this.webcamStream.getTracks().forEach(track => {
        track.stop();
      });
      this.webcamStream = null;
    }
    
    // Remove video element
    if (this.videoElement) {
      document.body.removeChild(this.videoElement);
      this.videoElement = null;
    }
    
    // Clear the current frame
    this.currentFrame = null;
    
    // Mark as inactive
    this.isWebcamActive = false;
    this.toggleButton.label = "Enable Webcam";
    
    // CRITICAL FIX: Disable webcam control of cognitive state
    // Set the flag to disable cognitive state control via webcam
    webcamControlsState = false;
    console.log("🎥 WEBCAM MODE DISABLED: webcamControlsState =", webcamControlsState);
    
    console.log("Webcam stopped successfully");
    
    // Add telemetry message
    if (typeof window.addBackendMessage === 'function') {
      window.addBackendMessage("Webcam control of cognitive state disabled", "system");
      window.addBackendMessage("Cognitive state will use autonomous simulation mode", "cognitive");
    }
    
    // Clear any error messages
    this.errorMessage = null;
    
    // Cancel frame capture if active
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    
    // Cancel trend tracking
    if (this.trendInterval) {
      clearInterval(this.trendInterval);
      this.trendInterval = null;
    }
    
    // Force a redraw
    this.markDirty();
  }
  
  /**
   * Start tracking emotion trends
   */
  startTrendTracking() {
    // Start fetching emotion trends periodically
    console.log("Starting emotion trend tracking...");
    
    // Initial fetch after 5 seconds
    this.trendTrackingTimer = setTimeout(() => {
      this.fetchEmotionTrends();
      
      // Then set up interval for continued fetching every 9 seconds to match telemetry logging
      this.trendTrackingInterval = setInterval(() => {
        this.fetchEmotionTrends();
      }, 9000); // Changed from 5000 to 9000ms (9 seconds)
    }, 5000);
  }
  
  /**
   * Fetch aggregated emotion trends from the server
   */
  fetchEmotionTrends() {
    // Skip if webcam is not active
    if (!this.isWebcamActive) return;
    
    // Fetch aggregated emotion data
    fetch('http://localhost:5005/api/emotion-aggregate?window=10')
      .then(response => {
        if (!response.ok) {
          // Clear any connection error message after some time
          if (response.status === 404) {
            console.warn("Emotion aggregate endpoint not found - server may not be running or endpoint not implemented");
            // Don't show error message for now, just log it
            if (!this.trendErrorLogged) {
              this.trendErrorLogged = true;
              // Try again in 30 seconds
              setTimeout(() => {
                this.trendErrorLogged = false;
              }, 30000);
            }
          }
          throw new Error(`Server returned ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (data.status === 'success') {
          console.log("Received emotion trend data:", data);
          
          // Store trend data
          this.emotionTrendData = data;
          
          // Update cognitive state based on trend data
          this.updateCognitiveStateFromTrends(data);
          
          // Log trends to telemetry
          this.logEmotionTrends(data);
          
          // Mark for redraw
          this.markDirty();
        }
      })
      .catch(error => {
        console.error("Error fetching emotion trends:", error);
        
        // Don't show any UI error for trend fetching failures
        // This is a background task that shouldn't affect the main UI
      });
  }
  
  /**
   * Update cognitive state based on trend data
   */
  updateCognitiveStateFromTrends(trendData) {
    if (!this.bioSignalData || !trendData) return;
    
    // Get emotion frequencies and confidence scores
    const frequencies = trendData.emotion_frequencies || {};
    const confidences = trendData.average_confidences || {};
    
    // Calculate engagement based on emotion mix
    let engagement = 0;
    const engagementWeights = {
      'happy': 0.9,    // Increased from 0.8
      'surprise': 0.8, // Increased from 0.7
      'neutral': 0.5,
      'sad': 0.2,      // Reduced from 0.3
      'fear': 0.3,     // Reduced from 0.4
      'angry': 0.7,    // Increased from 0.6
      'disgust': 0.1   // Reduced from 0.2
    };
    
    // Calculate attention based on emotion mix
    let attention = 0;
    const attentionWeights = {
      'happy': 0.7,     // Increased from 0.6
      'surprise': 0.9,  // Increased from 0.8
      'neutral': 0.7,
      'sad': 0.3,       // Reduced from 0.4
      'fear': 0.2,      // Reduced from 0.3
      'angry': 0.6,     // Increased from 0.5
      'disgust': 0.2    // Reduced from 0.3
    };
    
    // Calculate cognitive load based on emotion mix
    let cognitiveLoad = 0;
    const cognitiveLoadWeights = {
      'happy': 0.2,      // Reduced from 0.3
      'surprise': 0.7,   // Increased from 0.6
      'neutral': 0.4,
      'sad': 0.6,        // Increased from 0.5
      'fear': 0.8,       // Increased from 0.7
      'angry': 0.9,      // Increased from 0.8
      'disgust': 0.7     // Increased from 0.6
    };
    
    // Weight each emotion by its frequency and confidence
    Object.entries(frequencies).forEach(([emotion, frequency]) => {
      const confidence = confidences[emotion] || 0;
      
      // Apply to each metric
      if (engagementWeights[emotion]) {
        engagement += frequency * confidence * engagementWeights[emotion];
      }
      
      if (attentionWeights[emotion]) {
        attention += frequency * confidence * attentionWeights[emotion];
      }
      
      if (cognitiveLoadWeights[emotion]) {
        cognitiveLoad += frequency * confidence * cognitiveLoadWeights[emotion];
      }
    });
    
    // Increase transition rate for more noticeable changes
    const transitionRate = 0.4; // Increased from 0.2 (40% shift toward target per update)
    
    // Update engagement
    const currentEngagement = this.bioSignalData.engagement || 0.5;
    const targetEngagement = Math.min(1.0, Math.max(0.0, engagement));
    this.bioSignalData.engagement = currentEngagement + 
      (targetEngagement - currentEngagement) * transitionRate;
    
    // Update attention
    const currentAttention = this.bioSignalData.attention || 0.5;
    const targetAttention = Math.min(1.0, Math.max(0.0, attention));
    this.bioSignalData.attention = currentAttention + 
      (targetAttention - currentAttention) * transitionRate;
    
    // Update cognitive load
    const currentLoad = this.bioSignalData.cognitiveLoad || 0.5;
    const targetLoad = Math.min(1.0, Math.max(0.0, cognitiveLoad));
    this.bioSignalData.cognitiveLoad = currentLoad + 
      (targetLoad - currentLoad) * transitionRate;
    
    // Update emotion only if there's a strong dominant emotion
    const dominantEmotion = trendData.dominant_emotion;
    const dominantFrequency = frequencies[dominantEmotion] || 0;
    
    // Lower the threshold for emotion changes to make them more responsive
    if (dominantFrequency > 0.5) { // Reduced from 0.6
      // Only change if emotion is different
      if (this.bioSignalData.emotion !== dominantEmotion) {
        if (!this.emotionTransitionCounter) {
          this.emotionTransitionCounter = {};
        }
        
        this.emotionTransitionCounter[dominantEmotion] = 
          (this.emotionTransitionCounter[dominantEmotion] || 0) + 1;
        
        // Require fewer consecutive observations before changing
        if (this.emotionTransitionCounter[dominantEmotion] >= 1) { // Reduced from 2
          // Update both emotion properties
          this.bioSignalData.emotion = dominantEmotion;
          this.bioSignalData.currentEmotion = dominantEmotion;
          this.emotionTransitionCounter = {}; // Reset
          
          // Add pulse effect to state panel to highlight change
          if (typeof window.addPulseEffect === 'function' && window.stateX) {
            window.addPulseEffect(window.stateX, window.stateY, window.stateW, window.stateH, window.accentColor2);
          }
        }
      }
    }
  }
  
  /**
   * Log emotion trends to telemetry
   */
  logEmotionTrends(trendData) {
    if (!trendData || typeof trendData !== 'object') {
      console.error("Invalid trend data provided to logger:", trendData);
      return;
    }
    
    try {
      // Format the message for telemetry
      const dominantEmotion = trendData.dominant_emotion || 'neutral';
      const frequencies = trendData.emotion_frequencies || {};
      const confidences = trendData.average_confidences || {};
      
      const frequency = frequencies[dominantEmotion] || 0;
      const confidence = confidences[dominantEmotion] || 0;
      const faceDetectionRate = trendData.face_detection_rate || 0;
      
      // Handle frequency and face detection rate as 0-1 values
      const freqPercent = Math.min(Math.round(frequency * 100), 100);
      const faceRatePercent = Math.min(Math.round(faceDetectionRate * 100), 100);
      
      // Handle confidence - check if it's already in percentage scale (> 1.0)
      let confPercent;
      if (confidence > 1.0) {
        // Already in percentage scale, don't multiply again
        confPercent = Math.min(Math.round(confidence), 100);
      } else {
        // Standard 0-1 scale, convert to percentage
        confPercent = Math.round(confidence * 100);
      }
      
      // Create message without HTML-like formatting
      const messageText = `Emotion trend: ${dominantEmotion} (freq: ${freqPercent}%, conf: ${confPercent}%, face detection: ${faceRatePercent}%)`;
      
      // Add to backend messages (telemetry)
      if (typeof window.addBackendMessage === 'function') {
        window.addBackendMessage({
          text: messageText,
          timestamp: Date.now(),
          type: 'biometric',
          rawData: trendData
        });
      } else {
        console.log("Backend message function not available:", messageText);
      }
    } catch (e) {
      console.error("Error logging emotion trends to telemetry:", e);
    }
  }
  
  /**
   * Throttled logging of individual emotion detections
   */
  logEmotionToTelemetry(emotionData) {
    if (!emotionData || typeof emotionData !== 'object') {
      console.error("Invalid emotion data provided to logger:", emotionData);
      return;
    }
    
    const now = Date.now();
    const timeSinceLastLog = now - this.lastEmotionLogTime;
    const NINE_SECONDS = 9000; // 9 seconds in milliseconds
    
    // Always log if emotion type changed
    const currentEmotion = emotionData.emotion || 'neutral';
    const emotionChanged = currentEmotion !== this.lastLoggedEmotion;
    
    // Determine if we should log based on fixed 9-second throttling or emotion change
    if (emotionChanged || timeSinceLastLog > NINE_SECONDS) {
      // Format the message for telemetry
      const emotions = emotionData.emotions || {};
      const confidence = emotions[currentEmotion] || 0;
      
      // Handle confidence - check if it's already in percentage scale (> 1.0)
      let confidencePercent;
      if (confidence > 1.0) {
        // Already in percentage scale, don't multiply again
        confidencePercent = Math.min(Math.round(confidence), 100);
      } else {
        // Standard 0-1 scale, convert to percentage
        confidencePercent = Math.round(confidence * 100);
      }
      
      const facesDetected = emotionData.faces_detected || 0;
      
      // Create message without HTML-like formatting
      const messageText = `Emotion detected: ${currentEmotion} (confidence: ${confidencePercent}%, faces: ${facesDetected})`;
      
      try {
        // Add to backend messages (telemetry)
        if (typeof window.addBackendMessage === 'function') {
          window.addBackendMessage({
            text: messageText,
            timestamp: now,
            type: 'biometric',
            rawData: emotionData
          });
        } else {
          console.log("Backend message function not available:", messageText);
        }
        
        // Update tracking variables
        this.lastEmotionLogTime = now;
        this.lastLoggedEmotion = currentEmotion;
      } catch (e) {
        console.error("Error logging emotion to telemetry:", e);
      }
    }
  }
  
  /**
   * Sends the current webcam frame to the backend for emotion analysis.
   * @param {string} frameData Base64-encoded image data
   */
  sendFrameForAnalysis(frameData) {
    // Skip if we're not connected or we have a pending request
    if (!this.isWebcamActive || this.pendingAnalysis) return;
    
    // Throttle requests to avoid overwhelming the server
    // Only send a new frame after the previous analysis completes
    // or after a timeout (2 seconds max wait time)
    const now = Date.now();
    if (this.lastAnalysisTime && now - this.lastAnalysisTime < 200) {
      return; // Wait at least 200ms between requests (max 5 FPS to backend)
    }
    
    // Mark that we have a pending analysis
    this.pendingAnalysis = true;
    this.lastAnalysisTime = now;
    
    // Verify the frameData is valid before sending
    if (!frameData || typeof frameData !== 'string' || !frameData.startsWith('data:image')) {
      console.error("Invalid frame data format");
      this.pendingAnalysis = false;
      return;
    }
    
    // Try to connect to the server with better error handling
    try {
      // Log attempt to send frame
      console.log("Sending frame for analysis...");
      
      // Send the frame to the face analysis server
      fetch('http://localhost:5005/api/detect-face', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: frameData,
          sync: false // Use asynchronous processing
        })
      })
      .then(response => {
        if (!response.ok) {
          console.error(`Server returned error: ${response.status} - ${response.statusText}`);
          if (response.status === 500) {
            // For 500 errors, try to get the response body for more details
            return response.json().then(errorData => {
              throw new Error(`Server error 500: ${errorData.error || 'Unknown server error'}`);
            }).catch(e => {
              throw new Error(`Server error 500: Couldn't parse error details`);
            });
          }
          throw new Error(`Server returned ${response.status}: ${response.statusText}`);
        }
        return response.json();
      })
      .then(data => {
        // Mark that analysis is complete
        this.pendingAnalysis = false;
        
        // Handle the response data
        if (data.status === 'processing') {
          // Server is still processing, wait for the next frame
          console.log("Server processing the frame...");
          return;
        }
        
        // Check for server errors reported in the response
        if (data.error) {
          console.error("Server reported error:", data.error);
          this.showErrorMessage(`Analysis error: ${data.error}`);
          return;
        }
        
        if (data.result) {
          console.log("Received analysis result:", 
                      `faces: ${data.result.faces_detected}, ` +
                      `emotion: ${data.result.emotion}`);
                      
          // Clear any previous error messages
          if (this.errorMessage) {
            this.errorMessage = null;
            this.markDirty();
          }
          
          // Store the emotion data
          this.lastEmotionData = data.result;
          
          // Log to telemetry (throttled)
          this.logEmotionToTelemetry(data.result);
          
          // Update the global bio signal data if available
          if (this.bioSignalData) {
            // Set the current emotion - IMMEDIATELY update 
            const detectedEmotion = data.result.emotion || 'neutral';
            
            // Get confidence from emotions object
            const emotions = data.result.emotions || {};
            const confidence = emotions[detectedEmotion] || 0;
            
            // CRITICAL FIX: Make emotion updates work like gauge updates
            // Store and log the detection
            console.log(`🎭 EMOTION DETECTED: ${detectedEmotion} (confidence: ${confidence.toFixed(2)})`);
            
            // 1. Update the bio signal data (same for all modes)
            this.bioSignalData.currentEmotion = detectedEmotion;
            this.bioSignalData.emotion = detectedEmotion;
            
            // 2. If in webcam mode, update global variables through proper function
            // This ensures the emotion buffer gets populated correctly
            if (webcamControlsState === true) {
              console.log(`🎭 WEBCAM MODE: Using forceGlobalEmotionUpdate for ${detectedEmotion}`);
              
              // Use the proper function that integrates with the emotion buffer
              this.forceGlobalEmotionUpdate(detectedEmotion, confidence / 100);
              
              // The forceGlobalEmotionUpdate function will handle:
              // - Adding to emotion buffer 
              // - Updating global variables
              // - Updating cognitive metrics
              // - Adding visual pulse effects
              
            } else {
              console.log(`🎭 AUTO MODE: Webcam detection stored but not updating global state`);
            }
          }
          
          // Force a redraw to show updated values
          this.markDirty();
        } else {
          console.warn("Received empty result from server");
        }
      })
      .catch(error => {
        // Mark that analysis is complete even if it failed
        this.pendingAnalysis = false;
        
        // Only show errors if the webcam is still active
        if (this.isWebcamActive) {
          console.error("Error sending frame for analysis:", error);
          
          // Check if it's a connection error
          if (error.message.includes('Failed to fetch') || error.message.includes("NetworkError")) {
            // Server might be down, only show error occasionally to avoid spam
            if (!this.connectionErrorShown) {
              this.showErrorMessage("Can't connect to emotion analysis server");
              this.connectionErrorShown = true;
              
              // Reset after some time to allow retry messages
              setTimeout(() => {
                this.connectionErrorShown = false;
              }, 5000);
            }
          } else {
            // For other types of errors, show the specific message
            this.showErrorMessage(`Analysis error: ${error.message}`);
          }
        }
      });
    } catch (e) {
      // Handle any synchronous errors in the try block
      console.error("Error initiating server connection:", e);
      this.pendingAnalysis = false;
      this.showErrorMessage(`Connection error: ${e.message}`);
    }
  }
  
  /**
   * Force stops the webcam - useful for demo mode transitions.
   */
  forceStopWebcam() {
    if (this.isWebcamActive) {
      this.stopWebcam();
      console.log("Webcam force stopped");
    }
  }
  
  /**
   * Shows an error message in the panel.
   * @param {string} message The error message to display
   */
  showErrorMessage(message) {
    this.errorMessage = message;
    this.markDirty();
    console.error("Webcam error:", message);
  }

  /**
   * Draws a demo mode indicator when the panel is showing simulated data.
   * @param {p5.Graphics} g The graphics buffer to draw on.
   */
  drawDemoIndicator(g) {
    // Only draw indicator if we're not using a real webcam
    if (typeof window.demoMode !== 'undefined' && window.demoMode) {
      // Draw a "DEMO MODE" badge in the top-left corner instead of top-right
      // to avoid overlap with the webcam toggle button
      const badgeX = 10;
      const badgeY = 10; // Aligned with title
      const badgeWidth = 75;
      const badgeHeight = 22;
      
      // Draw badge background
      g.fill(131, 56, 236, 200); // Purple with transparency (accentColor2)
      g.noStroke();
      g.rect(badgeX, badgeY, badgeWidth, badgeHeight, 5);
      
      // Draw badge text
      g.fill(255);
      g.textAlign(CENTER, CENTER);
      g.textSize(10);
      g.text("DEMO MODE", badgeX + badgeWidth/2, badgeY + badgeHeight/2);
      
      // Add pulsing border effect
      const pulseAmount = sin(millis() * 0.003) * 0.5 + 0.5; // 0 to 1 pulsing
      g.noFill();
      g.stroke(255, 255, 255, 150 * pulseAmount);
      g.strokeWeight(1);
      g.rect(badgeX, badgeY, badgeWidth, badgeHeight, 5);
    }
  }

  /**
   * Draws a simulated face with the current emotion.
   * @param {number} centerX - Center X position of the face
   * @param {number} centerY - Center Y position of the face
   * @param {number} size - Size (diameter) of the face
   */
  drawSimulatedFace(centerX, centerY, size) {
    const g = this.graphics;
    
    // Get emotion from multiple sources to ensure it's always up-to-date
    // Try the global currentEmotion variable first if available
    let currentEmotion = 'neutral'; // Default fallback
    
    // First try the global currentEmotion if it exists
    if (typeof window.currentEmotion === 'string' && 
        ['neutral', 'happy', 'confused', 'frustrated'].includes(window.currentEmotion)) {
      currentEmotion = window.currentEmotion;
    } 
    // Then try the bioSignalData
    else if (this.bioSignalData && this.bioSignalData.currentEmotion && 
             ['neutral', 'happy', 'confused', 'frustrated'].includes(this.bioSignalData.currentEmotion)) {
      currentEmotion = this.bioSignalData.currentEmotion;
    }
    
    // Always log the emotion being used to draw the face to help debug
    if (frameCount % 30 === 0) {
      console.log("WebcamPanel drawing face with emotion:", currentEmotion, 
                  "Global emotion:", window.currentEmotion,
                  "Local emotion:", this.bioSignalData?.currentEmotion);
    }
    
    // Get animation time value for subtle movement
    const time = millis() * 0.001; // Time in seconds
    
    try {
      // Draw face background with subtle pulsing
      // Ensure valid numeric calculations to prevent NaN
      const pulseAmount = sin(time * 1.5);
      const pulseFactor = isNaN(pulseAmount) ? 0 : pulseAmount * 0.01; // Prevent NaN
      const pulseSize = size * (1 + pulseFactor); // Subtle 1% size pulsing
      
      // Use direct RGB values instead of color objects
      g.fill(220, 220, 220, 120); // Face color - translucent light gray
      g.noStroke();
      g.ellipse(centerX, centerY, pulseSize, pulseSize * 1.1); // Slightly oval
      
      // Draw face outline
      g.noFill();
      g.stroke(75, 207, 250); // Outline color - bright blue (accentColor1)
      g.strokeWeight(1.5);
      g.ellipse(centerX, centerY, pulseSize, pulseSize * 1.1);
      
      // Calculate positions for facial features
      const eyeY = centerY - size * 0.1;
      const eyeXOffset = size * 0.2;
      const mouthY = centerY + size * 0.2;
      const mouthWidth = size * 0.4;
      const noseY = centerY + size * 0.05;
      
      // Set common feature color
      const featureR = 75;
      const featureG = 207;
      const featureB = 250;
      
      // Draw eyes with direct RGB values
      this.drawEyesWithRGB(g, centerX, eyeY, eyeXOffset, size, currentEmotion, time, featureR, featureG, featureB);
      
      // Draw nose
      this.drawNoseWithRGB(g, centerX, eyeY, noseY, size, featureR, featureG, featureB);
      
      // Draw mouth based on emotion
      this.drawMouthWithRGB(g, centerX, mouthY, mouthWidth, size, currentEmotion, featureR, featureG, featureB);
      
      // Draw tracking points with subtle animation
      this.drawTrackingPointsWithRGB(g, centerX, centerY, eyeY, eyeXOffset, noseY, mouthY, mouthWidth, size, currentEmotion, time, featureR, featureG, featureB);
      
      // Draw emotion label at the bottom of the panel
      g.fill(220, 220, 220); // Light text color
      g.textAlign(CENTER, BOTTOM);
      g.textSize(14);
      g.text("Emotion: " + currentEmotion.toUpperCase(), this.w/2, this.h - 15);
    } catch (e) {
      console.error("Error in drawSimulatedFace:", e);
      // Draw error message in the middle of the panel
      g.fill(255, 0, 0, 100); // Semi-transparent red
      g.noStroke();
      g.rect(0, 0, this.w, this.h);
      g.fill(255);
      g.textAlign(CENTER, CENTER);
      g.textSize(16);
      g.text("Face Visualization Error", this.w/2, this.h/2);
    }
  }
  
  /**
   * Draws the eyes with appropriate expression for the current emotion using direct RGB values.
   */
  drawEyesWithRGB(g, centerX, eyeY, eyeXOffset, size, emotion, time, r, green, b) {
    // Draw eye shapes
    g.noFill();
    g.stroke(r, green, b);
    g.strokeWeight(1.5);
    
    // Left eye
    g.ellipse(centerX - eyeXOffset, eyeY, size * 0.15, size * 0.1);
    
    // Right eye
    g.ellipse(centerX + eyeXOffset, eyeY, size * 0.15, size * 0.1);
    
    // Draw pupils with subtle movement
    g.fill(r, green, b);
    
    // Calculate pupil movement - more active for "confused" emotion
    // Add safety checks to prevent NaN
    let sinValue = sin(time * 2);
    let cosValue = cos(time * 1.7);
    
    // Ensure valid numeric values
    let pupilMovementX = isNaN(sinValue) ? 0 : sinValue * 3;
    let pupilMovementY = isNaN(cosValue) ? 0 : cosValue * 2;
    
    // Apply emotion-specific adjustments
    if (emotion === "confused") {
      pupilMovementX *= 1.5; // More horizontal movement when confused
    }
    if (emotion === "frustrated") {
      pupilMovementY *= 1.5; // More vertical movement when frustrated
    }
    
    // Draw left pupil
    g.ellipse(
      centerX - eyeXOffset + pupilMovementX, 
      eyeY + pupilMovementY, 
      size * 0.05, 
      size * 0.05
    );
    
    // Draw right pupil
    g.ellipse(
      centerX + eyeXOffset + pupilMovementX, 
      eyeY + pupilMovementY, 
      size * 0.05, 
      size * 0.05
    );
    
    // Draw eyebrows based on emotion
    g.noFill();
    g.stroke(r, green, b);
    g.strokeWeight(2);
    
    // Left eyebrow
    if (emotion === "happy") {
      // Raised, curved up
      g.beginShape();
      g.vertex(centerX - eyeXOffset - size * 0.1, eyeY - size * 0.08);
      g.bezierVertex(
        centerX - eyeXOffset - size * 0.05, eyeY - size * 0.12,
        centerX - eyeXOffset + size * 0.05, eyeY - size * 0.12,
        centerX - eyeXOffset + size * 0.1, eyeY - size * 0.08
      );
      g.endShape();
    } else if (emotion === "frustrated") {
      // Angled down toward center
      g.beginShape();
      g.vertex(centerX - eyeXOffset - size * 0.1, eyeY - size * 0.1);
      g.bezierVertex(
        centerX - eyeXOffset - size * 0.05, eyeY - size * 0.08,
        centerX - eyeXOffset + size * 0.05, eyeY - size * 0.06,
        centerX - eyeXOffset + size * 0.1, eyeY - size * 0.04
      );
      g.endShape();
    } else if (emotion === "confused") {
      // One raised (left eyebrow raised)
      g.beginShape();
      g.vertex(centerX - eyeXOffset - size * 0.1, eyeY - size * 0.06);
      g.bezierVertex(
        centerX - eyeXOffset - size * 0.05, eyeY - size * 0.08,
        centerX - eyeXOffset + size * 0.05, eyeY - size * 0.1,
        centerX - eyeXOffset + size * 0.1, eyeY - size * 0.12
      );
      g.endShape();
    } else {
      // Neutral, slightly curved
      g.beginShape();
      g.vertex(centerX - eyeXOffset - size * 0.1, eyeY - size * 0.08);
      g.bezierVertex(
        centerX - eyeXOffset - size * 0.05, eyeY - size * 0.09,
        centerX - eyeXOffset + size * 0.05, eyeY - size * 0.09,
        centerX - eyeXOffset + size * 0.1, eyeY - size * 0.08
      );
      g.endShape();
    }
    
    // Right eyebrow
    if (emotion === "happy") {
      // Raised, curved up
      g.beginShape();
      g.vertex(centerX + eyeXOffset - size * 0.1, eyeY - size * 0.08);
      g.bezierVertex(
        centerX + eyeXOffset - size * 0.05, eyeY - size * 0.12,
        centerX + eyeXOffset + size * 0.05, eyeY - size * 0.12,
        centerX + eyeXOffset + size * 0.1, eyeY - size * 0.08
      );
      g.endShape();
    } else if (emotion === "frustrated") {
      // Angled down toward center (mirror of left)
      g.beginShape();
      g.vertex(centerX + eyeXOffset - size * 0.1, eyeY - size * 0.04);
      g.bezierVertex(
        centerX + eyeXOffset - size * 0.05, eyeY - size * 0.06,
        centerX + eyeXOffset + size * 0.05, eyeY - size * 0.08,
        centerX + eyeXOffset + size * 0.1, eyeY - size * 0.1
      );
      g.endShape();
    } else if (emotion === "confused") {
      // One lowered (right eyebrow lowered in confusion)
      g.beginShape();
      g.vertex(centerX + eyeXOffset - size * 0.1, eyeY - size * 0.12);
      g.bezierVertex(
        centerX + eyeXOffset - size * 0.05, eyeY - size * 0.1,
        centerX + eyeXOffset + size * 0.05, eyeY - size * 0.08,
        centerX + eyeXOffset + size * 0.1, eyeY - size * 0.06
      );
      g.endShape();
    } else {
      // Neutral, slightly curved
      g.beginShape();
      g.vertex(centerX + eyeXOffset - size * 0.1, eyeY - size * 0.08);
      g.bezierVertex(
        centerX + eyeXOffset - size * 0.05, eyeY - size * 0.09,
        centerX + eyeXOffset + size * 0.05, eyeY - size * 0.09,
        centerX + eyeXOffset + size * 0.1, eyeY - size * 0.08
      );
      g.endShape();
    }
  }
  
  /**
   * Draws the nose using direct RGB values.
   */
  drawNoseWithRGB(g, centerX, eyeY, noseY, size, r, green, b) {
    g.noFill();
    g.stroke(r, green, b);
    g.strokeWeight(1.5);
    
    // Simple nose with lines
    g.line(centerX, eyeY + size * 0.1, centerX - size * 0.05, noseY);
    g.line(centerX, eyeY + size * 0.1, centerX + size * 0.05, noseY);
    g.line(centerX - size * 0.05, noseY, centerX + size * 0.05, noseY);
  }
  
  /**
   * Draws the mouth with appropriate expression for the current emotion using direct RGB values.
   */
  drawMouthWithRGB(g, centerX, mouthY, mouthWidth, size, emotion, r, green, b) {
    g.noFill();
    g.stroke(r, green, b);
    g.strokeWeight(2);
    
    if (emotion === "happy") {
      // Happy mouth - upward curve
      g.beginShape();
      g.vertex(centerX - mouthWidth/2, mouthY);
      g.bezierVertex(
        centerX - mouthWidth/4, mouthY + size * 0.1,
        centerX + mouthWidth/4, mouthY + size * 0.1,
        centerX + mouthWidth/2, mouthY
      );
      g.endShape();
      
      // Bottom lip curve for happy
      g.strokeWeight(1);
      g.beginShape();
      g.vertex(centerX - mouthWidth/2, mouthY);
      g.bezierVertex(
        centerX - mouthWidth/4, mouthY + size * 0.02,
        centerX + mouthWidth/4, mouthY + size * 0.02,
        centerX + mouthWidth/2, mouthY
      );
      g.endShape();
    } 
    else if (emotion === "frustrated") {
      // Frustrated mouth - downward curve
      g.beginShape();
      g.vertex(centerX - mouthWidth/2, mouthY);
      g.bezierVertex(
        centerX - mouthWidth/4, mouthY - size * 0.05,
        centerX + mouthWidth/4, mouthY - size * 0.05,
        centerX + mouthWidth/2, mouthY
      );
      g.endShape();
      
      // Bottom lip curve for frustrated
      g.strokeWeight(1);
      g.beginShape();
      g.vertex(centerX - mouthWidth/2, mouthY);
      g.bezierVertex(
        centerX - mouthWidth/4, mouthY + size * 0.02,
        centerX + mouthWidth/4, mouthY + size * 0.02,
        centerX + mouthWidth/2, mouthY
      );
      g.endShape();
    } 
    else if (emotion === "confused") {
      // Confused mouth - slightly asymmetrical
      g.beginShape();
      g.vertex(centerX - mouthWidth/2, mouthY);
      g.bezierVertex(
        centerX - mouthWidth/4, mouthY - size * 0.02,
        centerX + mouthWidth/4, mouthY + size * 0.02,
        centerX + mouthWidth/2, mouthY - size * 0.01
      );
      g.endShape();
    } 
    else {
      // Neutral mouth - straight line with slight curve
      g.line(centerX - mouthWidth/2, mouthY, centerX + mouthWidth/2, mouthY);
      
      // Add a slight curve for the bottom lip
      g.strokeWeight(1);
      g.beginShape();
      g.vertex(centerX - mouthWidth/2, mouthY);
      g.bezierVertex(
        centerX - mouthWidth/4, mouthY + size * 0.01,
        centerX + mouthWidth/4, mouthY + size * 0.01,
        centerX + mouthWidth/2, mouthY
      );
      g.endShape();
    }
  }
  
  /**
   * Draws facial tracking landmark points with subtle animation using direct RGB values.
   */
  drawTrackingPointsWithRGB(g, centerX, centerY, eyeY, eyeXOffset, noseY, mouthY, mouthWidth, size, emotion, time, r, green, b) {
    g.stroke(r, green, b, 200); // Slightly transparent
    g.strokeWeight(1);
    
    // Helper function to draw animated tracking points
    const drawPoint = (x, y, pointSize) => {
      // Add subtle animation to tracking points
      const animationSize = pointSize * (0.8 + sin(time * 3 + x * 0.1 + y * 0.1) * 0.2);
      this.drawSimpleCross(g, x, y, animationSize);
    };
    
    // Face contour points
    for (let i = 0; i < 12; i++) {
      let angle = map(i, 0, 11, -PI/2, PI*1.5);
      let px = centerX + cos(angle) * (size/2);
      let py = centerY + sin(angle) * (size/2 * 1.1);
      drawPoint(px, py, 5);
    }
    
    // Eye tracking points
    // Left eye
    drawPoint(centerX - eyeXOffset - size * 0.08, eyeY, 5); // Left corner
    drawPoint(centerX - eyeXOffset, eyeY - size * 0.05, 5); // Top
    drawPoint(centerX - eyeXOffset + size * 0.08, eyeY, 5); // Right corner
    drawPoint(centerX - eyeXOffset, eyeY + size * 0.05, 5); // Bottom
    
    // Left pupil with animation
    let leftPupilX = centerX - eyeXOffset + sin(time * 2) * 3;
    let leftPupilY = eyeY + cos(time * 1.7) * 2;
    drawPoint(leftPupilX, leftPupilY, 5);
    
    // Right eye
    drawPoint(centerX + eyeXOffset - size * 0.08, eyeY, 5); // Left corner
    drawPoint(centerX + eyeXOffset, eyeY - size * 0.05, 5); // Top
    drawPoint(centerX + eyeXOffset + size * 0.08, eyeY, 5); // Right corner
    drawPoint(centerX + eyeXOffset, eyeY + size * 0.05, 5); // Bottom
    
    // Right pupil with animation
    let rightPupilX = centerX + eyeXOffset + sin(time * 2) * 3;
    let rightPupilY = eyeY + cos(time * 1.7) * 2;
    drawPoint(rightPupilX, rightPupilY, 5);
    
    // Eyebrow tracking points
    // Left eyebrow
    drawPoint(centerX - eyeXOffset - size * 0.1, eyeY - size * 0.08, 5); // Left end
    drawPoint(centerX - eyeXOffset, eyeY - size * 0.09, 5); // Middle
    drawPoint(centerX - eyeXOffset + size * 0.1, eyeY - size * 0.08, 5); // Right end
    
    // Right eyebrow
    drawPoint(centerX + eyeXOffset - size * 0.1, eyeY - size * 0.08, 5); // Left end
    drawPoint(centerX + eyeXOffset, eyeY - size * 0.09, 5); // Middle
    drawPoint(centerX + eyeXOffset + size * 0.1, eyeY - size * 0.08, 5); // Right end
    
    // Nose tracking points
    drawPoint(centerX, eyeY + size * 0.1, 5); // Bridge
    drawPoint(centerX - size * 0.05, noseY, 5); // Left nostril
    drawPoint(centerX + size * 0.05, noseY, 5); // Right nostril
    
    // Mouth tracking points
    drawPoint(centerX - mouthWidth/2, mouthY, 5); // Left corner
    drawPoint(centerX, mouthY, 5); // Center
    drawPoint(centerX + mouthWidth/2, mouthY, 5); // Right corner
    
    // Add specific points based on emotion
    if (emotion === "happy") {
      // Extra points for smile
      drawPoint(centerX - mouthWidth/4, mouthY + size * 0.05, 5);
      drawPoint(centerX + mouthWidth/4, mouthY + size * 0.05, 5);
    } else if (emotion === "frustrated") {
      // Extra points for frown
      drawPoint(centerX - mouthWidth/4, mouthY - size * 0.03, 5);
      drawPoint(centerX + mouthWidth/4, mouthY - size * 0.03, 5);
    }
    
    // Jaw tracking point
    drawPoint(centerX, centerY + size * 0.4, 5);
  }
  
  /**
   * Draws a simple cross marker.
   */
  drawSimpleCross(g, x, y, size) {
    g.line(x - size/2, y, x + size/2, y);
    g.line(x, y - size/2, x, y + size/2);
  }
  
  /**
   * Handles mouse pressed events within this panel.
   * @param {number} mx Mouse X position relative to panel
   * @param {number} my Mouse Y position relative to panel
   * @returns {boolean} True if the event was handled by this panel
   */
  handleMousePressed(mx, my) {
    // Check if click was on the toggle button
    if (this.toggleButton && 
        mx >= this.toggleButton.x && 
        mx <= this.toggleButton.x + this.toggleButton.width &&
        my >= this.toggleButton.y && 
        my <= this.toggleButton.y + this.toggleButton.height) {
      
      console.log("Webcam toggle button clicked");
      this.toggleWebcam();
      return true; // Indicate that this panel handled the press
    }
    return false; // Not handled
  }

  /**
   * Returns a color based on the emotion.
   * @param {string} emotion The detected emotion
   * @returns {p5.Color} Color for the emotion
   */
  getEmotionColor(emotion) {
    const colors = {
      'angry': color(255, 0, 0),     // Red
      'disgust': color(255, 140, 0),  // Orange
      'fear': color(128, 0, 0),      // Dark red
      'happy': color(0, 255, 0),     // Green
      'sad': color(0, 0, 255),       // Blue
      'surprise': color(0, 255, 255), // Cyan
      'neutral': color(255, 255, 255) // White
    };
    return colors[emotion] || color(255, 255, 255);
  }

  /**
   * CRITICAL RELIABILITY FIX: Forces the global emotion state to exactly match 
   * the currently detected emotion. This ensures the emotion bar always updates
   * in webcam mode, and is called directly from sendFrameForAnalysis.
   * 
   * @param {string} detectedEmotion - The emotion detected from webcam
   * @param {number} confidence - The confidence level (0-1) of the detection
   */
  forceGlobalEmotionUpdate(detectedEmotion, confidence) {
    // Skip if not in webcam mode
    if (!webcamControlsState) return;
    
    // Log this force update attempt
    console.log(`FORCE UPDATE: Setting global emotion to ${detectedEmotion} (confidence: ${confidence.toFixed(2)})`);
    
    // ADD TO EMOTION BUFFER for time window analysis
    console.log(`🔍 DEBUG: Checking for addEmotionToBuffer function...`);
    console.log(`🔍 DEBUG: typeof window.addEmotionToBuffer = ${typeof window.addEmotionToBuffer}`);
    
    if (typeof window.addEmotionToBuffer === 'function') {
      console.log(`🔄 CALLING: addEmotionToBuffer(${detectedEmotion}, ${confidence * 100})`);
      window.addEmotionToBuffer(detectedEmotion, confidence * 100); // Convert back to 0-100 range
      console.log(`📊 Added ${detectedEmotion} (${confidence.toFixed(2)}) to emotion buffer`);
    } else {
      console.error(`❌ ERROR: addEmotionToBuffer function not available! Type: ${typeof window.addEmotionToBuffer}`);
    }
    
    // 1. Set the bioSignalData first
    if (this.bioSignalData) {
      this.bioSignalData.currentEmotion = detectedEmotion;
      this.bioSignalData.emotion = detectedEmotion;
    }
    
    // 2. Directly set global variables regardless of previous state
    window.currentEmotion = detectedEmotion;
    
    // 3. Set emotion intensity high enough to be clearly visible but not too high
    window.emotionIntensity = 0.7; // Moderate intensity that matches other parts of the code
    
    // 4. Update cognitive metrics based on emotion (moved from deleted direct update code)
    const emotionMetricsMap = {
      'happy': { engagement: 0.85, attention: 0.75, cognitiveLoad: 0.25 },
      'neutral': { engagement: 0.60, attention: 0.55, cognitiveLoad: 0.45 },
      'confused': { engagement: 0.45, attention: 0.60, cognitiveLoad: 0.75 },
      'frustrated': { engagement: 0.35, attention: 0.40, cognitiveLoad: 0.85 },
      'angry': { engagement: 0.40, attention: 0.50, cognitiveLoad: 0.80 },
      'sad': { engagement: 0.30, attention: 0.35, cognitiveLoad: 0.60 },
      'disgust': { engagement: 0.35, attention: 0.40, cognitiveLoad: 0.70 },
      'fear': { engagement: 0.50, attention: 0.70, cognitiveLoad: 0.80 },
      'surprise': { engagement: 0.70, attention: 0.80, cognitiveLoad: 0.65 }
    };
    
    // Get metrics for this emotion with fallback to neutral
    const metrics = emotionMetricsMap[detectedEmotion.toLowerCase()] || emotionMetricsMap['neutral'];
    
    // Add slight randomness to create natural fluctuations (+/- 5%)
    const randomFactor = () => (1.0 + (Math.random() * 0.1 - 0.05));
    
    // Update bioSignalData metrics (the primary source for gauge readings)
    if (this.bioSignalData) {
      this.bioSignalData.engagement = metrics.engagement * randomFactor() || 0.5;
      this.bioSignalData.attention = metrics.attention * randomFactor() || 0.5;
      this.bioSignalData.cognitiveLoad = metrics.cognitiveLoad * randomFactor() || 0.5;
    }
    
    // Update window globals too for redundancy
    if (typeof window.engagementScore !== 'undefined') window.engagementScore = this.bioSignalData.engagement;
    if (typeof window.attentionScore !== 'undefined') window.attentionScore = this.bioSignalData.attention;
    if (typeof window.cognitiveLoad !== 'undefined') window.cognitiveLoad = this.bioSignalData.cognitiveLoad;
    
    // Log the updated metrics
    console.log(`📊 UPDATING METRICS: Eng=${this.bioSignalData.engagement.toFixed(2)} Att=${this.bioSignalData.attention.toFixed(2)} Cog=${this.bioSignalData.cognitiveLoad.toFixed(2)}`);
    
    // 5. Update cognitive metrics if the legacy function exists (for compatibility)
    if (typeof window.updateCognitiveMetricsForEmotion === 'function') {
      window.updateCognitiveMetricsForEmotion(detectedEmotion);
    }
    
    // Force global update - log the actual values to verify assignment worked
    console.log(`✅ VERIFY GLOBALS: currentEmotion=${window.currentEmotion}, intensity=${window.emotionIntensity}`);
    
    // 6. Add a visual pulse effect to emphasize the change
    if (typeof window.addPulseEffect === 'function' && 
        typeof window.stateX !== 'undefined' &&
        typeof window.stateY !== 'undefined' &&
        typeof window.stateW !== 'undefined' &&
        typeof window.stateH !== 'undefined') {
      
      // Use accentColor1 for consistent visual identification
      const pulseColor = window.accentColor1 || {r: 75, g: 207, b: 250};
      window.addPulseEffect(window.stateX, window.stateY, window.stateW, window.stateH, pulseColor);
      console.log(`✨ Added pulse effect to emotion panel`);
    }
    
    // 7. Force a redraw
    this.markDirty();
  }
}


// --- Helper Function (for Chat/Backend Panels) ---
/** Formats a timestamp into HH:MM string */
function formatTimestamp(timestamp) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}


// --- Chat Panel ---
/**
 * Panel for displaying chat messages between user and agent.
 */
class ChatPanel extends Panel {
  constructor(title, x, y, w, h, messagesRef) {
    super(title, x, y, w, h);
    this.messages = messagesRef; // Reference to the external message array

    // Revert: Message Handler - options use hardcoded defaults
    this.messageHandler = new MessageHandler(this.messages, {
        bubbleSpacing: 15,
        bubblePadding: 12,
        maxBubbleWidthFactor: 0.7,
        senderNameHeight: 0, // No sender name needed for chat bubbles usually
        timestampHeight: 18,
        groupTimeThreshold: 60000, // Group messages within 1 minute
        interMessageSpacing: 5
    });

    this.scrollY = 0; // Current scroll position (pixels from top)
    this.targetScrollY = 0; // Target for smooth scrolling
    this.maxScroll = 0; // Maximum scrollable distance
    this.isScrolling = false; // Flag for scrollbar interaction

    // Revert: Define colors using hardcoded defaults
    this.userBubbleColor = color(45, 45, 60);
    this.agentBubbleColor = color(30, 30, 45);
    this.textColor = color(220);
    this.timestampColor = color(150);
    this.scrollbarColor = color(80);
    this.scrollbarBgColor = color(40);
    // Revert: Define layout constants using hardcoded defaults
    this.scrollbarWidth = 8;
    this.bubbleRounding = 10;
    this.padding = 10; // General panel padding
    this.contentMarginTop = 30; // Space below title (adjust as needed)

    this.scrollToBottom(); // Initial calculation
  }

  /**
   * Adds a new message and scrolls to the bottom.
   * NOTE: This method in the panel might be redundant if addChatMessage
   * in the main sketch handles adding to the array directly.
   * Consider if this panel method is still needed. If kept, ensure
   * it doesn't duplicate messages.
   * @param {object} messageObject The message object {sender, text, timestamp}.
   */
  addMessage(messageObject) {
    // This method might not be needed if interaction_flow_demo2.js directly modifies
    // the messagesRef array passed in the constructor.
    // If it IS used, it should just mark dirty and scroll.
    // this.messages.push(messageObject); // Avoid pushing again if main sketch already did
    this.markDirty(); // Panel content has changed
    this.scrollToBottom(); // Scroll to show the new message
  }


  /** Sets the target scroll position to the bottom. */
  scrollToBottom() {
    // Recalculate total height using the message handler
    // Revert: Do not pass graphics context 'g' here yet
    if (this.graphics && this.graphics.width > 0 && this.graphics.height > 0) {
        this.messageHandler.groupMessages(); // Group messages first
        // Calculate height based on the graphics buffer width
        const contentWidth = this.w - this.padding * 2 - this.scrollbarWidth;
        // Revert: Call calculateTotalHeight without 'g'
        this.maxScroll = this.messageHandler.calculateTotalHeight(contentWidth);
    } else {
        this.maxScroll = 0; // Cannot calculate yet
    }

    // Calculate target scroll based on available content height
    const contentHeight = this.h - this.contentMarginTop - this.padding;
    
    // Ensure maxScroll is a valid number
    if (isNaN(this.maxScroll)) {
      this.maxScroll = 0;
    }
    
    this.targetScrollY = Math.max(0, this.maxScroll - contentHeight);
    
    // Ensure targetScrollY is a valid number
    if (isNaN(this.targetScrollY)) {
      this.targetScrollY = 0;
    }
    
    // If not actively scrolling via drag, snap scrollY to target
    if (!this.isScrolling) {
        this.scrollY = this.targetScrollY;
    }
    this.markDirty(); // Mark dirty as scroll position might change
  }

  /** Updates scroll position smoothly */
  update() {
    // Smooth scrolling interpolation
    const easing = 0.1; // Adjust for faster/slower scrolling
    
    // Ensure scrollY and targetScrollY are valid numbers
    if (isNaN(this.scrollY)) this.scrollY = 0;
    if (isNaN(this.targetScrollY)) this.targetScrollY = 0;
    
    let diff = this.targetScrollY - this.scrollY;
    if (abs(diff) > 0.1) { // Only update if there's a noticeable difference
      this.scrollY += diff * easing;
      this.markDirty(); // Mark dirty if scroll position changes
    } else if (this.scrollY !== this.targetScrollY) {
      this.scrollY = this.targetScrollY; // Snap to target if very close
      this.markDirty();
    }
  }

  /**
   * Draws the chat messages and scrollbar onto the panel's graphics buffer.
   */
  draw() {
    this.drawBase(); // Draw background and title

    const g = this.graphics;
    const contentY = this.contentMarginTop;
    const contentHeight = this.h - contentY - this.padding;
    const contentWidth = this.w - this.padding * 2 - this.scrollbarWidth;

    // Recalculate max scroll based on current content
    this.messageHandler.groupMessages();
    // Revert: Call calculateTotalHeight without 'g'
    const totalContentHeight = this.messageHandler.calculateTotalHeight(contentWidth);
    this.maxScroll = Math.max(0, totalContentHeight - contentHeight);

    // Check for NaN values and fix them
    if (isNaN(this.maxScroll)) this.maxScroll = 0;
    if (isNaN(this.scrollY)) this.scrollY = 0;
    if (isNaN(this.targetScrollY)) this.targetScrollY = 0;

    // Constrain scrollY based on potentially updated maxScroll
    this.scrollY = constrain(this.scrollY, 0, this.maxScroll);
    this.targetScrollY = constrain(this.targetScrollY, 0, this.maxScroll);


    // --- Draw Messages using MessageHandler ---
    g.push();
    g.translate(this.padding, contentY); // Move origin to content area

    // Revert: Attempt clipping without callback (this caused the original error)
    // Define the clipping rectangle relative to the translated origin
    g.rect(0, 0, contentWidth, contentHeight);
    g.clip(); // Apply clipping

    // Translate for scrolling *after* setting the clip region
    g.translate(0, -this.scrollY);

    // Use MessageHandler to draw the messages
    this.messageHandler.draw(g, contentWidth, {
        userBubbleColor: this.userBubbleColor,
        agentBubbleColor: this.agentBubbleColor,
        textColor: this.textColor,
        timestampColor: this.timestampColor,
        bubbleRounding: this.bubbleRounding
        // Pass other necessary options if MessageHandler.draw needs them
    });

    g.pop(); // Restore style settings and transformations

    // --- Draw Scrollbar ---
    // Draw scrollbar *outside* the clip area logic
    if (totalContentHeight > contentHeight) {
        const scrollbarX = this.w - this.scrollbarWidth - this.padding / 2;
        const scrollbarY = contentY;
        const scrollbarH = contentHeight;

        // Background
        g.fill(this.scrollbarBgColor);
        g.noStroke();
        g.rect(scrollbarX, scrollbarY, this.scrollbarWidth, scrollbarH, this.scrollbarWidth / 2);

        // Thumb
        // Calculate thumb height with defensive handling to prevent NaN or divide by zero
        let thumbHeight = 20; // Default minimum height
        if (totalContentHeight > 0) {
            thumbHeight = max(20, (scrollbarH / totalContentHeight) * scrollbarH);
        }
        
        // Calculate thumb position with defensive handling
        let thumbY = scrollbarY;
        if (this.maxScroll > 0 && !isNaN(this.scrollY)) {
            thumbY = scrollbarY + (this.scrollY / this.maxScroll) * (scrollbarH - thumbHeight);
        }

        g.fill(this.scrollbarColor);
        g.rect(scrollbarX, thumbY, this.scrollbarWidth, thumbHeight, this.scrollbarWidth / 2);
    }
  }


  // --- Scrollbar Interaction Methods ---
  handleMousePressed(mx, my) {
    // Check if mouse is over the scrollbar thumb
    const contentY = this.contentMarginTop;
    const contentHeight = this.h - contentY - this.padding;
    const scrollbarAreaHeight = contentHeight;
    const scrollbarAreaY = contentY;
    // Revert: Remove division by zero check
    const totalContentHeight = this.messages.length * (this.lineHeight + this.messageSpacing);
    // Revert: Remove division by zero check
    const thumbHeight = max(20, (scrollbarAreaHeight / totalContentHeight) * scrollbarAreaHeight);
    const thumbY = scrollbarAreaY + (this.maxScroll > 0 ? (this.scrollY / this.maxScroll) * (scrollbarAreaHeight - thumbHeight) : 0);
    const scrollbarX = this.w - this.scrollbarWidth - this.padding / 2;

    let localMx = mx - this.x;
    let localMy = my - this.y;

    if (localMx >= scrollbarX && localMx <= scrollbarX + this.scrollbarWidth &&
        localMy >= thumbY && localMy <= thumbY + thumbHeight) {
      this.isScrolling = true;
      this.scrollOffset = localMy - thumbY; // Store offset within thumb
      return true; // Indicate that this panel handled the press
    }
    return false;
  }

  handleMouseDragged(mx, my) {
    if (this.isScrolling) {
      const contentY = this.contentMarginTop;
      const contentHeight = this.h - contentY - this.padding;
      const scrollbarAreaHeight = contentHeight;
      const scrollbarAreaY = contentY;
      // Revert: Remove division by zero check
      const totalContentHeight = this.messages.length * (this.lineHeight + this.messageSpacing);
      // Revert: Remove division by zero check
      const thumbHeight = max(20, (scrollbarAreaHeight / totalContentHeight) * scrollbarAreaHeight);

      let localMy = my - this.y;
      let newThumbY = localMy - this.scrollOffset;
      let scrollRatio = (newThumbY - scrollbarAreaY) / (scrollbarAreaHeight - thumbHeight);
      scrollRatio = constrain(scrollRatio, 0, 1);

      this.targetScrollY = scrollRatio * this.maxScroll;
      this.scrollY = this.targetScrollY;
      this.markDirty();
      return true; // Indicate that this panel handled the drag
    }
    return false;
  }

  handleMouseReleased() {
    if (this.isScrolling) {
      this.isScrolling = false;
      return true; // Indicate that this panel handled the release
    }
    return false;
  }

   handleMouseWheel(event) {
    if (mouseX >= this.x && mouseX <= this.x + this.w &&
        mouseY >= this.y && mouseY <= this.y + this.h) {
      const scrollAmount = event.deltaY * 0.5;
      this.targetScrollY += scrollAmount;
      this.targetScrollY = constrain(this.targetScrollY, 0, this.maxScroll);
      this.markDirty();
      return true;
    }
    return false;
  }
}


// --- Backend Panel ---
/**
 * Panel for displaying backend/system telemetry messages.
 */
class BackendPanel extends Panel {
  constructor(title, x, y, w, h, messagesRef) {
    super(title, x, y, w, h);
    this.messages = messagesRef; // Reference to the external message array

    this.scrollY = 0;
    this.targetScrollY = 0;
    this.maxScroll = 0;
    this.isScrolling = false;

    // Revert: Define colors using hardcoded defaults
    this.textColor = color(200); // Default text color
    this.timestampColor = color(130);
    this.scrollbarColor = color(80);
    this.scrollbarBgColor = color(40);
    // Revert: Define specific message type colors using hardcoded defaults
    this.messageColors = {
        system: color(150, 150, 150),
        cognitive: color(100, 170, 255),
        sensor: color(255, 200, 100),
        error: color(255, 80, 80),
        insight: color(255, 140, 0)
    };

    // Revert: Define layout constants using hardcoded defaults
    this.scrollbarWidth = 8;
    this.padding = 10;
    this.lineHeight = 16; // Approximate height per message line
    this.messageSpacing = 4; // Vertical space between messages
    this.contentMarginTop = 30; // Space below title
    this.textSize = 12; // Font size for messages

    this.scrollToBottom(); // Initial calculation
  }

  /** Adds a message (similar to ChatPanel, might be redundant) */
  addMessage(messageObject) {
    // this.messages.push(messageObject); // Avoid pushing again
    this.markDirty();
    this.scrollToBottom();
  }

  /** Sets the target scroll position to the bottom. */
  scrollToBottom() {
    // Calculate total height based on number of messages and line height
    const contentHeight = this.h - this.contentMarginTop - this.padding;
    const totalContentHeight = this.messages.length * (this.lineHeight + this.messageSpacing);
    this.maxScroll = Math.max(0, totalContentHeight - contentHeight);
    
    // Ensure maxScroll is a valid number
    if (isNaN(this.maxScroll)) {
      this.maxScroll = 0;
    }

    this.targetScrollY = this.maxScroll;
    
    // Ensure targetScrollY is a valid number
    if (isNaN(this.targetScrollY)) {
      this.targetScrollY = 0;
    }
    
    if (!this.isScrolling) {
        this.scrollY = this.targetScrollY;
    }
    this.markDirty();
  }

  /** Updates scroll position smoothly */
  update() {
    const easing = 0.1;
    
    // Ensure scrollY and targetScrollY are valid numbers
    if (isNaN(this.scrollY)) this.scrollY = 0;
    if (isNaN(this.targetScrollY)) this.targetScrollY = 0;
    
    let diff = this.targetScrollY - this.scrollY;
    if (abs(diff) > 0.1) {
      this.scrollY += diff * easing;
      this.markDirty();
    } else if (this.scrollY !== this.targetScrollY) {
      this.scrollY = this.targetScrollY;
      this.markDirty();
    }
  }

  /**
   * Draws the backend messages and scrollbar onto the panel's graphics buffer.
   */
  draw() {
    this.drawBase(); // Draw background and title

    const g = this.graphics;
    const contentY = this.contentMarginTop;
    const contentHeight = this.h - contentY - this.padding;
    const contentWidth = this.w - this.padding * 2 - this.scrollbarWidth;

    // Recalculate max scroll
    const totalContentHeight = this.messages.length * (this.lineHeight + this.messageSpacing);
    this.maxScroll = Math.max(0, totalContentHeight - contentHeight);
    
    // Check for NaN values and fix them
    if (isNaN(this.maxScroll)) this.maxScroll = 0;
    if (isNaN(this.scrollY)) this.scrollY = 0;
    if (isNaN(this.targetScrollY)) this.targetScrollY = 0;
    
    this.scrollY = constrain(this.scrollY, 0, this.maxScroll);
    this.targetScrollY = constrain(this.targetScrollY, 0, this.maxScroll);

    // --- Clipping ---
    g.push();
    g.translate(this.padding, contentY);
    // Revert: Attempt clipping without callback
    g.rect(0, 0, contentWidth, contentHeight);
    g.clip();
    g.translate(0, -this.scrollY);

    // --- Draw Messages ---
    g.textSize(this.textSize);
    g.textAlign(LEFT, TOP);
    let currentY = 0;

    for (let i = 0; i < this.messages.length; i++) {
        let msg = this.messages[i];

        // Culling: Only draw visible messages (approximate)
        if (currentY + this.lineHeight >= this.scrollY && currentY < this.scrollY + contentHeight) {
            // Determine color based on type using local map
            let msgColor = this.messageColors[msg.type] || this.textColor; // Default to textColor

            // Draw timestamp (optional)
            let timestampStr = "";
            // Revert: Remove check for formatTimestamp
            // if (typeof formatTimestamp === 'function') {
                timestampStr = formatTimestamp(msg.timestamp) + " ";
                g.fill(this.timestampColor);
                g.text(timestampStr, 0, currentY);
            // } else {
            //      console.warn("formatTimestamp function not found.");
            // }

            const textX = g.textWidth(timestampStr);
            const availableTextWidth = contentWidth - textX;

            // Look for emotion words to highlight (without relying on HTML tags)
            this.drawColorizedText(g, msg.text, textX, currentY, availableTextWidth, msgColor);
        }

        currentY += (this.lineHeight + this.messageSpacing);

        // Optimization: Stop drawing if below visible area
        if (currentY > this.scrollY + contentHeight) {
            break;
        }
    }
    g.pop(); // Restore clip/translate

    // --- Draw Scrollbar ---
    if (totalContentHeight > contentHeight) {
        const scrollbarX = this.w - this.scrollbarWidth - this.padding / 2;
        const scrollbarY = contentY;
        const scrollbarH = contentHeight;

        // Background
        g.fill(this.scrollbarBgColor);
        g.noStroke();
        g.rect(scrollbarX, scrollbarY, this.scrollbarWidth, scrollbarH, this.scrollbarWidth / 2);

        // Thumb with defensive handling
        let thumbHeight = 20; // Default minimum height
        if (totalContentHeight > 0) {
            thumbHeight = max(20, (scrollbarH / totalContentHeight) * scrollbarH);
        }
        
        // Calculate thumb position with defensive handling
        let thumbY = scrollbarY;
        if (this.maxScroll > 0 && !isNaN(this.scrollY)) {
            thumbY = scrollbarY + (this.scrollY / this.maxScroll) * (scrollbarH - thumbHeight);
        }

        g.fill(this.scrollbarColor);
        g.rect(scrollbarX, thumbY, this.scrollbarWidth, thumbHeight, this.scrollbarWidth / 2);
    }
  }

  /**
   * Draw text with colored emotion words
   */
  drawColorizedText(g, text, x, y, maxWidth, defaultColor) {
    // List of emotions to recognize in text
    const emotionWords = ['happy', 'neutral', 'sad', 'angry', 'fear', 'surprise', 'disgust', 'confused', 'frustrated', 'positive', 'negative'];
    
    // Get color for an emotion
    const getEmotionColor = (emotion) => {
      const emotionColors = {
        'happy': color(255, 223, 0),      // Yellow
        'neutral': color(200, 200, 200),  // Light gray
        'sad': color(100, 100, 255),      // Blue
        'angry': color(255, 60, 60),      // Red
        'fear': color(180, 120, 255),     // Purple
        'surprise': color(255, 140, 0),   // Orange
        'disgust': color(80, 200, 120),   // Green
        'confused': color(255, 140, 0),   // Orange (same as surprise)
        'frustrated': color(255, 60, 60), // Red (same as angry)
        'positive': color(255, 223, 0),   // Yellow (same as happy)
        'negative': color(255, 60, 60)    // Red (same as angry)
      };
      
      return emotionColors[emotion.toLowerCase()] || color(200, 200, 200);
    };
    
    // If the text is short, just draw it (optimization)
    if (g.textWidth(text) <= maxWidth) {
      g.fill(defaultColor);
      g.text(text, x, y);
      return;
    }
    
    // Split text and process word by word for wrapping and coloring
    const words = text.split(' ');
    let line = '';
    let currX = x;
    let currY = y;
    
    g.fill(defaultColor);
    
    for (let i = 0; i < words.length; i++) {
      let word = words[i];
      let testLine = line + word + ' ';
      
      // Check if this is an emotion word (case insensitive)
      let isEmotionWord = false;
      let emotionToUse = '';
      
      for (const emotion of emotionWords) {
        if (word.toLowerCase() === emotion || 
            word.toLowerCase().includes(emotion)) {
          isEmotionWord = true;
          emotionToUse = emotion;
          break;
        }
      }
      
      // Check if we need to wrap to next line
      if (g.textWidth(testLine) > maxWidth) {
        // Draw current line
        g.text(line, currX, currY);
        
        // Move to next line
        line = '';
        currY += this.lineHeight;
        
        // Add the current word (which caused the wrap)
        if (isEmotionWord) {
          g.fill(getEmotionColor(emotionToUse)); // Set emotion color
          g.text(word + ' ', currX, currY);
          g.fill(defaultColor); // Reset to default color
        } else {
          g.text(word + ' ', currX, currY);
        }
        
        line = word + ' ';
      } else {
        // Continue on the current line
        if (isEmotionWord) {
          // Draw text up to this point
          if (line.length > 0) {
            g.text(line, currX, currY);
            currX += g.textWidth(line);
            line = '';
          }
          
          // Draw the emotion word in color
          g.fill(getEmotionColor(emotionToUse));
          g.text(word + ' ', currX, currY);
          currX += g.textWidth(word + ' ');
          g.fill(defaultColor); // Reset to default color
        } else {
          line = testLine;
        }
      }
    }
    
    // Draw any remaining text
    if (line.length > 0) {
      g.text(line, currX, currY);
    }
  }

  // --- Scrollbar Interaction Methods (Copy from ChatPanel if needed) ---
   handleMousePressed(mx, my) {
    // Check if mouse is over the scrollbar thumb
    const contentY = this.contentMarginTop;
    const contentHeight = this.h - contentY - this.padding;
    const scrollbarAreaHeight = contentHeight;
    const scrollbarAreaY = contentY;
    const totalContentHeight = this.messages.length * (this.lineHeight + this.messageSpacing);
    // Revert: Remove division by zero check
    const thumbHeight = max(20, (scrollbarAreaHeight / totalContentHeight) * scrollbarAreaHeight);
    const thumbY = scrollbarAreaY + (this.maxScroll > 0 ? (this.scrollY / this.maxScroll) * (scrollbarAreaHeight - thumbHeight) : 0);
    const scrollbarX = this.w - this.scrollbarWidth - this.padding / 2;

    let localMx = mx - this.x;
    let localMy = my - this.y;

    if (localMx >= scrollbarX && localMx <= scrollbarX + this.scrollbarWidth &&
        localMy >= thumbY && localMy <= thumbY + thumbHeight) {
      this.isScrolling = true;
      this.scrollOffset = localMy - thumbY;
      return true;
    }
    return false;
  }

  handleMouseDragged(mx, my) {
    if (this.isScrolling) {
      const contentY = this.contentMarginTop;
      const contentHeight = this.h - contentY - this.padding;
      const scrollbarAreaHeight = contentHeight;
      const scrollbarAreaY = contentY;
      const totalContentHeight = this.messages.length * (this.lineHeight + this.messageSpacing);
      // Revert: Remove division by zero check
      const thumbHeight = max(20, (scrollbarAreaHeight / totalContentHeight) * scrollbarAreaHeight);

      let localMy = my - this.y;
      let newThumbY = localMy - this.scrollOffset;
      let scrollRatio = (newThumbY - scrollbarAreaY) / (scrollbarAreaHeight - thumbHeight);
      scrollRatio = constrain(scrollRatio, 0, 1);

      this.targetScrollY = scrollRatio * this.maxScroll;
      this.scrollY = this.targetScrollY;
      this.markDirty();
      return true;
    }
    return false;
  }

  handleMouseReleased() {
    if (this.isScrolling) {
      this.isScrolling = false;
      return true;
    }
    return false;
  }

   handleMouseWheel(event) {
    if (mouseX >= this.x && mouseX <= this.x + this.w &&
        mouseY >= this.y && mouseY <= this.y + this.h) {
      const scrollAmount = event.deltaY * 0.5;
      this.targetScrollY += scrollAmount;
      this.targetScrollY = constrain(this.targetScrollY, 0, this.maxScroll);
      this.markDirty();
      return true;
    }
    return false;
  }
}


// --- Input Panel ---
/**
 * Panel acting as a container/background for the HTML input elements.
 * Doesn't draw much itself but defines the area.
 */
class InputPanel extends Panel {
  /**
   * Creates an InputPanel instance.
   * @param {string} title Panel title (can be empty).
   * @param {number} x X position.
   * @param {number} y Y position.
   * @param {number} w Width.
   * @param {number} h Height.
   */
  constructor(title, x, y, w, h) {
    super(title, x, y, w, h);
    // Revert: Use hardcoded defaults
    this.bgColor = color(25, 25, 35);
    this.rounding = 8;
  }

  /**
   * Draws a simple background for the input area.
   */
  draw() {
    const g = this.graphics;
    g.clear(); // Clear previous frame
    g.fill(this.bgColor);
    g.noStroke();
    g.rect(0, 0, this.w, this.h, this.rounding);
  }
}
