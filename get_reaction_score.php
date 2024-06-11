<?php
session_start();
// Include database connection
include('database.php');

// Check if the user is logged in using the correct session variable
if (!isset($_SESSION['username'])) {
    // If not logged in, return an error response
    echo json_encode(array('success' => false, 'message' => 'User not logged in'));
    exit();
}


$username = $_SESSION['username'];

// Prepare and execute the SQL query to retrieve the reaction test score
$query = "SELECT score FROM reaction_test_scores WHERE username = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param('s', $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $score = $row['score'] ?? 0; // Current reaction test score, default to 0 if null
    
    echo json_encode(array('success' => true, 'reactionScore' => $score)); // Return reaction test score
} else {
    echo json_encode(array('success' => false, 'message' => 'User not found'));
}

$stmt->close();
$conn->close();
?>