/**
 * Panel.js
 *
 * Base class for all UI panels. Handles position, size, graphics buffer,
 * title drawing, and dirty state management.
 */
class Panel {
  /**
   * Creates a new Panel instance.
   * @param {string} title The text to display at the top of the panel.
   * @param {number} x The x-coordinate of the panel's top-left corner.
   * @param {number} y The y-coordinate of the panel's top-left corner.
   * @param {number} w The width of the panel.
   * @param {number} h The height of the panel.
   */
  constructor(title, x, y, w, h) {
    this.title = title;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    // Create an offscreen graphics buffer for drawing the panel's content
    // Ensure p5 functions (createGraphics, image) are available globally
    // or passed in if using instance mode. Assuming global mode here.
    this.graphics = createGraphics(w, h);
    this.dirty = true; // Flag to indicate if the panel needs redrawing
  }

  /** Marks the panel as needing to be redrawn. */
  markDirty() {
    this.dirty = true;
  }

  /**
   * Draws the basic panel background and title onto its graphics buffer.
   * Subclasses should call this first in their draw() method.
   * Assumes constants like PANEL_BG_COLOR, PANEL_ROUNDING, etc.,
   * are defined globally in another file (e.g., config.js or the main sketch).
   */
  drawBase() {
    // Ensure graphics buffer exists and dimensions are valid
    if (!this.graphics || this.w <= 0 || this.h <= 0) {
        console.error("Panel graphics not initialized or invalid dimensions:", this.title, this.w, this.h);
        // Attempt to recreate if dimensions are valid now
        if (this.w > 0 && this.h > 0) {
            this.graphics = createGraphics(this.w, this.h);
            if (!this.graphics) return; // Still failed
        } else {
            return; // Cannot draw with invalid dimensions
        }
    }
     // Check if constants are defined before using them
     const bgColor = typeof PANEL_BG_COLOR !== 'undefined' ? PANEL_BG_COLOR : color(30, 30, 40, 240); // Default fallback
     const rounding = typeof PANEL_ROUNDING !== 'undefined' ? PANEL_ROUNDING : 8;
     const textColor = typeof LIGHT_TEXT_COLOR !== 'undefined' ? LIGHT_TEXT_COLOR : color(220);
     const titleSize = typeof TITLE_TEXT_SIZE !== 'undefined' ? TITLE_TEXT_SIZE : 14;


    this.graphics.clear(); // Clear previous frame
    this.graphics.fill(bgColor);
    this.graphics.noStroke();
    this.graphics.rect(0, 0, this.w, this.h, rounding);

    // Draw title if it exists
    if (this.title) {
        this.graphics.fill(textColor);
        this.graphics.textSize(titleSize);
        this.graphics.textAlign(LEFT, TOP);
        this.graphics.text(this.title, 10, 10); // Add some padding
    }
  }

  /**
   * Abstract draw method to be implemented by subclasses.
   * Should draw the specific content of the panel onto this.graphics.
   */
  draw() {
    // Subclasses implement this to draw their specific content
    this.drawBase(); // Usually start by drawing the background/title
  }

  /**
   * Draws the panel's graphics buffer to the main canvas if it's marked dirty.
   * Resets the dirty flag after drawing.
   */
  drawToCanvas() {
     // Ensure graphics buffer exists before trying to draw or access it
     if (!this.graphics) {
        // Attempt to recreate if dimensions are valid
        if (this.w > 0 && this.h > 0) {
            console.warn("Recreating missing graphics buffer for panel:", this.title);
            this.graphics = createGraphics(this.w, this.h);
            this.dirty = true; // Mark dirty to ensure draw() is called
            if (!this.graphics) return; // Still failed
        } else {
            console.error("Cannot draw panel with invalid dimensions and no graphics buffer:", this.title);
            return; // Cannot draw
        }
    }

    if (this.dirty) {
      // Ensure draw() doesn't error if graphics buffer is invalid
      try {
          this.draw(); // Call the subclass's draw method to update the buffer
      } catch (e) {
          console.error("Error during panel draw() for:", this.title, e);
          // Optionally draw an error state onto the buffer
          this.graphics.background(255,0,0, 100);
          this.graphics.fill(255);
          this.graphics.textAlign(CENTER, CENTER);
          this.graphics.text("Draw Error", this.w/2, this.h/2);
      }
      this.dirty = false; // Reset dirty flag
    }
    // Draw the offscreen buffer onto the main canvas at the panel's position
    // Add check before drawing image
    if (this.graphics && this.graphics.width > 0 && this.graphics.height > 0) {
       image(this.graphics, this.x, this.y);
    } else {
        // console.warn("Skipping drawing panel due to invalid graphics:", this.title);
    }
  }
}


