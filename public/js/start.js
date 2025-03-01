document.addEventListener('DOMContentLoaded', (event) => {  
    var condition
    var id
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    if (urlParams.size === 0) {
        condition = '1'
        id = 'R_6OJi7FcmMOb3GZe'
    } else {
        condition = urlParams.get('c')
        id = urlParams.get('id')
    }
    condition = parseInt(condition)
    var currentDate = new Date();
    logToDatabase(id, condition, currentDate);
    // Call the function
    someFunction(id);
    
    if (condition === 0) {
        sessionStorage.setItem("character", "female.glb")
        sessionStorage.setItem("body", "F")
    }

    console.log("id is:", id)
    console.log("condition is:", condition)

    document.getElementById('back1').addEventListener('click', part1);
    document.getElementById('part1-btn').addEventListener('click', part2);
    document.getElementById('part2-btn').addEventListener('click', part3);
    document.getElementById('back2').addEventListener('click', part2);
    document.getElementById('part3-btn').addEventListener('click', part4);
    document.getElementById('back3').addEventListener('click', part3);
    document.getElementById('part4-btn').addEventListener('click', part5);
    document.getElementById('back4').addEventListener('click', part4);
    document.getElementById('part5-btn').addEventListener('click', part6);
    document.getElementById('back5').addEventListener('click', part5);
    document.getElementById('part6-btn').addEventListener('click', function() {
        window.location.href = "/interaction?id=" + id + "&c=" + condition;
    });
});

function part1() {
    document.getElementById("part1").style.display = "block"
    document.getElementById("part2").style.display = "none"
    document.getElementById("info2").style.display = "none"
    document.getElementById("header-area").classList.remove("scaled-header")
    document.getElementById("part2-btn").style.display = "none"
    document.getElementById("part1-btn").style.display = "block"
    document.getElementById("back1").style.display = "none"
}

function part2() {
    document.getElementById("part1").style.display = "none"
    document.getElementById("part3").style.display = "none"
    document.getElementById("part2").style.display = "block"
    document.getElementById("info2").style.display = "flex"
    document.getElementById("info3").style.display = "none"
    document.getElementById("header-area").classList.add("scaled-header")
    document.getElementById("part2-btn").style.display = "block"
    document.getElementById("part3-btn").style.display = "none"
    document.getElementById("part1-btn").style.display = "none"
    document.getElementById("back1").style.display = "block"
    document.getElementById("back2").style.display = "none"
}

function part3() {
    document.getElementById("part2").style.display = "none"
    document.getElementById("part4").style.display = "none"
    document.getElementById("part3").style.display = "block"
    document.getElementById("part2-btn").style.display = "none"
    document.getElementById("part4-btn").style.display = "none"
    document.getElementById("part3-btn").style.display = "block"
    document.getElementById("info2").style.display = "none"
    document.getElementById("info4").style.display = "none"
    document.getElementById("info3").style.display = "flex"
    document.getElementById("back1").style.display = "none"
    document.getElementById("back3").style.display = "none"
    document.getElementById("back2").style.display = "block"
}

function part4() {
    document.getElementById("part3").style.display = "none"
    document.getElementById("part5").style.display = "none"
    document.getElementById("part4").style.display = "block"
    document.getElementById("part3-btn").style.display = "none"
    document.getElementById("part5-btn").style.display = "none"
    document.getElementById("part4-btn").style.display = "block"
    document.getElementById("info3").style.display = "none"
    document.getElementById("info5").style.display = "none"
    document.getElementById("info4").style.display = "flex"
    document.getElementById("back2").style.display = "none"
    document.getElementById("back4").style.display = "none"
    document.getElementById("back3").style.display = "block"
}

function part5() {
    console.log("IN PART 5")
    document.getElementById("part4").style.display = "none"
    document.getElementById("part6").style.display = "none"
    document.getElementById("part5").style.display = "block"
    document.getElementById("part4-btn").style.display = "none"
    document.getElementById("part5-btn").style.display = "block"
    document.getElementById("part6-btn").style.display = "none"
    document.getElementById("info4").style.display = "none"
    document.getElementById("info5").style.display = "flex"
    document.getElementById("back3").style.display = "none"
    document.getElementById("back5").style.display = "none"
    document.getElementById("back4").style.display = "block"
    document.getElementById("header-area").classList.add("scaled-header")
}

function part6() {
    document.getElementById("part5").style.display = "none"
    document.getElementById("part6").style.display = "block"
    document.getElementById("part5-btn").style.display = "none"
    document.getElementById("part6-btn").style.display = "block"
    document.getElementById("info5").style.display = "none"
    document.getElementById("header-area").classList.remove("scaled-header")
    document.getElementById("back4").style.display = "none"
    document.getElementById("back5").style.display = "block"
}


async function someFunction(id) {
    try {
        const result = await checkTopics(id);
        if (result.topics === false) {
            console.log("Topics does not exist, generating...", result.topics)
            getConversationTopics(id)
            return
        } else {
            console.log("Topics exists!")
            var topics = result.topics
            console.log(topics)
            var firstSevenTopics = {};
            firstSevenTopics["Topics"] = Object.fromEntries(Object.entries(topics.Topics).slice(0, 7));
            console.log(firstSevenTopics)
            sessionStorage.setItem("topics", JSON.stringify(firstSevenTopics))
        }
        // Continue with the rest of your code
    } catch (error) {
        console.error("An error occurred:", error);
        // Handle the error appropriately
    }
}

async function checkTopics(id) {
    try {
        const response = await fetch('/qualtrics/checkTopics', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({id: id})
        });

        if (response.status === 409) {
            const data = await response.json();
            throw new Error(data.message);
        }
        if (!response.ok) {
            throw new Error('Server responded with error ' + response.status);
        }

        const data = await response.json();
        console.log(data);
        return data; // Return the data
    } catch (error) {
        console.error('Error:', error.message);
        throw error; // Re-throw the error
    }
}


function getConversationTopics(id) {
    fetch('/qualtrics/scoreSurveyResponses', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({id: id})
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
        console.log(data);
    })
    .catch(error => {
        console.error('Error:', error.message);
    });  
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