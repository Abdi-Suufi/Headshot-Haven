<?php
session_start();

// Check if the user is logged in using the correct session variable
if (!isset($_SESSION['user_id'])) {
    // If not logged in, return an error response
    echo json_encode(array('success' => false, 'message' => 'User not logged in'));
    exit();
}

// Include database connection
include('database.php');

// Retrieve parameters
$userId = $_SESSION['user_id'];  // Use the correct session variable name
$newScore = $_POST['score'];

// Get the current score for the user
$query = "SELECT score FROM users WHERE id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param('i', $userId);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$currentScore = $row['score'];

// Update the score only if the new score is higher
if ($newScore > $currentScore) {
    $query = "UPDATE users SET score = ? WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ii', $newScore, $userId);

    // Execute the query
    if ($stmt->execute()) {
        echo json_encode(array('success' => true));
    } else {
        echo json_encode(array('success' => false, 'message' => 'Failed to update score: ' . $conn->error));
    }
} else {
    echo json_encode(array('success' => false, 'message' => 'New score is not a high score'));
}

// Output session ID for debugging
echo "Session ID: " . session_id() . "<br>";

// Close the prepared statement and database connection
$stmt->close();
$conn->close();
?>