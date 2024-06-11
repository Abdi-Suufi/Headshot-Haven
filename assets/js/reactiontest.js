document.addEventListener('DOMContentLoaded', (event) => {
    let reactionCanvas = document.getElementById('reactionCanvas');
    let reactionContext = reactionCanvas.getContext('2d');
    let startReactionButton = document.getElementById('startReactionButton');
    let reactionTimeDisplay = document.getElementById('reactionTime');
    let reactionStartTime;
    let reactionTimeout;
    let gameActive = false;

    function startReactionTest() {
        if (gameActive) return;

        gameActive = true;
        // Reset the canvas and timer
        reactionContext.fillStyle = 'red';
        reactionContext.fillRect(0, 0, reactionCanvas.width, reactionCanvas.height);
        reactionTimeDisplay.textContent = '0';

        // Generate a random delay between 1 and 6 seconds
        let randomDelay = Math.random() * 5000 + 1000;
        reactionCanvas.removeEventListener('click', recordReactionTime);

        // Set a timeout to change the canvas color to green
        reactionTimeout = setTimeout(() => {
            reactionContext.fillStyle = 'green';
            reactionContext.fillRect(0, 0, reactionCanvas.width, reactionCanvas.height);
            reactionStartTime = new Date().getTime();
            reactionCanvas.addEventListener('click', recordReactionTime);
        }, randomDelay);
    }

    function recordReactionTime() {
        let reactionEndTime = new Date().getTime();
        let reactionTime = reactionEndTime - reactionStartTime;
        reactionTimeDisplay.textContent = reactionTime;

        // Remove event listener to prevent multiple clicks
        reactionCanvas.removeEventListener('click', recordReactionTime);

        // Send the reaction time score to the server
        sendReactionScoreToServer(reactionTime); // Call the correct function name
    }

    function sendReactionScoreToServer(score) {
        const data = new FormData();
        data.append('score', score);

        fetch('update_reaction_score.php', {
            method: 'POST',
            body: data
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Reaction speed test score updated successfully');
                } else {
                    console.error('Error updating reaction speed test score:', data.message);
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    // Fetch and display the personal best reaction time from the server
    function getAndDisplayReactionBest() {
        fetch('get_reaction_score.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const reactionBestDisplay = document.getElementById('reaction-Best');
                    reactionBestDisplay.textContent = data.reactionScore; // Append "ms" for clarity
                } else {
                    console.error('Failed to get reaction personal best:', data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching reaction personal best:', error);
            });
    }

    function resetGame() {
        gameActive = false; // Allow starting a new game
        reactionCanvas.removeEventListener('click', recordReactionTime);
        clearTimeout(reactionTimeout);

        // Clear the canvas
        reactionContext.clearRect(0, 0, reactionCanvas.width, reactionCanvas.height);
        reactionTimeDisplay.textContent = '0';
    }

    startReactionButton.addEventListener('click', () => {
        resetGame(); // Reset the game before starting a new one
        startReactionTest();
    });
    getAndDisplayReactionBest()
});