import { characterAudio, characterAudioQueue, stopSpeaking, focusCharacter } from './virtualcharacter.js';

var continueNode = null
var progress = 0;
var userInfo = ""
var informationTranscript = new Map()
var id = ''
var condition = ''
// const textScript = "Text_Script_Audio.json"
const textScript = "Text_Script_Intro.json"
var incrementTotal

const slider = document.getElementById("myRange");
const sliderValue = document.getElementById("sliderValue");

// slider.addEventListener("input", function() {
//   const value = this.value;
//   var infoText
//   if (this.value === '50') {
//     infoText = "I kind of understand."
//   } else if (this.value === '100') {
//     infoText = "I completely understand."
//   } else if (this.value === '0') {
//     infoText = "I don't understand at all."
//   } else if (this.value === '25') {
//     infoText = "I don't really understand."
//   } else if (this.value === '75') {
//     infoText = "I mostly understand."
//   }

//   console.log("infoText")
//   sliderValue.textContent = infoText;
  
//   // Position the value box
//   const percent = (value - this.min) / (this.max - this.min);
//   const leftPosition = percent * (this.offsetWidth - 25) + 12.5;
//   sliderValue.style.left = `${leftPosition}px`;
  
//   // Show the value box
//   sliderValue.style.display = "block";
// });

slider.addEventListener("mousedown", function() {
    sliderValue.style.display = "block";
    const value = this.value;
    var infoText
    if (this.value === '50') {
        infoText = "I kind of understand."
    } else if (this.value === '100') {
        infoText = "I completely understand."
    } else if (this.value === '0') {
        infoText = "I don't understand at all."
    } else if (this.value === '25') {
        infoText = "I don't really understand."
    } else if (this.value === '75') {
        infoText = "I mostly understand."
    }

    sliderValue.textContent = infoText;
    slider.addEventListener("input", function() {
        const value = this.value;
        var infoText
        if (this.value === '50') {
          infoText = "I kind of understand."
        } else if (this.value === '100') {
          infoText = "I completely understand."
        } else if (this.value === '0') {
          infoText = "I don't understand at all."
        } else if (this.value === '25') {
          infoText = "I don't really understand."
        } else if (this.value === '75') {
          infoText = "I mostly understand."
        }
      
        console.log("infoText")
        sliderValue.textContent = infoText;
        
        // Position the value box
        const percent = (value - this.min) / (this.max - this.min);
        const leftPosition = percent * (this.offsetWidth - 25) + 12.5;
        sliderValue.style.left = `${leftPosition}px`;
        
        // Show the value box
        sliderValue.style.display = "block";
      });

});

slider.addEventListener("mouseup", function() {
  sliderValue.style.display = "none";
});


document.getElementById("slider-submit").onclick = function() {
    var sliderValue = document.getElementById("myRange").value;
    console.log(sliderValue)
    var text = document.getElementById("question-item-text").innerText
    console.log(text)
    if (sliderValue !== '100') {
        document.getElementById("question-item-text").style.opacity = '0';
        translateHealthLiteracy(text, sliderValue).then(translatedMessage => {
            console.log("Translated message:", translatedMessage);
            document.getElementById("question-item-text").innerText = translatedMessage
            document.getElementById("question-item-text").style.opacity = '1';
        })
        .catch(error => {
            console.error("Error in translation:", error);
        });
    }
}

function getCurrentDateTime() {
    var currentDate = new Date();
    // Convert the date and time to the user's local time zone
    var localDateTime = currentDate.toLocaleString();
    // Output the local date and time
    return localDateTime
}

var topics = JSON.parse(sessionStorage.getItem("topics"))
topics = topics["Topics"]
// Object.entries(topics).forEach(([key, value]) => {
//     console.log(key + ": " + value["justification"]);
//   });