/**
 * Button.js
 *
 * Represents a clickable button within the p5.js sketch.
 */
class Button {
  /**
   * Creates a new Button instance.
   * @param {string} label The text displayed on the button.
   * @param {number} x The x-coordinate of the button's top-left corner.
   * @param {number} y The y-coordinate of the button's top-left corner.
   * @param {number} w The width of the button.
   * @param {number} h The height of the button.
   * @param {function} onClick The function to call when the button is clicked.
   */
  constructor(label, x, y, w, h, onClick) {
    this.label = label;
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.onClick = onClick;
    this.isHovered = false;
    this.isPressed = false;
  }

  /**
   * Checks if the mouse cursor is currently over the button.
   * Updates the isHovered state.
   * Assumes mouseX and mouseY are globally available p5.js variables.
   */
  checkHover() {
    this.isHovered = mouseX > this.x && mouseX < this.x + this.w &&
                     mouseY > this.y && mouseY < this.y + this.h;
  }

  /**
   * Handles mouse press events. Sets the isPressed state if hovered.
   * @returns {boolean} True if the press was on this button, false otherwise.
   */
  handlePress() {
    if (this.isHovered) {
      this.isPressed = true;
      return true; // Indicate the press was handled
    }
    return false;
  }

  /**
   * Handles mouse release events. Calls the onClick callback if pressed.
   * Resets the isPressed state.
   * @returns {boolean} True if the release corresponds to a press on this button, false otherwise.
   */
  handleRelease() {
    if (this.isPressed) {
      this.isPressed = false; // Reset pressed state regardless of hover
      if (this.isHovered) {
        this.onClick(); // Execute the button's action
      }
      return true; // Indicate the release was related to this button
    }
    return false;
  }

  /**
   * Draws the button on the main canvas.
   * Appearance changes based on hover and pressed states.
   * Assumes p5.js drawing functions and global constants (like colors, text sizes) are available.
   */
  draw() {
    // Update hover state before drawing
    this.checkHover();

    // Determine button appearance based on state
    // Use default fallbacks if constants aren't defined yet
    const accent = typeof ACCENT_COLOR_1 !== 'undefined' ? ACCENT_COLOR_1 : [75, 207, 250];
    const lightText = typeof LIGHT_TEXT_COLOR !== 'undefined' ? LIGHT_TEXT_COLOR : color(220);
    const bodySize = typeof BODY_TEXT_SIZE !== 'undefined' ? BODY_TEXT_SIZE : 12;

    let bgColor = color(accent[0], accent[1], accent[2], 150); // Base color
    let textColor = color(lightText);
    let strokeWeightVal = 1;
    let strokeColor = color(accent[0], accent[1], accent[2], 255);

    if (this.isHovered) {
      bgColor = color(accent[0], accent[1], accent[2], 200); // Lighter/more opaque on hover
      strokeWeightVal = 1.5;
    }
    if (this.isPressed && this.isHovered) {
      bgColor = color(accent[0] * 0.8, accent[1] * 0.8, accent[2] * 0.8, 220); // Darker when pressed
      strokeWeightVal = 1;
    }

    // Draw the button rectangle
    stroke(strokeColor);
    strokeWeight(strokeWeightVal);
    fill(bgColor);
    rect(this.x, this.y, this.w, this.h, 5); // Use a slight rounding

    // Draw the button label
    noStroke();
    fill(textColor);
    textSize(bodySize); // Use constant
    textAlign(CENTER, CENTER);
    text(this.label, this.x + this.w / 2, this.y + this.h / 2);
  }
}


/**
 * MessageHandler.js
 *
 * Manages message history and formatting for chat/backend panels.
 * Handles grouping consecutive messages and calculating content height.
 */
class MessageHandler {
  /**
   * Creates a new MessageHandler instance.
   * @param {Array} messagesRef A reference to the array holding the message objects.
   * @param {object} options Configuration options (e.g., bubbleSpacing, bubblePadding, maxBubbleWidth, etc.)
   */
  constructor(messagesRef, options = {}) {
    this.messages = messagesRef; // Store a reference to the original array

    // Default options, merge with provided options
    this.options = {
      bubbleSpacing: 15,
      bubblePadding: 12,
      maxBubbleWidthFactor: 0.7, // Default max width as a factor of panel width
      senderNameHeight: 18,
      timestampHeight: 20,
      groupTimeThreshold: 60000, // 1 minute threshold for grouping
      interMessageSpacing: 5, // Spacing between messages in the same group
      ...options // Override defaults with provided options
    };

    this.groupedMessages = [];
    this.totalContentHeight = 0;
    this.messageDimensions = new Map(); // Added for caching
  }

