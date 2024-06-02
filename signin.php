<!DOCTYPE html>
<html data-bs-theme="light" lang="en">

<head>
    <link rel="shortcut icon" type="image" href="assets/img/headshot-haven-logo.svg">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <title>Sign In</title>
    <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" href="styles.css">
</head>

<body id="page-top" data-bs-spy="scroll" data-bs-target="#mainNav" data-bs-offset="77">
    <!-- Navbar -->
    <?php include('assets/navbar2.php'); ?>

    <!-- Sign In Form -->
    <section class="text-center content-section masthead">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mx-auto">
                    <h2>Sign In</h2>
                    <?php
                    session_start();
                    if (isset($_SESSION['signin_error'])) {
                        echo '<div class="alert alert-danger">' . $_SESSION['signin_error'] . '</div>';
                        unset($_SESSION['signin_error']);
                    }
                    ?>
                    <form action="signin-handler.php" method="POST">
                        <div class="form-group">
                            <label for="username">Username</label>
                            <input type="text" class="form-control" id="username" name="username" placeholder="Username" required>
                        </div>
                        <div class="form-group">
                            <label for="password">Password</label>
                            <input type="password" class="form-control" id="password" name="password" placeholder="Password" required>
                        </div>
                        <div class="form-check">
                            <input type="checkbox" class="form-check-input" id="is_admin" name="is_admin" value="1">
                            <label class="form-check-label" for="is_admin" style="float: left;">Admin Login</label>
                            <button type="submit" class="btn btn-dark">Sign In</button>
                        </div>
                    </form>
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