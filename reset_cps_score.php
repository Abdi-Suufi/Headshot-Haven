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
    header("Location: admin_panel2.php?error=missing_username"); 
    exit();
}

// Get the username to reset
$usernameToReset = filter_var($_GET['username'], FILTER_SANITIZE_STRING);

// Prepare and execute the update query
$updateQuery = "UPDATE cps_scores SET score = 0 WHERE username = ?";
$stmt = $conn->prepare($updateQuery);
$stmt->bind_param("s", $usernameToReset);

if ($stmt->execute()) {
    // Score reset successfully
    header("Location: admin_panel2.php?success=score_reset"); 
    exit();
} else {
    // Error occurred while resetting the score
    header("Location: admin_panel2.php?error=reset_failed"); 
    exit();
}

$stmt->close();
$conn->close();
?>
