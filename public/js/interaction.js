import { characterAudio, characterAudioQueue } from './virtualcharacter.js';

var continueNode = null
var progress = 0;
var userInfo = ""
var informationTranscript = new Map()
var id = ''
var condition = ''
var gender = "male"

function getCurrentDateTime() {
    var currentDate = new Date();
    // Convert the date and time to the user's local time zone
    var localDateTime = currentDate.toLocaleString();
    // Output the local date and time
    return localDateTime
}

document.addEventListener('DOMContentLoaded', (event) => {  
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    condition = urlParams.get('c')
    id = urlParams.get('id')
    condition = parseInt(condition)
    if (condition === 1) {
        gender = "male"
    } else {
        gender = "female"
    }
    document.getElementById("finish-btn").addEventListener('click', () => {
        window.location.href = "https://ufl.qualtrics.com/jfe/form/SV_b4xk3F1LVNROTWK?id=" + id + "&c=" + condition;
    });
    showLoading();
});

function showLoading() {
    // document.getElementById('start').style.display = "none";
    document.getElementById('loading-animation').style.display = "block";
    CSS.registerProperty({
        name: "--p",
        syntax: "<integer>",
        initialValue: 0,
        inherits: true,
      });
    // document.getElementById('loader-animation').classList.add("animate-start")
    const animatedElement = document.getElementById("loader-animation");

    animatedElement.onanimationend = () => {
        document.getElementById('loading-screen').classList.add("out")
        informationTranscript.set("SYSTEM " + getCurrentDateTime(), "Start Introduction");
        updateTranscript()
        handleUserInput(1, { userInput: "Start Introduction" });
    };
}

function updateProgress(progress) {
    const progressBar = document.querySelector('.progress-bar3');
    
    // Update progress bar width
    progressBar.style.width = `${progress}%`;
    
    // Update loader text
    document.getElementById("progress-percent").innerHTML = Math.round(progress)
}

// Function to increment progress
function incrementProgress() {
    console.log("INCREMENTING PROGRESS")
    var increment = (1/13)*100
    var nextIncrement = progress + increment;
    if (nextIncrement > 100) {
        nextIncrement = 100
    }
    const interval = setInterval(() => {
        progress += 1;
        updateProgress(progress);
        if (progress >= nextIncrement) {
            clearInterval(interval);
        }
    }, 50); // Adjust this value to change the speed of the progress
    if (nextIncrement === 100) {
        document.getElementById("finish-btn").style.display = "block"
    }
}

function appendMessage(message, speaker, nextNode = null) {
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
            let messageBody = { userMessage: message }
            handleUserInput(nextNode, messageBody)
        }
        messageText.innerHTML = `${message}`;
        messageItem.className = "message-item"
        messageItem.appendChild(labelText);
        messageItem.appendChild(messageText);
        chatBox.appendChild(messageItem);
        informationTranscript.set("USER " + getCurrentDateTime(), message);
        console.log("INFORMATION TRANSCRIPT", informationTranscript)
        updateTranscript()
    } else {
        messageItem.className = "message-item"
        messageItem.appendChild(labelText);
        messageItem.appendChild(messageText);
        chatBox.appendChild(messageItem)
        displaySubtitles(message, messageText)
        informationTranscript.set("ALEX " + getCurrentDateTime(), message);
        console.log("INFORMATION TRANSCRIPT", informationTranscript)
        updateTranscript()
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

async function handleStreamedResponse(reader) {
    console.log("HANDLING STREAMED RESPONSE ...")
    const decoder = new TextDecoder();
    let partialData = '';
    var isFirstChunk = true;

    while (true) {
        const { value, done } = await reader.read();

        if (done) {
            break;
        }

        partialData += decoder.decode(value, { stream: true });

        // Process each complete JSON chunk
        let boundaryIndex;
        while ((boundaryIndex = partialData.indexOf('\n')) !== -1) {
            const chunk = partialData.slice(0, boundaryIndex).trim();
            partialData = partialData.slice(boundaryIndex + 1);

            if (chunk) {
                const data = JSON.parse(chunk);

                // Special handling for the first chunk
                if (isFirstChunk) {
                    console.log("GOT FIRST CHUNK")
                    console.log(data)
                    // Handle audio if present
                    if (data.audio && data.audio.audioBase64) {
                        console.log("GOT AUDIO FOR FIRST CHUNK")
                        // first piece of dynamic response
                        isFirstChunk = false;
                        const audioData = await parseAudio(data.audio, null);
                        characterAudioQueue(audioData, null); // queue to play after placeholder ends
                        // only need to render front end input/buttons/stuff once
                        // DISPLAYING STUFF TO FRONT END; small wait to show ellipses
                        const ellipse = document.getElementById('lds-ellipsis');
                        ellipse.remove();

                        console.log("DISPLAYING RESPONSE TO FRONT END")
                        // Update dialogue
                        appendMessage(data.wholeDialogue, 'Alex');
                        if (data.options) {
                            displayOptions(data.options)
                        }
                    }
                } else {
                    console.log("GETTING REMAINING CHUNKS")
                    // keep rendering rest of audio stream as they come in!
                    if (data.audio && data.audio.audioBase64) {
                        const audioData = await parseAudio(data.audio, null);
                        characterAudioQueue(audioData, null);
                    }
                }
            }
        }
    }
}

async function handleUserInput(nodeId, body) {
    body.userInfo = userInfo
    body.characterGender = gender
    const response = await fetch(`/interact/${nodeId}`, {
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
        const data = await response.json(); // gives ENTIRE audio at once
        // process audio for front end
        await handlePreRecordedResponse(data);
    }
    else if (contentType && contentType.includes('application/json; charset=utf-8')) { // has some sort of ChatGPT element to it (streamed)
        console.log("AI ALTERED RESPONSE ...")
        const reader = response.body.getReader(); // getReader bc backend is writing stream by stream, not all at once, don't to close connection immedietely
        await handleStreamedResponse(reader);
    }
    else {
        console.error("Unknown response type. Unable to process.");
    }
}

async function handlePreRecordedResponse(data) {
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
        if (data.input.allowed === true) {
            const inputArea = document.getElementById("input-area")
            inputArea.style.display = 'flex'
            document.getElementById('send-btn').onclick = function() {
                appendMessage('text', 'user', data.input.nextNode);
                const optionsArea = document.getElementById("options-area")
                optionsArea.innerHTML = ''
            };  
        } else {
            const inputArea = document.getElementById("input-area")
            inputArea.style.display = 'none'
        }
    }, 1500); // 1500 milliseconds = 1.5 seconds
}

