<?php
session_start();
echo 'Session ID: ' . session_id() . '<br>';
echo 'User ID: ' . (isset($_SESSION['id']) ? $_SESSION['id'] : 'Not set') . '<br>';
echo 'Username: ' . (isset($_SESSION['username']) ? $_SESSION['username'] : 'Not set') . '<br>';
?>
