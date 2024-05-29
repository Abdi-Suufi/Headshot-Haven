<?php
session_start();

include('database.php');

// Retrieve form data
$username = $_POST['username'];
$password = $_POST['password'];
$isAdminLogin = isset($_POST['is_admin']) && $_POST['is_admin'] == 1;

// Determine the table to query
$table = $isAdminLogin ? 'admins' : 'users';

// Prepare and bind
$stmt = $conn->prepare("SELECT id, username, password FROM $table WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->store_result();

// Check if user exists
if ($stmt->num_rows > 0) {
    $stmt->bind_result($id, $username, $hashed_password);
    $stmt->fetch();

    // Verify password
    if (password_verify($password, $hashed_password)) {
        // Start session and store user data based on user type
        if ($isAdminLogin) {
            $_SESSION['admin_id'] = $id;
            $_SESSION['admin_username'] = $username;

            // Redirect to admin_panel.php
            header("Location: admin_panel.php");
            exit;
        } else {
            $_SESSION['user_id'] = $id;
            $_SESSION['username'] = $username;

            // Redirect to index.php
            header("Location: index.php");
            exit;
        }
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