<?php
// Include database connection
include('database.php');

// Initialize response array
$response = array();

// Query to fetch weapon names from the database
$sql = "SELECT weapon FROM valorant_weapon_spec";
$result = $conn->query($sql);

if ($result->num_rows > 0) {
    // Initialize array to store weapon names
    $weaponNames = array();

    // Fetch each row and store weapon names in the array
    while ($row = $result->fetch_assoc()) {
        $weaponNames[] = $row['weapon'];
    }

    // Close the database connection
    $conn->close();

    // Set success flag and weapon names in response
    $response['success'] = true;
    $response['weaponNames'] = $weaponNames;
} else {
    // Close the database connection
    $conn->close();

    // Set error message in response
    $response['success'] = false;
    $response['message'] = 'No weapon names found in the database';
}

// Send JSON response
header('Content-Type: application/json');
echo json_encode($response);
?>