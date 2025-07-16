class VoiceChatbot {
    constructor() {
        this.socket = io();
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isMuted = false;
        
        this.initializeElements();
        this.checkBrowserSupport();
        this.initializeSpeechRecognition();
        this.setupEventListeners();
        this.setupSocketEvents();
    }

    initializeElements() {
        this.chatMessages = document.getElementById('chat-messages');
        this.startBtn = document.getElementById('start-btn');
        this.stopBtn = document.getElementById('stop-btn');
        this.muteBtn = document.getElementById('mute-btn');
        this.status = document.getElementById('status');
    }

    checkBrowserSupport() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            this.updateStatus('❌ Speech recognition not supported. Please use Chrome browser.', 'error');
            this.startBtn.disabled = true;
            return false;
        }
        
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            this.updateStatus('❌ Microphone access not supported in this browser.', 'error');
            this.startBtn.disabled = true;
            return false;
        }
        
        return true;
    }

    async initializeSpeechRecognition() {
        if (!this.checkBrowserSupport()) return;

        // Request microphone permission first
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            this.updateStatus('✅ Microphone access granted. Ready to listen!', '');
        } catch (error) {
            this.updateStatus('❌ Microphone access denied. Please allow microphone access.', 'error');
            this.startBtn.disabled = true;
            return;
        }

        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Configure recognition settings
        this.recognition.continuous = false;  // Changed to false for better stability
        this.recognition.interimResults = true;
        this.recognition.lang = 'en-US';
        this.recognition.maxAlternatives = 1;

        this.recognition.onstart = () => {
            console.log('Speech recognition started');
            this.isListening = true;
            this.updateStatus('🎤 Listening... Speak now!', 'listening');
            this.startBtn.disabled = true;
            this.stopBtn.disabled = false;
        };

        this.recognition.onresult = (event) => {
            console.log('Speech recognition result:', event);
            let finalTranscript = '';
            let interimTranscript = '';
            
            for (let i = event.resultIndex; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                } else {
                    interimTranscript += transcript;
                }
            }

            if (interimTranscript) {
                this.updateStatus(`🎤 Hearing: "${interimTranscript}"`, 'listening');
            }

            if (finalTranscript.trim()) {
                console.log('Final transcript:', finalTranscript);
                this.handleUserMessage(finalTranscript.trim());
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            
            let errorMessage = '';
            switch (event.error) {
                case 'not-allowed':
                    errorMessage = '❌ Microphone access denied. Please allow microphone access and try again.';
                    break;
                case 'no-speech':
                    errorMessage = '❌ No speech detected. Please speak louder and try again.';
                    break;
                case 'aborted':
                    errorMessage = '⚠️ Speech recognition aborted. Click Start Listening to try again.';
                    break;
                case 'network':
                    errorMessage = '❌ Network error. Please check your internet connection.';
                    break;
                default:
                    errorMessage = `❌ Error: ${event.error}. Please try again.`;
            }
            
            this.updateStatus(errorMessage, 'error');
            this.resetButtons();
        };

        this.recognition.onend = () => {
            console.log('Speech recognition ended');
            this.isListening = false;
            this.updateStatus('⏹️ Stopped listening. Click Start Listening to try again.', '');
            this.resetButtons();
        };
    }

    resetButtons() {
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
    }

    setupEventListeners() {
        this.startBtn.addEventListener('click', () => this.startListening());
        this.stopBtn.addEventListener('click', () => this.stopListening());
        this.muteBtn.addEventListener('click', () => this.toggleMute());
    }

    setupSocketEvents() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
            this.displayMessage('Connected to chatbot server!', 'system');
        });

        this.socket.on('disconnect', () => {
            console.log('Disconnected from server');
            this.displayMessage('Disconnected from server', 'system');
        });

        this.socket.on('bot_response', (data) => {
            console.log('Bot response:', data);
            this.displayMessage(data.message, 'bot');
            
            if (!this.isMuted) {
                this.speakMessage(data.message);
            }
        });
    }

    async startListening() {
        if (!this.recognition) {
            this.updateStatus('❌ Speech recognition not initialized', 'error');
            return;
        }

        if (this.isListening) {
            this.updateStatus('⚠️ Already listening...', '');
            return;
        }

        try {
            console.log('Starting speech recognition...');
            this.updateStatus('🎤 Starting microphone...', 'listening');
            this.recognition.start();
        } catch (error) {
            console.error('Error starting recognition:', error);
            this.updateStatus('❌ Failed to start listening. Please try again.', 'error');
            this.resetButtons();
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            console.log('Stopping speech recognition...');
            this.recognition.stop();
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        this.muteBtn.textContent = this.isMuted ? '🔇 Unmute Bot' : '🔊 Mute Bot';
        this.muteBtn.className = this.isMuted ? 'btn btn-danger' : 'btn btn-warning';
        
        if (this.isMuted) {
            this.synthesis.cancel(); // Stop any ongoing speech
        }
    }

    handleUserMessage(message) {
        console.log('User message:', message);
        this.displayMessage(message, 'user');
        this.socket.emit('user_message', { message: message });
    }

    displayMessage(message, sender) {
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        messageElement.textContent = message;
        
        this.chatMessages.appendChild(messageElement);
        this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    }

    speakMessage(message) {
        // Cancel any ongoing speech
        this.synthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(message);
        utterance.rate = 0.8;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        // Choose a voice (optional)
        const voices = this.synthesis.getVoices();
        if (voices.length > 0) {
            utterance.voice = voices.find(voice => voice.name.includes('Google')) || voices[0];
        }
        
        this.synthesis.speak(utterance);
    }

    updateStatus(message, className = '') {
        this.status.textContent = message;
        this.status.className = className;
        console.log('Status:', message);
    }
}

// Initialize the chatbot when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing Voice Chatbot...');
    new VoiceChatbot();
});