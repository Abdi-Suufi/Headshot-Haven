<?php
session_start();

// Check if the user is logged in using the correct session variable
if (!isset($_SESSION['username'])) {
    // If not logged in, return an error response
    echo json_encode(array('success' => false, 'message' => 'User not logged in'));
    exit();
}

// Include database connection
include('database.php');

$username = $_SESSION['username'];

// Prepare and execute the SQL query to retrieve the CPS score
$query = "SELECT score FROM cps_scores WHERE username = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param('s', $username);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $score = $row['score'] ?? 0; // Current CPS score, default to 0 if null
    
    echo json_encode(array('success' => true, 'cpsScore' => $score)); // Return CPS score
} else {
    echo json_encode(array('success' => false, 'message' => 'User not found'));
}

$stmt->close();
$conn->close();
?>