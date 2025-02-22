document.addEventListener('DOMContentLoaded', (event) => {  
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var condition = urlParams.get('c')
    var id = urlParams.get('id')
    condition = parseInt(condition)
    var currentDate = new Date();
    logToDatabase(id, condition, currentDate);
    // Call the function
    someFunction(id);
    
    if (condition === 0) {
        sessionStorage.setItem("character", "female.glb")
        sessionStorage.setItem("body", "F")
    }

    document.getElementById("begin-btn").addEventListener('click', () => {
        window.location.href = "/interaction?id=" + id + "&c=" + condition;
    });
});

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
            sessionStorage.setItem("topics", JSON.stringify(topics))
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