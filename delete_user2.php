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

// Get the username to delete
$usernameToDelete = filter_var($_GET['username'], FILTER_SANITIZE_STRING);

// Prepare and execute the delete query for aim_training_scores
$deleteScoresQuery = "DELETE FROM cps_scores WHERE username = ?";
$stmt = $conn->prepare($deleteScoresQuery);
$stmt->bind_param("s", $usernameToDelete);
$stmt->execute();

// Prepare and execute the delete query for users
$deleteUserQuery = "DELETE FROM users WHERE username = ?";
$stmt = $conn->prepare($deleteUserQuery);
$stmt->bind_param("s", $usernameToDelete);

if ($stmt->execute()) {
    // User deleted successfully
    header("Location: admin_panel2.php?success=user_deleted"); 
    exit();
} else {
    // Error occurred while deleting the user
    header("Location: admin_panel2.php?error=delete_failed"); 
    exit();
}

$stmt->close();
$conn->close();
?>
