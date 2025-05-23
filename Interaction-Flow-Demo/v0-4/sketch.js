// Absolute minimal code to test if p5.js is working

// Global variables for panels
let eegX, eegY, eegW, eegH;
let stateX, stateY, stateW, stateH;
let webcamX, webcamY, webcamW, webcamH;
let chatX, chatY, chatW, chatH;
let backendX, backendY, backendW, backendH;
let inputX, inputY, inputW, inputH;

// Global variables for panel objects
let webcamPanel;

// Global variables for colors
let darkBg, lightText, accentColor1, accentColor2;
let panelBg, userBubbleColor, agentBubbleColor;

// Global variables for chat
let chatMessages = [];
let chatScrollY = 0;
let maxChatScroll = 0;
let bubblePaddingX = 10;
let bubblePaddingY = 10;
let bubbleSpacing = 10;
let bubbleRounding = 10;
let scrollbarWidth = 8;

// Global variables for user state
let engagementScore = 0.7;
let currentEmotion = "neutral"; // neutral, happy, confused, frustrated
let lastAgentMessage = ""; // Last message from the AI agent, used for emotional context

// Input elements
let inputElement;
let sendButton;

// Panel dimensions and constants
const panelRounding = 10;

// Adding backend panel with system telemetry

// Global variables for backend panel
let backendMessages = [];
let backendScrollY = 0;
let maxBackendScroll = 0;
let systemMsgColor, cognitiveMsgColor, sensorMsgColor;

// Global variables for pulse effects
let pulseEffects = [];

// Global variables for EEG wave parameters
let alphaAmplitude = 0.5;
let betaAmplitude = 0.3;
let thetaAmplitude = 0.2;
let deltaAmplitude = 0.4;

// Add these variables to track emotional state more precisely
let emotionIntensity = 0.5; // How strongly the current emotion is felt (0.0-1.0)
let emotionStability = 0.7; // How resistant to change the current emotion is (0.0-1.0)
let emotionTransitionThreshold = 0.8; // Threshold required to change emotions
let lastEmotionChange = 0; // When the last emotion change occurred
let emotionCooldown = 5000; // Minimum time between emotion changes (ms)

// Add at the top of your sketch.js file
let isWaitingForResponse = false;

// Add these with your other global variables (around line 20-30)
let attentionScore = 0.7;      // Default attention score
let cognitiveLoad = 0.5;       // Default cognitive load

// Add these global variables near the top of the file with other globals
// These are CRITICAL for webcam functionality
let webcamControlsState = false; // Flag to indicate if webcam is controlling the state
let lastWebcamUpdate = 0; // Timestamp of last webcam update
const WEBCAM_UPDATE_INTERVAL = 500; // Update from webcam twice per second (was 1000)

// Global variables for emotion tracking
let emotionBuffer = []; // Buffer to store emotion data over time
const EMOTION_WINDOW_SIZE = 5000; // 5 seconds in milliseconds
const RECENCY_WEIGHT = 0.05; // 5% weight for recency

// Global biometric variables that are accessible via window object
window.currentEmotion = "neutral"; // neutral, happy, confused, frustrated
window.emotionIntensity = 0.5; // How strongly the current emotion is felt (0.0-1.0)

// Function to add pulse effect
function addPulseEffect(x, y, w, h, color) {
  pulseEffects.push({
    x: x,
    y: y,
    w: w,
    h: h,
    color: color,
    life: 1.0
  });
}

// Function to update and draw pulse effects
function updatePulseEffects() {
  for (let i = pulseEffects.length - 1; i >= 0; i--) {
    let effect = pulseEffects[i];
    
    // Draw pulse
    push();
    noFill();
    stroke(effect.color.levels[0], effect.color.levels[1], effect.color.levels[2], 255 * effect.life);
    strokeWeight(2 * (1 - effect.life) + 1);
    rect(effect.x, effect.y, effect.w, effect.h, panelRounding);
    pop();
    
    // Update life
    effect.life -= 0.02;
    
    // Remove if expired
    if (effect.life <= 0) {
      pulseEffects.splice(i, 1);
    }
  }
}

// Function to add backend message
function addBackendMessage(message, type = "system") {
  // Handle both string messages and object messages
  let messageText = "";
  let messageType = type;
  let messageTimestamp = Date.now();
  let rawData = null;
  
  // If message is an object with text property
  if (typeof message === 'object' && message !== null) {
    messageText = message.text || "";
    messageType = message.type || type;
    messageTimestamp = message.timestamp || Date.now();
    rawData = message.rawData || null;
  } else if (typeof message === 'string') {
    // If message is a string
    messageText = message;
  } else {
    console.error("Invalid message format:", message);
    return;
  }
  
  // Skip emotional transition messages
  if (typeof messageText === 'string' && (
      messageText.includes("Emotional state transition:") || 
      messageText.includes("Final emotional state transition:") ||
      messageText.includes("Emotion changed to") ||
      messageText.includes("Final emotion state:"))) {
    return; // Don't add these messages
  }
  
  backendMessages.push({
    text: messageText,
    timestamp: messageTimestamp,
    type: messageType,
    rawData: rawData
  });
  
  if (backendMessages.length > 50) {
    backendMessages.shift();
  }
  
  // Add pulse effect based on message type
  let pulseColor;
  switch(messageType) {
    case "system":
      pulseColor = systemMsgColor;
      break;
    case "cognitive":
      pulseColor = cognitiveMsgColor;
      break;
    case "sensor":
    case "biometric":
      pulseColor = sensorMsgColor;
      break;
    case "error":
      pulseColor = color(255, 80, 80); // Red
      break;
    case "insight":
      pulseColor = color(255, 140, 0); // Orange
      break;
    default:
      pulseColor = lightText;
  }
  
  addPulseEffect(backendX, backendY, backendW, backendH, pulseColor);
}