  /**
   * Groups consecutive messages from the same sender within a time threshold.
   * Call this before calculating height or drawing.
   */
  groupMessages() {
    this.groupedMessages = [];
    let currentGroup = null;

    for (let i = 0; i < this.messages.length; i++) {
      let msg = this.messages[i];

      // Start a new group if sender changes or time threshold exceeded
      if (!currentGroup ||
          currentGroup.sender !== msg.sender ||
          msg.timestamp - currentGroup.messages[currentGroup.messages.length - 1].timestamp > this.options.groupTimeThreshold) {
        if (currentGroup) {
          this.groupedMessages.push(currentGroup);
        }
        currentGroup = {
          sender: msg.sender,
          messages: [msg],
          timestamp: msg.timestamp // Timestamp of the first message in the group
        };
      } else {
        // Add to current group
        currentGroup.messages.push(msg);
        // Update group timestamp to the latest message? Or keep the first? Let's keep the first for now.
      }
    }

    // Add the last group if it exists
    if (currentGroup) {
      this.groupedMessages.push(currentGroup);
    }
  }

  /**
   * Calculates the total height required to display all grouped messages.
   * Requires groupMessages() to be called first.
   * @param {number} panelWidth The current width of the panel containing the messages.
   * @returns {number} The total calculated height.
   */
  calculateTotalHeight(panelWidth) {
    this.totalContentHeight = 0;

    // Use options directly or hardcoded defaults, remove config.js dependencies
    const bubblePadding = this.options.bubblePadding || 10;
    const maxBubbleWidthFactor = this.options.maxBubbleWidthFactor || 0.7;
    const senderNameHeight = this.options.senderNameHeight || 0;
    const timestampHeight = this.options.timestampHeight || 14; // Example default if not in options
    const interMessageSpacing = this.options.interMessageSpacing || 2;
    const bubbleSpacing = this.options.bubbleSpacing || 10;
    // Use a hardcoded default text size, remove config.js dependency
    const messageTextSize = 12; // Example default body text size

    const maxBubbleWidth = panelWidth * maxBubbleWidthFactor - bubblePadding * 2;

    // Use p5's global text functions for calculation (requires push/pop)
    push();
    textSize(messageTextSize); // Set size for calculations

    for (let i = 0; i < this.groupedMessages.length; i++) {
      let group = this.groupedMessages[i];
      let groupHeight = senderNameHeight; // Start with sender name height (if any)

      for (let j = 0; j < group.messages.length; j++) {
        let msg = group.messages[j];
        let textDimensions = calculateTextDimensions(msg.text, maxBubbleWidth, messageTextSize);

        let bubbleHeight = textDimensions.height + bubblePadding * 2;

        if (j === group.messages.length - 1) {
          bubbleHeight += timestampHeight; // Add space for timestamp on last message
        }

        groupHeight += bubbleHeight;
        if (j < group.messages.length - 1) {
          groupHeight += interMessageSpacing; // Small spacing between messages in same group
        }
      }
      this.totalContentHeight += groupHeight + bubbleSpacing; // Add spacing between groups
    }

    pop(); // Restore text settings
    return this.totalContentHeight;
  }

  /**
   * Gets the currently calculated grouped messages.
   * Requires groupMessages() to be called first.
   * @returns {Array} The array of grouped message objects.
   */
  getGroupedMessages() {
    return this.groupedMessages;
  }

  /**
   * Gets the currently calculated total content height.
   * Requires calculateTotalHeight() to be called first.
   * @returns {number} The total height.
   */
  getTotalContentHeight() {
    return this.totalContentHeight;
  }

