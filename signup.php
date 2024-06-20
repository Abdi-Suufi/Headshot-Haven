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
                        <form action="signup-handler.php" method="post" class="text-center" onsubmit="return validateForm()">
                            <div class="form-group">
                                <label for="username">Username</label>
                                <input class="form-control" type="text" name="username" id="username" placeholder="Username" required>
                            </div>
                            <div class="form-group">
                                <label for="email">Email</label>
                                <input class="form-control" type="email" name="email" id="email" placeholder="Email" required>
                            </div>
                            <div class="form-group">
                                <label for="confirm_email">Confirm Email</label>
                                <input class="form-control" type="email" name="confirm_email" id="confirm_email" placeholder="Confirm Email" required>
                            </div>
                            <div class="form-group">
                                <label for="password">Password</label>
                                <input class="form-control" type="password" name="password" id="password" placeholder="Password" required>
                            </div>
                            <div class="form-group">
                                <label for="confirm_password">Confirm Password</label>
                                <input class="form-control" type="password" name="confirm_password" id="confirm_password" placeholder="Confirm Password" required>
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
    <script>
        function validateForm() {
            var email = document.getElementById("email").value;
            var confirmEmail = document.getElementById("confirm_email").value;
            var password = document.getElementById("password").value;
            var confirmPassword = document.getElementById("confirm_password").value;

            if (email !== confirmEmail) {
                alert("Emails do not match!");
                return false;
            }

            if (password !== confirmPassword) {
                alert("Passwords do not match!");
                return false;
            }

            return true;
        }
    </script>
    <style>
        input {
            margin: 6px;
        }
    </style>
    <!-- Bootstrap and custom scripts -->
    <script src="assets/bootstrap/js/bootstrap.min.js"></script>
</body>

</html>