<!DOCTYPE html>
<html data-bs-theme="light" lang="en">

<head>
    <link rel="shortcut icon" type="image" href="assets/img/headshot-haven-logo.svg">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <title>Sign Up</title>
    <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" href="styles.css">
    <link rel="stylesheet" href="assets/btn/styles.css">
</head>

<style>
    .masthead {
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        min-height: 100vh;
    }

    form.text-center {
        display: flex;
        flex-direction: column;
        align-items: center;
    }
</style>


<body id="page-top" data-bs-spy="scroll" data-bs-target="#mainNav" data-bs-offset="77">
    <!-- Navbar -->
    <?php include('assets/navbar2.php'); ?>

    <!-- Sign Up Form -->
    <section class="text-center content-section masthead" style="background-image:url('assets/img/testing.jpg');">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mx-auto">
                    <div class="col-lg-8 mx-auto">
                        <h2 style="background-color: rgb(24, 24, 24); width: 150px; margin: 0 auto; border-radius: 10px; color: rgb(255, 100, 66);" class="text-center">Sign Up</h2><br><br>
                        <?php
                        session_start();
                        if (isset($_SESSION['signup_error'])) {
                            echo '<div class="alert alert-danger">' . $_SESSION['signup_error'] . '</div>';
                            unset($_SESSION['signup_error']);
                        }
                        ?>
                        <form action="signup-handler.php" method="post" class="text-center">
                            <div class="form-group">
                                <label for="username">Username</label>
                                <input class="form-control" type="text" name="username" placeholder="Username" required>
                            </div>
                            <div class="form-group">
                                <label for="email">Email</label>
                                <input class="form-control" type="email" name="email" placeholder="Email" required>
                            </div>
                            <div class="form-group">
                                <label for="password">Password</label>
                                <input class="form-control" type="password" name="password" placeholder="Password" required>
                            </div>
                            <button class="btn-23" type="submit">
                                <span class="text">Sign-Up</span>
                                <span aria-hidden="" class="marquee">Sign-Up</span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <style>
        input {
            margin: 6px;
        }
    </style>
    <!-- Bootstrap and custom scripts -->
    <script src="assets/bootstrap/js/bootstrap.min.js"></script>
</body>

</html>