<?php
session_start();

include('database.php');

// Retrieve form data
$username = $_POST['username'];
$password = $_POST['password'];

// Prepare and bind
$stmt = $conn->prepare("SELECT id, username, password FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();

// Check if user exists
if ($stmt->num_rows > 0) {
    $stmt->bind_result($id, $username, $hashed_password);
    $stmt->fetch();

    // Verify password
    if (password_verify($password, $hashed_password)) {
        // Start session and store user data
        $_SESSION['user_id'] = $id;
        $_SESSION['username'] = $username;

        // Redirect to index.php
        header("Location: index.php");
        exit;
    } else {
        // Invalid password
        $_SESSION['signin_error'] = "Invalid username or password.";
        header("Location: signin.php");
        exit;
    }
} else {
    // Invalid username
    $_SESSION['signin_error'] = "Invalid username or password.";
    header("Location: signin.php");
    exit;
}

$stmt->close();
$conn->close();
?>
