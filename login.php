<?php
session_start();
include('database.php');

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $username = $_POST['username'];
    $password = $_POST['password'];

    // Query to check the username and password
    $query = "SELECT id, username, password FROM users WHERE username = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        $user = $result->fetch_assoc();
        if (password_verify($password, $user['password'])) {
            // Password is correct, set the session variables
            $_SESSION['id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            file_put_contents('debug.log', "Session set: ID = " . $_SESSION['id'] . ", Username = " . $_SESSION['username'] . "\n", FILE_APPEND);
            header('Location: index.php');
            exit();
        } else {
            // Incorrect password
            echo 'Invalid username or password.';
        }
    } else {
        // User not found
        echo 'Invalid username or password.';
    }

    // Close the statement and connection
    $stmt->close();
    $conn->close();
}
?>