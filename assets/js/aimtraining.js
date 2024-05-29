document.addEventListener('DOMContentLoaded', (event) => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    let balls = [];
    const ballRadius = 30;
    let score = 0;
    let startTime;
    const gameDuration = 5 * 1000;

    let personalBest = 0;
    let isGameStarted = false;
    let countdown = 3;
    const startButton = document.getElementById('startButton');
    const scoreDisplay = document.getElementById('score');
    const personalBestDisplay = document.getElementById('personalBest');

    // Define grid points
    const gridSize = 100; // Adjust the grid size as needed
    let gridPoints = [];

    function createGridPoints() {
        gridPoints = [];
        const cols = Math.floor(canvas.width / gridSize);
        const rows = Math.floor(canvas.height / gridSize);

        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                const x = i * gridSize + gridSize / 2;
                const y = j * gridSize + gridSize / 2;
                gridPoints.push({ x, y });
            }
        }
    }

    // Function to create initial balls with random positions
    function createBalls() {
        balls = []; // Reset the balls array
        const availablePoints = [...gridPoints]; // Make a copy of the grid points

        for (let i = 0; i < 3; i++) {
            if (availablePoints.length === 0) break; // No more points available
            const randomIndex = Math.floor(Math.random() * availablePoints.length);
            const { x, y } = availablePoints.splice(randomIndex, 1)[0]; // Remove selected point
            balls.push({
                x,
                y,
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
    canvas.addEventListener('mousedown', function (event) {
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
        ball.x = -100;
        ball.y = -100;

        const availablePoints = [...gridPoints]; // Make a copy of the grid points
        const randomIndex = Math.floor(Math.random() * availablePoints.length);
        const { x, y } = availablePoints.splice(randomIndex, 1)[0]; // Remove selected point

        const newBall = {
            x,
            y,
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

    // Function to start the countdown
    function startCountdown() {
        countdown = 3;
        startButton.disabled = true;

        const countdownInterval = setInterval(() => {
            clearCanvas();
            ctx.font = "30px Arial";
            ctx.fillStyle = "white";
            ctx.fillText(countdown, canvas.width / 2 - 10, canvas.height / 2);
            countdown--;

            if (countdown < 0) {
                clearInterval(countdownInterval);
                isGameStarted = true;
                createBalls(); // Create balls after countdown
                requestAnimationFrame(gameLoop);
            }
        }, 1000);
    }

    // Main game loop
    function gameLoop(timestamp) {
        if (isGameStarted) {
            if (!startTime) startTime = timestamp;
            if (timestamp - startTime < gameDuration) {
                clearCanvas();
                drawBalls();
                requestAnimationFrame(gameLoop);
            } else {
                console.log('Game over! Your score: ' + score);
                scoreDisplay.textContent = score;
                sendScoreToServer(score);
                startButton.disabled = false;
                isGameStarted = false;
            }
        } else {
            requestAnimationFrame(gameLoop);
        }
    }

    // Fetch and display the personal best from the server
    function getAndDisplayPersonalBest() {
        fetch('get_score.php')
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    personalBest = data.personalBest;
                    personalBestDisplay.textContent = personalBest;
                } else {
                    console.error('Failed to get personal best:', data.message);
                }
            })
            .catch(error => {
                console.error('Error fetching personal best:', error);
            });
    }

    function sendScoreToServer(score) {
        const data = new FormData();
        data.append('score', score);

        fetch('update_score.php', {
            method: 'POST',
            body: data
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    console.log('Score updated successfully');
                    getAndDisplayPersonalBest();
                }
            })
            .catch(error => {
                console.error('Error:', error);
            });
    }

    function resetGameState() {
        score = 0;
        balls = [];
        startTime = null;
        isGameStarted = false;
        scoreDisplay.textContent = score;
    }

    startButton.addEventListener('click', () => {
        resetGameState();
        startCountdown();
    });

    createGridPoints(); // Initialize grid points on page load
    getAndDisplayPersonalBest();
});
