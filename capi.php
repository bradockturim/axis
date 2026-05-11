<?php

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$pixelId = getenv('META_PIXEL_ID') ?: getenv('FB_PIXEL_ID');
$accessToken = getenv('META_ACCESS_TOKEN');
$testEventCode = getenv('META_TEST_EVENT_CODE');

if (!$pixelId || !$accessToken) {
    http_response_code(500);
    echo json_encode(['error' => 'Missing META_PIXEL_ID/FB_PIXEL_ID or META_ACCESS_TOKEN env vars']);
    exit;
}

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '{}', true);

if (!is_array($body)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON body']);
    exit;
}

$eventName = $body['event_name'] ?? null;
if (!$eventName) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing event_name']);
    exit;
}

$clientIp = null;
if (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
    $parts = explode(',', $_SERVER['HTTP_X_FORWARDED_FOR']);
    $clientIp = trim($parts[0]);
} elseif (!empty($_SERVER['REMOTE_ADDR'])) {
    $clientIp = $_SERVER['REMOTE_ADDR'];
}

$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? null;

$eventTime = isset($body['event_time']) ? (int)$body['event_time'] : time();
$eventId = $body['event_id'] ?? null;
$eventSourceUrl = $body['event_source_url'] ?? null;
$fbp = $body['fbp'] ?? null;
$fbc = $body['fbc'] ?? null;
$customData = $body['custom_data'] ?? null;

$payload = [
    'data' => [[
        'event_name' => $eventName,
        'event_time' => $eventTime,
        'event_id' => $eventId,
        'action_source' => 'website',
        'event_source_url' => $eventSourceUrl,
        'user_data' => array_filter([
            'client_ip_address' => $clientIp,
            'client_user_agent' => $userAgent,
            'fbp' => $fbp,
            'fbc' => $fbc
        ], fn($v) => $v !== null && $v !== ''),
        'custom_data' => is_array($customData) ? $customData : null
    ]]
];

if ($testEventCode) {
    $payload['test_event_code'] = $testEventCode;
}

$url = "https://graph.facebook.com/v20.0/{$pixelId}/events?access_token=" . urlencode($accessToken);

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);

$respBody = curl_exec($ch);
$respCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

if ($respBody === false) {
    http_response_code(502);
    echo json_encode(['error' => 'CAPI request failed', 'detail' => $curlErr]);
    exit;
}

http_response_code($respCode ?: 200);
echo $respBody;