// Draw backend panel
function drawBackendPanel(x, y, w, h) {
  push();
  translate(x, y);
  
  // Draw panel background
  fill(panelBg);
  noStroke();
  rect(0, 0, w, h, panelRounding);
  
  // Draw title
  fill(lightText);
  textSize(14);
  textAlign(LEFT, TOP);
  text("Section 3: System Log - Telemetry Stream", 10, 10);
  
  // Define content area (below title)
  let titleHeight = 30;
  let contentY = titleHeight;
  let contentHeight = h - titleHeight;
  
  // Create clipping region for messages (only for content area)
  push();
  beginClip();
  rect(0, contentY, w, contentHeight, 0, 0, panelRounding, panelRounding);
  endClip();
  
  // Calculate total content height
  let totalContentHeight = 0;
  let messageHeight = 25;
  let messageSpacing = 5;
  
  for (let i = 0; i < backendMessages.length; i++) {
    totalContentHeight += messageHeight + messageSpacing;
  }
  
  // Calculate max scroll
  maxBackendScroll = max(0, totalContentHeight - contentHeight);
  
  // Constrain scroll position
  backendScrollY = constrain(backendScrollY, 0, maxBackendScroll);
  
  // Draw messages
  let currentY = contentY - backendScrollY;
  
  // Map of emotions to their display colors
  const emotionColors = {
    'happy': color(0, 255, 0),      // Green
    'neutral': color(200, 200, 200), // Light gray
    'confused': color(255, 160, 0),  // Orange
    'frustrated': color(255, 60, 60), // Red
    'angry': color(255, 0, 0),      // Red
    'sad': color(80, 80, 255),       // Blue
    'surprise': color(0, 200, 255),  // Cyan
    'disgust': color(255, 120, 0)    // Orange
  };
  
  for (let i = 0; i < backendMessages.length; i++) {
    let msg = backendMessages[i];
    
    // Skip if outside visible area
    if (currentY + messageHeight < contentY || currentY > contentY + contentHeight) {
      currentY += messageHeight + messageSpacing;
      continue;
    }
    
    // Set color based on message type
    let msgColor;
    switch(msg.type) {
      case "system":
        msgColor = systemMsgColor;
        break;
      case "cognitive":
        msgColor = cognitiveMsgColor;
        break;
      case "sensor":
      case "biometric":
        msgColor = sensorMsgColor;
        break;
      case "error":
        msgColor = color(255, 80, 80); // Red
        break;
      case "insight":
        msgColor = color(255, 140, 0); // Orange
        break;
      default:
        msgColor = lightText;
    }
    
    // Format timestamp with HH:MM
    let timestamp = "";
    if (msg.timestamp) {
      let date = new Date(msg.timestamp);
      timestamp = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " ";
    }
    
    // Draw timestamp in white color
    fill(255); // White color for timestamp
    textSize(12);
    textAlign(LEFT, TOP);
    text(timestamp, 10, currentY);
    
    // Calculate timestamp width to position the message text
    let timestampWidth = textWidth(timestamp);
    
    // Check if the message contains emotion information to highlight
    let messageText = msg.text;
    
    if (msg.type === "biometric" || msg.type === "cognitive") {
      // Parse text to find and highlight emotion words
      textAlign(LEFT, TOP);
      let currentX = 10 + timestampWidth;
      let words = messageText.split(' ');
      
      for (let j = 0; j < words.length; j++) {
        let word = words[j];
        let wordLower = word.toLowerCase();
        let wordColor = msgColor;
        
        // Check if word is an emotion (or contains an emotion)
        let foundEmotion = false;
        for (let emotion in emotionColors) {
          // Check if the word contains the emotion name (case-insensitive)
          if (wordLower.includes(emotion)) {
            // Highlight just the emotion part of the word
            let beforeEmotion = wordLower.substring(0, wordLower.indexOf(emotion));
            let emotionPart = word.substring(beforeEmotion.length, beforeEmotion.length + emotion.length);
            let afterEmotion = word.substring(beforeEmotion.length + emotion.length);
            
            // Check for punctuation/parentheses
            let punctuation = '';
            if (afterEmotion.match(/^[,.;:!?)'"\]]/)) {
              punctuation = afterEmotion.match(/^[,.;:!?)'"\]]/)[0];
              afterEmotion = afterEmotion.substring(1);
            }
            
            // Draw parts before the emotion
            if (beforeEmotion) {
              fill(msgColor);
              text(beforeEmotion, currentX, currentY);
              currentX += textWidth(beforeEmotion);
            }
            
            // Draw the emotion in its color
            fill(emotionColors[emotion]);
            text(emotionPart, currentX, currentY);
            currentX += textWidth(emotionPart);
            
            // Draw punctuation (if any) in message color
            if (punctuation) {
              fill(msgColor);
              text(punctuation, currentX, currentY);
              currentX += textWidth(punctuation);
            }
            
            // Draw parts after the emotion
            if (afterEmotion) {
              fill(msgColor);
              text(afterEmotion, currentX, currentY);
              currentX += textWidth(afterEmotion);
            }
            
            foundEmotion = true;
            break;
          }
        }
        
        // If no emotion found in this word, draw it in the default color
        if (!foundEmotion) {
          fill(msgColor);
          text(word, currentX, currentY);
          currentX += textWidth(word);
        }
        
        // Add space between words
        if (j < words.length - 1) {
          fill(msgColor);
          text(" ", currentX, currentY);
          currentX += textWidth(" ");
        }
      }
    } else {
      // For non-biometric messages, draw the full text in the message color
      fill(msgColor);
      textAlign(LEFT, TOP);
      text(messageText, 10 + timestampWidth, currentY);
    }
    
    currentY += messageHeight + messageSpacing;
  }
  
  pop();
  
  // Draw scrollbar if needed
  if (maxBackendScroll > 0) {
    let scrollbarHeight = (contentHeight / totalContentHeight) * contentHeight;
    let scrollbarY = contentY + (backendScrollY / maxBackendScroll) * (contentHeight - scrollbarHeight);
    
    // Draw scrollbar track
    fill(40);
    rect(w - 10, contentY, 5, contentHeight, 2);
    
    // Draw scrollbar thumb
    fill(80);
    rect(w - 10, scrollbarY, 5, scrollbarHeight, 2);
  }
  
  pop();
}

// Adding demo script functionality

// Global variables for demo mode
let demoMode = false;
let currentScene = 0;
let demoScenes = [
  {
    // Scene 1: Neutral
    agentMessage: "Welcome to your Business Analytics training session. I'll guide you through key concepts to help you develop data analysis skills for informed business decisions. We'll cover Excel, SQL, and data visualization fundamentals. How familiar are you with data analysis?",
    userResponse: "I've played around with Excel for budgeting and stuff, but nothing fancy. Never touched SQL or that other one you mentioned.",
    bioSignals: {
      engagement: 0.7,
      emotion: "neutral",
      attention: 0.65,
      cognitiveLoad: 0.3
    }
  },
  {
    // Scene 2: Happy
    agentMessage: "Thank you for sharing your background. We'll start with foundational concepts and build from there. Let's begin with understanding the role of data in business decision-making.\n\nBusiness analytics transforms raw data into actionable insights. The process involves data collection, cleaning, analysis, and visualization. Let's start with Excel fundamentals for business contexts.",
    userResponse: "Cool, so it's like taking numbers and making them actually useful. What Excel tricks should I know?",
    bioSignals: {
      engagement: 0.75,
      emotion: "happy",
      attention: 0.7,
      cognitiveLoad: 0.4
    }
  },
  {
    // Scene 3: Confused getting more confused
    agentMessage: "Key Excel functions include VLOOKUP for data retrieval, SUMIF/COUNTIF for conditional calculations, and pivot tables for summarizing large datasets. Let me demonstrate how pivot tables can transform sales data into regional performance insights.",
    agentMessage2: "Now let's explore SQL fundamentals. SQL allows you to query databases to extract specific information. The basic syntax follows this pattern: SELECT columns FROM table WHERE conditions GROUP BY category HAVING group_conditions ORDER BY column;",
    userResponse: "Hmmm...So it's like asking database questions?",
    bioSignals: {
      engagement: 0.4,
      emotion: "confused", // Starts confused
      attention: 0.5,
      cognitiveLoad: 0.8
    },
    transitionTo: "confused", // Stay confused but with worse cognitive metrics
    transitionDelay: 8000, // Increased delay to 8 seconds to allow time for second message
    backendMessages: [
      { text: "Confusion detected. Recommend clarification protocol.", type: "cognitive" },
      { text: "Cognitive load high. Recommend procedural adjustment.", type: "cognitive" }
    ]
  },
  {
    // Scene 4: Frustrated to Neutral
    agentMessage: "I notice this might be challenging. Let me simplify. Think of SQL as a way to ask questions about your data. Let's break it down:",
    agentMessage2: "SELECT: What data you want\nFROM: Which table to use\nWHERE: Any conditions to filter by\n\nWould you like me to show you a visual example?",
    userResponse: "Yeah, that makes more sense. I'm just trying to picture how I'd use this at work.",
    bioSignals: {
      engagement: 0.6,
      emotion: "frustrated", // Starts frustrated
      attention: 0.65,
      cognitiveLoad: 0.6
    },
    transitionTo: "neutral", // Will transition to neutral during this scene
    transitionDelay: 6000, // Increased delay to 6 seconds
    backendMessages: [
      { text: "Frustration detected. Implementing simplification strategy.", type: "cognitive" },
      { text: "Cognitive load decreasing. Continue current approach.", type: "cognitive" }
    ]
  },
  {
    // Scene 5: Neutral to Happy
    agentMessage: "Here's a simpler approach. Imagine a spreadsheet of customer data. SQL lets you filter and organize this data to answer business questions like 'Which products are most profitable?' or 'Are certain regions underperforming?'",
    agentMessage2: "Let's apply what we've learned to a real scenario. The NYSE S&P dataset contains financial data for major companies. How might we use Excel and SQL to identify investment opportunities?",
    userResponse: "Hmm, maybe look at which companies are growing faster? Or find the ones that make steady money instead of going up and down all the time?",
    bioSignals: {
      engagement: 0.7,
      emotion: "neutral", // Starts neutral
      attention: 0.7,
      cognitiveLoad: 0.5
    },
    transitionTo: "happy", // Will transition to happy during this scene
    transitionDelay: 6000, // Increased delay to 6 seconds
    backendMessages: [
      { text: "Understanding increasing. Concept acquisition successful.", type: "cognitive" },
      { text: "Engagement metrics improving.", type: "cognitive" }
    ]
  },
  {
    // Scene 6: Happy to Neutral
    agentMessage: "Excellent approach! You could use SQL to extract year-over-year growth rates by sector, then visualize these trends in Excel or Tableau. This exact analysis helps investment firms identify promising sectors and companies. You're thinking like a business analyst now.",
    agentMessage2: "You've made excellent progress today. We covered Excel functions for data analysis, SQL basics for data querying, and applied these concepts to financial analysis. For our next session, we'll explore data visualization with Tableau. Would you like me to prepare any specific examples?",
    userResponse: "This was pretty cool. Next time could we look at making those dashboard things? My boss loves graphs and charts.",
    bioSignals: {
      engagement: 0.8,
      emotion: "happy", // Starts happy
      attention: 0.75,
      cognitiveLoad: 0.4
    },
    transitionTo: "neutral", // Will transition to neutral during this scene
    transitionDelay: 6000, // Increased delay to 6 seconds
    backendMessages: [
      { text: "Session completion approaching. Preparing conclusion.", type: "system" },
      { text: "User satisfaction metrics high.", type: "cognitive" }
    ]
  },
  {
    // Scene 7: Neutral to Happy to Neutral
    agentMessage: "Perfect suggestion. I'll prepare examples of KPI dashboards that integrate the Excel and SQL skills we discussed today. Your engagement with these concepts has been impressive, especially how you worked through the SQL complexity. See you at our next session!",
    userResponse: "",
    bioSignals: {
      engagement: 0.8,
      emotion: "neutral", // Starts neutral
      attention: 0.75,
      cognitiveLoad: 0.3
    },
    transitionTo: "happy", // First transition to happy
    transitionDelay: 3000, // Transition after 3 seconds
    finalEmotion: "neutral", // Final transition back to neutral
    finalTransitionDelay: 6000, // Final transition after 6 seconds (3s after first transition)
    backendMessages: [
      { text: "Session concluding. Positive reinforcement delivered.", type: "cognitive" },
      { text: "Brief positive emotional response detected.", type: "cognitive" },
      { text: "Returning to baseline emotional state.", type: "cognitive" }
    ]
  }
];

// Add demo controls
let demoButton;
let nextSceneButton;
let resetDemoButton;

// Update setup function to position demo controls at the bottom
function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Set up colors
  darkBg = color(20, 20, 30);
  lightText = color(220, 220, 220);
  accentColor1 = color(75, 207, 250);
  accentColor2 = color(131, 56, 236);
  panelBg = color(30, 30, 40, 200);
  userBubbleColor = color(45, 45, 60);
  agentBubbleColor = color(30, 30, 45);
  systemMsgColor = color(150, 150, 150); // Gray
  cognitiveMsgColor = color(100, 170, 255); // Blue
  sensorMsgColor = color(255, 200, 100); // Orange
  
  // Define constants for input area
  const inputElementHeight = 25; // Reduced height by 10% (from 28)
  const inputAreaPadding = 5;   
  const totalInputAreaHeight = inputElementHeight + inputAreaPadding * 2; 
  const bottomMargin = 10;
  const inputButtonGap = 10; 

  // Calculate section heights with adjusted ratios
  let sectionPadding = 10;
  let section1Height = height * 0.3;
  let section2Height = height * 0.25;
  
  // Calculate section 3 height considering the new input area height
  let section3Height = height - section1Height - section2Height - (sectionPadding * 3) - totalInputAreaHeight - bottomMargin;
  
  // SECTION 1: Bio-signal inputs
  let section1Y = sectionPadding;
  let leftPanelWidth = width * 0.6 - sectionPadding * 1.5;
  let rightPanelWidth = width * 0.4 - sectionPadding * 1.5;
  
  // EEG and Webcam panels
  eegX = sectionPadding;
  eegY = section1Y;
  eegW = leftPanelWidth;
  eegH = section1Height - sectionPadding;
  
  webcamX = eegX + eegW + sectionPadding;
  webcamY = section1Y;
  webcamW = rightPanelWidth;
  webcamH = section1Height - sectionPadding;
  
  // Update webcamPanel position and dimensions
  if (webcamPanel) {
    webcamPanel.x = webcamX;
    webcamPanel.y = webcamY;
    webcamPanel.w = webcamW;
    webcamPanel.h = webcamH;
    
    // Recreate the graphics buffer with new dimensions
    webcamPanel.graphics = createGraphics(webcamW, webcamH);
    webcamPanel.markDirty();
  }
  
  // SECTION 2: Cognitive State
  let section2Y = section1Y + section1Height + sectionPadding;
  stateX = sectionPadding;
  stateY = section2Y;
  stateW = width - sectionPadding * 2;
  stateH = section2Height - sectionPadding;
  
  // SECTION 3: Chat and Backend
  let section3Y = section2Y + section2Height + sectionPadding;
  chatX = sectionPadding;
  chatY = section3Y;
  chatW = leftPanelWidth;
  chatH = section3Height;
  
  backendX = chatX + chatW + sectionPadding;
  backendY = section3Y;
  backendW = rightPanelWidth;
  backendH = section3Height;
  
  // INPUT AREA Calculations
  let inputAreaY = section3Y + section3Height; 
  inputX = chatX;
  inputY = inputAreaY + inputAreaPadding; 
  inputW = chatW;
  inputH = inputElementHeight; // Use the updated constant height
  
  try {
    // Create input field (safely with try/catch)
    let inputFieldWidth = inputW - 120; 
    inputElement = createInput();
    if (inputElement) {
      inputElement.position(inputX + 10, inputY); 
      inputElement.size(inputFieldWidth, inputH); // Use updated inputH
      inputElement.style('background-color', '#2a2a3a');
      inputElement.style('color', '#ddd');
      inputElement.style('border', 'none');
      inputElement.style('border-radius', '5px');
      inputElement.style('padding', '5px 10px');
      inputElement.style('font-family', 'Arial');
      inputElement.style('font-size', '14px');
      // Vertically align text inside input box using the updated height
      inputElement.style('line-height', inputH + 'px'); 
    }
    
    // Create send button
    sendButton = createButton('Send');
    if (sendButton) {
      // Position button to the right of the input field with a gap, moved further right
      let sendButtonX = inputX + 10 + inputFieldWidth + inputButtonGap + (80 * 0.15); // Add 15% of button width (80 * 0.15 = 12)
      sendButton.position(sendButtonX, inputY); 
      sendButton.size(80, inputH); // Use updated inputH
      sendButton.style('background-color', accentColor1.toString());
      sendButton.style('color', '#fff');
      sendButton.style('border', 'none');
      sendButton.style('border-radius', '5px');
      sendButton.style('font-family', 'Arial');
      sendButton.style('font-size', '14px');
      sendButton.style('cursor', 'pointer');
      sendButton.mousePressed(handleSubmit);
    }
    
    // Create demo controls (ensure they align vertically)
    demoButton = createButton('Start Demo');
    if (demoButton) {
      demoButton.position(backendX, inputY); 
      demoButton.size(100, inputH); // Use updated inputH
      demoButton.style('background-color', accentColor2.toString());
      demoButton.style('color', '#fff');
      demoButton.style('border', 'none');
      demoButton.style('border-radius', '5px');
      demoButton.style('font-family', 'Arial');
      demoButton.style('font-size', '14px');
      demoButton.style('cursor', 'pointer');
      demoButton.mousePressed(toggleDemo);
    }
    
    nextSceneButton = createButton('Next Scene');
    if (nextSceneButton) {
      nextSceneButton.position(backendX + 110, inputY); 
      nextSceneButton.size(100, inputH); // Use updated inputH
      nextSceneButton.style('background-color', accentColor1.toString());
      nextSceneButton.style('color', '#fff');
      nextSceneButton.style('border', 'none');
      nextSceneButton.style('border-radius', '5px');
      nextSceneButton.style('font-family', 'Arial');
      nextSceneButton.style('font-size', '14px');
      nextSceneButton.style('cursor', 'pointer');
      nextSceneButton.mousePressed(nextScene);
      nextSceneButton.hide(); // Hide until demo starts
    }
    
    resetDemoButton = createButton('Reset Demo');
    if (resetDemoButton) {
      resetDemoButton.position(backendX + 220, inputY); 
      resetDemoButton.size(100, inputH); // Use updated inputH
      resetDemoButton.style('background-color', color(255, 100, 100).toString());
      resetDemoButton.style('color', '#fff');
      resetDemoButton.style('border', 'none');
      resetDemoButton.style('border-radius', '5px');
      resetDemoButton.style('font-family', 'Arial');
      resetDemoButton.style('font-size', '14px');
      resetDemoButton.style('cursor', 'pointer');
      resetDemoButton.mousePressed(resetDemo);
      resetDemoButton.hide(); // Hide until demo starts
    }
  } catch (e) {
    console.error("Error setting up UI elements:", e);
  }
  
  // Update any existing chat messages that use "Agent" 
  for (let i = 0; i < chatMessages.length; i++) {
    if (chatMessages[i].sender === "Agent") {
      chatMessages[i].sender = "AI Instructor";
    }
  }
  
  // Add initial message with "AI Instructor"
  addChatMessage("AI Instructor", "Hello! How can I help you today?");
  
  // Initialize emotional and cognitive states with reasonable values
  currentEmotion = "neutral";
  emotionIntensity = 0.5;
  engagementScore = 0.7;
  attentionScore = 0.65;
  cognitiveLoad = 0.4;
  
  // Initialize EEG wave parameters for neutral state
  alphaAmplitude = 0.5 + Math.random() * 0.1;
  betaAmplitude = 0.5 + Math.random() * 0.1;
  thetaAmplitude = 0.3 + Math.random() * 0.1;
  deltaAmplitude = 0.3 + Math.random() * 0.1;
  
  // Replace testTimestamp with more useful initialization messages
  addBackendMessage("System initialized", "system");
  addBackendMessage("Bio-signal processing ready", "sensor");
  addBackendMessage("Cognitive analysis engine loaded", "cognitive");
  
  // Create WebcamPanel instance with proper parameters
  try {
    console.log("Creating WebcamPanel instance...");
    if (typeof WebcamPanel === 'undefined') {
      console.error("WebcamPanel class is not defined! Check if panels.js is loaded properly.");
      // Create a fallback object so the app doesn't crash
      webcamPanel = {
        x: webcamX,
        y: webcamY,
        w: webcamW,
        h: webcamH,
        bioSignalData: { currentEmotion: currentEmotion },
        graphics: createGraphics(webcamW, webcamH),
        markDirty: function() {},
        drawToCanvas: function() {
          // Use fallback drawing function
          drawWebcamPanel(webcamX, webcamY, webcamW, webcamH);
        },
        destroy: function() {},
        forceStopWebcam: function() {}
      };
    } else {
      webcamPanel = new WebcamPanel(
        "Bio-Signal Input - Computer Vision",
        webcamX,
        webcamY,
        webcamW,
        webcamH,
        { currentEmotion: currentEmotion }
      );
      console.log("WebcamPanel created successfully");
      
      // CRITICAL: Make webcamPanel available in global window scope
      window.webcamPanel = webcamPanel;
    }
  } catch (e) {
    console.error("Error creating WebcamPanel:", e);
    // Create a fallback object so the app doesn't crash
    webcamPanel = {
      x: webcamX,
      y: webcamY,
      w: webcamW,
      h: webcamH,
      bioSignalData: { currentEmotion: currentEmotion },
      graphics: createGraphics(webcamW, webcamH),
      markDirty: function() {},
      drawToCanvas: function() {
        // Use fallback drawing function
        drawWebcamPanel(webcamX, webcamY, webcamW, webcamH);
      },
      destroy: function() {},
      forceStopWebcam: function() {}
    };
  }
  
  // Add event listener to clean up webcamPanel resources when window closes
  window.addEventListener('beforeunload', () => {
    if (webcamPanel) {
      webcamPanel.destroy();
    }
  });
  
  // Track session start time for biometric context
  window.sessionStartTime = Date.now();
  
  // Initialize demo state
  frameCount = 0;
  window.currentEmotion = "neutral";
  window.emotionIntensity = 0.5;
}

// Toggle demo mode
function toggleDemo() {
  demoMode = !demoMode;
  
  if (demoMode) {
    // Start demo
    demoButton.html('Stop Demo');
    nextSceneButton.show();
    resetDemoButton.show();
    
    // If webcam is active, force stop it
    if (webcamPanel && webcamPanel.isWebcamActive) {
      webcamPanel.forceStopWebcam();
      addBackendMessage("Webcam disabled for demo mode", "system");
    }
    
    // Clear existing messages
    chatMessages = [];
    backendMessages = [];
    
    // Start with first scene
    currentScene = 0;
    playScene(currentScene);
  } else {
    // Stop demo
    demoButton.html('Start Demo');
    nextSceneButton.hide();
    resetDemoButton.hide();
    
    // Add message that webcam can be used again
    addBackendMessage("Demo ended. Webcam can now be used", "system");
  }
}

// Play the current scene
function playScene(sceneIndex) {
  if (sceneIndex >= demoScenes.length) {
    return;
  }
  
  let scene = demoScenes[sceneIndex];
  
  // Update bio signals
  engagementScore = scene.bioSignals.engagement;
  currentEmotion = scene.bioSignals.emotion;
  emotionIntensity = 0.5; // Reset emotion intensity at start of scene
  
  // Ensure webcamPanel updates with the initial emotion
  if (webcamPanel) {
    if (!webcamPanel.bioSignalData) {
      webcamPanel.bioSignalData = {};
    }
    webcamPanel.bioSignalData.currentEmotion = scene.bioSignals.emotion;
    webcamPanel.markDirty(); // Force a redraw
    console.log("Scene started - set webcamPanel emotion to:", scene.bioSignals.emotion);
  }
  
  // Add agent message (will be split automatically if long)
  addChatMessage("AI Instructor", scene.agentMessage);
  
  // Add second agent message if it exists (with delay)
  if (scene.agentMessage2) {
    setTimeout(() => {
      addChatMessage("AI Instructor", scene.agentMessage2);
    }, 3000); // Reduced from 4000 to 3000 ms for better flow
  }
  
  // Add welcome message if available
  if (scene.welcomeMessage) {
    addChatMessage("AI Instructor", scene.welcomeMessage);
  }
  
  // Handle within-scene transitions
  if (scene.transitionTo) {
    setTimeout(() => {
      // Set the global current emotion
      currentEmotion = scene.transitionTo;
      emotionIntensity = 0.7;
      
      // Ensure webcamPanel updates with the new emotion
      if (webcamPanel) {
        // Update bioSignalData with the current emotion
        if (!webcamPanel.bioSignalData) {
          webcamPanel.bioSignalData = {};
        }
        webcamPanel.bioSignalData.currentEmotion = scene.transitionTo;
        
        // Force a redraw of the panel
        webcamPanel.markDirty();
        
        console.log("Scene transition - updated webcamPanel emotion to:", scene.transitionTo);
      }
      
      // Update bio signals for the new emotion
      if (currentEmotion === "neutral") {
        engagementScore = Math.min(engagementScore + 0.2, 0.9);
        cognitiveLoad = Math.max(cognitiveLoad - 0.2, 0.3);
      } else if (currentEmotion === "happy") {
        engagementScore = Math.min(engagementScore + 0.3, 0.9);
        cognitiveLoad = Math.max(cognitiveLoad - 0.3, 0.2);
      } else if (currentEmotion === "frustrated") {
        engagementScore = Math.max(engagementScore - 0.2, 0.2);
        cognitiveLoad = Math.min(cognitiveLoad + 0.2, 0.9);
      }
    }, scene.transitionDelay || 6000);
  }
  
  // Add more detailed telemetry specifically for scenes 1 and 2
  if (sceneIndex === 0) { // Scene 1
    // Initial scene needs more detailed telemetry
    addBackendMessage("Demo initialized: Scene 1", "system");
    addBackendMessage("User profile loaded", "system");
    addBackendMessage("Bio-signal detection active", "sensor");
    addBackendMessage("Baseline emotion detected: " + currentEmotion, "cognitive");
    addBackendMessage("Engagement level: " + engagementScore.toFixed(2), "cognitive");
    
    // Add delayed messages for scene progression
    setTimeout(() => {
      addBackendMessage("EEG alpha wave activity: Normal", "sensor");
    }, 2000);
    
    setTimeout(() => {
      addBackendMessage("Attention metrics: Establishing baseline", "cognitive");
    }, 4000);
  } 
  else if (sceneIndex === 1) { // Scene 2
    // Scene 2 telemetry
    addBackendMessage("Scene 2 activated", "system");
    addBackendMessage("Current emotion state: " + currentEmotion, "cognitive");
    addBackendMessage("Engagement trend: Increasing", "cognitive");
    
    // Add delayed messages for scene progression
    setTimeout(() => {
      addBackendMessage("Cognitive load analysis initialized", "cognitive");
    }, 1500);
    
    setTimeout(() => {
      addBackendMessage("EEG beta wave activity: Elevated", "sensor");
    }, 3000);
    
    setTimeout(() => {
      addBackendMessage("Attention focus: Strong", "cognitive");
    }, 4500);
  }
  
  // Add any backend messages from the scene definition
  if (scene.backendMessages) {
    for (let i = 0; i < scene.backendMessages.length; i++) {
      let msg = scene.backendMessages[i];
      setTimeout(() => {
        addBackendMessage(msg.text, msg.type);
      }, 4500 + i * 1200); // Reduced from 6000 + i * 1500 for faster display
    }
  }
  
  // Add user response after a delay (if not empty)
  if (scene.userResponse) {
    setTimeout(() => {
      addChatMessage("User", scene.userResponse);
    }, scene.agentMessage2 ? 5500 : 2000); // Reduced delays for quicker turn-taking
  }
  
  // Handle final transition if specified
  if (scene.finalEmotion) {
    setTimeout(() => {
      // Set the global current emotion
      currentEmotion = scene.finalEmotion;
      emotionIntensity = 0.6;
      
      // Ensure webcamPanel updates with the final emotion
      if (webcamPanel) {
        // Update bioSignalData with the current emotion
        if (!webcamPanel.bioSignalData) {
          webcamPanel.bioSignalData = {};
        }
        webcamPanel.bioSignalData.currentEmotion = scene.finalEmotion;
        
        // Force a redraw of the panel
        webcamPanel.markDirty();
        
        console.log("Final transition - updated webcamPanel emotion to:", scene.finalEmotion);
      }
      
      // Update bio signals for the final emotion
      if (scene.finalEmotion === "neutral") {
        engagementScore = 0.7;
        cognitiveLoad = 0.5;
      }
    }, scene.finalTransitionDelay || 6000);
  }
}

// Similarly enhance nextScene function for scene transitions
function nextScene() {
  if (currentScene < demoScenes.length - 1) {
    currentScene++;
    
    // Reset transition flags for the new scene
    if (demoScenes[currentScene].transitionTo) {
      demoScenes[currentScene].transitioned = false;
    }
    if (demoScenes[currentScene].finalEmotion) {
      demoScenes[currentScene].finalTransitioned = false;
    }
    
    // Record the start time of this scene
    sceneStartTime = millis();
    
    // Add a message to the backend panel
    addBackendMessage("Scene " + (currentScene + 1) + " started", "system");
    
    // Set the initial emotion for this scene
    currentEmotion = demoScenes[currentScene].bioSignals.emotion;
    emotionIntensity = 0.5;
    
    // Use playScene which properly handles all aspects of scene playback
    playScene(currentScene);
  }
}

// Ensure startDemo has sufficient telemetry for scene 1
function startDemo() {
  demoMode = true;
  currentScene = 0;
  sceneStartTime = millis();
  
  // Clear existing messages
  chatMessages = [];
  backendMessages = [];
  
  // Set initial emotion
  currentEmotion = demoScenes[currentScene].bioSignals.emotion;
  emotionIntensity = 0.5;
  
  // Add first scene messages
  addChatMessage("AI Instructor", demoScenes[currentScene].agentMessage);
  
  setTimeout(() => {
    addChatMessage("User", demoScenes[currentScene].userResponse);
  }, 800); // Reduced from 1000 to 800ms for quicker response
  
  // Add more detailed system startup messages
  addBackendMessage("Demo mode initialized", "system");
  addBackendMessage("Loading neural interface drivers...", "system");
  addBackendMessage("Neural interface drivers loaded", "system");
  addBackendMessage("Bio-signal processing module activated", "sensor");
  addBackendMessage("Cognitive state analysis engine ready", "cognitive");
  addBackendMessage("Emotion detection subsystem calibrated", "cognitive");
  
  // Add welcome message if available
  if (demoScenes[0].welcomeMessage) {
    addChatMessage("AI Instructor", demoScenes[0].welcomeMessage);
  }
  
  // Add any backend messages for this scene
  if (demoScenes[currentScene].backendMessages) {
    for (let i = 0; i < demoScenes[currentScene].backendMessages.length; i++) {
      let msg = demoScenes[currentScene].backendMessages[i];
      setTimeout(() => {
        addBackendMessage(msg.text, msg.type);
      }, 3500 + i * 1500); // Start after our custom messages
    }
  }
}

// Move to next scene
function nextScene() {
  currentScene++;
  if (currentScene < demoScenes.length) {
    playScene(currentScene);
  } else {
    // End of demo
    addBackendMessage("Demo completed", "system");
  }
}

// Reset demo
function resetDemo() {
  // Clear existing messages
  chatMessages = [];
  backendMessages = [];
  
  // Reset to first scene
  currentScene = 0;
  playScene(currentScene);
}

// New function to update EEG parameters based on scene
function updateEEGParameters(sceneIndex, scene) {
  switch(sceneIndex) {
    case 0: // Introduction & Baseline
      // Balanced, slightly elevated beta (attention)
      alphaAmplitude = 0.6;  // Moderate relaxation
      betaAmplitude = 0.7;   // Good attention
      thetaAmplitude = 0.3;  // Low drowsiness
      deltaAmplitude = 0.2;  // Very low deep sleep
      
      // Add backend message about EEG state
      setTimeout(() => {
        addBackendMessage("EEG: Balanced activity with good attention", "cognitive");
      }, 1000);
      break;
      
    case 1: // Initial Learning
      // Higher beta (active learning), good alpha (comfortable)
      alphaAmplitude = 0.5;  // Comfortable
      betaAmplitude = 0.9;   // High cognitive activity
      thetaAmplitude = 0.2;  // Very alert
      deltaAmplitude = 0.1;  // Fully awake
      
      setTimeout(() => {
        addBackendMessage("EEG: Increased beta waves - active learning", "cognitive");
      }, 1000);
      break;
      
    case 2: // Complexity Increases (confusion)
      // Very high beta (cognitive strain), low alpha (stress)
      alphaAmplitude = 0.2;  // Low relaxation (stress)
      betaAmplitude = 1.2;   // Very high cognitive load
      thetaAmplitude = 0.4;  // Slight increase (mental wandering)
      deltaAmplitude = 0.1;  // Fully awake
      
      setTimeout(() => {
        addBackendMessage("EEG: Cognitive load high - beta spike detected", "cognitive");
        setTimeout(() => {
          addBackendMessage("EEG: Alpha suppression indicates stress", "cognitive");
        }, 800);
      }, 1000);
      break;
      
    case 3: // Adaptation & Simplification
      // Beta decreasing, alpha increasing (relief)
      alphaAmplitude = 0.4;  // Increasing relaxation
      betaAmplitude = 0.8;   // Decreasing cognitive load
      thetaAmplitude = 0.3;  // Normal
      deltaAmplitude = 0.1;  // Fully awake
      
      setTimeout(() => {
        addBackendMessage("EEG: Cognitive load decreasing", "cognitive");
      }, 1000);
      break;
      
    case 4: // Recovery & Application
      // Balanced, healthy pattern
      alphaAmplitude = 0.7;  // Good relaxation
      betaAmplitude = 0.7;   // Engaged but not strained
      thetaAmplitude = 0.3;  // Normal
      deltaAmplitude = 0.1;  // Fully awake
      
      setTimeout(() => {
        addBackendMessage("EEG: Optimal learning state detected", "cognitive");
      }, 1000);
      break;
      
    case 5: // Breakthrough & Conclusion
      // High alpha (satisfaction), moderate beta (understanding)
      alphaAmplitude = 0.9;  // High satisfaction
      betaAmplitude = 0.6;   // Understanding without strain
      thetaAmplitude = 0.4;  // Slight increase (creative thinking)
      deltaAmplitude = 0.1;  // Fully awake
      
      setTimeout(() => {
        addBackendMessage("EEG: Alpha-dominant pattern - satisfaction", "cognitive");
      }, 1000);
      break;
      
    case 6: // Conclusion
      // Balanced, slightly elevated alpha (relaxed satisfaction)
      alphaAmplitude = 0.8;  // Relaxed satisfaction
      betaAmplitude = 0.5;   // Reduced cognitive effort
      thetaAmplitude = 0.3;  // Normal
      deltaAmplitude = 0.2;  // Slight increase (winding down)
      
      setTimeout(() => {
        addBackendMessage("EEG: Session-end pattern - relaxed satisfaction", "cognitive");
      }, 1000);
      break;
      
    default:
      // Default balanced state
      alphaAmplitude = 0.5;
      betaAmplitude = 0.5;
      thetaAmplitude = 0.3;
      deltaAmplitude = 0.2;
  }
}

// Update the draw function to respect the webcam state control
function draw() {
  // Draw background
  background(darkBg);
  
  // If in demo mode, slightly animate EEG parameters and update demo scene
  if (demoMode) {
    // Add subtle animation to EEG parameters
    alphaAmplitude += sin(frameCount * 0.01) * 0.005;
    betaAmplitude += sin(frameCount * 0.02) * 0.005;
    thetaAmplitude += sin(frameCount * 0.015) * 0.003;
    deltaAmplitude += sin(frameCount * 0.005) * 0.002;
    
    // Update demo scene state
    updateDemoScene();
  } 
  // Check if webcam is actively controlling state
  else if (webcamControlsState && webcamPanel) {
    // Get the current time
    let currentTime = millis();
    
    // Check if it's time for a webcam state update (twice per second now)
    if (currentTime - lastWebcamUpdate > WEBCAM_UPDATE_INTERVAL) {
      lastWebcamUpdate = currentTime;
      
      // CRITICAL WEBCAM EMOTION SYNCHRONIZATION
      // This section ensures the emotion bar always updates in webcam mode
      
      // First check if we have any emotion data from the webcam
      let webcamEmotion = null;
      if (webcamPanel.bioSignalData && webcamPanel.bioSignalData.emotion) {
        webcamEmotion = webcamPanel.bioSignalData.emotion;
        
        // Force the global emotion to match webcam detection
        if (currentEmotion !== webcamEmotion) {
          console.log(`SYNC: Updating emotion from ${currentEmotion} to webcam emotion ${webcamEmotion}`);
          currentEmotion = webcamEmotion;
          emotionIntensity = 0.7; // Set moderate intensity
          
          // Pulse effect for visual feedback
          addPulseEffect(stateX, stateY, stateW, stateH, accentColor1);
        } else {
          // Even if same emotion, keep intensity high
          emotionIntensity = Math.max(emotionIntensity, 0.7);
        }
      } else {
        // If no webcam emotion data yet, log it
        console.log("No webcam emotion data available yet");
      }
      
      // ALWAYS update metrics if available - this part works correctly
      if (webcamPanel.bioSignalData) {
        // Update engagement
        if (webcamPanel.bioSignalData.engagement !== undefined) {
          engagementScore = webcamPanel.bioSignalData.engagement;
          engagementScore = constrain(engagementScore, 0, 1);
        }
        
        // Update attention
        if (webcamPanel.bioSignalData.attention !== undefined) {
          attentionScore = webcamPanel.bioSignalData.attention;
          attentionScore = constrain(attentionScore, 0, 1);
        }
        
        // Update cognitive load
        if (webcamPanel.bioSignalData.cognitiveLoad !== undefined) {
          cognitiveLoad = webcamPanel.bioSignalData.cognitiveLoad;
          cognitiveLoad = constrain(cognitiveLoad, 0, 1);
        }
      }
      
      // Update EEG wave parameters to match the current emotional state
      updateEEGWavesForEmotion(currentEmotion);
    }
    
    // In webcam mode, add subtle random variations to the EEG signals only
    // - NOT to the emotion intensity which should stay stable based on detected emotion
    alphaAmplitude += (sin(frameCount * 0.01) * 0.003) + (random(-0.002, 0.002));
    betaAmplitude += (sin(frameCount * 0.02) * 0.003) + (random(-0.002, 0.002));
    thetaAmplitude += (sin(frameCount * 0.015) * 0.002) + (random(-0.001, 0.001));
    deltaAmplitude += (sin(frameCount * 0.005) * 0.002) + (random(-0.001, 0.001));
    
    // Keep values in reasonable range
    alphaAmplitude = constrain(alphaAmplitude, 0.1, 1.0);
    betaAmplitude = constrain(betaAmplitude, 0.1, 1.0);
    thetaAmplitude = constrain(thetaAmplitude, 0.1, 0.8);
    deltaAmplitude = constrain(deltaAmplitude, 0.1, 0.8);
    
    // REMOVE this line that was causing continuous fluctuations in emotion intensity
    // emotionIntensity = emotionIntensity * 0.999 + (sin(frameCount * 0.01) * 0.003);
    // Instead, let the emotion intensity decay very slowly for stability
    emotionIntensity = emotionIntensity * 0.99995;
    emotionIntensity = constrain(emotionIntensity, 0.5, 1.0);
  } 
  // Default non-webcam, non-demo mode
  else {
    // In this mode, add subtle random variations to the EEG signals only
    alphaAmplitude += (sin(frameCount * 0.01) * 0.003) + (random(-0.002, 0.002));
    betaAmplitude += (sin(frameCount * 0.02) * 0.003) + (random(-0.002, 0.002));
    thetaAmplitude += (sin(frameCount * 0.015) * 0.002) + (random(-0.001, 0.001));
    deltaAmplitude += (sin(frameCount * 0.005) * 0.002) + (random(-0.001, 0.001));
    
    // Keep values in reasonable range
    alphaAmplitude = constrain(alphaAmplitude, 0.1, 1.0);
    betaAmplitude = constrain(betaAmplitude, 0.1, 1.0);
    thetaAmplitude = constrain(thetaAmplitude, 0.1, 0.8);
    deltaAmplitude = constrain(deltaAmplitude, 0.1, 0.8);
    
    // REMOVE this line that was causing continuous fluctuations in emotion intensity
    // emotionIntensity += (sin(frameCount * 0.01) * 0.005);
    // Instead, let the emotion intensity decay very slowly
    emotionIntensity = emotionIntensity * 0.99995;
    emotionIntensity = constrain(emotionIntensity, 0.5, 1.0);
  }
  
  // Update webcamPanel with the current emotion
  if (webcamPanel) {
    // Ensure we're setting the correct property and it's accessible
    if (!webcamPanel.bioSignalData) {
      webcamPanel.bioSignalData = {};
    }
    
    // CRITICAL FIX: Handle emotion data differently based on mode
    if (webcamControlsState === true) {
      // In webcam control mode, always ensure global state matches panel data
      // This is another sync path that ensures consistency
      
      // Check if we have valid emotion data from webcam
      if (webcamPanel.bioSignalData && webcamPanel.bioSignalData.emotion) {
        // If emotion data exists, ensure global state matches
        if (currentEmotion !== webcamPanel.bioSignalData.emotion) {
          // Force sync on every frame if emotions don't match
          let prevEmotion = currentEmotion;
          currentEmotion = webcamPanel.bioSignalData.emotion;
          console.log(`🔄 FORCED SYNC: Updated global emotion from ${prevEmotion} to ${currentEmotion}`);
          
          // Also update the intensity for visibility
          emotionIntensity = 0.7;
        }
      }
    } 
    // In non-webcam control mode, set the webcam panel's emotion from global state
    else {
      webcamPanel.bioSignalData.currentEmotion = currentEmotion;
      webcamPanel.bioSignalData.emotion = currentEmotion; // Make sure both properties are set
    }
    
    // Set webcamPanel.bioSignalData.emotion to match current emotion
    if (webcamPanel.bioSignalData.currentEmotion && !webcamPanel.bioSignalData.emotion) {
      webcamPanel.bioSignalData.emotion = webcamPanel.bioSignalData.currentEmotion;
    }
    else if (webcamPanel.bioSignalData.emotion && !webcamPanel.bioSignalData.currentEmotion) {
      webcamPanel.bioSignalData.currentEmotion = webcamPanel.bioSignalData.emotion;
    }
  }
  
  // Draw panels with labels
  drawEEGPanel(eegX, eegY, eegW, eegH);
  drawStatePanel(stateX, stateY, stateW, stateH);
  
  // Use the panel object's drawToCanvas method instead of drawWebcamPanel function
  webcamPanel.drawToCanvas();
  
  drawChatPanel(chatX, chatY, chatW, chatH);
  drawBackendPanel(backendX, backendY, backendW, backendH);
  drawInputArea(inputX, inputY, inputW, inputH);
  
  // Draw pulse effects
  updatePulseEffects();
  drawPulseEffects();
  
  // Update webcam update interval
  if (webcamControlsState && webcamPanel) {
    // Force webcam panel to be properly initialized
    window.webcamPanel = webcamPanel;
    
    // Log state every 5 seconds
    if (frameCount % 300 === 0) {
      console.log(`🎥 Webcam is controlling state, interval: ${WEBCAM_UPDATE_INTERVAL}ms`);
    }
  }
}

function drawPanel(x, y, w, h, title) {
  push();
  translate(x, y);
  
  // Draw panel background
  fill(panelBg);
  noStroke();
  rect(0, 0, w, h, panelRounding);
  
  // Draw title
  if (title) {
    fill(lightText);
    textSize(14);
    textAlign(LEFT, TOP);
    text(title, 10, 10);
  }
  
  pop();
}

function drawEEGPanel(x, y, w, h) {
  push();
  translate(x, y);
  
  // Draw panel background
  fill(panelBg);
  noStroke();
  rect(0, 0, w, h, panelRounding);
  
  // Draw title
  fill(lightText);
  textSize(14);
  textAlign(LEFT, TOP);
  text("SECTION 1: Bio-Signal Input - EEG Monitor", 10, 10);
  
  // Draw EEG waves with improved label positioning
  let waveY = 50;
  let waveHeight = 30;
  let waveSpacing = 40;
  let labelWidth = 60; // Fixed width for labels
  
  // Alpha waves (relaxation, calm)
  fill(lightText);
  textSize(12);
  textAlign(LEFT, CENTER);
  text("Alpha", 20, waveY);
  drawWave(20 + labelWidth, waveY, w - 40 - labelWidth, waveHeight, 0.5, color(100, 200, 255), alphaAmplitude);
  
  // Beta waves (active thinking, problem-solving)
  text("Beta", 20, waveY + waveSpacing);
  drawWave(20 + labelWidth, waveY + waveSpacing, w - 40 - labelWidth, waveHeight, 1.0, color(255, 100, 100), betaAmplitude);
  
  // Theta waves (drowsiness, meditation)
  text("Theta", 20, waveY + waveSpacing * 2);
  drawWave(20 + labelWidth, waveY + waveSpacing * 2, w - 40 - labelWidth, waveHeight, 0.2, color(100, 255, 150), thetaAmplitude);
  
  // Delta waves (deep sleep, unconsciousness)
  text("Delta", 20, waveY + waveSpacing * 3);
  drawWave(20 + labelWidth, waveY + waveSpacing * 3, w - 40 - labelWidth, waveHeight, 0.1, color(200, 150, 255), deltaAmplitude);
  
  pop();
}

function drawWave(x, y, width, height, frequency, waveColor, amplitude) {
  push();
  
  // Draw wave
  noFill();
  stroke(waveColor);
  strokeWeight(1.5);
  
  beginShape();
  for (let i = 0; i < width; i++) {
    // Create wave with some randomness
    let baseAmplitude = height * 0.4 * amplitude;
    let noise1 = noise(i * 0.05 + millis() * 0.0005) * height * 0.2 * amplitude;
    let noise2 = sin(i * frequency * 0.1 + millis() * 0.001) * baseAmplitude;
    
    let yPos = y + noise1 + noise2;
    vertex(x + i, yPos);
  }
  endShape();
  
  pop();
}

function drawStatePanel(x, y, w, h) {
  push();
  translate(x, y);
  
  // Draw panel background
  fill(panelBg);
  noStroke();
  rect(0, 0, w, h, panelRounding);
  
  // Draw title
  fill(lightText);
  textSize(14);
  textAlign(LEFT, TOP);
  text("SECTION 2: Cognitive and Emotional State Tracker", 10, 10);
  
  // Define layout constants
  const titleHeight = 30;
  const padding = 15; 
  const gaugeAreaWidth = w * 0.8; 
  const emotionAreaWidth = w * 0.2; 
  
  // Calculate gauge size and reduce by 3%
  const gaugeSize = min(h - titleHeight - padding * 2, (gaugeAreaWidth / 3) - padding) * 1.15 * 0.97;
  
  // Adjusted spacing to account for smaller gauges
  const gaugeSpacing = (gaugeAreaWidth - (gaugeSize * 3)) / 4;
  
  // Calculate vertical position for gauges
  const gaugeY = titleHeight + (h - titleHeight) / 2;
  
  // Draw gauges
  drawGauge(
    gaugeSpacing + gaugeSize/2, 
    gaugeY, 
    gaugeSize, 
    "Engagement", 
    engagementScore, 
    color(75, 207, 250)  // Bright blue
  );
  
  drawGauge(
    gaugeSpacing * 2 + gaugeSize * 1.5, 
    gaugeY, 
    gaugeSize, 
    "Attention", 
    attentionScore, 
    color(255, 223, 0)   // Yellow
  );
  
  drawGauge(
    gaugeSpacing * 3 + gaugeSize * 2.5, 
    gaugeY, 
    gaugeSize, 
    "Cognitive Load", 
    cognitiveLoad, 
    color(255, 80, 100)  // Pink/Red
  );
  
  // Calculate emotion bar position
  const emotionBarX = gaugeAreaWidth + padding;
  const emotionBarY = titleHeight + padding;
  const emotionBarW = emotionAreaWidth - padding * 2;
  const emotionBarH = h - titleHeight - padding * 2;
  
  // Get emotion-specific color
  let emotionColor;
  
  // Convert to lowercase for case insensitive comparison
  const emotionLower = currentEmotion.toLowerCase();
  
  // Map emotions to our standard set of colors
  if (emotionLower === 'happy' || emotionLower === 'joy') {
    emotionColor = color(255, 223, 0);  // Yellow
  } else if (emotionLower === 'confused' || emotionLower === 'surprise') {
    emotionColor = color(180, 120, 255); // Purple
  } else if (emotionLower === 'frustrated' || emotionLower === 'angry' || 
             emotionLower === 'sad' || emotionLower === 'disgust' || 
             emotionLower === 'fear') {
    emotionColor = color(255, 60, 60);  // Red
  } else {
    emotionColor = color(200, 200, 200); // Light gray for neutral or unknown
  }
  
  // EXTENSIVE DIAGNOSTIC LOGGING FOR EMOTION BAR
  // Debug logging for emotion bar updates every second to avoid console spam
  if (frameCount % 60 === 0) {
    // First log the key state variables
    console.log(
      `[STATE PANEL] Mode: ${webcamControlsState ? "WEBCAM" : (demoMode ? "DEMO" : "AUTO")}`,
      `Emotion: ${currentEmotion}`,
      `Intensity: ${emotionIntensity.toFixed(2)}`
    );
    
    // If in webcam mode, log additional webcam-specific info
    if (webcamControlsState) {
      console.log(
        `[WEBCAM STATE] Panel emotion: ${webcamPanel?.bioSignalData?.emotion || "none"}`,
        `Panel currentEmotion: ${webcamPanel?.bioSignalData?.currentEmotion || "none"}`,
        `Metrics:`, 
        `Eng=${engagementScore.toFixed(2)}`,
        `Att=${attentionScore.toFixed(2)}`,
        `Cog=${cognitiveLoad.toFixed(2)}`
      );
    }
    
    // Log the color being applied to the emotion bar
    console.log(
      `[EMOTION BAR] Color:`, 
      `R=${emotionColor.levels[0]}`,
      `G=${emotionColor.levels[1]}`,
      `B=${emotionColor.levels[2]}`
    );
  }
  
  // Draw emotion bar
  drawEmotionBar(
    emotionBarX,
    emotionBarY,
    emotionBarW,
    emotionBarH,
    currentEmotion,
    emotionIntensity,
    emotionColor
  );
  
  pop();
}

// Helper function to draw the emotion vertical bar graph
function drawEmotionBar(x, y, w, h, emotion, intensity, color) {
  push();
  translate(x, y);
  
  // Define padding for this function
  const padding = 10;
  
  // Make sure we're using a valid emotion
  if (!emotion || typeof emotion !== 'string') {
    emotion = 'neutral';
  } else {
    // Convert standard emotions to our four base emotions
    emotion = emotion.toLowerCase();
    if (emotion === 'sad' || emotion === 'angry' || emotion === 'disgust' || emotion === 'fear') {
      emotion = 'frustrated'; // Map negative emotions to frustrated
    } else if (emotion === 'surprise') {
      emotion = 'confused'; // Map surprise to confused
    } else if (emotion === 'joy') {
      emotion = 'happy'; // Map joy to happy
    } else if (!['happy', 'neutral', 'confused', 'frustrated'].includes(emotion)) {
      // Default to neutral for any unrecognized emotion
      emotion = 'neutral';
    }
  }
  
  // Ensure intensity is within range
  intensity = constrain(intensity, 0.2, 1.0);
  
  // CRITICAL FIX: In webcam mode, ensure high intensity for clear visibility
  if (webcamControlsState === true) {
    // In webcam mode, apply a moderate boost to intensity for visibility
    intensity = constrain(intensity, 0.5, 1.0);
  }
  
  // Calculate bar dimensions
  const barWidth = w * 0.3 * 1.03; // Increased width by 3%
  const barMaxHeight = h - padding * 4;
  const barHeight = barMaxHeight * intensity;
  const barX = w/2 - barWidth/2;
  
  // Draw bar background (empty part)
  fill(60);
  noStroke();
  rect(barX, padding, barWidth, barMaxHeight, 5);
  
  // Draw filled part of bar - always use the passed color parameter
  fill(color);
  rect(barX, padding + barMaxHeight - barHeight, barWidth, barHeight, 5);
  
  // Add webcam indicator if in webcam mode with highlighted border
  if (webcamControlsState === true) {
    // We're removing the webcam indicator and pulsing border to keep the UI clean
    // as requested by the user
  }
  
  // Draw emotion name at the top with the same color
  fill(color);
  textAlign(CENTER, TOP);
  textSize(16);
  text(emotion.toUpperCase(), w/2, padding * 1.5);
  
  // Draw value in the middle of the bar
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(16);
  text(nf(intensity, 1, 2), w/2, padding + barMaxHeight/2);
  
  // Draw "Emotion" label at the bottom
  textSize(12);
  fill(200);
  textAlign(CENTER, BOTTOM);
  text("Emotion", w/2, h - padding);
  
  pop();
}

// Helper function to draw a standard gauge
function drawGauge(x, y, size, label, value, color) {
  push();
  translate(x, y);
  
  // Draw gauge background
  fill(40);
  noStroke();
  ellipse(0, 0, size, size);
  
  // Draw gauge track
  noFill();
  strokeWeight(size/10);
  strokeCap(ROUND);
  stroke(60);
  arc(0, 0, size * 0.8, size * 0.8, PI * 0.75, PI * 2.25);
  
  // Draw gauge value
  stroke(color);
  let endAngle = map(value, 0, 1, PI * 0.75, PI * 2.25);
  arc(0, 0, size * 0.8, size * 0.8, PI * 0.75, endAngle);
  
  // Draw gauge center
  noStroke();
  fill(30);
  ellipse(0, 0, size * 0.6, size * 0.6);
  
  // Draw value text
  fill(255);
  textAlign(CENTER, CENTER);
  textSize(size * 0.2);
  text(nf(value, 1, 2), 0, 0);
  
  // Draw label
  textSize(size * 0.12);
  fill(200);
  text(label, 0, size * 0.4);
  
  pop();
}

// Make sure we have a drawWebcamPanel function defined
function drawWebcamPanel(x, y, w, h) {
  push();
  translate(x, y);
  
  // Draw panel background
  fill(panelBg);
  noStroke();
  rect(0, 0, w, h, panelRounding);
  
  // Draw title
  fill(lightText);
  textSize(14);
  textAlign(LEFT, TOP);
  text("SECTION 1: Bio-Signal Input - Computer Vision", 10, 10);
  
  // Draw webcam simulation
  fill(20, 20, 20);
  rect(10, 30, w - 20, h - 70, 5);
  
  // Draw face outline
  let faceX = w/2;
  let faceY = h/2 - 10;
  let faceSize = min(w, h) * 0.6;
  
  // Add subtle glow effect to tracking
  drawingContext.shadowColor = color(accentColor1.levels[0], accentColor1.levels[1], accentColor1.levels[2], 80);
  drawingContext.shadowBlur = 3;
  
  // Draw face outline with more detail
  noFill();
  stroke(accentColor1);
  strokeWeight(1);
  ellipse(faceX, faceY, faceSize, faceSize * 1.1);
  
  // Draw facial features based on emotion
  let eyeY = faceY - faceSize * 0.1;
  let eyeXOffset = faceSize * 0.2;
  let mouthY = faceY + faceSize * 0.2;
  let mouthWidth = faceSize * 0.4;
  let noseY = faceY + faceSize * 0.05;
  
  // Draw eyes with more detail
  // Left eye
  noFill();
  stroke(accentColor1);
  strokeWeight(1);
  ellipse(faceX - eyeXOffset, eyeY, faceSize * 0.15, faceSize * 0.1);
  
  // Left pupil
  fill(accentColor1);
  let leftPupilX = faceX - eyeXOffset + sin(millis()/1000) * 3;
  ellipse(leftPupilX, eyeY, faceSize * 0.05, faceSize * 0.05);
  
  // Left eyebrow - shape depends on emotion
  noFill();
  stroke(accentColor1);
  strokeWeight(1.5);
  if (currentEmotion === "happy") {
    // Raised eyebrow
    bezier(
      faceX - eyeXOffset - faceSize * 0.1, eyeY - faceSize * 0.08,
      faceX - eyeXOffset - faceSize * 0.05, eyeY - faceSize * 0.12,
      faceX - eyeXOffset + faceSize * 0.05, eyeY - faceSize * 0.12,
      faceX - eyeXOffset + faceSize * 0.1, eyeY - faceSize * 0.08
    );
  } else if (currentEmotion === "frustrated") {
    // Angled down eyebrow
    bezier(
      faceX - eyeXOffset - faceSize * 0.1, eyeY - faceSize * 0.1,
      faceX - eyeXOffset - faceSize * 0.05, eyeY - faceSize * 0.08,
      faceX - eyeXOffset + faceSize * 0.05, eyeY - faceSize * 0.06,
      faceX - eyeXOffset + faceSize * 0.1, eyeY - faceSize * 0.04
    );
  } else if (currentEmotion === "confused") {
    // One raised, one lowered
    bezier(
      faceX - eyeXOffset - faceSize * 0.1, eyeY - faceSize * 0.06,
      faceX - eyeXOffset - faceSize * 0.05, eyeY - faceSize * 0.08,
      faceX - eyeXOffset + faceSize * 0.05, eyeY - faceSize * 0.1,
      faceX - eyeXOffset + faceSize * 0.1, eyeY - faceSize * 0.12
    );
  } else {
    // Neutral eyebrow
    bezier(
      faceX - eyeXOffset - faceSize * 0.1, eyeY - faceSize * 0.08,
      faceX - eyeXOffset - faceSize * 0.05, eyeY - faceSize * 0.09,
      faceX - eyeXOffset + faceSize * 0.05, eyeY - faceSize * 0.09,
      faceX - eyeXOffset + faceSize * 0.1, eyeY - faceSize * 0.08
    );
  }
  
  // Right eye
  noFill();
  stroke(accentColor1);
  strokeWeight(1);
  ellipse(faceX + eyeXOffset, eyeY, faceSize * 0.15, faceSize * 0.1);
  
  // Right pupil
  fill(accentColor1);
  let rightPupilX = faceX + eyeXOffset + sin(millis()/1000) * 3;
  ellipse(rightPupilX, eyeY, faceSize * 0.05, faceSize * 0.05);
  
  // Right eyebrow - shape depends on emotion
  noFill();
  stroke(accentColor1);
  strokeWeight(1.5);
  if (currentEmotion === "happy") {
    // Raised eyebrow
    bezier(
      faceX + eyeXOffset - faceSize * 0.1, eyeY - faceSize * 0.08,
      faceX + eyeXOffset - faceSize * 0.05, eyeY - faceSize * 0.12,
      faceX + eyeXOffset + faceSize * 0.05, eyeY - faceSize * 0.12,
      faceX + eyeXOffset + faceSize * 0.1, eyeY - faceSize * 0.08
    );
  } else if (currentEmotion === "frustrated") {
    // Angled down eyebrow
    bezier(
      faceX + eyeXOffset - faceSize * 0.1, eyeY - faceSize * 0.04,
      faceX + eyeXOffset - faceSize * 0.05, eyeY - faceSize * 0.06,
      faceX + eyeXOffset + faceSize * 0.05, eyeY - faceSize * 0.08,
      faceX + eyeXOffset + faceSize * 0.1, eyeY - faceSize * 0.1
    );
  } else if (currentEmotion === "confused") {
    // One raised, one lowered (opposite of left)
    bezier(
      faceX + eyeXOffset - faceSize * 0.1, eyeY - faceSize * 0.12,
      faceX + eyeXOffset - faceSize * 0.05, eyeY - faceSize * 0.1,
      faceX + eyeXOffset + faceSize * 0.05, eyeY - faceSize * 0.08,
      faceX + eyeXOffset + faceSize * 0.1, eyeY - faceSize * 0.06
    );
  } else {
    // Neutral eyebrow
    bezier(
      faceX + eyeXOffset - faceSize * 0.1, eyeY - faceSize * 0.08,
      faceX + eyeXOffset - faceSize * 0.05, eyeY - faceSize * 0.09,
      faceX + eyeXOffset + faceSize * 0.05, eyeY - faceSize * 0.09,
      faceX + eyeXOffset + faceSize * 0.1, eyeY - faceSize * 0.08
    );
  }
  
  // Draw nose
  noFill();
  stroke(accentColor1);
  strokeWeight(1);
  // Simple nose line
  line(faceX, eyeY + faceSize * 0.1, faceX - faceSize * 0.05, noseY);
  line(faceX, eyeY + faceSize * 0.1, faceX + faceSize * 0.05, noseY);
  line(faceX - faceSize * 0.05, noseY, faceX + faceSize * 0.05, noseY);
  
  // Draw mouth based on emotion with more detail
  if (currentEmotion === "happy") {
    // Happy mouth - upward curve with more detail
    noFill();
    stroke(accentColor1);
    strokeWeight(1.5);
    bezier(
      faceX - mouthWidth/2, mouthY, 
      faceX - mouthWidth/4, mouthY + faceSize * 0.1,
      faceX + mouthWidth/4, mouthY + faceSize * 0.1,
      faceX + mouthWidth/2, mouthY
    );
    
    // Add a slight curve for the bottom lip
    strokeWeight(1);
    bezier(
      faceX - mouthWidth/2, mouthY, 
      faceX - mouthWidth/4, mouthY + faceSize * 0.02,
      faceX + mouthWidth/4, mouthY + faceSize * 0.02,
      faceX + mouthWidth/2, mouthY
    );
  } else if (currentEmotion === "frustrated") {
    // Frustrated mouth - downward curve with more detail
    noFill();
    stroke(accentColor1);
    strokeWeight(1.5);
    bezier(
      faceX - mouthWidth/2, mouthY, 
      faceX - mouthWidth/4, mouthY - faceSize * 0.05,
      faceX + mouthWidth/4, mouthY - faceSize * 0.05,
      faceX + mouthWidth/2, mouthY
    );
    
    // Add a slight curve for the bottom lip
    strokeWeight(1);
    bezier(
      faceX - mouthWidth/2, mouthY, 
      faceX - mouthWidth/4, mouthY + faceSize * 0.02,
      faceX + mouthWidth/4, mouthY + faceSize * 0.02,
      faceX + mouthWidth/2, mouthY
    );
  } else if (currentEmotion === "confused") {
    // Confused mouth - slightly asymmetrical
    noFill();
    stroke(accentColor1);
    strokeWeight(1.5);
    bezier(
      faceX - mouthWidth/2, mouthY, 
      faceX - mouthWidth/4, mouthY - faceSize * 0.02,
      faceX + mouthWidth/4, mouthY + faceSize * 0.02,
      faceX + mouthWidth/2, mouthY - faceSize * 0.01
    );
  } else {
    // Neutral mouth - straight line with slight curve
    noFill();
    stroke(accentColor1);
    strokeWeight(1.5);
    line(faceX - mouthWidth/2, mouthY, faceX + mouthWidth/2, mouthY);
    
    // Add a slight curve for the bottom lip
    strokeWeight(0.75);
    bezier(
      faceX - mouthWidth/2, mouthY, 
      faceX - mouthWidth/4, mouthY + faceSize * 0.01,
      faceX + mouthWidth/4, mouthY + faceSize * 0.01,
      faceX + mouthWidth/2, mouthY
    );
  }
  
  // Reset shadow
  drawingContext.shadowBlur = 0;
  
  // Draw facial landmark tracking points with toned down pulsing effect
  stroke(accentColor1);
  strokeWeight(1);
  
  // Draw facial landmark tracking points
  // Face contour points
  for (let i = 0; i < 12; i++) {
    let angle = map(i, 0, 11, -PI/2, PI*1.5);
    let px = faceX + cos(angle) * (faceSize/2);
    let py = faceY + sin(angle) * (faceSize/2 * 1.1);
    drawSimpleCross(px, py, 5);
  }
  
  // Eye tracking points
  // Left eye
  drawSimpleCross(faceX - eyeXOffset - faceSize * 0.08, eyeY, 5); // Left corner
  drawSimpleCross(faceX - eyeXOffset, eyeY - faceSize * 0.05, 5); // Top
  drawSimpleCross(faceX - eyeXOffset + faceSize * 0.08, eyeY, 5); // Right corner
  drawSimpleCross(faceX - eyeXOffset, eyeY + faceSize * 0.05, 5); // Bottom
  drawSimpleCross(leftPupilX, eyeY, 5); // Pupil
  
  // Right eye
  drawSimpleCross(faceX + eyeXOffset - faceSize * 0.08, eyeY, 5); // Left corner
  drawSimpleCross(faceX + eyeXOffset, eyeY - faceSize * 0.05, 5); // Top
  drawSimpleCross(faceX + eyeXOffset + faceSize * 0.08, eyeY, 5); // Right corner
  drawSimpleCross(faceX + eyeXOffset, eyeY + faceSize * 0.05, 5); // Bottom
  drawSimpleCross(rightPupilX, eyeY, 5); // Pupil
  
  // Eyebrow tracking points
  // Left eyebrow
  drawSimpleCross(faceX - eyeXOffset - faceSize * 0.1, eyeY - faceSize * 0.08, 5); // Left end
  drawSimpleCross(faceX - eyeXOffset, eyeY - faceSize * 0.09, 5); // Middle
  drawSimpleCross(faceX - eyeXOffset + faceSize * 0.1, eyeY - faceSize * 0.08, 5); // Right end
  
  // Right eyebrow
  drawSimpleCross(faceX + eyeXOffset - faceSize * 0.1, eyeY - faceSize * 0.08, 5); // Left end
  drawSimpleCross(faceX + eyeXOffset, eyeY - faceSize * 0.09, 5); // Middle
  drawSimpleCross(faceX + eyeXOffset + faceSize * 0.1, eyeY - faceSize * 0.08, 5); // Right end
  
  // Nose tracking points
  drawSimpleCross(faceX, eyeY + faceSize * 0.1, 5); // Bridge
  drawSimpleCross(faceX - faceSize * 0.05, noseY, 5); // Left nostril
  drawSimpleCross(faceX + faceSize * 0.05, noseY, 5); // Right nostril
  
  // Mouth tracking points
  drawSimpleCross(faceX - mouthWidth/2, mouthY, 5); // Left corner
  drawSimpleCross(faceX, mouthY, 5); // Center
  drawSimpleCross(faceX + mouthWidth/2, mouthY, 5); // Right corner
  
  if (currentEmotion === "happy") {
    // Extra points for smile
    drawSimpleCross(faceX - mouthWidth/4, mouthY + faceSize * 0.05, 5);
    drawSimpleCross(faceX + mouthWidth/4, mouthY + faceSize * 0.05, 5);
  } else if (currentEmotion === "frustrated") {
    // Extra points for frown
    drawSimpleCross(faceX - mouthWidth/4, mouthY - faceSize * 0.03, 5);
    drawSimpleCross(faceX + mouthWidth/4, mouthY - faceSize * 0.03, 5);
  }
  
  // Jaw tracking point
  drawSimpleCross(faceX, faceY + faceSize * 0.4, 5);
  
  // Draw emotion detection label at the bottom
  fill(lightText);
  textSize(14);
  textAlign(CENTER, BOTTOM);
  text("Detected: " + currentEmotion.toUpperCase(), w/2, h - 20);
  
  pop();
}

// Simplified cross drawing function without pulsing effect
function drawSimpleCross(x, y, size) {
  stroke(accentColor1);
  strokeWeight(1);
  line(x - size/2, y, x + size/2, y);
  line(x, y - size/2, x, y + size/2);
}

function drawChatPanel(x, y, w, h) {
  push();
  translate(x, y);
  
  // Draw panel background
  fill(panelBg);
  noStroke();
  rect(0, 0, w, h, panelRounding);
  
  // Draw title
  fill(lightText);
  textSize(14);
  textAlign(LEFT, TOP);
  text("Section 3: System Log - Dialogue Stream", 10, 10);
  
  // Define content area (below title)
  let titleHeight = 30;
  let contentY = titleHeight;
  let contentHeight = h - titleHeight;
  
  // Create clipping region for messages (only for content area)
  push();
  beginClip();
  rect(0, contentY, w, contentHeight, 0, 0, panelRounding, panelRounding);
  endClip();
  
  // Calculate total content height
  let totalContentHeight = 0;
  let bubbleSpacing = 15;
  let bubblePadding = 12;
  let maxBubbleWidth = w - 100;
  let senderNameHeight = 18;
  let timestampHeight = 20; // Increased from 15 to provide more space
  
  // Group consecutive messages from the same sender
  let groupedMessages = [];
  let currentGroup = null;
  
  for (let i = 0; i < chatMessages.length; i++) {
    let message = chatMessages[i];
    
    // Convert any "Agent" to "AI Instructor" when rendering
    if (message.sender === "Agent") {
      message.sender = "AI Instructor";
    }
    
    // Start a new group if sender changes or too much time has passed
    if (!currentGroup || 
        currentGroup.sender !== message.sender || 
        message.timestamp - currentGroup.messages[currentGroup.messages.length-1].timestamp > 60000) {
      if (currentGroup) {
        groupedMessages.push(currentGroup);
      }
      currentGroup = {
        sender: message.sender,
        messages: [message],
        timestamp: message.timestamp
      };
    } else {
      // Add to current group
      currentGroup.messages.push(message);
    }
  }
  
  // Add the last group if it exists
  if (currentGroup) {
    groupedMessages.push(currentGroup);
  }
  
  // Calculate heights for all groups
  for (let i = 0; i < groupedMessages.length; i++) {
    let group = groupedMessages[i];
    let groupHeight = senderNameHeight; // Sender name
    
    for (let j = 0; j < group.messages.length; j++) {
      let msg = group.messages[j];
      // Pre-calculate text dimensions to ensure proper bubble sizing
      let textDimensions = calculateTextDimensions(msg.text, maxBubbleWidth - bubblePadding * 2);
      let bubbleHeight = textDimensions.height + bubblePadding * 2;
      
      if (j === group.messages.length - 1) {
        bubbleHeight += timestampHeight; // Add space for timestamp on last message
      }
      
      groupHeight += bubbleHeight;
      if (j < group.messages.length - 1) {
        groupHeight += 5; // Small spacing between messages in same group
      }
    }
    
    totalContentHeight += groupHeight + bubbleSpacing;
  }
  
  // Calculate max scroll
  maxChatScroll = max(0, totalContentHeight - contentHeight);
  
  // Constrain scroll position
  chatScrollY = constrain(chatScrollY, 0, maxChatScroll);
  
  // Draw messages
  let currentY = contentY - chatScrollY;
  
  for (let i = 0; i < groupedMessages.length; i++) {
    let group = groupedMessages[i];
    // Check for "User" or "AI Instructor"
    let isUser = group.sender === "User"; 
    let isAI = group.sender === "AI Instructor";
    
    // Skip if entire group is outside visible area
    let groupHeight = senderNameHeight;
    for (let j = 0; j < group.messages.length; j++) {
      let textDimensions = calculateTextDimensions(group.messages[j].text, maxBubbleWidth - bubblePadding * 2);
      groupHeight += textDimensions.height + bubblePadding * 2 + (j < group.messages.length - 1 ? 5 : 0);
      if (j === group.messages.length - 1) {
        groupHeight += timestampHeight;
      }
    }
    
    if (currentY + groupHeight < contentY || currentY > contentY + contentHeight) {
      currentY += groupHeight + bubbleSpacing;
      continue;
    }
    
    // Draw sender name if visible
    if (currentY >= contentY && currentY <= contentY + contentHeight) {
      textSize(12);
      textAlign(isUser ? RIGHT : LEFT, TOP);
      // Use distinct colors for sender names
      fill(isUser ? color(200, 200, 220) : accentColor2); // User: light gray, AI: accentColor2
      text(group.sender, isUser ? w - 20 : 20, currentY);
    }
    
    currentY += senderNameHeight;
    
    // Draw each message in the group
    for (let j = 0; j < group.messages.length; j++) {
      let msg = group.messages[j];
      let textDimensions = calculateTextDimensions(msg.text, maxBubbleWidth - bubblePadding * 2);
      let bubbleHeight = textDimensions.height + bubblePadding * 2;
      let isLastInGroup = j === group.messages.length - 1;
      
      if (isLastInGroup) {
        bubbleHeight += timestampHeight; // Add space for timestamp
      }
      
      // Skip if this message is outside visible area
      if (currentY + bubbleHeight < contentY || currentY > contentY + contentHeight) {
        currentY += bubbleHeight + (isLastInGroup ? 0 : 5);
        continue;
      }
      
      // Calculate bubble width based on text content
      let bubbleWidth = textDimensions.width + bubblePadding * 2;
      
      // Position bubble based on sender
      let bubbleX = isUser ? w - bubbleWidth - 20 : 20;
      
      // Draw bubble shadow for depth
      drawingContext.shadowOffsetX = isUser ? -2 : 2;
      drawingContext.shadowOffsetY = 3;
      drawingContext.shadowBlur = 6;
      drawingContext.shadowColor = 'rgba(0,0,0,0.2)';
      
      // Draw bubble with gradient background - updated colors
      if (isUser) {
        // User message gradient (darker blue/gray - kept similar)
        let userGradient = drawingContext.createLinearGradient(
          bubbleX, currentY, bubbleX + bubbleWidth, currentY + bubbleHeight
        );
        userGradient.addColorStop(0, 'rgba(60, 60, 80, 1)'); // Slightly lighter start
        userGradient.addColorStop(1, 'rgba(45, 45, 65, 1)'); // Slightly lighter end
        drawingContext.fillStyle = userGradient;
      } else { 
        // AI Instructor message gradient (using accentColor2 - purple)
        let aiColorStart = color(accentColor2.levels[0], accentColor2.levels[1], accentColor2.levels[2], 255 * 0.9); // Start slightly darker/more opaque
        let aiColorEnd = color(accentColor2.levels[0] * 0.8, accentColor2.levels[1] * 0.8, accentColor2.levels[2] * 0.8, 255 * 0.8); // End darker and slightly transparent

        let agentGradient = drawingContext.createLinearGradient(
          bubbleX, currentY, bubbleX + bubbleWidth, currentY + bubbleHeight
        );
        agentGradient.addColorStop(0, aiColorStart.toString()); 
        agentGradient.addColorStop(1, aiColorEnd.toString()); 
        drawingContext.fillStyle = agentGradient;
      }
      
      // Draw bubble with tail
      beginShape();
      if (isUser) {
        // User message tail (right side)
        vertex(bubbleX + bubbleWidth, currentY + 10);
        vertex(bubbleX + bubbleWidth + 8, currentY + 15);
        vertex(bubbleX + bubbleWidth, currentY + 20);
      } else {
        // AI Instructor message tail (left side)
        vertex(bubbleX, currentY + 10);
        vertex(bubbleX - 8, currentY + 15);
        vertex(bubbleX, currentY + 20);
      }
      endShape(CLOSE);
      
      // Draw rounded rectangle for bubble
      rect(bubbleX, currentY, bubbleWidth, bubbleHeight, 10);
      
      // Reset shadow
      drawingContext.shadowOffsetX = 0;
      drawingContext.shadowOffsetY = 0;
      drawingContext.shadowBlur = 0;
      
      // Draw message text with improved spacing
      fill(lightText);
      textSize(13);
      textAlign(LEFT, TOP);
      drawWrappedText(msg.text, bubbleX + bubblePadding, currentY + bubblePadding, 
                      bubbleWidth - bubblePadding * 2);
      
      // Draw timestamp on last message in group with fixed positioning
      if (isLastInGroup) {
        let timestamp = new Date(msg.timestamp);
        let timeStr = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        // Position timestamp at a fixed offset from the bottom of the bubble
        let timestampY = currentY + bubbleHeight - 10; // Fixed position from bottom
        
        fill(lightText, 150);
        textSize(10);
        textAlign(isUser ? RIGHT : LEFT, BOTTOM);
        text(timeStr, isUser ? bubbleX + bubbleWidth - 8 : bubbleX + 8, timestampY);
      }
      
      // Move to next message position
      currentY += bubbleHeight + (isLastInGroup ? 0 : 5);
    }
    
    // Add spacing between groups
    currentY += bubbleSpacing;
  }
  
  pop(); // End clipping
  
  // Draw scrollbar if needed
  if (maxChatScroll > 0) {
    let scrollbarWidth = 5;
    let scrollbarHeight = (contentHeight / totalContentHeight) * contentHeight;
    let scrollbarY = contentY + (chatScrollY / maxChatScroll) * (contentHeight - scrollbarHeight);
    
    // Draw scrollbar track
    fill(50, 50, 60, 100);
    rect(w - scrollbarWidth - 5, contentY, scrollbarWidth, contentHeight, scrollbarWidth/2);
    
    // Draw scrollbar thumb
    fill(150, 150, 170, 200);
    rect(w - scrollbarWidth - 5, scrollbarY, scrollbarWidth, scrollbarHeight, scrollbarWidth/2);
  }
  
  // Draw "new messages" indicator if scrolled up
  if (chatScrollY < maxChatScroll - 10 && chatMessages.length > 0) {
    // Draw circle with down arrow
    fill(accentColor1);
    circle(w - 25, h - 25, 30);
    
    fill(20, 20, 30);
    triangle(w - 25, h - 20, w - 30, h - 30, w - 20, h - 30);
  }
  
  pop();
}

// Improved text wrapping function that returns both width and height
function calculateTextDimensions(textContent, maxWidth) {
  // Handle newlines in text
  let lines = textContent.split('\n');
  let totalHeight = 0;
  let maxLineWidth = 0;
  
  textSize(13); // Set text size to match what will be used for rendering
  
  // Process each line separately
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    let currentLine = lines[lineIndex];
    
    // If the line is empty, still account for its height
    if (currentLine.trim() === '') {
      totalHeight += 20; // Line height for empty lines
      continue;
    }
    
    // Split the current line into words
    let words = currentLine.split(' ');
    let line = '';
    let lineCount = 1;
    let lineHeight = 20; // Increased line height for better readability
  
  for (let i = 0; i < words.length; i++) {
    let testLine = line + words[i] + ' ';
    let testWidth = textWidth(testLine);
    
    if (testWidth > maxWidth) {
      // This line is done, check if it's the widest so far
      maxLineWidth = max(maxLineWidth, textWidth(line));
      
      // Start a new line
      line = words[i] + ' ';
      lineCount++;
    } else {
      line = testLine;
    }
  }
  
  // Check the last line as well
  maxLineWidth = max(maxLineWidth, textWidth(line));
    
    // Add this line's height to the total
    totalHeight += lineCount * lineHeight;
  }
  
  return {
    width: maxLineWidth,
    height: totalHeight
  };
}

