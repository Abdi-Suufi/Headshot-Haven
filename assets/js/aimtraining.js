document.addEventListener('DOMContentLoaded', (event) => {
    // Initialize canvas and context
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) {
        console.error('Canvas element not found');
        return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
        console.error('2D context not available');
        return;
    }

    // Ball objects array
    let balls = [];
    const ballRadius = 20;
    let score = 0;
    let startTime; // Variable to store the start time
    const gameDuration = 5 * 1000; // 5 seconds in milliseconds

    // Create initial balls with random positions
    function createBalls() {
        for (let i = 0; i < 3; i++) {
            balls.push({ 
                x: Math.random() * (canvas.width - ballRadius * 2) + ballRadius,
                y: Math.random() * (canvas.height - ballRadius * 2) + ballRadius,
                radius: ballRadius,
                color: 'rgb(255, 100, 66)' 
            });
        }
    }

    // Function to draw a ball
    function drawBall(ball) {
        ctx.beginPath();
        ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
        ctx.fillStyle = ball.color;
        ctx.fill();
        ctx.closePath();
    }

    // Function to draw all balls
    function drawBalls() {
        balls.forEach(ball => {
            drawBall(ball);
        });
    }

    // Function to check if a point is inside a ball
    function isInsideBall(ball, mouseX, mouseY) {
        const distance = Math.sqrt((mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2);
        return distance <= ball.radius;
    }

    // Handle mousedown event to check if a ball is clicked
    canvas.addEventListener('mousedown', function(event) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        balls.forEach((ball, index) => {
            if (isInsideBall(ball, mouseX, mouseY)) {
                resetBall(ball);
                updateScore();
            }
        });
    });

    // Function to reset a ball's position
    function resetBall(ball) {
        // Move the shot ball off-screen
        ball.x = -100;
        ball.y = -100;
        
        // Spawn a new ball in a random position
        const newBall = {
            x: Math.random() * (canvas.width - ballRadius * 2) + ballRadius,
            y: Math.random() * (canvas.height - ballRadius * 2) + ballRadius,
            radius: ballRadius,
            color: 'rgb(255, 100, 66)'
        };
        balls.push(newBall);
    }

    // Function to update the score
    function updateScore() {
        score++;
    }

    // Function to clear canvas
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Main game loop
    function gameLoop(timestamp) {
        if (!startTime) startTime = timestamp; // Set the start time if it's not set
        
        if (timestamp - startTime < gameDuration) {
            clearCanvas();
            drawBalls();
            requestAnimationFrame(gameLoop);
        } else {
            // Game over, stop the game
            console.log('Game over! Your score: ' + score);
            document.getElementById('score').textContent = score;
            gameOver(score);
        }
    }
    
    function sendScoreToServer(score) {
        fetch('update_score.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ score: score })
        })
        .then(response => {
            return response.json().then(data => ({ data, response }));
        })
        .then(({ data, response }) => {
            if (response.ok) {
                console.log('Score updated successfully');
            } else {
                console.error('Failed to update score:', data.message);
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
    }
    
    // Call this function when the game ends and you have the final score
    function gameOver(finalScore) {
        // Send score to the server
        sendScoreToServer(finalScore);
    }
    

    // Start the game
    createBalls();
    requestAnimationFrame(gameLoop);

    // Reset button click event handler
    document.getElementById('resetButton').addEventListener('click', function() {
        score = 0; // Reset the score
        startTime = null; // Reset the start time
        balls = []; // Clear the balls array
        createBalls(); // Create new balls
        requestAnimationFrame(gameLoop); // Start the game loop again
    });
});