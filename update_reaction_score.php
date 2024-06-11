<?php
session_start();
include('database.php');

if (!isset($_SESSION['username'])) {
    echo json_encode(['success' => false, 'message' => 'User not logged in']);
    exit();
}

$username = $_SESSION['username'];
$newScore = number_format(floatval($_POST['score']), 2, '.', ''); // Ensure proper formatting

// Fetch the current best score
$query = "SELECT score FROM reaction_test_scores WHERE username = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("s", $username);
$stmt->execute();
$result = $stmt->get_result();
$row = $result->fetch_assoc();
$currentBestScore = $row['score'] ?? null; // Handle case where score might be null

// Update only if the new score is an improvement
if ($currentBestScore === null || $newScore < $currentBestScore) {
    $updateQuery = "UPDATE reaction_test_scores SET score = ? WHERE username = ?";
    $stmt = $conn->prepare($updateQuery);
    $stmt->bind_param("ds", $newScore, $username);

    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Reaction time updated successfully']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Error updating reaction time']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Not a new best time']);
}

$stmt->close();
$conn->close();
?>
