<?php
session_start();
include('database.php');

// Check if the user is logged in
if (!isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit();
}

// Get the username from the session
$username = $_SESSION['username'];

// Get the score from the POST request and ensure it is a float with two decimal places
if (isset($_POST['score'])) {
    $newScore = number_format(floatval($_POST['score']), 2, '.', '');
} else {
    echo json_encode(['success' => false, 'message' => 'Score not provided']);
    exit();
}

// Retrieve the current score for the user
$query = "SELECT score FROM cps_scores WHERE username = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$currentScore = $row['score'] ?? 0.0; // Default to 0.0 if no score is found

// Update the score only if the new score is higher
if ($newScore > $currentScore) {
    $updateQuery = "UPDATE cps_scores SET score = ? WHERE username = ?";
    $stmt = $conn->prepare($updateQuery);
    $stmt->bind_param("ds", $newScore, $username);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'CPS score updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error updating CPS score: ' . $conn->error]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'New score is not a high score']);
}

$stmt->close();
$conn->close();
