<?php
// DEBUG: Activar errores temporalmente para diagnóstico
ini_set('display_errors', 1);
error_reporting(E_ALL);
ini_set('log_errors', 1);
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

  // DEBUG: Información para diagnosticar detección de grupos
  // TODO: ELIMINAR DESPUÉS DEL DIAGNÓSTICO
  error_log("DEBUG calcular_total - Grup original: '" . $grup . "'");
  error_log("DEBUG calcular_total - Grup normalizado: '" . $g . "'");
  error_log("DEBUG calcular_total - Edad: " . $edat);
  
  // DEBUG: Probar diferentes búsquedas de brussó
  error_log("DEBUG - ¿Contiene 'brusso'?: " . (strpos($g, 'brusso') !== false ? 'SÍ' : 'NO'));
  error_log("DEBUG - ¿Contiene 'brussó'?: " . (strpos($grup, 'brussó') !== false ? 'SÍ' : 'NO'));
  error_log("DEBUG - ¿Contiene 'Brussó'?: " . (strpos($grup, 'Brussó') !== false ? 'SÍ' : 'NO'));
  error_log("DEBUG - ¿Contiene 'BRUSSÓ'?: " . (strpos(strtoupper($grup), 'BRUSSÓ') !== false ? 'SÍ' : 'NO'));

  // ========== PRIORIDAD 1: GRUPOS ESPECIALES (independiente de edad) ==========
  // SI SE DETECTA CUALQUIERA DE ESTOS GRUPOS, SE PARA LA COMPROBACIÓN Y SE RETORNA INMEDIATAMENTE
  
  // Grup: Fallers/falleres de brussó - siempre 400€ (PARA AQUÍ)
  // DETECCIÓN SÚPER AMPLIA para todas las variaciones posibles de "brussó"
  
  $grup_original_lower = mb_strtolower($grup);
  $grup_sin_acentos = remove_accents($grup_original_lower);
  
  // Buscar TODAS las variaciones posibles de "brussó"
  $variaciones_brusso = [
    'brussó', 'brusso', 'brusson', 'brasso', 'bruso', 'brusó',
    'fallers de brussó', 'falleres de brussó', 'fallers de brusso', 
    'falleres de brusso', 'fallers/falleres de brussó', 'fallers/falleres de brusso',
    'fallers falleres de brussó', 'fallers falleres de brusso'
  ];
  
  $es_brusso = false;
  foreach ($variaciones_brusso as $variacion) {
    if (strpos($grup_original_lower, $variacion) !== false || 
        strpos($grup_sin_acentos, remove_accents($variacion)) !== false ||
        strpos($g, remove_accents($variacion)) !== false) {
      $es_brusso = true;
      error_log("DEBUG: DETECTADO BRUSSÓ con variación: '" . $variacion . "'");
      break;
    }
  }
  
  if ($es_brusso) {
    error_log("DEBUG: *** CONFIRMADO GRUP BRUSSÓ - Retornando 400€ ***");
    return 400.00; // DETIENE COMPLETAMENTE LA EVALUACIÓN
  }
  
  // ========== DETECCIÓN DE EMERGENCIA PARA BRUSSÓ ==========
  // Si contiene "bru" seguido de algo (comodín para brussó/brusso/etc.)
  if (preg_match('/bru[sç]*/i', $grup) || preg_match('/bru[sç]*/i', $g)) {
    error_log("DEBUG: *** DETECCIÓN DE EMERGENCIA - Contiene 'bru' - Retornando 400€ ***");
    return 400.00;
  }
  
  error_log("DEBUG: NO se detectó como grup brussó - Continuando...");
  
  // Grup: Fallers d'honor - siempre 100€ (PARA AQUÍ)
  if (strpos($g, "fallers d'honor") !== false || strpos($g, 'fallers dhonor') !== false) {
    error_log("DEBUG: DETECTADO GRUP FALLERS D'HONOR - Retornando 100€");
    return 100.00; // DETIENE COMPLETAMENTE LA EVALUACIÓN
  }
  
  // Grup: Familiar de faller/fallera - siempre 300€ (PARA AQUÍ)
  if (strpos($g, 'familiar de faller/fallera') !== false || strpos($g, 'familiar de faller fallera') !== false) {
    error_log("DEBUG: DETECTADO GRUP FAMILIAR - Retornando 300€");
    return 300.00; // DETIENE COMPLETAMENTE LA EVALUACIÓN
  }
  
  // ========== SI LLEGAMOS AQUÍ, NO ES NINGÚN GRUPO DE PRIORIDAD 1 ========== 

  // ========== PRIORIDAD 2: GRUPOS CON VARIACIÓN POR EDAD ==========
  
  // Grup: Cap dels pares es faller
  if (strpos($g, 'cap dels pares es faller') !== false || strpos($g, 'cap dels pares es') !== false) {
    if ($edat <= 3) return 70.00;
    if ($edat <= 10) return 100.00;
    if ($edat <= 13) return 150.00;
    // Si es mayor de 13 años en este grupo, aplicar tarifa general por edad
  }
  
  // Grup: Un dels pares es faller
  if (strpos($g, 'un dels pares es faller') !== false) {
    if ($edat <= 3) return 40.00;
    if ($edat <= 10) return 55.00;
    if ($edat <= 13) return 85.00;
    // Si es mayor de 13 años en este grupo, aplicar tarifa general por edad
  }
  
  // Grup: Els dos pares son fallers
  if (strpos($g, 'els dos pares son fallers') !== false) {
    if ($edat <= 3) return 0.00;
    if ($edat <= 10) return 35.00;
    if ($edat <= 13) return 55.00;
    // Si es mayor de 13 años en este grupo, aplicar tarifa general por edad
  }
  
  // Grup: Cap ascendent faller (14-17 anys)
  if (strpos($g, 'cap ascendent faller') !== false || strpos($g, 'cap ascendet faller') !== false) {
    if ($edat >= 14 && $edat <= 17) return 250.00;
    // Si no está en el rango 14-17, aplicar tarifa general por edad
  }
  
  // Grup: 1 ascendent faller (14-17 anys)
  if (strpos($g, '1 ascendent faller') !== false || strpos($g, '1 ascendet faller') !== false) {
    if ($edat >= 14 && $edat <= 17) return 200.00;
    // Si no está en el rango 14-17, aplicar tarifa general por edad
  }
  
  // Grup: 2 ascendents fallers (14-17 anys)
  if (strpos($g, '2 ascendents fallers') !== false || strpos($g, '2 ascendets fallers') !== false) {
    if ($edat >= 14 && $edat <= 17) return 185.00;
    // Si no está en el rango 14-17, aplicar tarifa general por edad
  }

  // ========== PRIORIDAD 3: TARIFA GENERAL POR EDAD (sin grup específico) ==========
  
  // 18-25 anys: tarifa general
  if ($edat >= 18 && $edat <= 25) {
    error_log("DEBUG: APLICANDO TARIFA GENERAL 18-25 años - Retornando 425€");
    return 425.00;
  }
  
  // 26+ anys: tarifa general
  if ($edat >= 26) {
    error_log("DEBUG: APLICANDO TARIFA GENERAL 26+ años - Retornando 575€");
    return 575.00;
  }
  
  // Menores de 18 sin grup específico: tarifa básica
  if ($edat < 18) {
    return 200.00; // Tarifa por defecto para menores sin grup específico
  }

  // Fallback final
  error_log("DEBUG: LLEGÓ AL FALLBACK - Retornando 0€");
  return 0.00;
}

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

  error_log("DEBUG PRINCIPAL: Antes de calcular_total - Grup: '" . $grup . "', Edat: " . $edat);
  $total_pagament = calcular_total($grup, $edat);
  error_log("DEBUG PRINCIPAL: Después de calcular_total - Total_pagament: " . $total_pagament);
  
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
  
  // DEBUG: Información temporal para diagnosticar
  $grup_normalizado = mb_strtolower(trim($grup));
  $grup_sin_acentos = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $grup_normalizado);
  
  error_log("DEBUG PAGOS: Total a pagar: " . $total_pagament);
  error_log("DEBUG PAGOS: Aportado previamente: " . $total_aportat_previo);
  error_log("DEBUG PAGOS: Aporte actual: " . $quantitat_actual);
  error_log("DEBUG PAGOS: Total aportado: " . $aportat_pagament_total);
  error_log("DEBUG PAGOS: Falta por aportar: " . $falta_per_aportar);

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