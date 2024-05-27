<?php
session_start();

// Check if the user is logged in
if (!isset($_SESSION['id'])) {
    // If not logged in, return an error response
    echo json_encode(array('success' => false, 'message' => 'User not logged in'));
    exit();
}

// Include database connection
include('database.php');

// Retrieve parameters
$user_id = $_SESSION['id'];
$new_score = $_POST['score'];

// Prepare and execute the SQL query to update the score
$query = "UPDATE users SET score = ? WHERE id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param('ii', $new_score, $user_id);

// Execute the query
if ($stmt->execute()) {
    // Score updated successfully
    echo json_encode(array('success' => true));
} else {
    // Error occurred while updating the score
    echo json_encode(array('success' => false, 'message' => 'Failed to update score: ' . $conn->error));
}

// Close the prepared statement and database connection
$stmt->close();
$conn->close();
?>
