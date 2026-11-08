// --- Navigation Logic ---
const homePage = document.getElementById('home-page');
const settingsPage = document.getElementById('settings-page');

function openSettings() {
    homePage.classList.remove('active');
    settingsPage.classList.add('active');
}

function closeSettings() {
    settingsPage.classList.remove('active');
    homePage.classList.add('active');
}

// --- AI Assistant Logic ---
const aiChat = document.getElementById('ai-chat');

function toggleAI() {
    aiChat.classList.toggle('hidden');
}

function sendAIMessage() {
    const input = document.getElementById('ai-input');
    const chatBody = document.getElementById('chat-body');
    const message = input.value.trim();

    if (message !== "") {
        // 1. Add user message to chat
        const userDiv = document.createElement('div');
        userDiv.className = 'user-msg';
        userDiv.innerText = message;
        chatBody.appendChild(userDiv);

        // Clear input
        input.value = '';
        chatBody.scrollTop = chatBody.scrollHeight;

        // 2. Simulate AI thinking and replying
        setTimeout(() => {
            const botDiv = document.createElement('div');
            botDiv.className = 'bot-msg';
            
            // Basic logic to simulate AI answering based on keywords
            let response = "I am ARMA AI. I can help you solve problems. Could you please elaborate?";
            if(message.toLowerCase().includes("music")) {
                response = "You can search for music using the search bar, or play local files from your storage.";
            } else if (message.toLowerCase().includes("hello") || message.toLowerCase().includes("hi")) {
                response = "Hello! How can I assist you with ARMA PLAY today?";
            } else if (message.toLowerCase().includes("problem") || message.toLowerCase().includes("solve")) {
                response = "Please type out the problem you are facing, and I will generate a solution for you.";
            }

            botDiv.innerText = response;
            chatBody.appendChild(botDiv);
            chatBody.scrollTop = chatBody.scrollHeight;
        }, 1000); // 1 second delay to simulate thinking
    }
}

// Allow pressing "Enter" to send message
document.getElementById('ai-input').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        sendAIMessage();
    }
});
