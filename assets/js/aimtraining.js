document.addEventListener("DOMContentLoaded", (event) => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  let balls = [];
  const ballRadius = 30;
  let score = 0;
  let startTime;
  const gameDuration = 30 * 1000;

  let personalBest = 0;
  let isGameStarted = false;
  let countdown = 3;
  const startButton = document.getElementById("startButton");
  const personalBestDisplay = document.getElementById("personalBest");
  const timerDisplay = document.getElementById("timer");
  const accuracyDisplay = document.getElementById("accuracy");

  let totalClicks = 0;
  let successfulClicks = 0;

  // Load audio files
  const clickSound = new Audio("assets/audio/gun-noise.mp3");
  const hitSound = new Audio("assets/audio/ball-hit.ogg");
  const highScoreSound = new Audio("assets/audio/highscore.mp3");

  // Set the volume for the audio files
  clickSound.volume = 0.1; // Adjust volume between 0 and 1
  hitSound.volume = 0.8; // Adjust volume between 0 and 1
  highScoreSound.volume = 0.8; // Adjust volume between 0 and 1

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
        color: "rgb(255, 100, 66)",
      });
    }
  }

  function drawBall(ball) {
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    ctx.fillStyle = ball.color;
    ctx.fill();
    ctx.closePath();
  }

  function drawBalls() {
    balls.forEach((ball) => {
      drawBall(ball);
    });
  }

  function isInsideBall(ball, mouseX, mouseY) {
    const distance = Math.sqrt((mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2);
    return distance <= ball.radius;
  }

  canvas.addEventListener("mousedown", function (event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    totalClicks++;

    let ballClicked = false;

    balls.forEach((ball, index) => {
      if (isInsideBall(ball, mouseX, mouseY)) {
        resetBall(ball);
        updateScore(1);
        successfulClicks++;
        hitSound.currentTime = 0; // Reset hit sound to start
        hitSound.play(); // Play hit sound
        ballClicked = true;
      }
    });

    clickSound.currentTime = 0; // Reset click sound to start
    clickSound.play(); // Play click sound

    if (!ballClicked) {
      updateScore(-1);
    }

    updateAccuracy();
  });

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
      color: "rgb(255, 100, 66)",
    };
    balls.push(newBall);
  }

  function updateScore(change) {
    score += change;
  }

  function updateAccuracy() {
    const accuracy = ((successfulClicks / totalClicks) * 100).toFixed(1);
    accuracyDisplay.textContent = `Accuracy: ${accuracy}%`;
  }

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

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

  function gameLoop(timestamp) {
    if (isGameStarted) {
      if (!startTime) startTime = timestamp;
      const elapsedTime = timestamp - startTime;
      const timeLeft = Math.max((gameDuration - elapsedTime) / 1000, 0).toFixed(
        1
      ); // Calculate time left

      clearCanvas();
      drawBalls();

      timerDisplay.textContent = timeLeft;

      if (elapsedTime < gameDuration) {
        requestAnimationFrame(gameLoop);
      } else {
        console.log("Game over! Your score: " + score);
        if (score > personalBest) {
          highScoreSound.play(); // Play high score sound if new high score
          displayFinalScore(true); // Display new high score message
        } else {
          displayFinalScore(false); // Display normal game over message
        }
        sendScoreToServer(score);
        startButton.disabled = false;
        isGameStarted = false;
      }
    } else {
      requestAnimationFrame(gameLoop);
    }
  }

  function displayFinalScore(isNewHighScore) {
    clearCanvas();
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    if (isNewHighScore) {
      ctx.fillText(
        `New High Score! Your score: ${score}`,
        canvas.width / 2 - 150,
        canvas.height / 2
      );
    } else {
      ctx.fillText(
        `Game over! Your score: ${score}`,
        canvas.width / 2 - 150,
        canvas.height / 2
      );
    }
  }

  function getAndDisplayPersonalBest() {
    fetch("get_score.php")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          personalBest = data.personalBest;
          personalBestDisplay.textContent = personalBest;
        } else {
          console.error("Failed to get personal best:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error fetching personal best:", error);
      });
  }

  function calculateAccuracy() {
    return ((successfulClicks / totalClicks) * 100).toFixed(1);
  }

  function sendScoreToServer(score) {
    const data = new FormData();
    data.append("score", score);
    const accuracy = calculateAccuracy();
    data.append("accuracy", accuracy);

    fetch("update_score.php", {
      method: "POST",
      body: data,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log("Score and accuracy updated successfully");
          getAndDisplayPersonalBest();
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  function resetGameState() {
    score = 0;
    totalClicks = 0;
    successfulClicks = 0;
    balls = [];
    startTime = null;
    isGameStarted = false;
    timerDisplay.textContent = (gameDuration / 1000).toFixed(1); // Reset timer display
    accuracyDisplay.textContent = "Accuracy: 0%"; // Reset accuracy display
  }

  startButton.addEventListener("click", () => {
    resetGameState();
    startCountdown();
  });

  createGridPoints();
  getAndDisplayPersonalBest();
});