document.addEventListener('DOMContentLoaded', (event) => {  
    document.getElementById("study-button-1").onclick = function() {
        document.getElementById("study1").style.display = 'block'
        document.getElementById("study2").style.display = 'none'
        document.getElementById("study3").style.display = 'none'
        document.getElementById("study-button-1").classList.add('active')
        document.getElementById("study-button-2").classList.remove('active')
        document.getElementById("study-button-3").classList.remove('active')
    }
    
    document.getElementById("study-button-2").onclick = function() {
        document.getElementById("study2").style.display = 'block'
        document.getElementById("study1").style.display = 'none'
        document.getElementById("study3").style.display = 'none'
        document.getElementById("study-button-2").classList.add('active')
        document.getElementById("study-button-1").classList.remove('active')
        document.getElementById("study-button-3").classList.remove('active')
    }
    
    document.getElementById("study-button-3").onclick = function() {
        document.getElementById("study3").style.display = 'block'
        document.getElementById("study1").style.display = 'none'
        document.getElementById("study2").style.display = 'none'
        document.getElementById("study-button-3").classList.add('active')
        document.getElementById("study-button-2").classList.remove('active')
        document.getElementById("study-button-1").classList.remove('active')
    }

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    condition = urlParams.get('c')
    id = urlParams.get('id')
    condition = parseInt(condition)

    document.getElementById("finish-btn").addEventListener('click', () => {
        // window.location.href = "https://ufl.qualtrics.com/jfe/form/SV_b4xk3F1LVNROTWK?id=" + id + "&c=" + condition;
        document.getElementById("virtualcharacter").style.filter = "blur(2px)"
        document.getElementById("virtualcharacter-1").style.filter = "blur(0px)"
        focusCharacter("support");
    });

    document.getElementById("finish-btn1").addEventListener('click', () => {
        // window.location.href = "https://ufl.qualtrics.com/jfe/form/SV_b4xk3F1LVNROTWK?id=" + id + "&c=" + condition;
        document.getElementById("virtualcharacter").style.filter = "blur(0px)"
        document.getElementById("virtualcharacter-1").style.filter = "blur(2px)"
        focusCharacter("doctor");
    });

    document.getElementById("history").addEventListener('click', () => {
        document.getElementById("chat-container").style.display = 'flex'
        document.getElementById("chat-container-bg").style.display = 'flex'
    });

    document.getElementById("close-chat-history-icon").addEventListener('click', () => {
        document.getElementById("chat-container").style.display = 'none'
        document.getElementById("chat-container-bg").style.display = 'none'
    });


    let loadBody = { transcript: textScript }

    showLoading();
});

function currentSpeakingCharacter(agent) {
    focusCharacter(agent);
    if (agent === "support") {
        // document.getElementById("virtualcharacter").style.filter = "blur(2px)"
        // document.getElementById("virtualcharacter-1").style.filter = "blur(0px)"
    } else {
        // document.getElementById("virtualcharacter").style.filter = "blur(0px)"
        // document.getElementById("virtualcharacter-1").style.filter = "blur(2px)"
    }
}

function showInfoQuestion(item = topics) {
    console.log(item)
    var questionItem = document.getElementById("question-item-text")
    questionItem.innerHTML = ''
    const [[key, value]] = Object.entries(item);
    delete item[key];

    questionItem.innerText = key;
}

