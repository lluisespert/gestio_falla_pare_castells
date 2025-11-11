<?php
ini_set('display_errors', 0);
error_reporting(0);
require_once __DIR__ . '/config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
header('Content-Type: application/json; charset=utf-8');

$id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if ($id <= 0) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'ID inválido']);
  exit;
}

try {
  $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
  if ($conn->connect_error) { throw new Exception('Conexión: ' . $conn->connect_error); }
  $conn->set_charset('utf8mb4');

  $sql = "SELECT id, nom, cognoms, domicili, telefon, dni,
                 DATE_FORMAT(data_naixement,'%Y-%m-%d') AS data_naixement,
                 email, edat, `grup`, colaborador, categoria,
                 DATE_FORMAT(data_alta,'%Y-%m-%d') AS data_alta
          FROM fallers WHERE id = ?";
  $stmt = $conn->prepare($sql);
  if (!$stmt) throw new Exception('Prepare: ' . $conn->error);
  $stmt->bind_param('i', $id);
  $stmt->execute();
  $res = $stmt->get_result();
  $f = $res->fetch_assoc();
  $stmt->close();
  $conn->close();

  if (!$f) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Faller no trobat']);
    exit;
  }

  $f['id'] = (int)$f['id'];
  $f['edat'] = isset($f['edat']) ? (int)$f['edat'] : null;
  $f['colaborador'] = (int)$f['colaborador'];

  echo json_encode(['success' => true, 'faller' => $f], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>