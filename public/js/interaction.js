import { characterAudio, characterAudioQueue, stopSpeaking, focusCharacter } from './virtualcharacter.js';

var continueNode = null
var progress = 0;
var userInfo = ""
var informationTranscript = new Map()
var id = ''
var condition = ''
// const textScript = "Text_Script_Audio.json"
const textScript = "Text_Script.json"
var incrementTotal
var finishCounter = 0
const slider = document.getElementById("myRange");
var explanations = {}
var explanationPreference = [1]
var introQuestionsJSON = []
var questionsJSON = []
var prevPreference = -1
var prevQuestion = 'What is a placebo?'

var prependItems = [
    "Good question. ",
    "Certainly, let's talk about that. ",
    "Glad you asked. ",
    "Of course, I can answer that. "
];

let prependIndex = 0; // Track current index

document.querySelector(".toggle").addEventListener("click", function() {
    this.classList.toggle("active-toggle");
});


function getPrependPhrase() {
    let phrase = prependItems[prependIndex]; // Get current phrase
    prependIndex = (prependIndex + 1) % prependItems.length; // Move to the next, loop back if needed
    return phrase;
}

async function getIntroQuestions() {
    const introQuestionsResponse = await fetch(`/getIntroQuestionsJSON`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!introQuestionsResponse.ok) {
        console.error('Failed to fetch response:', introQuestionsResponse.statusText);
    }
    const introQuestions = await introQuestionsResponse.json(); // gives ENTIRE audio at once
    introQuestionsJSON = introQuestions.introQuestions
}

async function getQuestions() {
    const questionsResponse = await fetch(`/getQuestionsJSON`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
    });
    if (!questionsResponse.ok) {
        console.error('Failed to fetch response:', questionsResponse.statusText);
    }
    const questions = await questionsResponse.json(); // gives ENTIRE audio at once
    questionsJSON = questions.questions
}


slider.addEventListener("input", function() {
    var value = this.value;
    // Do something with the slider value
    // Add your custom logic here
    if (value === "0"){
        document.getElementById("question-item-text").innerText = explanations.plain 
    } else if (value === "100"){
        document.getElementById("question-item-text").innerText = explanations.highhealth
    } else if (value === "50"){
        document.getElementById("question-item-text").innerText = explanations.original
    }
})

getIntroQuestions()
getQuestions()


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
    });

    document.getElementById("history").addEventListener('click', () => {
        document.getElementById("chat-container").style.display = 'flex'
        let chatContainer = document.getElementById("chat-container")
        chatContainer.scrollTop = chatContainer.scrollHeight
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
        document.getElementById("virtualcharacter").style.filter = "blur(.5px)"
        document.getElementById("virtualcharacter1").style.filter = "blur(0px)"
    } else if (agent === "doctor") {
        document.getElementById("virtualcharacter").style.filter = "blur(0px)"
        document.getElementById("virtualcharacter1").style.filter = "blur(.5px)"
    } else {
        document.getElementById("virtualcharacter").style.filter = "blur(.5px)"
        document.getElementById("virtualcharacter1").style.filter = "blur(.5px)"
    }
}

function findMostFrequentSmallestNumber(arr) {
    const frequencyMap = {};
    let maxCount = 0;
    let smallestMostFrequent = Infinity;

    // Count occurrences of each number (stored as strings)
    for (let num of arr) {
        frequencyMap[num] = (frequencyMap[num] || 0) + 1;
        maxCount = Math.max(maxCount, frequencyMap[num]);
    }

    // Find the smallest number among the most frequent ones
    for (let num in frequencyMap) {
        if (frequencyMap[num] === maxCount) {
            smallestMostFrequent = Math.min(smallestMostFrequent, Number(num)); // Convert to number for comparison
        }
    }

    return smallestMostFrequent; // Convert back to string if needed
}


function showInfoQuestion(question) {
    // var questionItem = document.getElementById("question-item-text")
    // questionItem.innerHTML = ''
    // questionItem.innerText = question;
}

