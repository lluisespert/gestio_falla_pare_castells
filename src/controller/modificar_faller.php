<?php
ini_set('display_errors', 0);
error_reporting(0);
require_once __DIR__ . '/config.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(200); exit; }
if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); exit; }
header('Content-Type: application/json; charset=utf-8');

$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input)) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'JSON inválido']);
  exit;
}

$id = isset($input['id']) ? (int)$input['id'] : 0;
if ($id <= 0) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'ID requerido']);
  exit;
}

$nom = $input['nom'] ?? '';
$cognoms = $input['cognoms'] ?? '';
$domicili = $input['domicili'] ?? '';
$telefon = $input['telefon'] ?? '';
$dni = $input['dni'] ?? '';
$data_naixement = $input['data_naixement'] ?? '';
$email = $input['email'] ?? '';
$edat = ($input['edat'] === '' || !isset($input['edat'])) ? null : (int)$input['edat'];
$grup = $input['grup'] ?? '';
$colaborador = isset($input['colaborador']) ? (int)!!$input['colaborador'] : 0;
$data_alta = $input['data_alta'] ?? '';
$categoria = $input['categoria'] ?? 'Home';

try {
  $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
  if ($conn->connect_error) throw new Exception('Conexión: ' . $conn->connect_error);
  $conn->set_charset('utf8mb4');

  $sql = "UPDATE fallers
          SET nom=?, cognoms=?, domicili=?, telefon=?, dni=?, data_naixement=?, email=?, edat=?, `grup`=?, colaborador=?, data_alta=?, categoria=?
          WHERE id=?";
  $stmt = $conn->prepare($sql);
  if (!$stmt) throw new Exception('Prepare: ' . $conn->error);

  $types = 'sssssssisissi';
  $stmt->bind_param(
    $types,
    $nom, $cognoms, $domicili, $telefon, $dni, $data_naixement, $email,
    $edat, $grup, $colaborador, $data_alta, $categoria, $id
  );

  if (!$stmt->execute()) {
    if ($stmt->errno === 1062) throw new Exception('Valor duplicado');
    throw new Exception('Error al actualizar: ' . $stmt->error);
  }

  $affected = $stmt->affected_rows;
  $stmt->close();
  $conn->close();

  echo json_encode(['success' => true, 'message' => 'Actualizado', 'affected' => $affected]);
} catch (Exception $e) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>