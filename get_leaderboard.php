<?php
// Include database connection
include('database.php');

// Query to fetch leaderboard data (username and score)
$query = "SELECT username, score FROM users ORDER BY score DESC LIMIT 10"; // Change the LIMIT according to your requirements
$result = $conn->query($query);

// Check if there are rows returned
if ($result->num_rows > 0) {
    // Output the leaderboard data as JSON
    $leaderboard_data = array();
    while ($row = $result->fetch_assoc()) {
        $leaderboard_data[] = $row;
    }
    echo json_encode(array('success' => true, 'leaderboard' => $leaderboard_data));
} else {
    // No data found in the database
    echo json_encode(array('success' => false, 'message' => 'No data found in the leaderboard'));
}

// Close the database connection
$conn->close();
?>
