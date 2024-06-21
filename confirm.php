<!DOCTYPE html>
<html data-bs-theme="light" lang="en">

<head>
    <link rel="shortcut icon" type="image" href="assets/img/headshot-haven-logo.svg">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <title>Email Confirmation</title>
    <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" href="styles.css">
</head>

<body>
    <!-- Navbar -->
    <?php include('assets/navbar2.php'); ?>

    <!-- Confirmation Section -->
    <section class="content-section masthead" style="background-image:url('assets/img/testing.jpg'); min-height: 100vh;">
        <div class="container">
            <div class="row">
                <div class="col-lg-8 mx-auto">
                    <div class="card mt-5">
                        <div class="card-body">
                            <?php
                            require 'database.php'; // Adjust the path as needed

                            if (isset($_GET['email']) && isset($_GET['token'])) {
                                $email = $conn->real_escape_string($_GET['email']);
                                $token = $conn->real_escape_string($_GET['token']);

                                // Verify the token and activate the account
                                $query = "SELECT * FROM users WHERE email='$email' AND token='$token' AND token_expiry > NOW()";

                                $result = $conn->query($query);

                                if ($result->num_rows > 0) {
                                    $query = "UPDATE users SET is_active=1, token=NULL, token_expiry=NULL WHERE email='$email'";
                                    if ($conn->query($query) === TRUE) {
                                        echo '<h2 class="card-title text-center">Account Confirmed!</h2>';
                                        echo '<p class="card-text text-center">Your account has been successfully confirmed.</p>';
                                    } else {
                                        echo '<p class="card-text text-center text-danger">Error updating record: ' . $conn->error . '</p>';
                                    }
                                } else {
                                    echo '<p class="card-text text-center text-danger">Invalid or expired token.</p>';
                                }
                            } else {
                                echo '<p class="card-text text-center text-danger">Email or token not provided.</p>';
                            }
                            ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>

    <!-- Bootstrap and custom scripts -->
    <script src="assets/bootstrap/js/bootstrap.min.js"></script>
</body>

</html>