// Improved text drawing function with proper wrapping
function drawWrappedText(textContent, x, y, maxWidth) {
  // Handle newlines in text
  let lines = textContent.split('\n');
  let currentY = y;
  
  textSize(13); // Ensure text size is consistent
  
  // Process each line separately
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    let currentLine = lines[lineIndex];
    
    // If the line is empty, just add the line height
    if (currentLine.trim() === '') {
      currentY += 20; // Line height for empty lines
      continue;
    }
    
    // Split the current line into words
    let words = currentLine.split(' ');
    let line = '';
    let lineHeight = 20; // Increased line height for better readability
  
  for (let i = 0; i < words.length; i++) {
    let testLine = line + words[i] + ' ';
    let testWidth = textWidth(testLine);
    
    if (testWidth > maxWidth) {
      text(line, x, currentY);
      line = words[i] + ' ';
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  
    // Draw the last line of this paragraph
  text(line, x, currentY);
    currentY += lineHeight;
  }
}

function drawInputArea(x, y, w, h) {
  // No background rectangle needed here
  // push();
  // translate(x, y);
  // fill(panelBg); // This was drawing the background rectangle
  // noStroke();
  // rect(0, 0, w, h, 5); 
  // pop();
}

function addChatMessage(sender, text) {
  // Capitalize first letter of sender for consistency, handle "AI Instructor" specifically
  if (sender.toLowerCase() === "ai instructor") {
      sender = "AI Instructor";
      // Store the message content for emotional context processing
      lastAgentMessage = text;
  } else {
      sender = sender.charAt(0).toUpperCase() + sender.slice(1).toLowerCase();
  }
  
  // Split long messages into multiple bubbles (for AI Instructor only)
  if (sender === "AI Instructor") {
    // First check if there are explicit newline separators
    if (text.includes("\n\n")) {
      // If there are paragraph breaks, split by those first
    let paragraphs = text.split("\n\n");
    
      for (let paragraph of paragraphs) {
        if (paragraph.trim().length > 0) {
          chatMessages.push({ 
            sender: sender,
            text: paragraph.trim(), 
            timestamp: Date.now() 
          });
        }
      }
    } 
    // Check for single newlines that should be preserved
    else if (text.includes("\n") && text.length < 250) {
      // If it contains newlines but isn't too long, keep it as one message
      chatMessages.push({ 
        sender: sender,
        text: text, 
        timestamp: Date.now() 
      });
    }
    // For long messages without newlines, split by sentences
    else if (text.length > 200) {
      let sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      let currentMessage = "";
      
      for (let sentence of sentences) {
        if ((currentMessage + sentence).length > 200) {
          if (currentMessage.length > 0) {
            chatMessages.push({ 
              sender: sender,
              text: currentMessage.trim(), 
              timestamp: Date.now() 
            });
          }
          currentMessage = sentence;
        } else {
          currentMessage += sentence;
        }
      }
      
      if (currentMessage.length > 0) {
        chatMessages.push({ 
          sender: sender,
          text: currentMessage.trim(), 
          timestamp: Date.now() 
        });
      }
    } else {
      // For shorter AI messages, add as is
      chatMessages.push({ 
        sender: sender,
        text: text, 
        timestamp: Date.now() 
      });
    }
  } else {
    // For user messages, add as is
    chatMessages.push({ 
      sender: sender,
      text: text, 
      timestamp: Date.now() 
    });
  }
  
  // Limit the number of messages
  while (chatMessages.length > 25) {
    chatMessages.shift();
  }
  
  // Auto-scroll to bottom (latest messages)
  // Only auto-scroll if user is very close to the bottom (within 10 pixels)
  // This allows users to scroll up and read earlier messages without interference
  if (chatScrollY <= 10) {
    chatScrollY = 0;
  }
  
  // Add pulse effect to chat panel using updated colors
  let pulseColor = sender === "User" ? color(60, 60, 80) : accentColor2;
  addPulseEffect(chatX, chatY, chatW, chatH, pulseColor);
  
  // Change engagement score slightly for demo purposes
  engagementScore += (Math.random() - 0.5) * 0.1;
  engagementScore = constrain(engagementScore, 0.2, 0.95);
  
  // Add engagement score update to backend
  if (Math.random() < 0.3) {
    setTimeout(() => {
      addBackendMessage("EEG: Engagement level: " + nf(engagementScore, 1, 2), "cognitive");
    }, 500);
  }
  
  // Add more informative backend messages - only one per conversation turn
  if (sender === "User") {
    addBackendMessage("Dialog: User input detected", "system");
  } else if (sender === "AI Instructor") {
    addBackendMessage("Dialog: AI response generated", "system");
  }
}

/**
 * Captures a snapshot of the current biometric state
 * This function collects the most recent biometric data from various sources
 * and returns a structured object with the user's cognitive and emotional state.
 * @returns {Object} Biometric snapshot with emotion and cognitive metrics
 */
function captureBiometricSnapshot() {
  // Use time window logic to determine the best emotion
  const windowResults = selectWinningEmotion();
  
  // Start with emotion data from the time window analysis
  const snapshot = {
    // Core emotion data (now based on time window)
    emotion: {
      name: windowResults.emotion,
      intensity: windowResults.confidence,
      detected_at: Date.now(),
      window_analysis: {
        total_score: windowResults.totalScore,
        all_emotions: windowResults.windowData,
        buffer_size: emotionBuffer.length
      }
    },
    
    // Cognitive metrics (still use current state)
    metrics: {
      engagement: engagementScore || 0.5,
      attention: attentionScore || 0.5,
      cognitive_load: cognitiveLoad || 0.5
    },
    
    // Metadata about the snapshot
    metadata: {
      timestamp: Date.now(),
      source: webcamControlsState ? "webcam" : (demoMode ? "demo" : "simulation"),
      session_duration: (Date.now() - sessionStartTime) / 1000, // seconds
      emotion_window_size: EMOTION_WINDOW_SIZE
    }
  };
  
  // If webcam data is available, include more detailed information
  if (webcamControlsState && webcamPanel && webcamPanel.lastEmotionData) {
    const emotionData = webcamPanel.lastEmotionData;
    
    // Include webcam-specific data if available
    snapshot.webcam = {
      faces_detected: emotionData.faces_detected || 0,
      current_confidence: emotionData.emotions ? 
                         (emotionData.emotions[windowResults.emotion] || 0) : 0,
      all_emotions: emotionData.emotions || {}
    };
  }
  
  // Log the snapshot with time window information
  console.log("📸 Captured time window-based biometric snapshot:", snapshot);
  console.log("🔍 Emotion window analysis:", windowResults.windowData);
  addBackendMessage(`Emotion snapshot: ${windowResults.emotion} (score: ${windowResults.totalScore.toFixed(2)}, buffer: ${emotionBuffer.length} entries)`, "system");
  
  return snapshot;
}

// Update the handleSubmit function to use the biometric snapshot
function handleSubmit() {
  let userMessage = inputElement.value().trim();
  if (userMessage === '' || isWaitingForResponse) return;
  
  // Add user message to chat
  addChatMessage("User", userMessage);
  inputElement.value('');
  
  // Capture biometric snapshot at the moment of submission
  console.log("🔍 SUBMIT: About to capture biometric snapshot...");
  console.log("🔍 SUBMIT: Global variables before capture:");
  console.log(`   window.currentEmotion = ${window.currentEmotion}`);
  console.log(`   window.emotionIntensity = ${window.emotionIntensity}`);
  
  const biometricSnapshot = captureBiometricSnapshot();
  
  console.log("🔍 SUBMIT: Captured biometric snapshot:", biometricSnapshot);
  console.log("🔍 SUBMIT: Emotion from snapshot:", biometricSnapshot.emotion);
  console.log("🔍 SUBMIT: Cognitive state for LLM:", {
    emotion: biometricSnapshot.emotion.name,
    emotionIntensity: biometricSnapshot.emotion.intensity,
    engagement: biometricSnapshot.metrics.engagement,
    attention: biometricSnapshot.metrics.attention,
    cognitiveLoad: biometricSnapshot.metrics.cognitive_load
  });
  
  // Add telemetry message
  addBackendMessage(`Sending to LLM: emotion=${biometricSnapshot.emotion.name} (${biometricSnapshot.emotion.intensity.toFixed(2)})`, "system");
  
  // Show processing state
  isWaitingForResponse = true;
  
  // Send request to Python backend
  fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: userMessage,
      cognitive_state: {
        emotion: biometricSnapshot.emotion.name,
        emotionIntensity: biometricSnapshot.emotion.intensity,
        engagement: biometricSnapshot.metrics.engagement,
        attention: biometricSnapshot.metrics.attention,
        cognitiveLoad: biometricSnapshot.metrics.cognitive_load
      },
      biometric_snapshot: biometricSnapshot // Include the full snapshot
    })
  })
  .then(response => {
    // Log the response status
    console.log("Server response status:", response.status);
    return response.json();
  })
  .then(data => {
    console.log("Response data:", data);
    
    // Add AI response to chat
    if (data.message) {
      addChatMessage("AI Instructor", data.message);
      
      // Only trigger random state change after AI responds if we're in 
      // autonomous mode (not demo and not webcam control)
      if (!demoMode && !webcamControlsState) {
        // Add telemetry message about incoming response
        addBackendMessage("Analyzing cognitive response to feedback...", "system");
        
        // Trigger random state change with delay to make it feel responsive to the AI's message
        setTimeout(() => {
          triggerRandomStateChange();
        }, 1500);
      }
    } else if (data.error) {
      addBackendMessage("Error: " + data.error, "error");
    }
    
    // Reset waiting flag
    isWaitingForResponse = false;
  })
  .catch(error => {
    // Add error message
    console.error("Fetch error:", error);
    addBackendMessage("Connection error: " + error.message, "error");
    addChatMessage("AI Instructor", "Sorry, I encountered a problem connecting to my reasoning module. Please try again.");
    
    // Reset waiting flag
    isWaitingForResponse = false;
  });
}

