<nav class="navbar navbar-expand-md fixed-top" id="mainNav">
    <div class="container">
        <a class="navbar-brand" href="index.php">
            <img src="assets/img/navbar-logo.svg" width="200" height="auto">
        </a>
        <button data-bs-toggle="collapse" class="navbar-toggler navbar-toggler-right" data-bs-target="#navbarResponsive" type="button" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation" value="Menu">
            <i class="fa fa-bars"></i>
        </button>
        <div class="collapse navbar-collapse" id="navbarResponsive" >
            <ul class="navbar-nav ms-auto" >
                <li class="nav-item"><a class="nav-link" href="#aim-training" id="navbar-btn">Aim Training</a></li>
                <li class="nav-item"><a class="nav-link" href="#leaderboard">Leaderboard</a></li>
                <li class="nav-item"><a class="nav-link" href="#weapon-spec">Weapon Spec</a></li>
                <?php if (isset($_SESSION['username'])): ?>
                    <li class="nav-item dropdown">
                        <a class="nav-link dropdown-toggle" href="#" id="userDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <?php echo htmlspecialchars($_SESSION['username']); ?>
                        </a>
                        <ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="userDropdown">
                            <li><a class="dropdown-item" href="logout.php">Log Out</a></li>
                        </ul>
                    </li>
                <?php else: ?>
                    <li class="nav-item"><a class="nav-link" href="signin.php" >Sign In</a></li>
                    <li class="nav-item"><a class="nav-link" href="signup.php" >Sign Up</a></li>
                <?php endif; ?>
            </ul>
        </div>
    </div>
</nav>
