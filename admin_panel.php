<?php
session_start();
include('database.php');

// Check if the user is an admin
if (!isset($_SESSION['admin_id'])) {
    // Redirect or show an error if not an admin
    header("Location: signin.php");
    exit();
}
?>

<!DOCTYPE html>
<html data-bs-theme="light" lang="en">

<head>
    <link rel="shortcut icon" type="image" href="assets/img/headshot-haven-logo.svg">
    <link rel="shortcut icon" type="image" href="assets/img/fix ur.svg">
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, shrink-to-fit=no">
    <title>Admin panel</title>
    <link rel="stylesheet" href="assets/bootstrap/css/bootstrap.min.css">
    <link rel="stylesheet" href="styles.css">
</head>

<style>
    .masthead {
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        min-height: 100vh;
    }
</style>


<body id="page-top" data-bs-spy="scroll" data-bs-target="#mainNav" data-bs-offset="77">
    <!-- Navbar -->
    <?php include('assets/navbar3.php'); ?>

    <!-- Sign In Form -->
    <section class="text-center content-section masthead" style="background-image:url('assets/img/testing2.jpg');">
        <div class="container mt-4">
            <h2>User Information - Aim training</h2>
            <table class="table table-dark table-striped">
                <thead>
                    <tr>
                        <th>Username</th>
                        <th>Score</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php
                    $query = "SELECT id, username, score FROM aim_training_scores ORDER BY score DESC";
                    $result = $conn->query($query);

                    if ($result->num_rows > 0) {
                        while ($row = $result->fetch_assoc()) {
                            echo "<tr>";
                            echo "<td>" . $row["username"] . "</td>";
                            echo "<td>" . $row["score"] . "</td>";
                            echo "<td>";
                            echo "<a href='delete_user.php?username=" . $row["username"] . "' class='btn btn-danger btn-sm me-2'>Delete</a>";
                            echo "<a href='reset_score.php?username=" . $row["username"] . "' class='btn btn-warning btn-sm'><i class='bi bi-arrow-clockwise'></i> Reset score</a>";
                            echo "</td>";
                            echo "</tr>";
                        }
                    } else {
                        echo "<tr><td colspan='4'>No users found</td></tr>";
                    }
                    ?>
                </tbody>
            </table>
        </div>
    </section>
    <!-- Bootstrap and custom scripts -->
    <script src="assets/bootstrap/js/bootstrap.min.js"></script>
</body>

</html>