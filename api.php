<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT');
header('Access-Control-Allow-Headers: Content-Type');

$menuFile = __DIR__ . '/data/menu.json';
$action = $_GET['action'] ?? 'read';

if ($action === 'read') {
    if (!file_exists($menuFile)) {
        http_response_code(404);
        echo json_encode(['error' => 'File not found']);
        exit;
    }
    
    $content = file_get_contents($menuFile);
    echo $content;
} else {
    $newData = json_decode(file_get_contents('php://input'), true);
    if (!$newData) {
        http_response_code(400);
        echo json_encode(['error' => 'Invalid JSON']);
        exit;
    }
    
    $jsonString = json_encode($newData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    file_put_contents($menuFile, $jsonString, LOCK_EX);
    
    echo json_encode(['success' => true]);
}
