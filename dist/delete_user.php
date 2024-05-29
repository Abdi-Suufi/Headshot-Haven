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

// Get the user ID to delete
$userIdToDelete = filter_var($_GET['user_id'], FILTER_VALIDATE_INT);

// Validate user ID (ensure it's an integer)
if (!$userIdToDelete) {
    // Redirect or show an error if user_id is invalid
    header("Location: admin_panel.php?error=invalid_user_id"); 
    exit();
}

// Prepare and execute the delete query
$deleteQuery = "DELETE FROM users WHERE id = ?";
$stmt = $conn->prepare($deleteQuery);
$stmt->bind_param("i", $userIdToDelete);

if ($stmt->execute()) {
    // User deleted successfully
    header("Location: admin_panel.php?success=user_deleted"); 
    exit();
} else {
    // Error occurred while deleting the user
    header("Location: admin_panel.php?error=delete_failed"); 
    exit();
}