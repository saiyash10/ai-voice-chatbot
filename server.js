const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle incoming messages
  socket.on('user_message', (data) => {
    console.log('Received message:', data.message);
    
    // Simple AI response logic (you can enhance this)
    const response = generateAIResponse(data.message);
    
    // Send response back to client
    socket.emit('bot_response', {
      message: response,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Simple AI response function
function generateAIResponse(userMessage) {
  const message = userMessage.toLowerCase();
  
  // Greetings
  if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
    return "Hello! How can I help you today?";
  }
  
  // Time
  if (message.includes('time')) {
    return `The current time is ${new Date().toLocaleTimeString()}`;
  }
  
  // Date
  if (message.includes('date') || message.includes('today')) {
    return `Today is ${new Date().toLocaleDateString()}`;
  }
  
  // Weather
  if (message.includes('weather')) {
    return "I don't have access to real-time weather data, but you can check your local weather app!";
  }
  
  // Geography - Countries and Capitals
  if (message.includes('capital of india') || message.includes('capital india')) {
    return "The capital of India is New Delhi.";
  }
  if (message.includes('capital of usa') || message.includes('capital america')) {
    return "The capital of the United States is Washington, D.C.";
  }
  if (message.includes('capital of france')) {
    return "The capital of France is Paris.";
  }
  if (message.includes('capital of japan')) {
    return "The capital of Japan is Tokyo.";
  }
  if (message.includes('capital of uk') || message.includes('capital britain')) {
    return "The capital of the United Kingdom is London.";
  }
  
  // Basic Math
  if (message.includes('2 + 2') || message.includes('2+2')) {
    return "2 + 2 equals 4.";
  }
  if (message.includes('what is') && message.includes('+')) {
    return "I can do basic math! Try asking me simple addition problems.";
  }
  
  // Science
  if (message.includes('speed of light')) {
    return "The speed of light is approximately 299,792,458 meters per second.";
  }
  if (message.includes('planets in solar system')) {
    return "There are 8 planets in our solar system: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune.";
  }
  
  // Technology
  if (message.includes('what is javascript') || message.includes('javascript')) {
    return "JavaScript is a programming language commonly used for web development.";
  }
  if (message.includes('what is ai') || message.includes('artificial intelligence')) {
    return "AI stands for Artificial Intelligence - it's technology that enables machines to simulate human intelligence.";
  }
  
  // Personal questions
  if (message.includes('who are you') || message.includes('what are you')) {
    return "I'm an AI voice chatbot! I can answer questions and have conversations with you.";
  }
  if (message.includes('how are you')) {
    return "I'm doing great! Thanks for asking. How are you doing today?";
  }
  
  // Fun facts
  if (message.includes('fun fact') || message.includes('tell me something interesting')) {
    const facts = [
      "Did you know that honey never spoils? Archaeologists have found pots of honey in ancient Egyptian tombs that are over 3,000 years old!",
      "Bananas are berries, but strawberries aren't!",
      "A group of flamingos is called a 'flamboyance'.",
      "The shortest war in history lasted only 38-45 minutes between Britain and Zanzibar in 1896.",
      "Octopuses have three hearts and blue blood!"
    ];
    return facts[Math.floor(Math.random() * facts.length)];
  }
  
  // Goodbyes
  if (message.includes('bye') || message.includes('goodbye') || message.includes('see you')) {
    return "Goodbye! Have a great day!";
  }
  
  // Default response
  return "I'm sorry, I didn't quite understand that. You can ask me about capitals, basic math, science facts, or just chat with me!";
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});