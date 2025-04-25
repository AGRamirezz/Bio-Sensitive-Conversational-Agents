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
    let emotionColor = this.emotionColors[this.bioSignalData.emotion] || this.textColor;
    g.fill(emotionColor);
    g.textAlign(RIGHT, CENTER);
    g.text(this.bioSignalData.emotion.toUpperCase(), this.w - this.padding, this.barHeight / 2);
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
 * Panel intended to display a webcam feed (placeholder for now).
 */
class WebcamPanel extends Panel {
  constructor(title, x, y, w, h, bioSignalDataRef) {
    super(title, x, y, w, h);
    this.bioSignalData = bioSignalDataRef; // May use this later for emotion overlay
    // Placeholder text color
    this.placeholderTextColor = color(150);
  }

  /**
   * Draws a placeholder indicating where the webcam feed would be.
   */
  draw() {
    this.drawBase(); // Draw background and title

    const g = this.graphics;
    const centerX = this.w / 2;
    const centerY = this.h / 2 + 10; // Adjust center slightly below title

    // Draw placeholder text
    g.fill(this.placeholderTextColor);
    g.textAlign(CENTER, CENTER);
    g.textSize(16);
    g.text("[Webcam Feed Placeholder]", centerX, centerY);

    // Optional: Draw a border for the feed area
    g.noFill();
    g.stroke(this.placeholderTextColor);
    g.strokeWeight(1);
    g.rect(this.padding, this.contentMarginTop, this.w - this.padding * 2, this.h - this.contentMarginTop - this.padding);
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
    this.targetScrollY = Math.max(0, this.maxScroll - contentHeight);
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
        // Revert: Remove division-by-zero check
        const thumbHeight = max(20, (scrollbarH / totalContentHeight) * scrollbarH);
        const thumbY = scrollbarY + (this.scrollY / this.maxScroll) * (scrollbarH - thumbHeight);

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

    this.targetScrollY = this.maxScroll;
    if (!this.isScrolling) {
        this.scrollY = this.targetScrollY;
    }
    this.markDirty();
  }

  /** Updates scroll position smoothly */
  update() {
    const easing = 0.1;
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


            // Draw message text
            g.fill(msgColor);
            // Revert: Remove check for msg.text
            // let textToDraw = (typeof msg.text === 'string') ? msg.text : "[Invalid Text]";
            g.text(msg.text, g.textWidth(timestampStr), currentY, contentWidth - g.textWidth(timestampStr)); // Use remaining width
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

        // Thumb
        // Revert: Remove division-by-zero check
        const thumbHeight = max(20, (scrollbarH / totalContentHeight) * scrollbarH);
        const thumbY = scrollbarY + (this.scrollY / this.maxScroll) * (scrollbarH - thumbHeight);

        g.fill(this.scrollbarColor);
        g.rect(scrollbarX, thumbY, this.scrollbarWidth, thumbHeight, this.scrollbarWidth / 2);
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
