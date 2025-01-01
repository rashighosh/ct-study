var counter = 1;
let progress = 0;

const instructions = [
    "Alex will respond with both text and audio, so <b>make sure your sound is on</b>!",
    "You can interact with Alex using by <b>clicking buttons</b> or by <b>typing</b>.",
    "Note that Alex may use AI to respond to you, so <b>responses can take up to 15 seconds</b>.",
    "Alex will walk you through a few topics. When <b>finished</b>, a button will appear in the <b>right middle side of your screen</b> which you can click to continue."
]

document.addEventListener('DOMContentLoaded', (event) => {  
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var condition = urlParams.get('c')
    var id = urlParams.get('id')
    condition = parseInt(condition)
    var currentDate = new Date();
    logToDatabase(id, condition, currentDate);
    document.getElementById("start-btn").addEventListener('click', () => {
        window.location.href = "/interaction?id=" + id + "&c=" + condition;
    });
});

document.getElementById("next-btn").addEventListener('click', () => {
    counter++;
    console.log(counter)
    if (counter <= 4) {
        document.getElementById("number").innerHTML = counter + "/4"
        incrementProgress();
        document.getElementById("back-btn").style.visibility = "visible"
        var image = "/images/" + counter + ".png"
        console.log(image)
        document.getElementById("image-instruction").src = image
        document.getElementById("instruction").innerHTML = instructions[counter-1]
    } else {
        beginInteraction()
    }
});

document.getElementById("back-btn").addEventListener('click', () => {
    counter--;
    console.log(counter)
    document.getElementById("number").innerHTML = counter + "/4"
    if (counter <= 1) {
        document.getElementById("back-btn").style.visibility = "hidden"
    }
    decrementProgress();
    var image = "/images/" + counter + ".png"
    console.log(image)
    document.getElementById("image-instruction").src = image
    document.getElementById("instruction").innerHTML = instructions[counter-1]
});

document.getElementById("review-btn").addEventListener('click', () => {
    counter = 4;
    document.getElementById("intro").style.display = "none" 
    document.getElementById("next-btn").style.display = "block"
    document.getElementById("back-btn").style.display = "block"
    document.getElementById("number").innerHTML = counter + "/4"
    var image = "/images/" + counter + ".png"
    console.log(image)
    document.getElementById("image-instruction").src = image
    document.getElementById("information").style.display = "flex"
    document.getElementById("instruction").innerHTML = instructions[counter-1]
    document.getElementById("start-btn").style.display = "none"
    document.getElementById("review-btn").style.display = "none"
});

document.getElementById("instructions-btn").addEventListener('click', () => {
    document.getElementById("instructions-btn").style.display = "none"
    document.getElementById("intro").style.display = "none"
    document.getElementById("information").style.display = "flex"
    document.getElementById("navigation").style.display = "flex"
    incrementProgress()
});

function beginInteraction() {
    document.getElementById("information").style.display = "none"
    document.getElementById("next-btn").style.display = "none"
    document.getElementById("back-btn").style.display = "none"
    document.getElementById("start-btn").style.display = "block"
    document.getElementById("review-btn").style.display = "block"
    document.getElementById("intro").innerHTML = "You are now ready to begin chatting with Alex! Click the button below to begin the interaction." 
    document.getElementById("intro").style.display = "flex"
}

function logToDatabase(id, condition, currentDate) {
    fetch('/logUser', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: id, condition: condition, startTime: currentDate})
    })
    .then(async response => {
        if (response.status === 409) {
            const data = await response.json();
            throw new Error(data.message); // Throw error with the message from server
        }
        if (!response.ok) {
            throw new Error('Server responded with error ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        console.log(data.message);
    })
    .catch(error => {
        console.error('Error:', error.message);
    });
    
}

function updateProgress(progress) {
    const progressBar = document.querySelector('.progress-bar2');
    const loader = document.querySelector('.loader');
    
    // Update progress bar width
    progressBar.style.width = `${progress}%`;
    
    // Update loader text
    loader.setAttribute('data-progress', Math.round(progress));
}

// Function to increment progress
function incrementProgress() {
    console.log("INCREMENTING PROGRESS")
    var nextIncrement = progress + 25;
    const interval = setInterval(() => {
        progress += 1;
        updateProgress(progress);
        if (progress >= nextIncrement) {
            clearInterval(interval);
        }
    }, 50); // Adjust this value to change the speed of the progress
}

// Function to increment progress
function decrementProgress() {
    var nextIncrement = progress - 25;
    const interval = setInterval(() => {
        progress -= 1;
        updateProgress(progress);
        if (progress <= nextIncrement) {
            clearInterval(interval);
        }
    }, 50); // Adjust this value to change the speed of the progress
}

// Call the function when you want to start the progress

