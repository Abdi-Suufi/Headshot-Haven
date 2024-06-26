document.addEventListener("DOMContentLoaded", (event) => {
  let cpsCount = 0;
  let cpsTimer;
  let startTime;
  let isCPSStarted = false;
  let countdown = 3;
  const cpsDuration = 10 * 1000; // 10 seconds in milliseconds
  const startCPSButton = document.getElementById("startCPSButton");
  const cpsCanvas = document.getElementById("cpsCanvas");
  const cpsCountElement = document.getElementById("cpsCount");
  const finalCPSElement = document.getElementById("finalCPS");
  const cpsTimerElement = document.getElementById("cpsTimer");
  const ctx = cpsCanvas.getContext("2d");

  // Load high score audio
  const highScoreSound = new Audio("assets/audio/highscore.mp3");
  highScoreSound.volume = 0.8; // Adjust volume as needed

  let personalBest = 0; // Store the current personal best CPS

  // Function to start the CPS test
  function startCPSTest() {
    cpsCount = 0;
    cpsCountElement.textContent = cpsCount;
    finalCPSElement.textContent = 0;
    cpsTimerElement.textContent = (cpsDuration / 1000).toFixed(1);
    startCPSButton.disabled = true;
    startCountdown();
  }

  // Function to start the countdown
  function startCountdown() {
    countdown = 3;
    const countdownInterval = setInterval(() => {
      clearCanvas();
      ctx.font = "30px Arial";
      ctx.fillStyle = "white";
      ctx.fillText(countdown, cpsCanvas.width / 2 - 10, cpsCanvas.height / 2);
      countdown--;

      if (countdown < 0) {
        clearInterval(countdownInterval);
        isCPSStarted = true;
        clearCanvas(); // Clear the canvas after countdown
        startTime = Date.now();
        cpsCanvas.addEventListener("click", incrementCPS); // Add the event listener back here
        requestAnimationFrame(cpsGameLoop);
      }
    }, 1000);
  }

  // Function to increment the CPS count
  function incrementCPS() {
    cpsCount++;
    cpsCountElement.textContent = cpsCount;
  }

  // Function to display the CPS score at the end
  function displayCPSScore(finalCPS) {
    cpsCanvas.removeEventListener("click", incrementCPS);
    if (finalCPS > personalBest) {
      personalBest = finalCPS;
      playHighScoreAudio();
      displayHighScoreMessage(finalCPS);
    } else {
      displayFinalScoreOnCanvas(finalCPS);
    }
    sendCpsScoreToServer(finalCPS); // Send CPS score to server
  }

  // Function to play high score audio
  function playHighScoreAudio() {
    highScoreSound.currentTime = 0;
    highScoreSound.play();
  }

  // Function to display high score message on the canvas
  function displayHighScoreMessage(finalCPS) {
    clearCanvas();
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(
      `New High Score: ${finalCPS} CPS`,
      cpsCanvas.width / 2 - 150,
      cpsCanvas.height / 2
    );
  }

  // Function to display final score on the canvas
  function displayFinalScoreOnCanvas(finalCPS) {
    clearCanvas();
    ctx.font = "30px Arial";
    ctx.fillStyle = "white";
    ctx.fillText(
      `Game Over. Your Score: ${finalCPS} CPS`,
      cpsCanvas.width / 2 - 150,
      cpsCanvas.height / 2
    );
  }

  // Function to send CPS score to server
  function sendCpsScoreToServer(score) {
    const data = new FormData();
    data.append("score", score);

    fetch("update_cps_score.php", {
      method: "POST",
      body: data,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log("CPS score updated successfully");
          getAndDisplayPersonalBest();
        } else {
          console.error("Error updating CPS score:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Fetch and display the personal best CPS from the server
  function getAndDisplayPersonalBest() {
    fetch("get_cps_score.php")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          personalBest = data.personalBest;
          const personalBestDisplay = document.getElementById("personalBest");
          personalBestDisplay.textContent = personalBest;
        } else {
          console.error("Failed to get personal best:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error fetching personal best:", error);
      });
  }

  // Function to clear canvas
  function clearCanvas() {
    ctx.clearRect(0, 0, cpsCanvas.width, cpsCanvas.height);
  }

  // Main CPS game loop
  function cpsGameLoop() {
    const elapsedTime = Date.now() - startTime;
    const timeLeft = Math.max((cpsDuration - elapsedTime) / 1000, 0).toFixed(1);

    cpsTimerElement.textContent = timeLeft;

    if (elapsedTime < cpsDuration) {
      requestAnimationFrame(cpsGameLoop);
    } else {
      const finalCPS = (cpsCount / (cpsDuration / 1000)).toFixed(2);
      displayCPSScore(finalCPS);
      startCPSButton.disabled = false;
      isCPSStarted = false;
    }
  }

  // Event listener for the start button
  startCPSButton.addEventListener("click", startCPSTest);

  // Get and display personal best on page load
  getAndDisplayPersonalBest();
});
