<?php
// Database connection parameters
$host = 'headshot-haven.database.windows.net';
$username = 'headshot-haven';
$password = 'Admin-312';
$database = 'Headshot-Haven';

// Create connection
$conn = new mysqli($host, $username, $password, $database);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
