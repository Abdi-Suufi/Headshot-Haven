<?php
// Start the session
session_start();

include('database.php');
require 'Assets/PHPMailer/src/PHPMailer.php';
require 'Assets/PHPMailer/src/SMTP.php';
require 'Assets/PHPMailer/src/Exception.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

// Process sign up form data
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST["username"];
    $email = $_POST["email"];
    $password = $_POST["password"];

    // Check if username or email already exists
    $checkQuery = "SELECT * FROM users WHERE username = ? OR email = ?";
    $stmt_check = $conn->prepare($checkQuery);
    if (!$stmt_check) {
        $_SESSION['signup_error'] = "Error preparing statement: " . $conn->error;
        header("Location: signup.php");
        exit();
    }
    $stmt_check->bind_param("ss", $username, $email);
    $stmt_check->execute();
    $result = $stmt_check->get_result();

    if ($result->num_rows > 0) {
        // Username or email already exists
        $_SESSION['signup_error'] = "Username or email already taken. Please try another.";
        $stmt_check->close();
        header("Location: signup.php");
        exit();
    }

    // Hash the password for security
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Prepare and bind the SQL statement to insert into users table
    $insertQuery = "INSERT INTO users (username, email, password) VALUES (?, ?, ?)";
    $stmt_insert = $conn->prepare($insertQuery);
    if (!$stmt_insert) {
        $_SESSION['signup_error'] = "Error preparing statement: " . $conn->error;
        header("Location: signup.php");
        exit();
    }
    $stmt_insert->bind_param("sss", $username, $email, $hashed_password);

    // Execute the statement to insert user
    if ($stmt_insert->execute()) {
        // Get the last inserted ID (the new user's ID)
        $userId = $stmt_insert->insert_id;

        // Insert default score for the new user into aim_training_scores table
        $insertAimTrainingScoreQuery = "INSERT INTO aim_training_scores (username, score, accuracy, created_at) VALUES (?, 0, 0, NOW())";
        $stmt_score_aim = $conn->prepare($insertAimTrainingScoreQuery);
        if (!$stmt_score_aim) {
            $_SESSION['signup_error'] = "Error preparing statement: " . $conn->error;
            header("Location: signup.php");
            exit();
        }
        $stmt_score_aim->bind_param("s", $username);
        $stmt_score_aim->execute();

        // Insert default score for the new user into cps_scores table
        $insertCpsScoreQuery = "INSERT INTO cps_scores (username, score) VALUES (?, 0)";
        $stmt_score_cps = $conn->prepare($insertCpsScoreQuery);
        if (!$stmt_score_cps) {
            $_SESSION['signup_error'] = "Error preparing statement: " . $conn->error;
            header("Location: signup.php");
            exit();
        }
        $stmt_score_cps->bind_param("s", $username);
        $stmt_score_cps->execute();

        // Insert default score for the new user into reaction_test_scores table
        $insertReactionScoreQuery = "INSERT INTO reaction_test_scores (username, score) VALUES (?, null)";
        $stmt_score_reaction = $conn->prepare($insertReactionScoreQuery);
        if (!$stmt_score_reaction) {
            $_SESSION['signup_error'] = "Error preparing statement: " . $conn->error;
            header("Location: signup.php");
            exit();
        }
        $stmt_score_reaction->bind_param("s", $username);
        $stmt_score_reaction->execute();

        // Generate a unique token and expiry time in UTC
        $token = bin2hex(random_bytes(16));
        $dateTime = new DateTime();
        $dateTime->modify('+24 hour');
        $tokenExpiry = $dateTime->format('Y-m-d H:i:s');
        
        // Update the token and expiry time
        $updateTokenQuery = "UPDATE users SET token = ?, token_expiry = ? WHERE id = ?";
        $stmt_token = $conn->prepare($updateTokenQuery);
        if (!$stmt_token) {
            $_SESSION['signup_error'] = "Error preparing statement: " . $conn->error;
            header("Location: signup.php");
            exit();
        }
        $stmt_token->bind_param("ssi", $token, $tokenExpiry, $userId);
        if (!$stmt_token->execute()) {
            $_SESSION['signup_error'] = "Error updating token: " . $stmt_token->error;
            header("Location: signup.php");
            exit();
        }

        // Send confirmation email
        $mail = new PHPMailer(true);
        try {
            // Server settings
            $mail->isSMTP();
            $mail->Host = 'smtp.gmail.com';
            $mail->SMTPAuth = true;
            $mail->Username = 'headshothaven.team@gmail.com'; // Your Gmail address
            $mail->Password = 'squg sldk iowm cwwb'; // Your Gmail password or app password
            $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
            $mail->Port = 587;

            // Recipients
            $mail->setFrom('headshothaven.team@gmail.com', 'Headshot Haven Team');
            $mail->addAddress($email, $username);

            // Content
            $mail->isHTML(true);
            $mail->Subject = 'Confirm Your Email Address';
            $mail->Body = 'Thank you for signing up! Please click the link below to confirm your email address:<br><br><a href="http://localhost:3000/confirm.php?email=' . $email . '&token=' . $token . '">Confirm Email</a>';

            // Send the email
            if ($mail->send()) {
                $_SESSION['signup_success'] = 'Registration successful! Please check your email to confirm your account.';
                header('Location: signup-success.php'); // Redirect to a success page
            } else {
                $_SESSION['signup_error'] = 'Registration successful, but the email could not be sent.';
                header('Location: signup.php'); // Redirect back to the sign-up page
            }
        } catch (Exception $e) {
            $_SESSION['signup_error'] = 'Mailer Error: ' . $mail->ErrorInfo;
            header('Location: signup.php'); // Redirect back to the sign-up page
        }

        // Set session variables with username and user_id
        $_SESSION['username'] = $username;
        $_SESSION['user_id'] = $userId;

        // Close all prepared statements
        $stmt_check->close();
        $stmt_insert->close();
        $stmt_score_aim->close();
        $stmt_score_cps->close();
        $stmt_score_reaction->close();
        $stmt_token->close();

        // Close the database connection
        $conn->close();

        // Redirect back to index.php
        header("Location: index.php");
        exit();
    } else {
        $_SESSION['signup_error'] = "Error: " . $stmt_insert->error;
        header("Location: signup.php");
        exit();
    }
}