function showLoading() {
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
    var increment = (1/incrementTotal)*100
    if (double === true) {
        increment = increment * 2
    }
    var nextIncrement = progress + increment;
    if (nextIncrement >= 100) {
        nextIncrement = 100
    }
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

function moveChatBox() {
    const historyHeight = document.getElementById('history').offsetHeight;

    const interactionHeight = document.getElementById('interaction').offsetHeight;
    
    // Get the chatbox-support element
    document.getElementById('chatbox-support').style.bottom = `${interactionHeight + historyHeight + 45}px`;
    document.getElementById('chatbox-doctor').style.bottom = `${interactionHeight + historyHeight + 45}px`;
}

function resetChatBoxPosition() {
    document.getElementById('chatbox-support').style.bottom = `5%`;
    document.getElementById('chatbox-doctor').style.bottom = `5%`;
}

function appendMessage(message, speaker, agent, nextNode = null, passOn = null) {
    var chatBox
    agent === 'doctor' ? chatBox = document.getElementById("chatbox-doctor") : chatBox = document.getElementById("chatbox-support")
    const labelText = document.createElement('div');
    const messageText = document.createElement('div');
    const messageItem = document.createElement('div');
    var agentSpeaker
    const messageTextHistory = document.createElement('div');
    const messageItemHistory = document.createElement('div');


    labelText.className = "label-text";

    if (speaker === 'user') {
        labelText.innerText = `You`
        messageText.className = "user-chatbot-message"
        messageTextHistory.className = "history-user-chatbot-message"
    } else {
        if (agent === 'doctor') {
            messageText.className = "doctor-chatbot-message"
            messageTextHistory.className = "history-doctor-chatbot-message"
            labelText.innerText = `Dr Alex`
            agentSpeaker = 'Alex'
        } else {
            messageText.className = "support-chatbot-message"
            labelText.innerText = `Skylar`
            messageTextHistory.className = "history-support-chatbot-message"
            agentSpeaker = 'Skylar'
        }
    }

    if (speaker === 'user') {
        if (message === 'text') {
            message = document.getElementById('user-input').value;
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
        informationTranscript.set(agentSpeaker + " " + getCurrentDateTime(), message);
        updateTranscript()
    }
    // if (speaker === 'user') {
    //     document.getElementById('user-input').value = '';
    // }
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

function enableButtons(tag) {
    const buttons = document.getElementsByClassName(tag);
    for (let button of buttons) {
        if (button.tagName.toLowerCase() === "button") {
            button.disabled = false;
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
    return data.message
}

const toggleFunction = function() {
    document.querySelector(".toggle").classList.toggle("active-toggle");
};

async function handleUserInput(nodeId, body, prevAgent = null, specificDialogue = null) {
    document.getElementById("user-rating-area-mini").style.display = "none";
    var supportCharacter = document.querySelector('#virtualcharacter1 > canvas')
    supportCharacter.style.pointerEvents = "none"
    supportCharacter.removeEventListener("click", toggleFunction);


    if (prevAgent === "doctor") {
        document.getElementById("chatbox-doctor").innerHTML = ''
    } else {
        document.getElementById("chatbox-support").innerHTML = ''
    }
    body.script = textScript
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
    if (data.nodeId >= 15) {
        finishCounter++
        console.log("FINISH COUNTER IS", finishCounter)
        if (finishCounter === 5) {
            console.log("WE R DONE")
            document.getElementById("finish-btn").style.display = "block"
        }
    }

    focusCharacter(data.agent)

    if (data.options) {
        displayOptions(data.options, data.agent)
    }

    var characterDialogue = data.dialogue
    if (data.showQuestions && data.showQuestions.questionList) { 
        var jsonList
        data.showQuestions.questionList.questionJSON === "introQuestionsJSON" ? jsonList = introQuestionsJSON : jsonList = questionsJSON
        if (data.showQuestions.questionList.questionJSON === "introQuestionsJSON") {
            jsonList = introQuestionsJSON
            if (prevPreference === '0') { 
                // characterDialogue += jsonList[data.showQuestions.questionList.item].explanations.plain; 
                console.log(jsonList[data.showQuestions.questionList.item].explanations)
                showInfoQuestion(jsonList[data.showQuestions.questionList.item].explanations) 
            }
            if (prevPreference === '50') { 
                // characterDialogue += jsonList[data.showQuestions.questionList.item].explanations.original,
                console.log(jsonList[data.showQuestions.questionList.item].explanations)
                showInfoQuestion(jsonList[data.showQuestions.questionList.item].explanations) 
            }
            if (prevPreference === '100') { 
                // characterDialogue += jsonList[data.showQuestions.questionList.item].explanations.highhealth 
                console.log(jsonList[data.showQuestions.questionList.item].explanations)
                showInfoQuestion(jsonList[data.showQuestions.questionList.item].explanations) 
            }
        } else if (data.showQuestions.questionList.questionJSON === "questionsJSON") {
            jsonList = questionsJSON
            console.log("EXPLANATION PREFERENCES", explanationPreference)
            console.log(prevQuestion)
            var userQuestionItem = jsonList.find(obj => obj.question === prevQuestion);
            console.log(userQuestionItem)

            var explanationType = findMostFrequentSmallestNumber(explanationPreference)
            var responseType
            if (explanationType === 1) { responseType = userQuestionItem.explanations.plain }
            if (explanationType === 50) { responseType = userQuestionItem.explanations.original }
            if (explanationType === 100) { responseType = userQuestionItem.explanations.highhealth }

            characterDialogue += getPrependPhrase() + responseType
            explanations = userQuestionItem.explanations
        }
        
    }
    
    if (data.nodeId >= 13) {
        if (data.showQuestions && data.showQuestions.questionAdjustment) {
            var explanationType = findMostFrequentSmallestNumber(explanationPreference)
            console.log(explanationType)
            if (explanationType === 1) { 
                document.getElementById("1").classList.add("highlight") 
                document.getElementById("2").classList.remove("highlight")
                document.getElementById("3").classList.remove("highlight")
            }
            if (explanationType === 50) { 
                document.getElementById("2").classList.add("highlight") 
                document.getElementById("1").classList.remove("highlight")
                document.getElementById("3").classList.remove("highlight")
            }
            if (explanationType === 100) { 
                document.getElementById("3").classList.add("highlight") 
                document.getElementById("2").classList.remove("highlight")
                document.getElementById("1").classList.remove("highlight")
            }

            jsonList = questionsJSON
            var userQuestionItem = jsonList.find(obj => obj.question === prevQuestion);
            userQuestionItem.explanations.plain
            document.getElementById("1").onclick = function() {
                console.log("LOW HL")
                document.getElementById("user-rating-area").style.opacity = 0;
                document.getElementById("user-rating-area").style.pointerEvents = "none";
                document.getElementById("options-area").innerHTML = ''
                explanationPreference.push(1)
                resetChatBoxPosition();
                handleUserInput(13, { userMessage: userQuestionItem.explanations.plain, script: textScript }, data.agent, userQuestionItem.explanations.plain)
            };
            document.getElementById("2").onclick = function() {
                console.log("DEFAULT HL")
                document.getElementById("user-rating-area").style.opacity = 0;
                document.getElementById("user-rating-area").style.pointerEvents = "none";
                document.getElementById("options-area").innerHTML = ''
                explanationPreference.push(50)
                resetChatBoxPosition();
                handleUserInput(13, { userMessage: userQuestionItem.explanations.original, script: textScript }, data.agent, userQuestionItem.explanations.original)
            };
            document.getElementById("3").onclick = function() {
                console.log("HIGH HL")
                document.getElementById("user-rating-area").style.opacity = 0;
                document.getElementById("user-rating-area").style.pointerEvents = "none";
                document.getElementById("options-area").innerHTML = ''
                explanationPreference.push(100)
                resetChatBoxPosition();
                handleUserInput(13, { userMessage: userQuestionItem.explanations.highhealth, script: textScript }, data.agent, userQuestionItem.explanations.highhealth)
            };
        }
    }

    if (specificDialogue) { characterDialogue = specificDialogue }

    characterAudio(characterDialogue, null, data.agent, () => {
        if (data.passOn) {
            handleUserInput(data.input.nextNode, { userInput: "Start Introduction", script: textScript, gender: "male" }, data.agent);
        } else {
            focusCharacter("neither")
        }
        if (data.nodeId >= 13) {
            if (data.showQuestions && data.showQuestions.questionAdjustment) {
                document.getElementById("user-rating-area-mini").style.display = "block";
                var supportCharacter = document.querySelector('#virtualcharacter1 > canvas')
                supportCharacter.style.pointerEvents = "all"
                supportCharacter.addEventListener("click", toggleFunction);
            }
        }

        if (data.options && data.options.generate && data.options.generate !== false || data.options.generate === undefined || data.options.questionList) {
            setTimeout(() => {
                document.getElementById("user-rating-area").style.opacity = 1;
                document.getElementById("user-rating-area").style.pointerEvents = "all";
                enableButtons("option-btn")
                moveChatBox();
            }, 10);
        }
        if (data.options.questionList) {
            enableButtons("preference-option-btn")
        }
        
        // if (data.showQuestions) { 
        //     document.getElementById('questions').classList.add('show');
        //     if (data.agent === "doctor") {
        //         document.getElementById("chatbox-doctor").innerHTML = ''
        //     } else {
        //         document.getElementById("chatbox-support").innerHTML = ''
        //     }
        // } else {
        //     document.getElementById('questions').classList.remove('show');
        // }
        // if (data.showQuestions && data.showQuestions.explanations) { 
        //     document.getElementById('ask-preference-area').classList.add('show');
        // } else {
        //     document.getElementById("ask-preference-area").classList.remove('show')
        // }
    });

    if (data.passOn) { 
        appendMessage(characterDialogue, 'Alex',  data.agent, null, data.passOn);
    } else {
        appendMessage(characterDialogue, 'Alex',  data.agent);
    } 
}

function checkAndRemoveTopic(item) {
    if (item in topics) {
        delete topics[item]
    }
}

function getOptionText(key, value) {
    switch(key) {
        case 'original':
            return '<strong>Default:</strong><br/>';
        case 'plain':
            return '<strong>Less Technical:</strong><br/>';
        case 'highhealth':
            return '<strong>More Technical:</strong><br/>';
        default:
            return value; // fallback to the value if key is not recognized
    }
}

function getOptionValue(key, value) {
    switch(key) {
        case 'original':
            return 50;
        case 'plain':
            return 1;
        case 'highhealth':
            return 100;
        default:
            return value; // fallback to the value if key is not recognized
    }
}

function checkPreference(key, value) {
    console.log("IN CHECK PREF, PREV PREF WAS", prevPreference)
    switch(key) {
        case 'original':
            if (prevPreference === 50) {return true}
        case 'plain':
            if (prevPreference === 1) {return true}
        case 'highhealth':
            if (prevPreference === 100) {return true}
        default:
            return false; // fallback to the value if key is not recognized
    }
}

function displayOptions(options, agent) {
    var prevAgent = agent
    var optionsArray = options
    if (options.generate) {
        const optionsTopics = Object.keys(topics)
        .slice(0, 3)
        .map(key => ({
            optionText: key,
            nextNode: options.nextNode,
            getPreference: true
        }));
        optionsArray = optionsTopics
        // prevAgent = "doctor"
    }
    if (options.questionList) {
        console.log("CREATING OPTIONS FROM QUESTION LIST")
        var tutorialOptionsTopics = Object.entries(introQuestionsJSON[options.item].explanations)
        .map(([key, value]) => ({
            optionText: getOptionText(key) + value,
            optionDialogue: value,
            nextNode: options.nextNode,
            getPreference: true,
            preference: getOptionValue(key),
        }));
        optionsArray = tutorialOptionsTopics
    }
    console.log(optionsArray)
    optionsArray.forEach(option => {
        const optionsArea = document.getElementById("options-area")
        
        const button = document.createElement('button');
        const userText = option.optionText
        button.innerHTML = userText;
        if (option.preference && option.preference === prevPreference) {
            console.log("THIS WAS THE PREV PREF")
            // button.classList.add("highlight-option-btn")
            const highlightDiv = document.createElement("p");
            highlightDiv.innerHTML = "Skylar Recommends"
            highlightDiv.classList.add("highlight-div")
            button.appendChild(highlightDiv)
        }
        if (options.questionList) {
            button.classList.add("preference-option-btn")
        } else {
            button.classList.add("option-btn")
        }
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
                document.getElementById("chatbox-doctor").innerHTML = ''
                document.getElementById("chatbox-support").innerHTML = ''
                if (option.getPreference && option.preference) {
                    prevPreference = option.preference
                    prevQuestion = option.optionText
                    // document.getElementById("user-rating-area-mini").style.display = "none";
                    explanationPreference.push(option.preference)
                    console.log("EXPLANATION PREF:", explanationPreference)
                }
                if (option.getPreference) {
                    prevPreference = option.preference
                    prevQuestion = option.optionText
                }
                console.log("CLICKED BUTTON")
                document.getElementById('questions').classList.remove('show');
                document.getElementById("ask-preference-area").classList.remove('show')
                document.getElementById("user-rating-area").style.opacity = 0;
                document.getElementById("user-rating-area").style.pointerEvents = "none";
                optionsArea.innerHTML = ''
                resetChatBoxPosition();
                appendMessage(userText, 'user', null, null, null)
                let messageBody = { userMessage: option.optionText, script: textScript }
                checkAndRemoveTopic(option.optionText)
                if (option.nextNode) {
                    if (option.increment === true) {
                        if (option.userInfo) {
                            userInfo = option.userInfo
                            document.getElementById("thinking").style.display = "flex"
                        }
                        if (option.value === 0 || option.value ===1) {
                            logItem("browseChoice", option.value)
                        }
                        incrementProgress();
                        if (option.doubleIncrement) {
                            incrementProgress(true);
                        }
                    }
                    if (options.questionList) {
                        handleUserInput(option.nextNode, messageBody, prevAgent, option.optionDialogue)
                    } else {
                        handleUserInput(option.nextNode, messageBody, prevAgent)
                    }
                } else {
                    incrementProgress();
                    handleUserInput(continueNode, messageBody, prevAgent)
                }
                
                // You can add more actions here based on nextNode
            });
        }
        
        optionsArea.appendChild(button);
    });
    
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