function showLoading() {
    // document.getElementById('start').style.display = "none";
    document.getElementById('loading-animation').style.display = "block";
    CSS.registerProperty({
        name: "--p",
        syntax: "<integer>",
        initialValue: 0,
        inherits: true,
      });

    const animatedElement = document.getElementById("loader-animation");

    animatedElement.onanimationend = () => {
        document.getElementById('loading-screen').classList.add("out")
        handleUserInput(1, { userInput: "Start Introduction", script: textScript, gender: "male" });
        informationTranscript.set("SYSTEM " + getCurrentDateTime(), "Start Introduction");
        updateTranscript()
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
function incrementProgress(double = false) {
    console.log("INCREMENT TOTAL IS", incrementTotal)
    var increment = (1/incrementTotal)*100
    if (double === true) {
        increment = increment * 2
    }
    var nextIncrement = progress + increment;
    if (nextIncrement >= 100) {
        nextIncrement = 100
    }
    console.log("PROGRESS IS", progress)
    console.log("NEXT INCREMENT IS", nextIncrement)
    const interval = setInterval(() => {
        progress += 1;
        if (progress >= 100) {
            progress = 100
            document.getElementById("finish-btn").style.display = "block"
        }
        updateProgress(progress);
        if (progress >= nextIncrement) {
            clearInterval(interval);
        }
    }, 50); // Adjust this value to change the speed of the progress
}

function appendMessage(message, speaker, agent, nextNode = null, passOn = null) {
    var chatBox
    agent === 'doctor' ? chatBox = document.getElementById("chatbox-doctor") : chatBox = document.getElementById("chatbox-support")
    const labelText = document.createElement('div');
    const messageText = document.createElement('div');
    const messageItem = document.createElement('div');

    const messageTextHistory = document.createElement('div');
    const messageItemHistory = document.createElement('div');


    labelText.className = "label-text";

    if (speaker === 'user') {
        labelText.innerText = `You`
    } else {
        agent === 'doctor' ? labelText.innerText = `Alex` : labelText.innerText = `Skylar`;
    }
    speaker === 'user' ? messageText.className = "user-chatbot-message" : messageText.className = "alex-chatbot-message"
    speaker === 'user' ? messageTextHistory.className = "history-user-chatbot-message" : messageTextHistory.className = "history-alex-chatbot-message"


    if (speaker === 'user') {
        if (message === 'text') {
            message = document.getElementById('user-input').value;
            console.log("SENDING USER MESSAGE", message)
            let messageBody = { userMessage: message, gender: "male", script: textScript }
            handleUserInput(nextNode, messageBody)
        }
        messageTextHistory.innerHTML = `${message}`;
        messageItemHistory.className = "message-item"
        messageItemHistory.appendChild(labelText);
        messageItemHistory.appendChild(messageTextHistory);
        document.getElementById("chat-container").appendChild(messageItemHistory)
        informationTranscript.set("USER " + getCurrentDateTime(), message);
        updateTranscript()
    } else {
        messageItem.className = "message-item"
        messageItem.appendChild(messageText);
        chatBox.appendChild(messageItem)

        messageItemHistory.className = "message-item"
        messageTextHistory.innerText = message
        messageItemHistory.appendChild(labelText);
        messageItemHistory.appendChild(messageTextHistory);
        document.getElementById("chat-container").appendChild(messageItemHistory)

        displaySubtitles(message, messageText, passOn)
        informationTranscript.set("ALEX " + getCurrentDateTime(), message);
        updateTranscript()
    }
    if (speaker === 'user') {
        document.getElementById('user-input').value = '';
    }

    // chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
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
                    // Handle audio if present
                    if (data.audio && data.audio.audioBase64) {
                        // first piece of dynamic response
                        isFirstChunk = false;
                        const audioData = await parseAudio(data.audio, null);
                        characterAudioQueue(audioData, null); // queue to play after placeholder ends
                        // only need to render front end input/buttons/stuff once
                        // DISPLAYING STUFF TO FRONT END; small wait to show ellipses
                        const ellipse = document.getElementById('lds-ellipsis');
                        ellipse.remove();
                        // document.getElementById("thinking").style.display = "none"
                        // Update dialogue
                        appendMessage(data.wholeDialogue, 'Alex', data.agent);
                        if (data.options) {
                            displayOptions(data.options)
                        }
                        if (data.input.allowed === true) {
                            const inputArea = document.getElementById("input-area")
                            const userInput = document.getElementById('user-input');
                            document.getElementById('send-btn').onclick = function() {
                                appendMessage('text', 'user', null, data.input.nextNode, null);
                                const optionsArea = document.getElementById("options-area")
                                optionsArea.innerHTML = ''
                                inputArea.style.visibility = 'visible'
                            };  
                            userInput.onkeydown = function(event) {
                                if (event.key === 'Enter' && !event.shiftKey) {
                                    event.preventDefault();
                                    appendMessage('text', 'user', null, data.input.nextNode, null);
                                    const optionsArea = document.getElementById("options-area")
                                    optionsArea.innerHTML = ''
                                    inputArea.style.visibility = 'visible'
                                }
                            };
                            
                        } else {
                            const inputArea = document.getElementById("input-area")
                            inputArea.style.visibility = 'visible'
                        }
                    }
                } else {
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

async function translateHealthLiteracy(message, adjustment) {
    var body = {message: message, adjustment: adjustment}
    const response = await fetch(`/adjustHealthLiteracy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        console.error('Failed to fetch response:', response.statusText);
        return;
    }
    const data = await response.json(); // gives ENTIRE audio at once
    console.log("GOT TRANSLATION")
    return data.message
    // const chatbotMessage = document.querySelector(".alex-chatbot-message");
    // chatbotMessage.innerText = data.message
}

async function handleUserInput(nodeId, body, prevAgent = null) {
    if (prevAgent === "doctor") {
        document.getElementById("chatbox-doctor").innerHTML = ''
    } else {
        document.getElementById("chatbox-support").innerHTML = ''
    }
    body.script = textScript
    body.userInfo = userInfo
    console.log("AB TO CALL SERVER, BODY IS", body)
    // body.characterGender = gender
    // body.script = textScript
    const response = await fetch(`/interact/${nodeId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        console.error('Failed to fetch response:', response.statusText);
        return;
    }

    const data = await response.json(); // gives ENTIRE audio at once
    console.log("RESPONSE FROM SERVER", data)

    if (data.nodeId === 4) {
        document.getElementById("virtualcharacter").style.display = "flex";
    }

    // document.getElementById("user-input").disabled = true; // Enable user input
    document.getElementById("send-btn").disabled = true; // Enable user input
    document.getElementById("input-area").classList.add("disabled"); // Enable user input

    characterAudio(data.dialogue, null, data.agent, () => {
        document.getElementById("user-input").disabled = false; // Enable user input
        document.getElementById("send-btn").disabled = false; // Disable user input
        document.getElementById("input-area").classList.remove("disabled"); // Disable user input
        if (data.passOn) {
            console.log("PASS ON")
            handleUserInput(data.input.nextNode, { userInput: "Start Introduction", script: textScript, gender: "male" }, data.agent);
        }
    });

    if (data.showQuestions) {
        if (data.showQuestions.example) {
            showInfoQuestion(data.showQuestions.example)
        } else {
            showInfoQuestion()
        }
    }
    if (data.passOn) { 
        appendMessage(data.dialogue, 'Alex',  data.agent, null, data.passOn);
    } else {
        appendMessage(data.dialogue, 'Alex',  data.agent);
    } 
    if (data.showQuestions) { 
        document.getElementById("questions").style.display = "flex" 
        document.getElementById("slidecontainer").style.display = "block" 
    } else {
        document.getElementById("questions").style.display = "none" 
        document.getElementById("slidecontainer").style.display = "none" 
    }
    if (data.options) {
        displayOptions(data.options, data.agent)
    }
    if (data.input.allowed === true) {
        console.log("IN INPUT AREA")
        const inputArea = document.getElementById("input-area")
        const userInput = document.getElementById('user-input');
        inputArea.style.visibility = 'visible'
        document.getElementById('send-btn').onclick = function() {
            inputArea.style.visibility = 'visible'
            appendMessage('text', 'user', null, data.input.nextNode, null);
            const optionsArea = document.getElementById("options-area")
            optionsArea.innerHTML = ''
        };  
        userInput.onkeydown = function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                appendMessage('text', 'user', null, data.input.nextNode, null);
                const optionsArea = document.getElementById("options-area")
                optionsArea.innerHTML = ''
                inputArea.style.visibility = 'visible'
            }
        };
        
    } else {
        const inputArea = document.getElementById("input-area")
        inputArea.style.visibility = 'visible'
    }
}

function displayOptions(options, agent) {
    options.forEach(option => {
        const optionsArea = document.getElementById("options-area")
        
        optionsArea.style.visibility = 'visible';

        const button = document.createElement('button');
        const userText = option.optionText
        button.textContent = userText;
        button.classList.add("option-btn")
        if (option.continueNode) {
            continueNode = option.continueNode
        }
        if (option.optionText === "View Resource.") {
            button.onclick = function() {
                moreInfoModal.style.display = "flex";
            }
        } 
        else if (option.optionText === "View Sample Clinical Trials.") {
            button.onclick = function() {
                document.getElementById("studies-modal").style.display = "flex";
            }
        } else {
            button.addEventListener('click', () => {
                optionsArea.innerHTML = ''
                appendMessage(userText, 'user', null, null, null)
                let messageBody = { userMessage: option.optionText, script: textScript }
                if (option.nextNode) {
                    if (option.increment === true) {
                        if (option.userInfo) {
                            userInfo = option.userInfo
                            // document.getElementById("thinking").style.display = "flex"
                        }
                        if (option.value === 0 || option.value ===1) {
                           logItem("browseChoice", option.value)
                        }
                        incrementProgress();
                        if (option.doubleIncrement) {
                            incrementProgress(true);
                        }
                    }
                    handleUserInput(option.nextNode, messageBody, agent)
                } else {
                    incrementProgress();
                    handleUserInput(continueNode, messageBody)
                }
                
                // You can add more actions here based on nextNode
            });
        }
        
        optionsArea.appendChild(button);
        setTimeout(() => {
            button.classList.add('move-up');
        }, 10);
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

function displaySubtitles(dialogue, divItem, passOn = null) {
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
            cancelTypewriterEffect(dialogueSection, dialogue, sources);
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
            // const optionsArea = document.getElementById("options-area")
            // optionsArea.style.display = "flex"
        }
        // chatBox.scrollTop = chatBox.scrollHeight; // Scroll to bottom
    }

    typeWriter(); // Start typing animation
}

function cancelTypewriterEffect(dialogueSection, wholeDialogue, sources) {
    typewriterRunning = false;
    dialogueSection.innerHTML = wholeDialogue; // Instantly display the complete dialogue
    if (sources !== null) {
        for (var j = 0; j < sources.length; j++) {
            const link = document.createElement('p');
            link.className = "source-link";
            link.textContent = `[ Source: ${j+1} ]`;
        
            var pdfModal = document.getElementById('pdfModal');
            var pdfViewer = document.getElementById('pdfViewer');
            document.getElementById('resource-item').innerText = sources[j].slice(0, -4);
        
            link.onclick = (function(index) {
                return function() {
                    pdfModal.style.display = 'flex';
                    pdfViewer.src = '../sources/' + sources[index];
                };
            })(j);
        
            dialogueSection.appendChild(document.createTextNode(' ')); // Add a space
            dialogueSection.appendChild(link);
        }
        
        // Move this outside the loop
        window.onclick = function(event) {
            if (event.target == pdfModal) {
                pdfModal.style.display = 'none';
            }
        };
        
    }
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

function logItem(columnName, value) {
    fetch('/logItem', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
            id: id, 
            columnName: columnName, 
            value: value
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

var closeHelp = document.getElementById("help-close");

closeHelp.onclick = function() {
    helpModal.style.display = "none";
}

// When the user clicks on the button, open the modal
helpBtn.onclick = function() {
    helpModal.style.display = "flex";
    var currentURLelement = document.getElementById("current-link-help")
    const currentURL = window.location.href;
    currentURLelement.innerHTML = currentURL
}

// Get the modal
var moreInfoModal = document.getElementById("more-info-modal");
var closeMoreInfoModal = document.getElementById("close-more-info-modal");
closeMoreInfoModal.onclick = function() {
    moreInfoModal.style.display = "none";
}

var ctModal = document.getElementById("studies-modal");
document.getElementById("close-ct-modal").onclick = function() {
    ctModal.style.display = "none";
}

var closePDFModal = document.getElementById("close-pdf-modal");
closePDFModal.onclick = function() {
    document.getElementById("pdfModal").style.display = "none";
}

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
    if (event.target == helpModal) {
      helpModal.style.display = "none";
    }
  
    if (event.target == moreInfoModal) {
      moreInfoModal.style.display = "none";
    }

    if (event.target == ctModal) {
        ctModal.style.display = "none";
      }
  }