function displayOptions(options) {
    options.forEach(option => {
        const optionsArea = document.getElementById("options-area")
        optionsArea.style.visibility = "hidden"
        const button = document.createElement('button');
        const userText = option.optionText
        button.textContent = userText;
        button.classList.add("option-btn")
        if (option.continueNode) {
            continueNode = option.continueNode
        }
        button.addEventListener('click', () => {
            optionsArea.innerHTML = ''
            appendMessage(userText, 'user')
            let messageBody = { userMessage: option.optionText }
            if (option.nextNode) {
                if (option.nextNode !== 99) {
                    if (option.userInfo) {
                        userInfo = userInfo + " ; " + option.userInfo
                    }
                    incrementProgress();
                }
                handleUserInput(option.nextNode, messageBody)
            } else {
                incrementProgress();
                handleUserInput(continueNode, messageBody)
            }
            
            // You can add more actions here based on nextNode
        });
        optionsArea.appendChild(button);
    });
}

// Important to Keep
async function parseAudio(audio, emoji) {
    try {
        // Get the Base64 audio string
        const base64Audio = audio.audioBase64;

        // Decode the Base64 audio string into an ArrayBuffer
        const arrayBuffer = await fetch(`data:audio/wav;base64,${base64Audio}`)
            .then(response => response.arrayBuffer());

        // Create an AudioContext
        const audioContext = new AudioContext();

        // Decode the ArrayBuffer into an AudioBuffer
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

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
    const chatBox = document.getElementById("chat-container")

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
            optionsArea.style.visibility = "visible"
        }
        chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
    }

    typeWriter(); // Start typing animation
}

function cancelTypewriterEffect(dialogueSection, wholeDialogue, url = null) {
    typewriterRunning = false;
    dialogueSection.innerHTML = wholeDialogue; // Instantly display the complete dialogue
}

function updateTranscript() {
    let transcriptString = JSON.stringify(Object.fromEntries(informationTranscript));
    fetch('/updateTranscript', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            id: id, 
            transcriptType: 'informationTranscript', 
            transcript: transcriptString
        })
    })
    .then(response => response.json())
    .then(data => {
    })
    .catch(error => console.error('Error logging transcript:', error));
}

// Get the modal
var helpModal = document.getElementById("help-modal");

// Get the button that opens the modal
var helpBtn = document.getElementById("help-icon");

// Get the <span> element that closes the modal
var helpSpan = document.getElementsByClassName("help-close")[0];

// When the user clicks on the button, open the modal
helpBtn.onclick = function() {
    helpModal.style.display = "flex";
    var currentURLelement = document.getElementById("current-link-help")
    const currentURL = window.location.href;
    currentURLelement.innerHTML = currentURL
}

// When the user clicks on <span> (x), close the modal
helpSpan.onclick = function() {
    helpModal.style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
  if (event.target == helpModal) {
    helpModal.style.display = "none";
  }
}