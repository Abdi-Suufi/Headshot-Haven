<?php
session_start();
?>
<!DOCTYPE html>
<html data-bs-theme="light" lang="en">

<head>
    <link rel="shortcut icon" type="image" href="assets/img/headshot-haven-logo.svg">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <title>Valorant Site</title>
    <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">
    <script src="https://kit.fontawesome.com/56e72382bd.js" crossorigin="anonymous"></script>
    <script src="assets/js/aimtraining.js"></script>
    <!--icon for few arrows im using-->
    <link rel="stylesheet" href="styles.css">
</head>

<body id="page-top" data-bs-spy="scroll" data-bs-target="#mainNav" data-bs-offset="77">
    <?php include('assets/navbar.php'); ?>
    <!--Top page-->
    <header class="masthead" style="background-image:url('assets/img/controller.jpg'); ">
        <div class="intro-body">
            <div class="container">
                <div class="row">
                    <div class="col-lg-8 mx-auto">
                        <a class="navbar-brand" href="index.php">
                            <img src="assets/img/headshot-haven.svg" width="700" height="auto" style="max-width: 100%; margin-bottom: 50px;">
                        </a><br>
                        <a class="btn btn-link btn-circle" style="color: rgb(255, 100, 66);" role="button" href="#aim-training"><span style="color: orange;"><i class="fa-solid fa-angle-down"></i></span></a>
                    </div>
                </div>
            </div>
        </div>
    </header>

    <section id="aim-training" class="text-center content-section masthead" style="background-image:url('assets/img/controller3.jpg');">
        <div class="container">
            <div class="row">
                <div class="map-clean text-center">
                    <h2>Score: <span id="score">0</span></h2>
                    <canvas id="gameCanvas" width="1000" height="500"></canvas><br>
                    <div class="d-flex justify-content-center">
                        <button id="resetButton" class="btn btn-warning">Reset</button>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <section class="text-center content-section masthead" id="leaderboard" style="background-image:url('assets/img/controller5.jpg');">
        <div class="container">
            <h2>Leaderboard</h2>
            <table class="table table-striped table-dark">
                <thead>
                    <tr>
                        <th>Player</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody id="leaderboardBody">
                    <!-- Leaderboard data will be dynamically populated here -->
                </tbody>
            </table>
        </div>
    </section>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            fetch('get_leaderboard.php')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const leaderboardBody = document.getElementById('leaderboardBody');
                        data.leaderboard.forEach(entry => {
                            const row = `<tr><td>${entry.username}</td><td>${entry.score}</td></tr>`;
                            leaderboardBody.innerHTML += row;
                        });
                    } else {
                        console.error('Failed to fetch leaderboard data:', data.message);
                    }
                })
                .catch(error => {
                    console.error('Error fetching leaderboard data:', error);
                });
        });
    </script>

    <script>
        document.addEventListener('DOMContentLoaded', function() {
            fetch('get_score.php')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Update the score element
                        document.getElementById('score').textContent = data.score;
                    } else {
                        console.error('Failed to fetch user score:', data.message);
                    }
                })
                .catch(error => {
                    console.error('Error fetching user score:', error);
                });
        });
    </script>

    <!-- Section to display table -->
    <section class="text-center content-section masthead" id="weapon-spec" style="height: 700px; background-image:url('assets/img/controller3.jpg');">
        <div class="container">
            <div class="col-lg-8 mx-auto">
                <h2 class="center-text">Weapon Specs</h2>
                <!-- Table for displaying data -->
                <div class="table-responsive">
                    <?php include('get_weapon_spec.php'); ?>
                </div>
            </div>
        </div>
    </section>

    <!-- Roulette wheel section -->
    <section class="text-center content-section masthead" id="roulette" style="background-image:url('assets/img/controller2.jpg')">
        <h2>time to sell? &#129315;</h2>
        <div class="container">
            <canvas id="canvas" width="380" height="380"></canvas><br>
            <input type="button" value="spin" class="btn btn-warning" id='spin' />
        </div>
        <script src="roulette.js"></script>
    </section>

    <?php include('assets/footer.php'); ?>

    <!--Bugs out if its in the head tag idk why-->
    <script src="assets/bootstrap/js/bootstrap.min.js"></script>
    <script src="assets/js/navbar.js"></script>
</body>

</html>