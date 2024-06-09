document.getElementById('crosshair-upload').addEventListener('change', function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const cursorUrl = e.target.result;
            document.getElementById('gameCanvas').style.cursor = `url(${cursorUrl}), crosshair`;
        };
        reader.readAsDataURL(file);
    }
});