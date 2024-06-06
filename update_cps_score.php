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
    $score = number_format(floatval($_POST['score']), 2, '.', '');
} else {
    echo json_encode(['success' => false, 'message' => 'Score not provided']);
    exit();
}

// Prepare and execute the update query for cps_scores
$updateQuery = "UPDATE cps_scores SET score = ? WHERE username = ?";
$stmt = $conn->prepare($updateQuery);
$stmt->bind_param("ds", $score, $username);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'CPS score updated successfully']);
} else {
    echo json_encode(['success' => false, 'message' => 'Error updating CPS score']);
}

$stmt->close();
$conn->close();
?>