  /**
   * Draws the messages onto the provided graphics buffer.
   * NOW REQUIRES the p5.Graphics buffer.
   * @param {p5.Graphics} g - The graphics buffer to draw on.
   * @param {number} x - Starting X position within the buffer.
   * @param {number} y - Starting Y position (top of visible area) within the buffer.
   * @param {number} w - Available width within the buffer.
   * @param {number} h - Available height within the buffer.
   * @param {number} scrollY - The current vertical scroll offset.
   * @param {object} colors - Object containing color definitions (e.g., userBubble, agentBubble, lightText).
   */
  draw(g, x, y, w, h, scrollY, colors) {
    g.push();
    g.translate(x, y - scrollY); // Apply scroll offset

    let currentY = this.options.bubbleSpacing; // Start with spacing at the top

    this.groupedMessages.forEach((group, groupIndex) => {
      let groupHeight = this.options.senderNameHeight; // Start with sender name height

      // Draw sender name
      g.fill(colors.senderName || color(255));
      g.textSize(this.options.senderNameHeight);
      g.textAlign(LEFT, TOP);
      g.text(group.sender, 0, currentY);
      groupHeight += this.options.senderNameHeight;

      group.messages.forEach((msg, msgIndex) => {
        const msgKey = msg.timestamp || `${groupIndex}-${msgIndex}`;
        let dims = this.messageDimensions.get(msgKey);

        // Recalculate if not cached (should have been by calculateTotalHeight)
        if (!dims) {
          dims = calculateTextDimensions(msg.text, this.options.maxBubbleWidthFactor * w - this.options.bubblePadding * 2, this.options.timestampHeight);
          this.messageDimensions.set(msgKey, dims);
        }

        const bubbleHeight = dims.height + this.options.bubblePadding * 2;
        const bubbleWidth = Math.min(this.options.maxBubbleWidthFactor * w - this.options.bubblePadding * 2, w - this.options.bubblePadding * 2); // Ensure bubble fits panel width

        // Determine bubble position and color based on sender
        let bubbleX;
        let bubbleColor;
        let textColor = colors.lightText || color(255); // Default to white

        if (msg.sender === "User") {
          bubbleX = w - bubbleWidth - this.options.bubblePadding; // Align right
          bubbleColor = colors.userBubble || color(50, 50, 70);
        } else { // Agent or System
          bubbleX = this.options.bubblePadding; // Align left
          bubbleColor = colors.agentBubble || color(40, 40, 55);
        }

        // --- Draw Bubble ---
        // Check if bubble is within vertical view
        if (currentY + bubbleHeight > scrollY && currentY < scrollY + h) {
          g.fill(bubbleColor);
          g.noStroke();
          g.rect(bubbleX, currentY, bubbleWidth, bubbleHeight, this.options.bubbleRounding);

          // --- Draw Text ---
          g.fill(textColor);
          g.textSize(this.options.timestampHeight);
          g.textAlign(LEFT, TOP);
          g.text(msg.text, bubbleX + this.options.bubblePadding, currentY + this.options.bubblePadding, bubbleWidth); // Use calculated textWidth for wrapping
        }

        currentY += bubbleHeight + this.options.interMessageSpacing;
      });

      currentY += groupHeight + this.options.bubbleSpacing;
    });

    g.pop();
  }
}

/**
 * Calculates the wrapped dimensions of text.
 * NOW REQUIRES the p5.Graphics buffer as the first argument.
 * @param {p5.Graphics} g - The graphics buffer to use for text calculations.
 * @param {string} text - The text content.
 * @param {number} maxWidth - The maximum width allowed for the text.
 * @param {number} textSizeValue - The font size.
 * @returns {{width: number, height: number, lines: number}}
 */
function calculateTextDimensions(g, text, maxWidth, textSizeValue) {
    // Safety check for undefined text
    if (typeof text !== 'string') {
        console.warn("calculateTextDimensions received non-string text:", text);
        return { width: 0, height: 0, lines: 0 };
    }
    // Safety check for graphics context
    if (!g || typeof g.textSize !== 'function' || typeof g.textWidth !== 'function') {
        console.error("calculateTextDimensions received invalid graphics context:", g);
        // Fallback to global p5 if necessary, though likely won't work reliably here
        g = window; // Assuming global p5 instance is available on window
        if (typeof g.textSize !== 'function') return { width: 0, height: 0, lines: 0 }; // Bail out
    }


    g.push(); // Use the buffer's push/pop
    g.textSize(textSizeValue);
    // g.textFont(textFont); // Add if using custom fonts

    let words = text.split(' ');
    let lines = [];
    let currentLine = '';
    let maxLineWidth = 0;

    words.forEach(word => {
        let testLine = currentLine === '' ? word : currentLine + ' ' + word;
        let testWidth = g.textWidth(testLine); // Use buffer's textWidth

        if (testWidth > maxWidth && currentLine !== '') {
            lines.push(currentLine);
            maxLineWidth = Math.max(maxLineWidth, g.textWidth(currentLine)); // Use buffer's textWidth
            currentLine = word;
        } else {
            currentLine = testLine;
        }
    });
    lines.push(currentLine);
    maxLineWidth = Math.max(maxLineWidth, g.textWidth(currentLine)); // Use buffer's textWidth

    // Calculate height based on lines and leading
    const leading = g.textLeading() || (textSizeValue * 1.2); // Use buffer's textLeading or estimate
    const totalHeight = lines.length * leading;

    g.pop(); // Restore buffer's state

    return {
        width: maxLineWidth,
        height: totalHeight,
        lines: lines.length
    };
}
