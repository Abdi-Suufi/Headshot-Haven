<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $code = $_POST['code'];

    $url = 'https://api.henrikdev.xyz/valorant/v1/crosshair/generate?id=' . urlencode($code);
    $authorization = 'HDEV-0fe3cd31-144b-48b3-9841-02c1183ccbe1';

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'accept: image/png',
        'Authorization: ' . $authorization
    ]);

    $result = curl_exec($ch);
    if ($result === false) {
        http_response_code(500);
        echo json_encode(['error' => curl_error($ch)]);
    } else {
        header('Content-Type: image/png');
        echo $result;
    }

    curl_close($ch);
}