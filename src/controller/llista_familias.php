<?php
ini_set('display_errors', 0);
error_reporting(0);

require_once __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        throw new Exception('Error de conexión: ' . $conn->connect_error);
    }
    $conn->set_charset('utf8mb4');

    $sql = 'SELECT id, apellidos FROM familias ORDER BY apellidos ASC';
    $result = $conn->query($sql);
    if ($result === false) {
        throw new Exception('Error en la consulta: ' . $conn->error);
    }

    $rows = [];
    while ($row = $result->fetch_assoc()) {
        $rows[] = [
            'id' => (int)$row['id'],
            'apellidos' => $row['apellidos']
        ];
    }

    $result->free();
    $conn->close();

    echo json_encode(['success' => true, 'data' => $rows, 'count' => count($rows)]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage(), 'data' => []]);
}
?>