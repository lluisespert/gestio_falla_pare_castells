<?php
// DEBUG: Activar errores temporalmente para diagnóstico
ini_set('display_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
require_once __DIR__ . '/config.php';
require_once __DIR__ . '/tarifes_pagament.php';

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

$id_faller = isset($input['id_faller']) ? (int)$input['id_faller'] : 0;
$comentaris = isset($input['comentaris']) ? trim((string)$input['comentaris']) : '';
$quantitat = isset($input['quantitat']) ? (float)$input['quantitat'] : 0;
$data_pagament = isset($input['data_pagament']) ? trim((string)$input['data_pagament']) : '';
$metode_pagament = isset($input['metode_pagament']) ? trim((string)$input['metode_pagament']) : '';

$allowed_methods = ['efectiu','targeta','transferencia','transferència','bizum'];
if (!in_array(mb_strtolower($metode_pagament), $allowed_methods, true)) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Mètode de pagament no vàlid']);
  exit;
}
$dt = DateTime::createFromFormat('Y-m-d', $data_pagament);
$valid_date = $dt && $dt->format('Y-m-d') === $data_pagament;

if ($id_faller <= 0 || $comentaris === '' || $quantitat <= 0 || !$valid_date) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Campos obligatorios incompletos o inválidos']);
  exit;
}

$comentaris = mb_substr($comentaris, 0, 500);
$quantitat = round($quantitat, 2);

try {
  $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
  if ($conn->connect_error) throw new Exception('Conexión: ' . $conn->connect_error);
  $conn->set_charset('utf8mb4');

  // Obtener faller (grup y edat)
  $stmtF = $conn->prepare('SELECT nom, cognoms, dni, edat, `grup` FROM fallers WHERE id = ? LIMIT 1');
  if (!$stmtF) throw new Exception('Prepare: ' . $conn->error);
  $stmtF->bind_param('i', $id_faller);
  $stmtF->execute();
  $resF = $stmtF->get_result();
  $faller = $resF ? $resF->fetch_assoc() : null;
  $stmtF->close();

  if (!$faller) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Faller no trobat']);
    $conn->close();
    exit;
  }

  $edat = (int)$faller['edat'];
  $grup = (string)$faller['grup'];

  $total_pagament = calcular_total_pagament($grup, $edat);
  
  // ========== CONSULTAR PAGOS PREVIOS DEL FALLER ==========
  $stmt_pagos = $conn->prepare('SELECT SUM(quantitat) as total_aportat_previo FROM pagaments WHERE id_faller = ?');
  if (!$stmt_pagos) throw new Exception('Error preparando consulta pagos: ' . $conn->error);
  
  $stmt_pagos->bind_param('i', $id_faller);
  $stmt_pagos->execute();
  $result_pagos = $stmt_pagos->get_result();
  $row_pagos = $result_pagos->fetch_assoc();
  $stmt_pagos->close();
  
  // Total aportado previamente (puede ser NULL si no hay pagos previos)
  $total_aportat_previo = (float)($row_pagos['total_aportat_previo'] ?? 0);
  
  // ========== CALCULAR VALORES CON ACUMULACIÓN ==========
  // Nuevo aporte de este pago
  $quantitat_actual = $quantitat;
  
  // Total aportado incluyendo este pago
  $aportat_pagament_total = $total_aportat_previo + $quantitat_actual;
  
  // Lo que falta por aportar después de este pago
  $falta_per_aportar = max(0, round($total_pagament - $aportat_pagament_total, 2));
  
  // Para este registro específico, guardamos solo la cantidad de este pago
  $aportat_pagament = $quantitat_actual;
  
  $data_aportacio = $data_pagament; // por defecto, misma fecha
  
  $grup_normalizado = normalize_group_upper($grup);
  $grup_sin_acentos = normalize_group_key($grup);

  // Insert
  $sql = "INSERT INTO pagaments (
            id_faller, comentaris, quantitat, data_pagament, metode_pagament,
            total_pagament, aportat_pagament, falta_per_aportar, data_aportacio
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
  $stmt = $conn->prepare($sql);
  if (!$stmt) throw new Exception('Prepare: ' . $conn->error);

  $m = mb_strtolower($metode_pagament);
  if ($m === 'transferència') $m = 'transferencia';

  $stmt->bind_param(
    'isdssddds',
    $id_faller,
    $comentaris,
    $quantitat,
    $data_pagament,
    $m,
    $total_pagament,
    $aportat_pagament,
    $falta_per_aportar,
    $data_aportacio
  );

  if (!$stmt->execute()) throw new Exception('Error al insertar: ' . $stmt->error);

  $insert_id = $stmt->insert_id;
  $stmt->close();
  $conn->close();

  echo json_encode([
    'success' => true,
    'message' => 'Pagament registrat correctament',
    'id' => $insert_id,
    'recibo' => [
      'nom_complet' => $faller['nom'] . ' ' . $faller['cognoms'],
      'dni' => $faller['dni'],
      'comentaris' => $comentaris,
      'data_pagament' => $data_pagament,
      'metode_pagament' => $metode_pagament,
      'total_pagament' => $total_pagament,
      'aportat_anterior' => $total_aportat_previo,
      'quantitat_pagada' => $quantitat_actual,
      'total_aportat' => $aportat_pagament_total
    ],
    'resum_pagament' => [
      'faller' => $faller['nom'] . ' ' . $faller['cognoms'],
      'grup' => $grup,
      'edat' => $edat,
      'total_a_pagar' => $total_pagament,
      'aportat_previamente' => $total_aportat_previo,
      'aporte_actual' => $quantitat_actual,
      'total_aportado' => $aportat_pagament_total,
      'falta_por_aportar' => $falta_per_aportar,
      'porcentaje_completado' => round(($aportat_pagament_total / $total_pagament) * 100, 2),
      'estado' => $falta_per_aportar <= 0 ? 'COMPLETADO' : 'PENDIENTE'
    ],
    'debug' => [
      'grup_normalizado' => $grup_normalizado,
      'grup_sin_acentos' => $grup_sin_acentos
    ]
  ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
