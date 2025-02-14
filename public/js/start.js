document.addEventListener('DOMContentLoaded', (event) => {  
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    var condition = urlParams.get('c')
    var id = urlParams.get('id')
    condition = parseInt(condition)
    var currentDate = new Date();
    logToDatabase(id, condition, currentDate);
    if (condition === 0) {
        sessionStorage.setItem("character", "female.glb")
        sessionStorage.setItem("body", "F")
    }
    document.getElementById("begin-btn").addEventListener('click', () => {
        window.location.href = "/interaction?id=" + id + "&c=" + condition;
    });
});

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