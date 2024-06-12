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
$username = $_SESSION['username']; // Retrieve username from session
$newScore = $_POST['score'];
$newAccuracy = $_POST['accuracy']; // Retrieve accuracy from POST data

// Get the current score and accuracy for the user
$query = "SELECT score, accuracy FROM aim_training_scores WHERE username = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param('s', $username);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$currentScore = $row['score'] ?? 0; // Default to 0 if no score is found
$currentAccuracy = $row['accuracy'] ?? 0.0; // Default to 0.0 if no accuracy is found

// Update the score and accuracy only if the new score is higher
if ($newScore > $currentScore) {
    $query = "UPDATE aim_training_scores SET score = ?, accuracy = ? WHERE username = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('ids', $newScore, $newAccuracy, $username);

    // Execute the query
    if ($stmt->execute()) {
        echo json_encode(array('success' => true));
    } else {
        echo json_encode(array('success' => false, 'message' => 'Failed to update score and accuracy: ' . $conn->error));
    }
} else {
    echo json_encode(array('success' => false, 'message' => 'New score is not a high score'));
}

// Close the prepared statement and database connection
$stmt->close();
$conn->close();
?>