function keyPressed() {
  if (keyCode === ENTER && document.activeElement === inputElement.elt) {
    handleSubmit();
    return false;
  }
  return true;
}

function mouseWheel(event) {
  // Check if mouse is over backend panel
  if (mouseX >= backendX && mouseX <= backendX + backendW &&
      mouseY >= backendY && mouseY <= backendY + backendH) {
    // Ensure variables are initialized before calculations
    if (isNaN(backendScrollY)) backendScrollY = 0;
    if (isNaN(maxBackendScroll)) maxBackendScroll = 0;
    
    // Add scroll amount to backend panel position
    backendScrollY += event.delta * 0.5;
    
    // Constrain scroll with safeguards
    backendScrollY = constrain(backendScrollY, 0, maxBackendScroll);
    
    return false; // Prevent default scroll
  }
  
  // Same for chat panel
  if (mouseX >= chatX && mouseX <= chatX + chatW &&
      mouseY >= chatY && mouseY <= chatY + chatH) {
    // Ensure variables are initialized
    if (isNaN(chatScrollY)) chatScrollY = 0;
    if (isNaN(maxChatScroll)) maxChatScroll = 0;
    
    // Add scroll amount to chat panel position
    chatScrollY += event.delta * 0.5;
    
    // Constrain scroll with safeguards
    chatScrollY = constrain(chatScrollY, 0, maxChatScroll || 0);
    
    return false; // Prevent default scroll
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Define constants for input area (same as in setup)
  const inputElementHeight = 25; // Reduced height
  const inputAreaPadding = 5;
  const totalInputAreaHeight = inputElementHeight + inputAreaPadding * 2;
  const bottomMargin = 10;
  const inputButtonGap = 10; 

  // Calculate section heights with adjusted ratios
  let sectionPadding = 10;
  let section1Height = height * 0.3; 
  let section2Height = height * 0.25; 
  
  // Dynamic calculation for section 3 height using updated input area height
  let section3Height = height - section1Height - section2Height - (sectionPadding * 3) - totalInputAreaHeight - bottomMargin;
  
  let leftPanelWidth = width * 0.6 - sectionPadding * 1.5;
  let rightPanelWidth = width * 0.4 - sectionPadding * 1.5;
  
  // Recalculate all panel positions based on new heights/widths
  // Section 1: Bio-signal panels
  let section1Y = sectionPadding;
  eegX = sectionPadding;
  eegY = section1Y;
  eegW = leftPanelWidth;
  eegH = section1Height - sectionPadding;
  
  webcamX = eegX + eegW + sectionPadding;
  webcamY = section1Y;
  webcamW = rightPanelWidth;
  webcamH = section1Height - sectionPadding;
  
  // Update webcamPanel position and dimensions
  if (webcamPanel) {
    webcamPanel.x = webcamX;
    webcamPanel.y = webcamY;
    webcamPanel.w = webcamW;
    webcamPanel.h = webcamH;
    
    // Recreate the graphics buffer with new dimensions
    webcamPanel.graphics = createGraphics(webcamW, webcamH);
    webcamPanel.markDirty();
  }
  
  // Section 2: Cognitive state
  let section2Y = section1Y + section1Height + sectionPadding;
  stateX = sectionPadding;
  stateY = section2Y;
  stateW = width - sectionPadding * 2;
  stateH = section2Height - sectionPadding;
  
  // Section 3: Chat and Backend
  let section3Y = section2Y + section2Height + sectionPadding;
  chatX = sectionPadding;
  chatY = section3Y;
  chatW = leftPanelWidth;
  chatH = section3Height;
  
  backendX = chatX + chatW + sectionPadding;
  backendY = section3Y;
  backendW = rightPanelWidth;
  backendH = section3Height;
  
  // Input area and buttons
  let inputAreaY = section3Y + section3Height; 
  inputX = chatX;
  inputY = inputAreaY + inputAreaPadding;
  inputW = chatW;
  inputH = inputElementHeight; // Use the updated constant height
  
  try {
    // Safety check - if input area goes off-screen, adjust section 3 height
    if (inputAreaY + totalInputAreaHeight + bottomMargin > height) {
      let overflow = (inputAreaY + totalInputAreaHeight + bottomMargin) - height;
      section3Height -= overflow; 
      // Recalculate positions based on adjusted section3Height
      chatH = section3Height;
      backendH = section3Height;
      inputAreaY = section3Y + section3Height; 
      inputY = inputAreaY + inputAreaPadding;
    }
    
    // Update UI element positions and sizes (with null checks)
    let inputFieldWidth = inputW - 120; 
    if (inputElement && typeof inputElement.position === 'function') {
      inputElement.position(inputX + 10, inputY);
      inputElement.size(inputFieldWidth, inputH); // Use updated inputH
      inputElement.style('line-height', inputH + 'px'); // Re-apply updated line-height
    }
    
    if (sendButton && typeof sendButton.position === 'function') {
      // Position button to the right of the input field with a gap, moved further right
      let sendButtonX = inputX + 10 + inputFieldWidth + inputButtonGap + (80 * 0.15); // Add 15% of button width
      sendButton.position(sendButtonX, inputY);
      sendButton.size(80, inputH); // Use updated inputH
    }
    
    if (demoButton && typeof demoButton.position === 'function') {
      demoButton.position(backendX, inputY); 
      demoButton.size(100, inputH); // Use updated inputH
    }
    
    if (nextSceneButton && typeof nextSceneButton.position === 'function') {
      nextSceneButton.position(backendX + 110, inputY); 
      nextSceneButton.size(100, inputH); // Use updated inputH
    }
    
    if (resetDemoButton && typeof resetDemoButton.position === 'function') {
      resetDemoButton.position(backendX + 220, inputY); 
      resetDemoButton.size(100, inputH); // Use updated inputH
    }
  } catch (e) {
    console.error("Error resizing UI elements:", e);
  }
}

// Refined emotion state system with more natural transitions

// Update the emotion state with better narrative coherence
function updateEmotionState() {
  let currentTime = millis();
  
  // In demo mode or webcam mode, just allow small intensity fluctuations
  if (demoMode || webcamControlsState) {
    // Allow small fluctuations in intensity without changing the emotion itself
    emotionIntensity += random(-0.1, 0.1);
    emotionIntensity = constrain(emotionIntensity, 0.2, 1.0);
    
    // In demo mode, follow the scripted emotions for each scene
    if (demoMode) {
      let targetEmotion = demoScenes[currentScene].bioSignals.emotion;
      
      // If we're not already at the target emotion, transition toward it
      if (currentEmotion !== targetEmotion) {
        // Gradually build up intensity before changing emotion
        emotionIntensity += 0.05;
        
        // When intensity reaches threshold, change to the target emotion
        if (emotionIntensity >= emotionTransitionThreshold) {
          currentEmotion = targetEmotion;
          lastEmotionChange = currentTime;
          emotionIntensity = 0.5; // Reset intensity on emotion change
          
          // Log the emotion change
          console.log("Demo scene " + currentScene + ": Emotion changed to " + currentEmotion);
        }
      } else {
        // If we're at the target emotion, allow natural fluctuations in intensity
        emotionIntensity = 0.5 + sin(millis() * 0.0005) * 0.3;
      }
      
      // Update engagement score based on demo scene
      engagementScore = lerp(engagementScore, 
                            demoScenes[currentScene].bioSignals.engagement, 
                            0.05);
    }
    
    // In webcam mode, don't actively change emotions
    // (changes come from webcam via draw() function)
    
    // Update bio-signal amplitudes in both cases
    updateBioSignals();
    return; // Exit early
  }
  
  // Below here is only for autonomous mode (not demo or webcam)
  
  // Allow small fluctuations in intensity without changing the emotion itself
  emotionIntensity += random(-0.1, 0.1);
  emotionIntensity = constrain(emotionIntensity, 0.2, 1.0);
  
  // Only consider emotion changes if cooldown period has passed
  if (currentTime - lastEmotionChange > emotionCooldown) {
    // Calculate transition probability based on content and context
    let transitionProbability = 0;
    
    // Content-based factors
    if (lastAgentMessage.includes("complex") || lastAgentMessage.includes("difficult") ||
        lastAgentMessage.includes("challenging")) {
      // Content suggests difficulty
      if (currentEmotion === "happy") {
        transitionProbability += 0.2; // Chance to become neutral or confused
      } else if (currentEmotion === "neutral") {
        transitionProbability += 0.3; // Higher chance to become confused
      }
    }
    
    if (lastAgentMessage.includes("simple") || lastAgentMessage.includes("clear") || 
        lastAgentMessage.includes("understand") || lastAgentMessage.includes("excellent")) {
      // Content suggests clarity or understanding
      if (currentEmotion === "confused") {
        transitionProbability += 0.3; // Chance to become neutral
      } else if (currentEmotion === "frustrated") {
        transitionProbability += 0.2; // Chance to become confused or neutral
      }
    }
    
    // Engagement-based factors
    if (engagementScore < 0.3) {
      transitionProbability += 0.2; // Low engagement increases chance of negative emotions
    }
    
    if (engagementScore > 0.7) {
      transitionProbability += 0.2; // High engagement increases chance of positive emotions
    }
    
    // Duration-based factors
    if (currentEmotion === "confused" && emotionIntensity > 0.8) {
      transitionProbability += 0.2; // Prolonged high confusion may lead to frustration
    }
    
    // Small random factor
    transitionProbability += random(0, 0.05);
    
    // Apply emotional stability as a resistance factor
    transitionProbability *= (1 - emotionStability);
    
    // Check if we should transition to a new emotion
    if (transitionProbability > emotionTransitionThreshold) {
      // Determine the appropriate emotion to transition to based on context
      let newEmotion = currentEmotion;
      let possibleEmotions = [];
      
      // Build list of possible emotions based on current state and context
      // This allows direct transitions between any states, but weights them by context
      if (currentEmotion === "happy") {
        // Happy can transition to any state, but most likely neutral
        possibleEmotions = [
          "neutral", "neutral", "neutral", // Weighted toward neutral
          "confused", 
          "frustrated" // Least likely
        ];
      } else if (currentEmotion === "neutral") {
        // Neutral can go anywhere based on context
        if (engagementScore > 0.7 || lastAgentMessage.includes("clear")) {
          possibleEmotions = ["happy", "happy", "confused", "frustrated"];
        } else if (lastAgentMessage.includes("complex")) {
          possibleEmotions = ["confused", "confused", "happy", "frustrated"];
        } else if (engagementScore < 0.3) {
          possibleEmotions = ["frustrated", "confused", "happy"];
        } else {
          possibleEmotions = ["happy", "confused", "frustrated"];
        }
      } else if (currentEmotion === "confused") {
        // Confused can go anywhere, but weighted by context
        if (lastAgentMessage.includes("simple") || lastAgentMessage.includes("understand")) {
          possibleEmotions = ["neutral", "neutral", "happy", "frustrated"];
        } else if (emotionIntensity > 0.8 || engagementScore < 0.3) {
          possibleEmotions = ["frustrated", "frustrated", "neutral"];
        } else {
          possibleEmotions = ["neutral", "frustrated", "happy"];
        }
      } else if (currentEmotion === "frustrated") {
        // Frustrated can go anywhere, but weighted by context
        if (lastAgentMessage.includes("simple") || lastAgentMessage.includes("understand")) {
          possibleEmotions = ["neutral", "neutral", "confused", "happy"];
        } else {
          possibleEmotions = ["confused", "confused", "neutral", "happy"];
        }
      }
      
      // Select a new emotion from the weighted possibilities
      newEmotion = random(possibleEmotions);
      
      // Only update if the emotion actually changed
      if (newEmotion !== currentEmotion) {
        currentEmotion = newEmotion;
        lastEmotionChange = currentTime;
        emotionIntensity = 0.5; // Reset intensity on emotion change
        
        // Log the emotion change for debugging
        console.log("Emotion changed to: " + currentEmotion + 
                   " (Probability: " + nf(transitionProbability, 1, 2) + ")");
        
        // Add backend message about the emotion change
        addBackendMessage("Emotion state transition: " + currentEmotion, "cognitive");
      }
    }
  }
  
  // Update bio-signal amplitudes based on current emotion and intensity
  updateBioSignals();
}

// Separate function to update bio-signals based on emotional state
function updateBioSignals() {
  // Update brain wave amplitudes based on current emotion and intensity
  if (currentEmotion === "happy") {
    alphaAmplitude = 0.8 + sin(millis() * 0.001) * 0.1 * emotionIntensity;
    betaAmplitude = 0.4 + sin(millis() * 0.002) * 0.1 * emotionIntensity;
    thetaAmplitude = 0.3 + sin(millis() * 0.0015) * 0.05 * emotionIntensity;
    deltaAmplitude = 0.2 + sin(millis() * 0.0005) * 0.05 * emotionIntensity;
  } else if (currentEmotion === "neutral") {
    alphaAmplitude = 0.6 + sin(millis() * 0.001) * 0.1 * emotionIntensity;
    betaAmplitude = 0.5 + sin(millis() * 0.002) * 0.1 * emotionIntensity;
    thetaAmplitude = 0.4 + sin(millis() * 0.0015) * 0.05 * emotionIntensity;
    deltaAmplitude = 0.3 + sin(millis() * 0.0005) * 0.05 * emotionIntensity;
  } else if (currentEmotion === "confused") {
    alphaAmplitude = 0.4 + sin(millis() * 0.001) * 0.15 * emotionIntensity;
    betaAmplitude = 0.7 + sin(millis() * 0.002) * 0.15 * emotionIntensity;
    thetaAmplitude = 0.6 + sin(millis() * 0.0015) * 0.1 * emotionIntensity;
    deltaAmplitude = 0.3 + sin(millis() * 0.0005) * 0.05 * emotionIntensity;
  } else if (currentEmotion === "frustrated") {
    alphaAmplitude = 0.3 + sin(millis() * 0.001) * 0.2 * emotionIntensity;
    betaAmplitude = 0.9 + sin(millis() * 0.002) * 0.2 * emotionIntensity;
    thetaAmplitude = 0.4 + sin(millis() * 0.0015) * 0.1 * emotionIntensity;
    deltaAmplitude = 0.5 + sin(millis() * 0.0005) * 0.15 * emotionIntensity;
  }
  
  // Update engagement score with small fluctuations
  engagementScore += random(-0.03, 0.03) * (1 - emotionStability);
  engagementScore = constrain(engagementScore, 0.1, 0.9);
  
  // Adjust engagement based on current emotion (subtle influence)
  if (currentEmotion === "happy") {
    engagementScore = lerp(engagementScore, 0.8, 0.01);
  } else if (currentEmotion === "frustrated") {
    engagementScore = lerp(engagementScore, 0.3, 0.01);
  }
}

// Update demo scenes to follow the specified emotional progression

// Define sceneStartTime if it doesn't exist yet, otherwise just use it
if (typeof sceneStartTime === 'undefined') {
  var sceneStartTime = 0;
}

// Update the demo scene handling to manage emotional transitions
function updateDemoScene() {
  if (!demoMode) return;
  
  let scene = demoScenes[currentScene];
  let currentTime = millis();
  let elapsedTime = currentTime - sceneStartTime;
  
  // Handle within-scene emotional transitions
  if (scene.transitionTo && !scene.transitioned && elapsedTime >= scene.transitionDelay) {
    // If staying in the same emotion but with different intensity (Scene 3 - confused)
    if (scene.transitionTo === currentEmotion) {
      // Keep same emotion but worsen cognitive metrics
      emotionIntensity = 0.9; // Increase intensity
      cognitiveLoad = Math.min(cognitiveLoad + 0.15, 0.95); // Increase cognitive load
      engagementScore = Math.max(engagementScore - 0.1, 0.3); // Decrease engagement
      attentionScore = Math.max(attentionScore - 0.1, 0.4); // Decrease attention
      
      // Add a subtle visual indication
      addPulseEffect(stateX, stateY, stateW, stateH, color(255, 180, 0)); // Orange pulse for deepening confusion
      addBackendMessage("Increased cognitive load detected", "cognitive");
    } else {
      // Regular emotion transition
      currentEmotion = scene.transitionTo;
      emotionIntensity = 0.7;
      
      // Update webcamPanel with new emotion
      if (webcamPanel) {
        if (!webcamPanel.bioSignalData) {
          webcamPanel.bioSignalData = {};
        }
        webcamPanel.bioSignalData.currentEmotion = scene.transitionTo;
        webcamPanel.markDirty();
        console.log("Demo scene update - set webcamPanel emotion to:", scene.transitionTo);
      }
      
      // Add a subtle visual indication
      addPulseEffect(stateX, stateY, stateW, stateH, accentColor2);
      // Remove emotion change message
      // addBackendMessage("Emotion changed to " + scene.transitionTo, "cognitive");
    
      // Update bio signals for the new emotion
      if (currentEmotion === "neutral") {
        engagementScore = Math.min(engagementScore + 0.2, 0.9);
        cognitiveLoad = Math.max(cognitiveLoad - 0.2, 0.3);
      } else if (currentEmotion === "happy") {
        engagementScore = Math.min(engagementScore + 0.3, 0.9);
        cognitiveLoad = Math.max(cognitiveLoad - 0.3, 0.2);
      } else if (currentEmotion === "frustrated") {
        engagementScore = Math.max(engagementScore - 0.2, 0.2);
        cognitiveLoad = Math.min(cognitiveLoad + 0.2, 0.9);
      }
    }
    
    scene.transitioned = true;
  }
  
  // Handle final transitions if applicable
  if (scene.finalEmotion && scene.transitioned && !scene.finalTransitioned &&
      elapsedTime >= scene.finalTransitionDelay) {
    currentEmotion = scene.finalEmotion;
    emotionIntensity = 0.6;
    scene.finalTransitioned = true;
    
    // Update webcamPanel with final emotion
    if (webcamPanel) {
      if (!webcamPanel.bioSignalData) {
        webcamPanel.bioSignalData = {};
      }
      webcamPanel.bioSignalData.currentEmotion = scene.finalEmotion;
      webcamPanel.markDirty();
      console.log("Demo scene final update - set webcamPanel emotion to:", scene.finalEmotion);
    }
    
    // Add a subtle visual indication
    addPulseEffect(stateX, stateY, stateW, stateH, accentColor1);
    // Remove final emotion state message
    // addBackendMessage("Final emotion state: " + scene.finalEmotion, "cognitive");
    
    // Update bio signals for the final emotion
    if (scene.finalEmotion === "neutral") {
      engagementScore = 0.7;
      cognitiveLoad = 0.5;
    }
  }
}

// Update the nextScene function to reset transition flags and scene start time
function nextScene() {
  if (currentScene < demoScenes.length - 1) {
    currentScene++;
    
    // Reset transition flags for the new scene
    if (demoScenes[currentScene].transitionTo) {
      demoScenes[currentScene].transitioned = false;
    }
    if (demoScenes[currentScene].finalEmotion) {
      demoScenes[currentScene].finalTransitioned = false;
    }
    
    // Record the start time of this scene
    sceneStartTime = millis();
    
    // Add a message to the backend panel
    addBackendMessage("Scene " + (currentScene + 1) + " started", "system");
    
    // Set the initial emotion for this scene
    currentEmotion = demoScenes[currentScene].bioSignals.emotion;
    emotionIntensity = 0.5;
    
    // Use playScene which properly handles all aspects of scene playback
    playScene(currentScene);
  }
}

// Update the startDemo function to initialize the first scene properly
function startDemo() {
  demoMode = true;
  currentScene = 0;
  sceneStartTime = millis();
  
  // Clear existing messages
  chatMessages = [];
  backendMessages = [];
  
  // Set initial emotion
  currentEmotion = demoScenes[currentScene].bioSignals.emotion;
  emotionIntensity = 0.5;
  
  // Add first scene messages
  addChatMessage("AI Instructor", demoScenes[currentScene].agentMessage);
  
  setTimeout(() => {
    addChatMessage("User", demoScenes[currentScene].userResponse);
  }, 800); // Reduced from 1000 to 800ms for quicker response
  
  // Add more detailed system startup messages
  addBackendMessage("Demo mode initialized", "system");
  addBackendMessage("Loading neural interface drivers...", "system");
  addBackendMessage("Neural interface drivers loaded", "system");
  addBackendMessage("Bio-signal processing module activated", "sensor");
  addBackendMessage("Cognitive state analysis engine ready", "cognitive");
  addBackendMessage("Emotion detection subsystem calibrated", "cognitive");
  
  // Add welcome message if available
  if (demoScenes[0].welcomeMessage) {
    addChatMessage("AI Instructor", demoScenes[0].welcomeMessage);
  }
  
  // Add any backend messages for this scene
  if (demoScenes[currentScene].backendMessages) {
    for (let i = 0; i < demoScenes[currentScene].backendMessages.length; i++) {
      let msg = demoScenes[currentScene].backendMessages[i];
      setTimeout(() => {
        addBackendMessage(msg.text, msg.type);
      }, 3500 + i * 1500); // Start after our custom messages
    }
  }
}

// Update System Telemetry panel with revised color coding

function drawSystemPanel(x, y, w, h) {
  push();
  translate(x, y);
  
  // Draw panel background
  fill(panelBg);
  noStroke();
  rect(0, 0, w, h, panelRounding);
  
  // Draw title
  fill(lightText);
  textSize(14);
  textAlign(LEFT, TOP);
  text("System Telemetry", 10, 10);
  
  // Draw message container
  fill(20, 20, 20);
  rect(10, 30, w - 20, h - 40, 5);
  
  // Define content area (below title)
  let titleHeight = 30;
  let contentY = titleHeight;
  let contentHeight = h - titleHeight;
  
  // Create clipping region for messages (only for content area)
  push();
  beginClip();
  rect(0, contentY, w, contentHeight, 0, 0, panelRounding, panelRounding);
  endClip();
  
  // Calculate total content height
  let totalContentHeight = 0;
  let messageHeight = 25;
  let messageSpacing = 5;
  
  for (let i = 0; i < backendMessages.length; i++) {
    totalContentHeight += messageHeight + messageSpacing;
  }
  
  // Calculate max scroll
  maxBackendScroll = max(0, totalContentHeight - contentHeight);
  
  // Constrain scroll position
  backendScrollY = constrain(backendScrollY, 0, maxBackendScroll);
  
  // Draw messages
  let currentY = contentY - backendScrollY;
  
  for (let i = 0; i < backendMessages.length; i++) {
    let msg = backendMessages[i];
    
    // Skip if outside visible area
    if (currentY + messageHeight < contentY || currentY > contentY + contentHeight) {
      currentY += messageHeight + messageSpacing;
      continue;
    }
    
    // Set color based on message type
    let msgColor;
    switch(msg.type) {
      case "system":
        msgColor = systemMsgColor;
        break;
      case "cognitive":
        msgColor = cognitiveMsgColor;
        break;
      case "sensor":
        msgColor = sensorMsgColor;
        break;
      case "error":
        msgColor = color(255, 80, 80); // Red
        break;
      case "insight":
        msgColor = color(255, 140, 0); // Orange
        break;
      default:
        msgColor = lightText;
    }
    
    // Format timestamp
    let timestamp = "";
    if (msg.timestamp) {
      let date = new Date(msg.timestamp);
      let minutes = date.getMinutes().toString().padStart(2, '0');
      let seconds = date.getSeconds().toString().padStart(2, '0');
      let milliseconds = Math.floor(date.getMilliseconds() / 10).toString().padStart(2, '0');
      timestamp = `${minutes}:${seconds}.${milliseconds} `;
    }
    
    // Draw message
    fill(msgColor);
    textSize(12);
    textAlign(LEFT, TOP);
    text(timestamp + msg.text, 10, currentY);
    
    currentY += messageHeight + messageSpacing;
  }
  
  pop();
  
  // Draw scrollbar if needed
  if (maxBackendScroll > 0) {
    let scrollbarHeight = (contentHeight / totalContentHeight) * contentHeight;
    let scrollbarY = contentY + (backendScrollY / maxBackendScroll) * (contentHeight - scrollbarHeight);
    
    // Draw scrollbar track
    fill(40);
    rect(w - 10, contentY, 5, contentHeight, 2);
    
    // Draw scrollbar thumb
    fill(80);
    rect(w - 10, scrollbarY, 5, scrollbarHeight, 2);
  }
  
  pop();
}

// Test function
function testSystemPanel() {
  // Add test messages
  addBackendMessage("System message test", "system");
  addBackendMessage("Error message test", "error");
  addBackendMessage("Bio-sensing message test", "cognitive");
  addBackendMessage("Insight message test", "insight");
}

// Uncomment to test
// testSystemPanel();

// Test function that adds a simple message
function testTimestamp() {
  // Add a test message
  addBackendMessage("Test message with fixed timestamp", "system");
}

// Call this function to test
// testTimestamp();

// Function to trigger random state changes in non-demo mode
function triggerRandomStateChange() {
  // Skip in demo mode or when webcam is controlling state
  if (demoMode || webcamControlsState === true) {
    if (webcamControlsState === true) {
      console.log("⏩ Skipping random state change - webcam is controlling state");
    }
    return;
  }
  
  // Get current emotion
  let previousEmotion = currentEmotion;
  
  // Define transition probabilities based on current emotion
  // New probability distribution as requested:
  // - Happy and confused should have higher probability
  // - Frustrated should be second lowest
  // - Neutral should be lowest
  let transitionProbabilities = {};
  
  if (currentEmotion === "neutral") {
    transitionProbabilities = {
      "happy": 0.5,      // Increased from 0.4
      "confused": 0.3,   // Same
      "frustrated": 0.15, // Increased from 0.1
      "neutral": 0.05    // Reduced from 0.2 (lowest)
    };
  } else if (currentEmotion === "happy") {
    transitionProbabilities = {
      "neutral": 0.15,    // Reduced from 0.5 (now lowest)
      "confused": 0.5,    // Increased from 0.2 (now highest)
      "frustrated": 0.25, // Increased from 0.1 (now second highest)
      "happy": 0.1        // Reduced from 0.2 (second lowest)
    };
  } else if (currentEmotion === "confused") {
    transitionProbabilities = {
      "neutral": 0.1,     // Reduced from 0.3 (now lowest)
      "happy": 0.45,      // Increased from 0.2 (now highest)
      "frustrated": 0.25, // Reduced from 0.3 (now middle)
      "confused": 0.2     // Same
    };
  } else if (currentEmotion === "frustrated") {
    transitionProbabilities = {
      "neutral": 0.15,    // Reduced from 0.4 (now lowest)
      "confused": 0.4,    // Increased from 0.3 (now highest)
      "happy": 0.3,       // Increased from 0.1 (now second highest)
      "frustrated": 0.15  // Reduced from 0.2 (now tied for lowest)
    };
  }
  
  // Select new emotion based on probabilities
  let random = Math.random();
  let cumulativeProbability = 0;
  let newEmotion = currentEmotion; // default to staying the same
  
  for (let emotion in transitionProbabilities) {
    cumulativeProbability += transitionProbabilities[emotion];
    if (random <= cumulativeProbability) {
      newEmotion = emotion;
      break;
    }
  }
  
  // Only continue if the emotion actually changed
  if (newEmotion === previousEmotion) return;
  
  // ADD TO EMOTION BUFFER for time window analysis
  addEmotionToBuffer(newEmotion, 75); // Add with 75% confidence for simulation
  console.log(`📊 SIMULATION: Added ${newEmotion} to emotion buffer`);
  
  // Update the emotion
  currentEmotion = newEmotion;
  emotionIntensity = 0.9; // Set a high intensity for better visibility in the emotion bar
  
  // Update cognitive metrics based on new emotion
  updateCognitiveMetricsForEmotion(newEmotion);
  
  // Add pulse effect to state panel to indicate change
  addPulseEffect(stateX, stateY, stateW, stateH, accentColor2);
  
  // Add telemetry messages
  addStateChangeTelemetry(previousEmotion, newEmotion);
  
  // Update webcamPanel with new emotion
  if (webcamPanel) {
    if (!webcamPanel.bioSignalData) {
      webcamPanel.bioSignalData = {};
    }
    webcamPanel.bioSignalData.currentEmotion = newEmotion;
    webcamPanel.markDirty(); // Force a redraw
    console.log("Random emotion change - updated webcamPanel emotion to:", newEmotion);
  }
}

// Function to update cognitive metrics based on emotion
function updateCognitiveMetricsForEmotion(emotion) {
  if (emotion === "happy") {
    engagementScore = Math.min(0.8 + Math.random() * 0.15, 0.95);
    attentionScore = Math.min(0.75 + Math.random() * 0.15, 0.9);
    cognitiveLoad = Math.max(0.2 + Math.random() * 0.2, 0.25);
  } else if (emotion === "neutral") {
    engagementScore = 0.6 + Math.random() * 0.2;
    attentionScore = 0.55 + Math.random() * 0.25;
    cognitiveLoad = 0.4 + Math.random() * 0.2;
  } else if (emotion === "confused") {
    engagementScore = Math.max(0.4 + Math.random() * 0.2, 0.35);
    attentionScore = Math.max(0.5 + Math.random() * 0.15, 0.4);
    cognitiveLoad = Math.min(0.7 + Math.random() * 0.2, 0.9);
  } else if (emotion === "frustrated") {
    engagementScore = Math.max(0.2 + Math.random() * 0.2, 0.25);
    attentionScore = Math.max(0.3 + Math.random() * 0.2, 0.35);
    cognitiveLoad = Math.min(0.8 + Math.random() * 0.15, 0.95);
  }
  
  // Update EEG wave parameters based on the new emotional state
  updateEEGWavesForEmotion(emotion);
}

// Function to update EEG wave parameters based on emotion
function updateEEGWavesForEmotion(emotion) {
  if (emotion === "happy") {
    alphaAmplitude = 0.8 + Math.random() * 0.1;  // High alpha (relaxation)
    betaAmplitude = 0.4 + Math.random() * 0.1;   // Lower beta (less mental effort)
    thetaAmplitude = 0.3 + Math.random() * 0.1;  // Low theta
    deltaAmplitude = 0.2 + Math.random() * 0.1;  // Low delta
  } else if (emotion === "neutral") {
    alphaAmplitude = 0.5 + Math.random() * 0.1;  // Moderate alpha
    betaAmplitude = 0.5 + Math.random() * 0.1;   // Moderate beta
    thetaAmplitude = 0.3 + Math.random() * 0.1;  // Moderate theta
    deltaAmplitude = 0.3 + Math.random() * 0.1;  // Moderate delta
  } else if (emotion === "confused") {
    alphaAmplitude = 0.3 + Math.random() * 0.1;  // Low alpha (less relaxation)
    betaAmplitude = 0.8 + Math.random() * 0.1;   // High beta (mental effort)
    thetaAmplitude = 0.5 + Math.random() * 0.1;  // Higher theta (distraction)
    deltaAmplitude = 0.3 + Math.random() * 0.1;  // Moderate delta
  } else if (emotion === "frustrated") {
    alphaAmplitude = 0.2 + Math.random() * 0.1;  // Very low alpha (stress)
    betaAmplitude = 0.9 + Math.random() * 0.1;   // Very high beta (high mental effort)
    thetaAmplitude = 0.4 + Math.random() * 0.1;  // Moderate-high theta
    deltaAmplitude = 0.5 + Math.random() * 0.1;  // Higher delta (discomfort)
  }
}

// Function to add appropriate telemetry messages for state changes
function addStateChangeTelemetry(previousEmotion, newEmotion) {
  // Add a system message with a simpler format that shows just the key change
  addBackendMessage({
    text: `Bio-signal pattern update: ${previousEmotion} → ${newEmotion}`,
    type: "system"
  });
  
  // Additional sensor message only for significant EEG changes
  if (newEmotion === "happy" && (previousEmotion === "confused" || previousEmotion === "frustrated")) {
    addBackendMessage("EEG: Alpha wave activity increasing", "sensor");
  } else if ((newEmotion === "confused" || newEmotion === "frustrated") && previousEmotion === "happy") {
    addBackendMessage("EEG: Beta wave activity increasing", "sensor");
  }
}

// Add this function after the mouseWheel function
function mousePressed() {
  // Check if mouse is over webcamPanel
  if (mouseX >= webcamX && mouseX <= webcamX + webcamW &&
      mouseY >= webcamY && mouseY <= webcamY + webcamH) {
    // Convert global coordinates to panel-local coordinates
    let localX = mouseX - webcamX;
    let localY = mouseY - webcamY;
    
    // Forward event to panel
    if (webcamPanel && typeof webcamPanel.handleMousePressed === 'function') {
      return webcamPanel.handleMousePressed(localX, localY);
    }
  }
  
  // If we get here, no panel handled the event
  return true; // Allow default behavior
}

/**
 * Adds emotion data to the time window buffer
 * This should be called whenever a new emotion is detected (webcam, demo, etc.)
 */
function addEmotionToBuffer(emotionName, confidence, timestamp = Date.now()) {
  const normalizedConfidence = confidence / 100; // Normalize to 0-1 range
  
  // Apply higher threshold for neutral emotions to combat over-representation
  if (emotionName.toLowerCase() === 'neutral' && normalizedConfidence < 0.9) {
    console.log(`🚫 FILTERED: Neutral emotion blocked (confidence: ${normalizedConfidence.toFixed(2)} < 0.9 threshold)`);
    return; // Don't add low-confidence neutral emotions to buffer
  }
  
  emotionBuffer.push({
    emotion: emotionName,
    confidence: normalizedConfidence,
    timestamp: timestamp
  });
  
  console.log(`📊 ADDED to buffer: ${emotionName} (confidence: ${normalizedConfidence.toFixed(2)})`);
  
  // Clean old entries outside the window
  cleanEmotionBuffer(timestamp);
}

/**
 * Removes emotion entries older than the window size
 */
function cleanEmotionBuffer(currentTime = Date.now()) {
  const cutoffTime = currentTime - EMOTION_WINDOW_SIZE;
  emotionBuffer = emotionBuffer.filter(entry => entry.timestamp >= cutoffTime);
}

/**
 * Calculates composite emotion scores using frequency and strength with recency weighting
 */
function calculateCompositeEmotionScores(currentTime = Date.now()) {
  cleanEmotionBuffer(currentTime);
  
  if (emotionBuffer.length === 0) {
    return { neutral: 1.0 }; // Default to neutral if no data
  }
  
  const emotionScores = {};
  const windowStart = currentTime - EMOTION_WINDOW_SIZE;
  
  // Calculate scores for each emotion
  emotionBuffer.forEach(entry => {
    const emotion = entry.emotion;
    const confidence = entry.confidence;
    
    // Calculate recency factor (more recent = higher weight)
    const age = currentTime - entry.timestamp;
    const recencyFactor = 1 + (RECENCY_WEIGHT * (1 - age / EMOTION_WINDOW_SIZE));
    
    // Composite score = confidence * recency_factor
    let score = confidence * recencyFactor;
    
    // Apply 10% penalty to neutral emotions to reduce their dominance
    if (emotion.toLowerCase() === 'neutral') {
      score *= 0.9; // 10% penalty
      console.log(`⚖️ NEUTRAL PENALTY: Applied 10% penalty to ${emotion} score (${(score/0.9).toFixed(3)} → ${score.toFixed(3)})`);
    }
    
    if (!emotionScores[emotion]) {
      emotionScores[emotion] = 0;
    }
    emotionScores[emotion] += score;
  });
  
  return emotionScores;
}

/**
 * Selects the winning emotion based on composite scores
 */
function selectWinningEmotion() {
  const emotionScores = calculateCompositeEmotionScores();
  
  // Log all emotion scores for debugging
  console.log('🏆 EMOTION SCORES:', Object.entries(emotionScores)
    .map(([emotion, score]) => `${emotion}: ${score.toFixed(3)}`)
    .join(', '));
  
  // Find emotion with highest score
  let winningEmotion = 'neutral';
  let highestScore = 0;
  
  for (const [emotion, score] of Object.entries(emotionScores)) {
    if (score > highestScore) {
      highestScore = score;
      winningEmotion = emotion;
    }
  }
  
  console.log(`🎯 WINNER: ${winningEmotion} with score ${highestScore.toFixed(3)}`);
  
  // Calculate average confidence for the winning emotion
  const winningEmotionEntries = emotionBuffer.filter(entry => entry.emotion === winningEmotion);
  const avgConfidence = winningEmotionEntries.length > 0 ?
    winningEmotionEntries.reduce((sum, entry) => sum + entry.confidence, 0) / winningEmotionEntries.length :
    0.5;
  
  return {
    emotion: winningEmotion,
    confidence: avgConfidence,
    totalScore: highestScore,
    windowData: emotionScores
  };
}

// Make the function globally accessible for webcam integration
window.addEmotionToBuffer = addEmotionToBuffer;