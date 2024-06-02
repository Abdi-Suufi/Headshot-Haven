document.addEventListener('DOMContentLoaded', (event) => {
    let cpsCount = 0;
    let cpsTimer;
    const cpsDuration = 5000; // 5 seconds in milliseconds
    const startCPSButton = document.getElementById('startCPSButton');
    const cpsCanvas = document.getElementById('cpsCanvas');
    const cpsCountElement = document.getElementById('cpsCount');
    const finalcps = document.getElementById('finalCPS');

    // Function to start the CPS test
    function startCPSTest() {
        cpsCount = 0;
        cpsCountElement.textContent = cpsCount;

        cpsCanvas.addEventListener('click', incrementCPS);

        // Stop the CPS test after the specified duration
        cpsTimer = setTimeout(() => {
            cpsCanvas.removeEventListener('click', incrementCPS);
            displayCPSScore();
        }, cpsDuration);
    }

    // Function to increment the CPS count
    function incrementCPS() {
        cpsCount++;
        cpsCountElement.textContent = cpsCount;
    }

    // Function to display the CPS score at the end
    function displayCPSScore() {
        finalcps.textContent = cpsCount / (cpsDuration / 1000);
    }

    // Event listener for the start button
    startCPSButton.addEventListener('click', startCPSTest);
});