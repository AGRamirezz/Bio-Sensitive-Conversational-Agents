// Absolute minimal code to test if p5.js is working

// Global variables for panels
let eegX, eegY, eegW, eegH;
let stateX, stateY, stateW, stateH;
let webcamX, webcamY, webcamW, webcamH;
let chatX, chatY, chatW, chatH;
let backendX, backendY, backendW, backendH;
let inputX, inputY, inputW, inputH;

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
function addBackendMessage(text, type = "system") {
  backendMessages.push({
    text: text,
    timestamp: Date.now(),
    type: type
  });
  
  if (backendMessages.length > 50) {
    backendMessages.shift();
  }
  
  // Add pulse effect based on message type
  let pulseColor;
  switch(type) {
    case "system":
      pulseColor = systemMsgColor;
      break;
    case "cognitive":
      pulseColor = cognitiveMsgColor;
      break;
    case "sensor":
      pulseColor = sensorMsgColor;
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
  text("System Telemetry", 10, 10);
  
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
    // Scene 3: Confused and Frustrated
    agentMessage: "Key Excel functions include VLOOKUP for data retrieval, SUMIF/COUNTIF for conditional calculations, and pivot tables for summarizing large datasets. Let me demonstrate how pivot tables can transform sales data into regional performance insights.\n\nNow let's explore SQL fundamentals. SQL allows you to query databases to extract specific information. The basic syntax follows this pattern: SELECT columns FROM table WHERE conditions GROUP BY category HAVING group_conditions ORDER BY column;",
    userResponse: "Hmmm...So it's like asking database questions?",
    bioSignals: {
      engagement: 0.4,
      emotion: "confused", // Starts confused
      attention: 0.5,
      cognitiveLoad: 0.8
    },
    transitionTo: "frustrated", // Will transition to frustrated during this scene
    transitionDelay: 5000, // Transition after 5 seconds
    backendMessages: [
      { text: "Confusion detected. Recommend clarification protocol.", type: "cognitive" },
      { text: "Cognitive load high. Recommend procedural adjustment.", type: "cognitive" },
      { text: "Transitioning to frustrated state.", type: "cognitive" }
    ]
  },
  {
    // Scene 4: Frustrated to Neutral
    agentMessage: "I notice this might be challenging. Let me simplify. Think of SQL as a way to ask questions about your data. Let's break it down into smaller parts:\n\n• SELECT: What information do you want? (like customer names, sales amounts)\n• FROM: Where is this information stored? (which database table)\n• WHERE: Any specific conditions? (like sales over $1000)\n\nWould a visual example help?",
    userResponse: "Yeah, that makes more sense. I'm just trying to picture how I'd use this at work.",
    bioSignals: {
      engagement: 0.6,
      emotion: "frustrated", // Starts frustrated
      attention: 0.65,
      cognitiveLoad: 0.6
    },
    transitionTo: "neutral", // Will transition to neutral during this scene
    transitionDelay: 4000, // Transition after 4 seconds
    backendMessages: [
      { text: "Frustration detected. Implementing simplification strategy.", type: "cognitive" },
      { text: "Cognitive load decreasing. Continue current approach.", type: "cognitive" },
      { text: "Transitioning to neutral state.", type: "cognitive" }
    ]
  },
  {
    // Scene 5: Neutral to Happy
    agentMessage: "Here's a simpler approach. Imagine a spreadsheet of customer data. SQL lets you filter and organize this data to answer business questions like 'Which products are most profitable?' or 'Are certain regions underperforming?' Let's start with a basic query to find total sales by region.\n\nLet's apply what we've learned to a real scenario. The NYSE S&P dataset contains financial data for major companies. How might we use Excel and SQL to identify investment opportunities based on financial performance trends?",
    userResponse: "Hmm, maybe look at which companies are growing faster? Or find the ones that make steady money instead of going up and down all the time?",
    bioSignals: {
      engagement: 0.7,
      emotion: "neutral", // Starts neutral
      attention: 0.7,
      cognitiveLoad: 0.5
    },
    transitionTo: "happy", // Will transition to happy during this scene
    transitionDelay: 4000, // Transition after 4 seconds
    backendMessages: [
      { text: "Understanding increasing. Concept acquisition successful.", type: "cognitive" },
      { text: "Engagement metrics improving.", type: "cognitive" },
      { text: "Transitioning to positive emotional state.", type: "cognitive" }
    ]
  },
  {
    // Scene 6: Happy to Neutral
    agentMessage: "Excellent approach! You could use SQL to extract year-over-year growth rates by sector, then visualize these trends in Excel or Tableau. This exact analysis helps investment firms identify promising sectors and companies. You're thinking like a business analyst now.\n\nYou've made excellent progress today. We covered Excel functions for data analysis, SQL basics for data querying, and applied these concepts to financial analysis. For our next session, we'll explore data visualization with Tableau. Would you like me to prepare any specific examples?",
    userResponse: "This was pretty cool. Next time could we look at making those dashboard things? My boss loves graphs and charts.",
    bioSignals: {
      engagement: 0.8,
      emotion: "happy", // Starts happy
      attention: 0.75,
      cognitiveLoad: 0.4
    },
    transitionTo: "neutral", // Will transition to neutral during this scene
    transitionDelay: 5000, // Transition after 5 seconds
    backendMessages: [
      { text: "Session completion approaching. Preparing conclusion.", type: "system" },
      { text: "User satisfaction metrics high.", type: "cognitive" },
      { text: "Transitioning to neutral state for session closure.", type: "cognitive" }
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
  
  // Set up panel dimensions and positions with adjusted widths
  chatX = 20;
  chatY = height * 0.3 + 10;
  chatW = width * 0.6 - 30;
  chatH = height * 0.7 - 100;
  
  backendX = width * 0.6 + 10;
  backendY = height * 0.3 + 10;
  backendW = width * 0.4 - 30;
  backendH = height * 0.7 - 100;
  
  // Adjust EEG and webcam widths - make EEG wider
  eegX = chatX;
  eegY = 20;
  eegW = (chatW - 10) * 0.65; // Increased from 0.6 to 0.65
  eegH = chatY - 30;
  
  webcamX = eegX + eegW + 10;
  webcamY = 20;
  webcamW = (chatW - 10) * 0.35; // Decreased from 0.4 to 0.35
  webcamH = chatY - 30;
  
  stateX = backendX;
  stateY = 20;
  stateW = backendW;
  stateH = chatY - 30;
  
  inputX = chatX;
  inputY = height - 70;
  inputW = chatW;
  inputH = 40;
  
  // Create input field
  inputElement = createInput();
  inputElement.position(inputX + 10, inputY + 10);
  inputElement.size(inputW - 100, inputH - 20);
  inputElement.style('background-color', '#2a2a3a');
  inputElement.style('color', '#ddd');
  inputElement.style('border', 'none');
  inputElement.style('border-radius', '5px');
  inputElement.style('padding', '5px 10px');
  inputElement.style('font-family', 'Arial');
  inputElement.style('font-size', '14px');
  
  // Create send button
  sendButton = createButton('Send');
  sendButton.position(inputX + inputW - 80, inputY + 10);
  sendButton.size(80, 30);
  sendButton.style('background-color', accentColor1.toString());
  sendButton.style('color', '#fff');
  sendButton.style('border', 'none');
  sendButton.style('border-radius', '5px');
  sendButton.style('font-family', 'Arial');
  sendButton.style('font-size', '14px');
  sendButton.style('cursor', 'pointer');
  sendButton.mousePressed(handleSubmit);
  
  // Create demo controls - now positioned at the bottom
  demoButton = createButton('Start Demo');
  demoButton.position(backendX, inputY + 10);
  demoButton.size(100, 30);
  demoButton.style('background-color', accentColor2.toString());
  demoButton.style('color', '#fff');
  demoButton.style('border', 'none');
  demoButton.style('border-radius', '5px');
  demoButton.style('font-family', 'Arial');
  demoButton.style('font-size', '14px');
  demoButton.style('cursor', 'pointer');
  demoButton.mousePressed(toggleDemo);
  
  nextSceneButton = createButton('Next Scene');
  nextSceneButton.position(backendX + 110, inputY + 10);
  nextSceneButton.size(100, 30);
  nextSceneButton.style('background-color', accentColor1.toString());
  nextSceneButton.style('color', '#fff');
  nextSceneButton.style('border', 'none');
  nextSceneButton.style('border-radius', '5px');
  nextSceneButton.style('font-family', 'Arial');
  nextSceneButton.style('font-size', '14px');
  nextSceneButton.style('cursor', 'pointer');
  nextSceneButton.mousePressed(nextScene);
  nextSceneButton.hide(); // Hide until demo starts
  
  resetDemoButton = createButton('Reset Demo');
  resetDemoButton.position(backendX + 220, inputY + 10);
  resetDemoButton.size(100, 30);
  resetDemoButton.style('background-color', color(255, 100, 100).toString());
  resetDemoButton.style('color', '#fff');
  resetDemoButton.style('border', 'none');
  resetDemoButton.style('border-radius', '5px');
  resetDemoButton.style('font-family', 'Arial');
  resetDemoButton.style('font-size', '14px');
  resetDemoButton.style('cursor', 'pointer');
  resetDemoButton.mousePressed(resetDemo);
  resetDemoButton.hide(); // Hide until demo starts
  
  // Add some initial messages
  addChatMessage("Agent", "Hello! How can I help you today?");
  
  // Test the telemetry panel
  testTimestamp();
}

// Toggle demo mode
function toggleDemo() {
  demoMode = !demoMode;
  
  if (demoMode) {
    // Start demo
    demoButton.html('Stop Demo');
    nextSceneButton.show();
    resetDemoButton.show();
    
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
  
  // Set EEG wave parameters based on scene
  updateEEGParameters(sceneIndex, scene);
  
  // Add agent message (will be split automatically if long)
  addChatMessage("Agent", scene.agentMessage);
  
  // Add backend messages if any
  if (scene.backendMessages) {
    for (let msg of scene.backendMessages) {
      setTimeout(() => {
        addBackendMessage(msg.text, msg.type);
      }, 500);
    }
  }
  
  // Add user response after a delay (if not empty)
  if (scene.userResponse) {
    setTimeout(() => {
      addChatMessage("User", scene.userResponse);
    }, 2000);
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

function draw() {
  // Draw background
  background(darkBg);
  
  // If in demo mode, slightly animate EEG parameters
  if (demoMode) {
    // Add subtle animation to EEG parameters
    alphaAmplitude += sin(frameCount * 0.01) * 0.005;
    betaAmplitude += sin(frameCount * 0.02) * 0.005;
    thetaAmplitude += sin(frameCount * 0.015) * 0.003;
    deltaAmplitude += sin(frameCount * 0.005) * 0.002;
  }
  
  // Draw panels with labels
  drawEEGPanel(eegX, eegY, eegW, eegH);
  drawStatePanel(stateX, stateY, stateW, stateH);
  drawWebcamPanel(webcamX, webcamY, webcamW, webcamH);
  drawChatPanel(chatX, chatY, chatW, chatH);
  drawBackendPanel(backendX, backendY, backendW, backendH);
  drawInputArea(inputX, inputY, inputW, inputH);
  
  // Draw pulse effects
  updatePulseEffects();
  
  // Update demo scene emotions if in demo mode
  if (demoMode) {
    updateDemoScene();
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
  text("EEG Monitor", 10, 10);
  
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
  text("Cognitive State Tracker", 10, 10);
  
  // Set up spacing for bars - more compact layout
  let barWidth = w - 40;
  let barHeight = 8;
  let barX = 20;
  let labelHeight = 15;
  let valueWidth = 50;
  let sectionSpacing = 30;
  
  // Start Y position after title
  let currentY = 35;
  
  // Draw section for engagement
  fill(lightText);
  textSize(11);
  textAlign(LEFT, TOP);
  text("Engagement", 20, currentY);
  currentY += labelHeight;
  
  // Background bar
  fill(50, 50, 60);
  rect(barX, currentY, barWidth, barHeight, barHeight/2);
  
  // Filled portion
  let fillWidth = barWidth * engagementScore;
  let barColor;
  if (engagementScore < 0.3) {
    barColor = color(255, 100, 100); // Red for low engagement
  } else if (engagementScore < 0.6) {
    barColor = color(255, 200, 100); // Yellow for medium engagement
  } else {
    barColor = color(100, 255, 150); // Green for high engagement
  }
  
  fill(barColor);
  rect(barX, currentY, fillWidth, barHeight, barHeight/2);
  
  // Display value
  fill(lightText);
  textSize(11);
  textAlign(RIGHT, CENTER);
  text(nf(engagementScore, 1, 2), w - 20, currentY + barHeight/2);
  
  // Move to next section
  currentY += sectionSpacing;
  
  // Draw section for attention
  fill(lightText);
  textSize(11);
  textAlign(LEFT, TOP);
  text("Attention", 20, currentY);
  currentY += labelHeight;
  
  // Calculate attention based on engagement and emotion
  let attention = 0;
  if (currentEmotion === "happy") {
    attention = min(1.0, engagementScore + 0.1);
  } else if (currentEmotion === "confused") {
    attention = max(0.3, engagementScore - 0.1);
  } else if (currentEmotion === "frustrated") {
    attention = max(0.2, engagementScore - 0.2);
  } else {
    attention = engagementScore;
  }
  
  // Background bar
  fill(50, 50, 60);
  rect(barX, currentY, barWidth, barHeight, barHeight/2);
  
  // Filled portion
  fillWidth = barWidth * attention;
  if (attention < 0.3) {
    barColor = color(255, 100, 100);
  } else if (attention < 0.6) {
    barColor = color(255, 200, 100);
  } else {
    barColor = color(100, 255, 150);
  }
  
  fill(barColor);
  rect(barX, currentY, fillWidth, barHeight, barHeight/2);
  
  // Display value
  fill(lightText);
  textSize(11);
  textAlign(RIGHT, CENTER);
  text(nf(attention, 1, 2), w - 20, currentY + barHeight/2);
  
  // Move to next section
  currentY += sectionSpacing;
  
  // Draw section for cognitive load
  fill(lightText);
  textSize(11);
  textAlign(LEFT, TOP);
  text("Cognitive Load", 20, currentY);
  currentY += labelHeight;
  
  // Calculate cognitive load based on emotion
  let cognitiveLoad = 0;
  if (currentEmotion === "confused") {
    cognitiveLoad = 0.8;
  } else if (currentEmotion === "frustrated") {
    cognitiveLoad = 0.9;
  } else if (currentEmotion === "happy") {
    cognitiveLoad = 0.4;
  } else {
    cognitiveLoad = 0.5;
  }
  
  // Background bar
  fill(50, 50, 60);
  rect(barX, currentY, barWidth, barHeight, barHeight/2);
  
  // Filled portion
  fillWidth = barWidth * cognitiveLoad;
  if (cognitiveLoad > 0.7) {
    barColor = color(255, 100, 100); // Red for high load (bad)
  } else if (cognitiveLoad > 0.4) {
    barColor = color(255, 200, 100); // Yellow for medium load
  } else {
    barColor = color(100, 255, 150); // Green for low load (good)
  }
  
  fill(barColor);
  rect(barX, currentY, fillWidth, barHeight, barHeight/2);
  
  // Display value
  fill(lightText);
  textSize(11);
  textAlign(RIGHT, CENTER);
  text(nf(cognitiveLoad, 1, 2), w - 20, currentY + barHeight/2);
  
  // Move to next section
  currentY += sectionSpacing;
  
  // Draw section for emotional valence - now combined with emotion label
  fill(lightText);
  textSize(11);
  textAlign(LEFT, TOP);
  text("Emotional Valence: " + currentEmotion.toUpperCase(), 20, currentY);
  currentY += labelHeight;
  
  // Calculate emotional valence based on emotion
  let emotionalValence = 0;
  if (currentEmotion === "happy") {
    emotionalValence = 0.8;
  } else if (currentEmotion === "neutral") {
    emotionalValence = 0.5;
  } else if (currentEmotion === "confused") {
    emotionalValence = 0.3;
  } else if (currentEmotion === "frustrated") {
    emotionalValence = 0.1;
  } else {
    emotionalValence = 0.5;
  }
  
  // Background bar
  fill(50, 50, 60);
  rect(barX, currentY, barWidth, barHeight, barHeight/2);
  
  // Filled portion
  fillWidth = barWidth * emotionalValence;
  barColor = lerpColor(color(255, 100, 100), color(100, 255, 150), emotionalValence);
  fill(barColor);
  rect(barX, currentY, fillWidth, barHeight, barHeight/2);
  
  // Display value
  fill(lightText);
  textSize(11);
  textAlign(RIGHT, CENTER);
  text(nf(emotionalValence, 1, 2), w - 20, currentY + barHeight/2);
  
  pop();
}

// Cleaned up Computer Vision Analysis panel

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
  text("Computer Vision Analysis", 10, 10);
  
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
  text("User-Agent Dialogue", 10, 10);
  
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
    let msg = chatMessages[i];
    
    // Start a new group if sender changes or too much time has passed
    if (!currentGroup || 
        currentGroup.sender !== msg.sender || 
        msg.timestamp - currentGroup.messages[currentGroup.messages.length-1].timestamp > 60000) {
      if (currentGroup) {
        groupedMessages.push(currentGroup);
      }
      currentGroup = {
        sender: msg.sender,
        messages: [msg],
        timestamp: msg.timestamp
      };
    } else {
      // Add to current group
      currentGroup.messages.push(msg);
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
    let isUser = group.sender.startsWith("User");
    
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
      fill(isUser ? color(200, 200, 220) : color(150, 200, 255));
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
      
      // Draw bubble with gradient background
      if (isUser) {
        // User message gradient (darker blue)
        let userGradient = drawingContext.createLinearGradient(
          bubbleX, currentY, bubbleX + bubbleWidth, currentY + bubbleHeight
        );
        userGradient.addColorStop(0, 'rgba(50, 50, 70, 1)');
        userGradient.addColorStop(1, 'rgba(40, 40, 60, 1)');
        drawingContext.fillStyle = userGradient;
      } else {
        // Agent message gradient (accent color)
        let agentGradient = drawingContext.createLinearGradient(
          bubbleX, currentY, bubbleX + bubbleWidth, currentY + bubbleHeight
        );
        agentGradient.addColorStop(0, 'rgba(35, 35, 50, 1)');
        agentGradient.addColorStop(1, 'rgba(45, 45, 65, 1)');
        drawingContext.fillStyle = agentGradient;
      }
      
      // Draw bubble with tail
      beginShape();
      if (isUser) {
        // User message (right side)
        vertex(bubbleX + bubbleWidth, currentY + 10);
        vertex(bubbleX + bubbleWidth + 8, currentY + 15);
        vertex(bubbleX + bubbleWidth, currentY + 20);
      } else {
        // Agent message (left side)
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
  let words = textContent.split(' ');
  let line = '';
  let lineCount = 1;
  let lineHeight = 20; // Increased line height for better readability
  let maxLineWidth = 0;
  
  textSize(13); // Set text size to match what will be used for rendering
  
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
  
  return {
    width: maxLineWidth,
    height: lineCount * lineHeight
  };
}

// Improved text drawing function with proper wrapping
function drawWrappedText(textContent, x, y, maxWidth) {
  let words = textContent.split(' ');
  let line = '';
  let lineHeight = 20; // Increased line height for better readability
  let currentY = y;
  
  textSize(13); // Ensure text size is consistent
  
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
  
  // Draw the last line
  text(line, x, currentY);
}

function drawInputArea(x, y, w, h) {
  push();
  translate(x, y);
  
  // Draw input area background
  fill(panelBg);
  noStroke();
  rect(0, 0, w, h, 5);
  
  pop();
}

function addChatMessage(sender, text) {
  // Capitalize first letter of sender for consistency
  sender = sender.charAt(0).toUpperCase() + sender.slice(1).toLowerCase();
  
  // Split long messages into multiple bubbles (for agent only)
  if (sender === "Agent" && text.length > 200) {
    // Split by paragraphs first
    let paragraphs = text.split("\n\n");
    
    if (paragraphs.length > 1) {
      // If there are multiple paragraphs, send each as a separate message
      for (let paragraph of paragraphs) {
        if (paragraph.trim().length > 0) {
          chatMessages.push({ 
            sender: sender, 
            text: paragraph.trim(), 
            timestamp: Date.now() 
          });
        }
      }
    } else {
      // If it's just one long paragraph, split by sentences
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
    }
  } else {
    // For user messages or short agent messages, add as is
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
  // Only auto-scroll if already at or near the bottom
  if (chatScrollY < 50) {
    chatScrollY = 0;
  }
  
  // Add pulse effect to chat panel
  let pulseColor = sender === "User" ? color(45, 45, 60) : accentColor1;
  addPulseEffect(chatX, chatY, chatW, chatH, pulseColor);
  
  // Add backend messages
  if (sender === "User") {
    // Truncate long user messages in the backend log
    let truncatedText = text.length > 30 ? text.substring(0, 30) + "..." : text;
    addBackendMessage("User input received: " + truncatedText, "system");
    
    // Simulate cognitive analysis
    setTimeout(() => {
      addBackendMessage("Analyzing sentiment...", "cognitive");
    }, 300);
    
    // Simulate emotion detection
    setTimeout(() => {
      let emotions = ["neutral", "happy", "confused", "frustrated"];
      currentEmotion = emotions[Math.floor(Math.random() * emotions.length)];
      addBackendMessage("CV: Affective state detected: " + currentEmotion, "sensor");
    }, 800);
  } else {
    addBackendMessage("Agent response sent", "system");
  }
  
  // Change engagement score slightly for demo purposes
  engagementScore += (Math.random() - 0.5) * 0.1;
  engagementScore = constrain(engagementScore, 0.2, 0.95);
  
  // Add engagement score update to backend
  if (Math.random() < 0.3) {
    setTimeout(() => {
      addBackendMessage("EEG: Engagement level: " + nf(engagementScore, 1, 2), "cognitive");
    }, 500);
  }
}

function handleSubmit() {
  let inputText = inputElement.value().trim();
  if (inputText.length > 0) {
    addChatMessage("User", inputText);
    inputElement.value('');
    
    // Simple response
    setTimeout(() => {
      addChatMessage("Agent", "Thank you for your message: " + inputText);
    }, 1000);
  }
}

function keyPressed() {
  if (keyCode === ENTER && document.activeElement === inputElement.elt) {
    handleSubmit();
    return false;
  }
  return true;
}

function mouseWheel(event) {
  // Scroll chat panel
  if (mouseX >= chatX && mouseX <= chatX + chatW && 
      mouseY >= chatY && mouseY <= chatY + chatH) {
    chatScrollY += event.delta * 1.2;
    chatScrollY = constrain(chatScrollY, 0, maxChatScroll);
    return false;
  }
  
  // Scroll backend panel
  if (mouseX >= backendX && mouseX <= backendX + backendW && 
      mouseY >= backendY && mouseY <= backendY + backendH) {
    backendScrollY += event.delta * 1.2;
    backendScrollY = constrain(backendScrollY, 0, maxBackendScroll);
    return false;
  }
  
  return true;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  
  // Update panel positions and sizes
  chatX = 20;
  chatY = height * 0.3 + 10;
  chatW = width * 0.6 - 30;
  chatH = height * 0.7 - 100;
  
  backendX = width * 0.6 + 10;
  backendY = height * 0.3 + 10;
  backendW = width * 0.4 - 30;
  backendH = height * 0.7 - 100;
  
  // Adjust EEG and webcam widths - make EEG wider
  eegX = chatX;
  eegY = 20;
  eegW = (chatW - 10) * 0.65; // Increased from 0.6 to 0.65
  eegH = chatY - 30;
  
  webcamX = eegX + eegW + 10;
  webcamY = 20;
  webcamW = (chatW - 10) * 0.35; // Decreased from 0.4 to 0.35
  webcamH = chatY - 30;
  
  stateX = backendX;
  stateY = 20;
  stateW = backendW;
  stateH = chatY - 30;
  
  inputX = chatX;
  inputY = height - 70;
  inputW = chatW;
  inputH = 40;
  
  // Update input element position and size
  inputElement.position(inputX + 10, inputY + 10);
  inputElement.size(inputW - 100, inputH - 20);
  
  // Update send button position
  sendButton.position(inputX + inputW - 80, inputY + 10);
  
  // Update demo controls - now positioned at the bottom
  demoButton.position(backendX, inputY + 10);
  nextSceneButton.position(backendX + 110, inputY + 10);
  resetDemoButton.position(backendX + 220, inputY + 10);
}

// Refined emotion state system with more natural transitions

// Update the emotion state with better narrative coherence
function updateEmotionState() {
  let currentTime = millis();
  
  // Allow small fluctuations in intensity without changing the emotion itself
  emotionIntensity += random(-0.1, 0.1);
  emotionIntensity = constrain(emotionIntensity, 0.2, 1.0);
  
  // Only consider emotion changes if cooldown period has passed
  if (currentTime - lastEmotionChange > emotionCooldown) {
    
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
          
          // Add backend message about the emotion change
          addBackendMessage("Emotion state transition: " + currentEmotion, "cognitive");
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
    // Non-demo mode: more natural transitions based on context
    else {
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
  
  // Handle scene-specific emotion transitions
  if (scene.transitionTo && !scene.transitioned && 
      currentTime - sceneStartTime > scene.transitionDelay) {
    // Perform the first transition
    currentEmotion = scene.transitionTo;
    emotionIntensity = 0.7; // Start with higher intensity
    scene.transitioned = true; // Mark as transitioned
    
    // Add backend message about the transition
    addBackendMessage("Emotion transition: " + scene.transitionTo, "cognitive");
    
    console.log("Scene " + currentScene + ": Transitioned to " + scene.transitionTo);
  }
  
  // Handle final transition for Scene 7
  if (scene.finalEmotion && scene.transitioned && !scene.finalTransitioned &&
      currentTime - sceneStartTime > scene.finalTransitionDelay) {
    // Perform the final transition
    currentEmotion = scene.finalEmotion;
    emotionIntensity = 0.6; // Slightly lower intensity
    scene.finalTransitioned = true; // Mark as transitioned
    
    // Add backend message about the final transition
    addBackendMessage("Final emotion transition: " + scene.finalEmotion, "cognitive");
    
    console.log("Scene " + currentScene + ": Final transition to " + scene.finalEmotion);
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
    
    // Update chat with the new messages
    addChatMessage("Agent", demoScenes[currentScene].agentMessage);
    
    if (demoScenes[currentScene].userResponse) {
      setTimeout(() => {
        addChatMessage("User", demoScenes[currentScene].userResponse);
      }, 1000);
    }
    
    // Add any backend messages for this scene
    if (demoScenes[currentScene].backendMessages) {
      for (let i = 0; i < demoScenes[currentScene].backendMessages.length; i++) {
        let msg = demoScenes[currentScene].backendMessages[i];
        // Add with a slight delay between messages
        setTimeout(() => {
          addBackendMessage(msg.text, msg.type);
        }, 500 + i * 1500);
      }
    }
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
  addChatMessage("Agent", demoScenes[currentScene].agentMessage);
  
  setTimeout(() => {
    addChatMessage("User", demoScenes[currentScene].userResponse);
  }, 1000);
  
  // Add backend message
  addBackendMessage("Demo mode started. Scene 1 initialized.", "system");
  
  // Add any backend messages for the first scene
  if (demoScenes[currentScene].backendMessages) {
    for (let i = 0; i < demoScenes[currentScene].backendMessages.length; i++) {
      let msg = demoScenes[currentScene].backendMessages[i];
      setTimeout(() => {
        addBackendMessage(msg.text, msg.type);
      }, 500 + i * 1500);
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