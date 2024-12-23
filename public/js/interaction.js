import { characterAudio, characterAudioQueue } from './virtualcharacter.js';

document.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById('send-btn').addEventListener('click', function() {
        appendMessage('text', 'user');
    });    
    document.getElementById('start').addEventListener('click', function() {
        showLoading();
    });
});

function showLoading() {
    document.getElementById('start').style.display = "none";
    document.getElementById('loading-animation').style.display = "block";
    document.getElementById('animate-charcter').classList.add("animate-start")
    const animatedElement = document.getElementById("animate-charcter");

    animatedElement.onanimationend = () => {
    console.log("Animation has ended.");
    document.getElementById('loading-screen').classList.add("out")
    handleUserInput(1, { userInput: "Start Introduction" });
};
}

function appendMessage(message, speaker) {
    const chatBox = document.getElementById("chat-container")
    const labelText = document.createElement('div');
    const messageText = document.createElement('div');
    const messageItem = document.createElement('div');

    labelText.className = "label-text";

    speaker === 'user' ? labelText.innerText = `You` : labelText.innerText = `Alex`;
    speaker === 'user' ? messageText.className = "user-chatbot-message" : messageText.className = "alex-chatbot-message"

    if (speaker === 'user') {
        if (message === 'text') {
            message = document.getElementById('user-input').value;
        }
        messageText.innerHTML = `${message}`;
        messageItem.className = "message-item"
        messageItem.appendChild(labelText);
        messageItem.appendChild(messageText);
        chatBox.appendChild(messageItem);
    } else {
        messageItem.className = "message-item"
        messageItem.appendChild(labelText);
        messageItem.appendChild(messageText);
        chatBox.appendChild(messageItem)
        displaySubtitles(message, messageText)
    }
    if (speaker === 'user') {
        document.getElementById('user-input').value = '';
        appendLoadingDots();
    }

    chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
}

function appendLoadingDots() {
    const chatBox = document.getElementById("chat-container")

    const ellipse = document.createElement('div');
    ellipse.className = "lds-ellipsis";
    ellipse.setAttribute('id', "lds-ellipsis")


    const l1 = document.createElement('div');
    const l2 = document.createElement('div');
    const l3 = document.createElement('div');

    ellipse.appendChild(l1)
    ellipse.appendChild(l2)
    ellipse.appendChild(l3)

    chatBox.appendChild(ellipse);
}

async function handleUserInput(nodeId, body) {
    const response = await fetch(`/${nodeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });

    if (!response.ok) {
        console.error('Failed to fetch response:', response.statusText);
        return;
    }

    const contentType = response.headers.get('Content-Type');

    // Handle streamed response
    if (contentType && contentType.includes('prerecorded')) { // not expecting ANY streamed response
        // Handle pre-recorded response
        console.log("Pre-recorded responses");
        const data = await response.json(); // gives ENTIRE audio at once
        // process audio for front end
        await handlePreRecordedResponse(data);
    }
    // else if (contentType && contentType.includes('application/json; charset=utf-8')) { // has some sort of ChatGPT element to it (streamed)
    //     console.log("Streamed Response.")
    //     const reader = response.body.getReader(); // getReader bc backend is writing stream by stream, not all at once, don't to close connection immedietely
    //     await handleStreamedResponse(reader);
    // }
    // else {
    //     console.error("Unknown response type. Unable to process.");
    // }
}

async function handlePreRecordedResponse(data) {
    console.log('Received pre-recorded response:', data);
    // Handle audio if present; parse it for being ready for front end
    if (data.audio && data.audio.audioBase64) {
        const audioData = await parseAudio(data.audio, null);
        characterAudio(audioData, null);
    }

    // DISPLAYING STUFF TO FRONT END; small wait to show ellipses
    setTimeout(() => {
        const ellipse = document.getElementById('lds-ellipsis');
        if (ellipse) {
            ellipse.remove();
        }
        // Update dialogue
        appendMessage(data.dialogue, 'Alex');
        if (data.options) {
            displayOptions(data.options)
        }
    }, 1500); // 1500 milliseconds = 1.5 seconds
}

function displayOptions(options) {
    options.forEach(option => {
        const optionsArea = document.getElementById("options-area")
        optionsArea.style.display = "none"
        const button = document.createElement('button');
        const userText = option.optionText
        button.textContent = userText;
        button.classList.add("option-btn")
        button.addEventListener('click', () => {
            optionsArea.innerHTML = ''
            console.log("OPTION IS:", userText)
            appendMessage(userText, 'user')
            let messageBody = { userMessage: option.optionText }
            console.log(messageBody)
            handleUserInput(option.nextNode, messageBody)
            // You can add more actions here based on nextNode
        });
        optionsArea.appendChild(button);
    });
}

// Important to Keep
async function parseAudio(audio, emoji) {
    console.log("parseAudio called with audio and emoji:", { audio, emoji });

    try {
        // Get the Base64 audio string
        const base64Audio = audio.audioBase64;

        // Decode the Base64 audio string into an ArrayBuffer
        const arrayBuffer = await fetch(`data:audio/wav;base64,${base64Audio}`)
            .then(response => response.arrayBuffer());
        console.log("Audio decoded into ArrayBuffer.");

        // Create an AudioContext
        const audioContext = new AudioContext();
        console.log("AudioContext created.");

        // Decode the ArrayBuffer into an AudioBuffer
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        console.log("AudioBuffer decoded:", audioBuffer);

        // Create a new audio object with the decoded AudioBuffer
        const audioWithWav = {
            ...audio,
            audio: audioBuffer,
            sampleRate: audioBuffer.sampleRate,
        };

        return audioWithWav;
    } catch (error) {
        console.error("Error decoding audio data:", error);
        throw error;
    }
}

function displaySubtitles(dialogue, divItem, url = null) {
    const dialogueSection = divItem;

    // Start with the current content to avoid overwriting
    let existingText = dialogueSection.innerText.trim();
    let textToAdd = dialogue; // Dialogue to type
    let typewriterRunning = true;
    let i = 0; // Character index

    // Typewriter effect
    function typeWriter() {
        if (!typewriterRunning) {
            // If the effect is canceled, instantly show remaining text
            cancelTypewriterEffect(dialogueSection, dialogue, url);
            return;
        }
        if (i < textToAdd.length) {
            // Append each character
            if (i === 0 && existingText.length > 0) {
                dialogueSection.innerHTML += ' '; // Add a space before new text
            }
            dialogueSection.innerHTML += textToAdd[i]; // Append character
            i++;
            setTimeout(typeWriter, 30); // Adjust speed (20ms per character)
        } else {
            typewriterRunning = false; // Reset the flag when done
            const optionsArea = document.getElementById("options-area")
            optionsArea.style.display = "flex"
        }
    }

    typeWriter(); // Start typing animation
}

function cancelTypewriterEffect(dialogueSection, wholeDialogue, url = null) {
    typewriterRunning = false;
    dialogueSection.innerHTML = wholeDialogue; // Instantly display the complete dialogue
    console.log("Typewriter effect canceled and completed instantly.");
}