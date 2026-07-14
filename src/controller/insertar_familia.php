<?php
ini_set('display_errors', 0);
error_reporting(0);

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Origin, Accept');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON incorrecto: ' . json_last_error_msg());
    }

    $apellidos = trim($input['apellidos'] ?? $input['cognoms'] ?? '');
    if ($apellidos === '') {
        throw new Exception('Els cognoms de la família són obligatoris');
    }

    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        throw new Exception('Error de conexión: ' . $conn->connect_error);
    }
    $conn->set_charset('utf8mb4');

    $stmt = $conn->prepare('INSERT INTO familias (apellidos) VALUES (?)');
    if (!$stmt) {
        throw new Exception('Error en prepare: ' . $conn->error);
    }

    if (!$stmt->bind_param('s', $apellidos)) {
        throw new Exception('Error en bind_param: ' . $stmt->error);
    }
    if (!$stmt->execute()) {
        throw new Exception('Error al insertar la família: ' . $stmt->error);
    }

    echo json_encode(['success' => true, 'message' => 'Família creada correctament', 'insert_id' => $stmt->insert_id]);
    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}
?>