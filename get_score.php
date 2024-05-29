<?php
session_start();

// Check if the user is logged in
if (!isset($_SESSION['user_id'])) {
    // If not logged in, return an error response
    echo json_encode(array('success' => false, 'message' => 'User not logged in'));
    exit();
}

// Include database connection
include('database.php');

// Retrieve parameters
$user_id = $_SESSION['user_id'];

// Prepare and execute the SQL query to retrieve the score
$query = "SELECT score FROM users WHERE id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param('i', $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    // User found, return the score
    $row = $result->fetch_assoc();
    $score = $row['score'];
    if ($score === null) {
        // Handle null score here (e.g., set a default score)
        $score = 0; // Default score
    }
    echo json_encode(array('success' => true, 'score' => $score));
} else {
    // User not found, return an error response
    echo json_encode(array('success' => false, 'message' => 'User not found'));
}

// Close the database connection
$stmt->close();
$conn->close();
?>
