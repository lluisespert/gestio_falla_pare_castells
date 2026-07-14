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

    $familia_id = isset($input['familia_id']) ? (int)$input['familia_id'] : 0;
    $faller_id = isset($input['faller_id']) ? (int)$input['faller_id'] : 0;

    if ($familia_id <= 0 || $faller_id <= 0) {
        throw new Exception('Familia i faller són obligatoris');
    }

    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        throw new Exception('Error de conexión: ' . $conn->connect_error);
    }
    $conn->set_charset('utf8mb4');

    // Verificar existència família
    $stmt = $conn->prepare('SELECT id FROM familias WHERE id = ?');
    if (!$stmt) {
        throw new Exception('Error en prepare: ' . $conn->error);
    }
    $stmt->bind_param('i', $familia_id);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows === 0) {
        throw new Exception('La família no existeix');
    }
    $stmt->close();

    // Verificar existència faller
    $stmt = $conn->prepare('SELECT id FROM fallers WHERE id = ?');
    if (!$stmt) {
        throw new Exception('Error en prepare: ' . $conn->error);
    }
    $stmt->bind_param('i', $faller_id);
    $stmt->execute();
    $stmt->store_result();
    if ($stmt->num_rows === 0) {
        throw new Exception('El faller no existeix');
    }
    $stmt->close();

    // Assignar família al faller
    $stmt = $conn->prepare('UPDATE fallers SET familia_id = ? WHERE id = ?');
    if (!$stmt) {
        throw new Exception('Error en prepare: ' . $conn->error);
    }
    $stmt->bind_param('ii', $familia_id, $faller_id);
    if (!$stmt->execute()) {
        throw new Exception('Error al assignar la família: ' . $stmt->error);
    }

    echo json_encode(['success' => true, 'message' => 'Faller assignat a la família correctament']);
    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}
?>