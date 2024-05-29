<?php

// Include database connection
include('database.php');

// Query to fetch weapon data
$sql = "SELECT * FROM valorant_weapon_spec";
$result = $conn->query($sql);

// Check if there are rows returned
if ($result->num_rows > 0) {
    // Output table header
    echo "<table class='table table-striped table-dark'>
    <thead>
            <tr>
                <th>Weapon</th>
                <th>Price</th>
                <th>Fire Rate</th>
                <th>Headshot Damage</th>
                <th>Bodyshot Damage</th>
                <th>Legshot Damage</th>
            </tr>
          </thead>";

    // Output data as table rows
    echo "<tbody>";
    while ($row = $result->fetch_assoc()) {
        echo "<tr>";
        echo "<td>" . $row["weapon"] . "</td>";
        echo "<td>" . $row["Price"] . "</td>";
        echo "<td>" . $row["Fire_Rate"] . "</td>";
        echo "<td>" . $row["Damage_Head"] . "</td>";
        echo "<td>" . $row["Damage_Body"] . "</td>";
        echo "<td>" . $row["Damage_Leg"] . "</td>";
        echo "</tr>";
    }
    echo "</tbody> 
    </table>";
} else {
    // No data available message
    echo "<tr><td colspan='6'>No data available</td></tr>";
}

// Close MySQL connection
$conn->close();
