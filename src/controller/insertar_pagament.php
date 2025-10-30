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

// helpers
function remove_accents($str) {
  $str = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $str);
  return $str === false ? '' : $str;
}
function norm($s) {
  $s = mb_strtolower(trim($s));
  $s = remove_accents($s);
  $s = preg_replace('/\s+/', ' ', $s);
  return $s;
}
function calcular_total($grup, $edat) {
  $g = norm($grup);

  // Reglas “especiales” por grup (independiente de edad)
  if (strpos($g, 'brusso') !== false || strpos($g, 'brusso') !== false || strpos($g, 'brusso') !== false) {
    // seguridad por variantes, pero normalizado ya maneja tildes
  }
  if (strpos($g, 'brusso') !== false || strpos($g, 'brusso') !== false) { /* no-op */ }
  if (strpos($g, 'brusso') !== false) { /* no-op */ }

  // Casos exactos
  if (strpos($g, 'fallers/falleres de brusso') !== false || strpos($g, 'brusso') !== false || strpos($g, 'brusso') !== false) {
    return 400.00;
  }
  if (strpos($g, "fallers d'honor") !== false || strpos($g, 'fallers dhonor') !== false) {
    return 100.00;
  }
  if (strpos($g, 'familiar de faller/fallera') !== false || strpos($g, 'familiar de faller fallera') !== false) {
    return 300.00;
  }

  // Hasta 13 anys: según pares fallers
  if ($edat >= 0 && $edat <= 13) {
    if (strpos($g, 'cap dels pares es faller') !== false || strpos($g, 'cap dels pares es') !== false) {
      if ($edat <= 3) return 70.00;
      if ($edat <= 10) return 100.00;
      return 150.00; // 11-13
    }
    if (strpos($g, 'un dels pares es faller') !== false) {
      if ($edat <= 3) return 40.00;
      if ($edat <= 10) return 55.00;
      return 85.00; // 11-13
    }
    if (strpos($g, 'els dos pares son fallers') !== false) {
      if ($edat <= 3) return 0.00;
      if ($edat <= 10) return 35.00;
      return 55.00; // 11-13
    }
  }

  // 14-17 anys: según ascendents
  if ($edat >= 14 && $edat <= 17) {
    if (strpos($g, 'cap ascendent faller') !== false || strpos($g, 'cap ascendet faller') !== false) {
      return 250.00;
    }
    if (strpos($g, '1 ascendent faller') !== false || strpos($g, '1 ascendet faller') !== false) {
      return 200.00;
    }
    if (strpos($g, '2 ascendents fallers') !== false || strpos($g, '2 ascendets fallers') !== false) {
      return 185.00;
    }
  }

  // 18-25 anys: tarifa general
  if ($edat >= 18 && $edat <= 25) {
    return 425.00;
  }

  // 26+ anys: tarifa general (nota: caso “fallera > 26 = 450€” no se puede deducir sin sexo)
  if ($edat >= 26) {
    return 575.00;
  }

  // Fallback
  return 0.00;
}

try {
  $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
  if ($conn->connect_error) throw new Exception('Conexión: ' . $conn->connect_error);
  $conn->set_charset('utf8mb4');

  // Obtener faller (grup y edat)
  $stmtF = $conn->prepare('SELECT nom, cognoms, edat, `grup` FROM fallers WHERE id = ? LIMIT 1');
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

  $total_pagament = calcular_total($grup, $edat);
  // valores derivados
  $aportat_pagament = $quantitat;
  $falta_per_aportar = max(0, round($total_pagament - $aportat_pagament, 2));
  $data_aportacio = $data_pagament; // por defecto, misma fecha

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
    'tarifacio' => [
      'grup' => $grup,
      'edat' => $edat,
      'total_pagament' => $total_pagament,
      'aportat_pagament' => $aportat_pagament,
      'falta_per_aportar' => $falta_per_aportar
    ]
  ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>