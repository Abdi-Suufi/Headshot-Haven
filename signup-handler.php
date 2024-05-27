<?php
// Start the session
session_start();

// Establish connection to the database
$servername = "localhost";
$username = "root";
$password = "Barton-324";
$dbname = "valorant_data";

$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Process sign up form data
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = $_POST["username"];
    $email = $_POST["email"];
    $password = $_POST["password"];

    // Check if username or email already exists
    $checkQuery = "SELECT * FROM users WHERE username = ? OR email = ?";
    $stmt = $conn->prepare($checkQuery);
    $stmt->bind_param("ss", $username, $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // Username or email already exists
        $_SESSION['signup_error'] = "Username or email already taken. Please try another.";
        header("Location: signup.php");
        exit();
    } else {
        // Hash the password for security
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        // Prepare and bind the SQL statement
        $insertQuery = "INSERT INTO users (username, email, password, score) VALUES (?, ?, ?, 0)";
        $stmt = $conn->prepare($insertQuery);
        $stmt->bind_param("sss", $username, $email, $hashed_password);

        // Execute the statement
        if ($stmt->execute()) {
            // Set session variable with the username
            $_SESSION['username'] = $username;

            // Redirect back to index.php
            header("Location: index.php");
            exit();
        } else {
            $_SESSION['signup_error'] = "Error: " . $stmt->error;
            header("Location: signup.php");
            exit();
        }
    }

    // Close the statement and database connection
    $stmt->close();
    $conn->close();
}
?>
