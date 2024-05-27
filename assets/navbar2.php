<?php 
session_start()
?>
<script src="https://kit.fontawesome.com/56e72382bd.js" crossorigin="anonymous"></script>
<nav class="navbar navbar-expand-md fixed-top" id="mainNav">
    <div class="container">
        <a class="navbar-brand" href="index.php">
            <img src="assets/img/fix ur.svg" width="50" height="auto">
        </a>
        <button data-bs-toggle="collapse" class="navbar-toggler navbar-toggler-right" data-bs-target="#navbarResponsive" type="button" aria-controls="navbarResponsive" aria-expanded="false" aria-label="Toggle navigation" value="Menu">
            <i class="fa fa-bars"></i>
        </button>
        <div class="collapse navbar-collapse" id="navbarResponsive">
            <ul class="navbar-nav ms-auto">
                <li class="nav-item nav-link"><a class="nav-link" href="signup.php">SignUp</a></li>
                <li class="nav-item nav-link"><a class="nav-link" href="signin.php">SignIn</a></li>
            </ul>
        </div>
    </div>
</nav>
