<?php
session_start();
include('database.php');

// Check if admin is logged in
if (!isset($_SESSION['admin_id'])) {
    // Redirect or show an error if not an admin
    header("Location: signin.php"); 
    exit();
}

// Check if username parameter is provided
if (!isset($_GET['username'])) {
    // Redirect or show an error if username is missing
    header("Location: " . $_SERVER['HTTP_REFERER'] . "?error=missing_username"); 
    exit();
}

// Get the username to reset
$usernameToReset = filter_var($_GET['username'], FILTER_SANITIZE_STRING);

// Prepare and execute the update query
$updateQuery = "UPDATE aim_training_scores SET score = 0 WHERE username = ?";
$stmt = $conn->prepare($updateQuery);
$stmt->bind_param("s", $usernameToReset);

if ($stmt->execute()) {
    // User deleted successfully
    header("Location: " . $_SERVER['PHP_SELF']);
    exit();
} else {
    // Rollback the transaction if an error occurred
    $conn->rollback();

    // Error occurred while deleting the user
    header("Location: " . $_SERVER['PHP_SELF']);
    exit();
}

$stmt->close();
$conn->close();
?>
