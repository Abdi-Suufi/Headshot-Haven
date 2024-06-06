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

// Get the current score for the user
$query = "SELECT score FROM cps_scores WHERE username = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param('s', $username);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$currentScore = $row['score'] ?? 0; // Default to 0 if no score is found

// Update the score only if the new score is higher
if ($newScore > $currentScore) {
    $query = "UPDATE cps_scores SET score = ? WHERE username = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('is', $newScore, $username);

    // Execute the query
    if ($stmt->execute()) {
        echo json_encode(array('success' => true));
    } else {
        echo json_encode(array('success' => false, 'message' => 'Failed to update score: ' . $conn->error));
    }
} else {
    echo json_encode(array('success' => false, 'message' => 'New score is not a high score'));
}

// Close the prepared statement and database connection
$stmt->close();
$conn->close();
?>
