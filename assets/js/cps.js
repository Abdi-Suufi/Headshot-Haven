document.addEventListener('DOMContentLoaded', (event) => {
    let cpsCount = 0;
    let cpsTimer;
    let startTime;
    let isCPSStarted = false;
    let countdown = 3;
    const cpsDuration = 10 * 1000; // 10 seconds in milliseconds
    const startCPSButton = document.getElementById('startCPSButton');
    const cpsCanvas = document.getElementById('cpsCanvas');
    const cpsCountElement = document.getElementById('cpsCount');
    const finalCPSElement = document.getElementById('finalCPS');
    const cpsTimerElement = document.getElementById('cpsTimer');
    const ctx = cpsCanvas.getContext('2d');

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
                cpsCanvas.addEventListener('click', incrementCPS);
                startTime = Date.now();
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
    function displayCPSScore() {
        cpsCanvas.removeEventListener('click', incrementCPS);
        finalCPSElement.textContent = (cpsCount / (cpsDuration / 1000)).toFixed(2);
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
            displayCPSScore();
            startCPSButton.disabled = false;
            isCPSStarted = false;
        }
    }

    // Event listener for the start button
    startCPSButton.addEventListener('click', startCPSTest);
});