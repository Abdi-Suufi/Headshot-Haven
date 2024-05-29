<?php
session_start();
include('database.php');

// Check if admin is logged in
if (!isset($_SESSION['admin_id'])) {
    // Redirect or show an error if not an admin
    header("Location: signin.php"); 
    exit();
}

// Check if user_id parameter is provided
if (!isset($_GET['user_id'])) {
    // Redirect or show an error if user_id is missing
    header("Location: admin_panel.php?error=missing_user_id"); 
    exit();
}

// Get the user ID to reset
$userIdToReset = filter_var($_GET['user_id'], FILTER_VALIDATE_INT);

// Validate user ID (ensure it's an integer)
if (!$userIdToReset) {
    // Redirect or show an error if user_id is invalid
    header("Location: admin_panel.php?error=invalid_user_id"); 
    exit();
}

// Prepare and execute the update query
$updateQuery = "UPDATE users SET score = 0 WHERE id = ?";
$stmt = $conn->prepare($updateQuery);
$stmt->bind_param("i", $userIdToReset);

if ($stmt->execute()) {
    // Score reset successfully
    header("Location: admin_panel.php?success=score_reset"); 
    exit();
} else {
    // Error occurred while resetting the score
    header("Location: admin_panel.php?error=reset_failed"); 
    exit();
}