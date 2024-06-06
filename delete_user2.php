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

try {
    // Begin a transaction
    $conn->begin_transaction();

    // Prepare and execute the delete query for cps_scores
    $deleteCpsScoresQuery = "DELETE FROM cps_scores WHERE username = ?";
    $stmt = $conn->prepare($deleteCpsScoresQuery);
    $stmt->bind_param("s", $usernameToDelete);
    $stmt->execute();
    $stmt->close();

    // Prepare and execute the delete query for aim_training_scores
    $deleteAimTrainingScoresQuery = "DELETE FROM aim_training_scores WHERE username = ?";
    $stmt = $conn->prepare($deleteAimTrainingScoresQuery);
    $stmt->bind_param("s", $usernameToDelete);
    $stmt->execute();
    $stmt->close();

    // Prepare and execute the delete query for users
    $deleteUserQuery = "DELETE FROM users WHERE username = ?";
    $stmt = $conn->prepare($deleteUserQuery);
    $stmt->bind_param("s", $usernameToDelete);
    $stmt->execute();
    $stmt->close();

    // Commit the transaction
    $conn->commit();

    // User deleted successfully
    header("Location: admin_panel2.php?success=user_deleted");
    exit();
} catch (Exception $e) {
    // Rollback the transaction if an error occurred
    $conn->rollback();

    // Error occurred while deleting the user
    header("Location: admin_panel2.php?error=delete_failed");
    exit();
}

$conn->close();
?>
