<nav class="navbar navbar-expand-md fixed-top" id="mainNav">
    <div class="container">
        <a class="navbar-brand" href="index.php">
            <img src="assets/img/headshot-haven-logo.svg" width="200" height="auto">
        </a>
        <button data-bs-toggle="collapse" class="navbar-toggler navbar-toggler-right" data-bs-target="#navbarResponsive" type="button" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation" value="Menu">
            <i class="fa fa-bars"></i>
        </button>
        <div class="collapse navbar-collapse" id="navbarResponsive">
            <ul class="navbar-nav ms-auto" id="nav-bg">
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="aimTrainingDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        Aim Training
                    </a>
                    <ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="aimTrainingDropdown">
                        <li><a class="dropdown-item" href="#aim-training">Aim Training</a></li>
                        <li><a class="dropdown-item" href="#leaderboard">Aim Leaderboard</a></li>
                    </ul>
                </li>
                <li class="nav-item"><a class="nav-link" href="#weapon-spec">Weapon Spec</a></li>
                <li class="nav-item"><a class="nav-link" href="#roulette">Roulette</a></li>
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="cpsDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        CPS
                    </a>
                    <ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="cpsDropdown">
                        <li><a class="dropdown-item" href="#cps">CPS</a></li>
                        <li><a class="dropdown-item" href="#cpsleaderboard">CPS Leaderboard</a></li>
                    </ul>
                </li>
                <?php if (isset($_SESSION['username'])): ?>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <?php echo htmlspecialchars($_SESSION['username']); ?>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="userDropdown">
                            <li><a class="dropdown-item" href="logout.php">Sign Out</a></li>
                        </ul>
                    </li>
                <?php else: ?>
                    <li class="nav-item"><a class="nav-link" href="signin.php">Sign In</a></li>
                    <li class="nav-item"><a class="nav-link" href="signup.php">Sign Up</a></li>
                <?php endif; ?>
            </ul>
        </div>
    </div>
</nav>