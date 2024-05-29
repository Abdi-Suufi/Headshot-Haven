<?php
session_start();

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(array('success' => false, 'message' => 'User not logged in'));
    exit();
}

include('database.php');

$user_id = $_SESSION['user_id'];

// Prepare and execute the SQL query to retrieve the score (which is the personal best)
$query = "SELECT score FROM users WHERE id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $score = $row['score'] ?? 0; // Current score (also personal best), default to 0 if null
    
    echo json_encode(array('success' => true, 'personalBest' => $score)); // Return score as personalBest
} else {
    echo json_encode(array('success' => false, 'message' => 'User not found'));
}

$stmt->close();
$conn->close();
?>
