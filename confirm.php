<?php
// confirm.php
require 'database.php'; // Adjust the path as needed

if (isset($_GET['email']) && isset($_GET['token'])) {
    $email = $conn->real_escape_string($_GET['email']);
    $token = $conn->real_escape_string($_GET['token']);

    // Verify the token and activate the account
    $query = "SELECT * FROM users WHERE email='$email' AND token='$token' AND token_expiry > NOW()";

    $result = $conn->query($query);

    if ($result->num_rows > 0) {
        $query = "UPDATE users SET is_active=1, token=NULL, token_expiry=NULL WHERE email='$email'";
        if ($conn->query($query) === TRUE) {
            echo "Account confirmed successfully!";
        } else {
            echo "Error updating record: " . $conn->error;
        }
    } else {
        echo "Invalid or expired token.";
    }
}
