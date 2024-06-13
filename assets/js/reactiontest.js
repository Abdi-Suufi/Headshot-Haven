document.addEventListener("DOMContentLoaded", (event) => {
  let reactionCanvas = document.getElementById("reactionCanvas");
  let reactionContext = reactionCanvas.getContext("2d");
  let startReactionButton = document.getElementById("startReactionButton");
  let reactionTimeDisplay = 0;
  let reactionStartTime;
  let reactionTimeout;
  let gameActive = false;
  let personalBestReactionTime = Number.MAX_SAFE_INTEGER;

  // Load audio files
  const highScoreSound = new Audio("assets/audio/highscore.mp3");
  highScoreSound.volume = 0.8;

  function startReactionTest() {
    if (gameActive) return;

    gameActive = true;
    // Reset the canvas and timer
    reactionContext.fillStyle = "red";
    reactionContext.fillRect(0, 0, reactionCanvas.width, reactionCanvas.height);

    // Generate a random delay between 1 and 6 seconds
    let randomDelay = Math.random() * 5000 + 1000;
    reactionCanvas.removeEventListener("click", recordReactionTime);

    // Set a timeout to change the canvas color to green
    reactionTimeout = setTimeout(() => {
      reactionContext.fillStyle = "green";
      reactionContext.fillRect(
        0,
        0,
        reactionCanvas.width,
        reactionCanvas.height
      );
      reactionStartTime = new Date().getTime();
      reactionCanvas.addEventListener("click", recordReactionTime);
    }, randomDelay);
  }

  function recordReactionTime() {
    let reactionEndTime = new Date().getTime();
    let reactionTime = reactionEndTime - reactionStartTime;
    reactionTimeDisplay.textContent = reactionTime;

    // Remove event listener to prevent multiple clicks
    reactionCanvas.removeEventListener("click", recordReactionTime);

    // Send the reaction time score to the server
    sendReactionScoreToServer(reactionTime);

    // Display reaction time on canvas
    displayReactionTimeOnCanvas(reactionTime);
  }

  function sendReactionScoreToServer(score) {
    const data = new FormData();
    data.append("score", score);

    fetch("update_reaction_score.php", {
      method: "POST",
      body: data,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          console.log("Reaction speed test score updated successfully");
          getAndDisplayReactionBest();
        } else {
          console.error(
            "Error updating reaction speed test score:",
            data.message
          );
        }
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  }

  // Fetch and display the personal best reaction time from the server
  function getAndDisplayReactionBest() {
    fetch("get_reaction_score.php")
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const reactionBestDisplay = document.getElementById("reaction-Best");
          personalBestReactionTime = data.reactionScore;
          reactionBestDisplay.textContent = personalBestReactionTime; // Append "ms" for clarity
        } else {
          console.error("Failed to get reaction personal best:", data.message);
        }
      })
      .catch((error) => {
        console.error("Error fetching reaction personal best:", error);
      });
  }

  // Function to display the reaction time on the canvas
  function displayReactionTimeOnCanvas(reactionTime) {
    clearCanvas();
    reactionContext.font = "24px Arial";
    reactionContext.fillStyle = "white";
    reactionContext.textAlign = "center";
    if (reactionTime < personalBestReactionTime) {
      personalBestReactionTime = reactionTime;
      highScoreSound.play(); // Play high score sound if new high score
      reactionContext.fillText(
        `New High Score! ${reactionTime}ms`,
        reactionCanvas.width / 2,
        reactionCanvas.height / 2
      );
    } else {
      reactionContext.fillText(
        `${reactionTime} ms`,
        reactionCanvas.width / 2,
        reactionCanvas.height / 2
      );
    }
  }

  function resetGame() {
    gameActive = false; // Allow starting a new game
    reactionCanvas.removeEventListener("click", recordReactionTime);
    clearTimeout(reactionTimeout);

    // Clear the canvas
    clearCanvas();
  }

  function clearCanvas() {
    reactionContext.clearRect(
      0,
      0,
      reactionCanvas.width,
      reactionCanvas.height
    );
  }

  startReactionButton.addEventListener("click", () => {
    resetGame(); // Reset the game before starting a new one
    startReactionTest();
  });

  getAndDisplayReactionBest(); // Get personal best on page load
});
