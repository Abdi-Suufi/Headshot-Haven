<!DOCTYPE html>
<html data-bs-theme="light" lang="en">

<head>
    <link rel="shortcut icon" type="image" href="assets/img/fix ur.svg">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <title>Sign Up</title>
    <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" href="styles.css"> <!-- Import your custom styles -->
</head>

<body id="page-top" data-bs-spy="scroll" data-bs-target="#mainNav" data-bs-offset="77">
    <!-- Navbar -->
    <?php include('assets/navbar.php'); ?>

    <!-- Sign Up Form -->
    <section class="text-center content-section masthead">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mx-auto">
                    <h2>Sign Up</h2>
                    <?php
                    session_start();
                    if (isset($_SESSION['signup_error'])) {
                        echo '<div class="alert alert-danger">' . $_SESSION['signup_error'] . '</div>';
                        unset($_SESSION['signup_error']);
                    }
                    ?>
                    <form action="signup-handler.php" method="post">
                        <div class="form-group">
                            <input class="form-control" type="text" name="username" placeholder="Username" required>
                        </div>
                        <div class="form-group">
                            <input class="form-control" type="email" name="email" placeholder="Email" required>
                        </div>
                        <div class="form-group">
                            <input class="form-control" type="password" name="password" placeholder="Password" required>
                        </div>
                        <button type="submit" class="btn btn-dark">Sign Up</button>
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
