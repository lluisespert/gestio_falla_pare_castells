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
$id_familia = isset($input['id_familia']) ? (int)$input['id_familia'] : 0;
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

if (($id_faller <= 0 && $id_familia <= 0) || ($id_faller > 0 && $id_familia > 0) || $comentaris === '' || $quantitat <= 0 || !$valid_date) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => 'Selecciona un faller o una família, i completa tots els camps']);
  exit;
}

$comentaris = mb_substr($comentaris, 0, 500);
$quantitat = round($quantitat, 2);

try {
  $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
  if ($conn->connect_error) throw new Exception('Conexión: ' . $conn->connect_error);
  $conn->set_charset('utf8mb4');

  // Detect whether `pagaments` table contains `id_familia` column
  $has_id_familia = false;
  $colCheck = $conn->query("SHOW COLUMNS FROM pagaments LIKE 'id_familia'");
  if ($colCheck && $colCheck->num_rows > 0) {
    $has_id_familia = true;
  }
  // Detect whether `id_faller` allows NULL (some schemas have it NOT NULL)
  $id_faller_nullable = false;
  $colF = $conn->query("SHOW COLUMNS FROM pagaments LIKE 'id_faller'");
  if ($colF && $colF->num_rows > 0) {
    $colfrow = $colF->fetch_assoc();
    if (isset($colfrow['Null']) && strtoupper($colfrow['Null']) === 'YES') {
      $id_faller_nullable = true;
    }
  }

  // Obtener faller (grup y edat)
  $total_pagament = 0.0;
  $total_aportat_previo = 0.0;
  $quantitat_actual = $quantitat;
  $familiarMembers = [];
  $familyName = null;

  if ($id_familia > 0) {
    $stmtF = $conn->prepare('SELECT id, grup, edat FROM fallers WHERE familia_id = ?');
    if (!$stmtF) throw new Exception('Prepare familia: ' . $conn->error);
    $stmtF->bind_param('i', $id_familia);
    $stmtF->execute();
    $resultF = $stmtF->get_result();
    while ($row = $resultF->fetch_assoc()) {
      $familiarMembers[] = $row;
    }
    $stmtF->close();

    if (count($familiarMembers) === 0) {
      http_response_code(404);
      echo json_encode(['success' => false, 'message' => 'Família no trobada o sense components']);
      $conn->close();
      exit;
    }

    foreach ($familiarMembers as $member) {
      $total_pagament += calcular_total_pagament($member['grup'], (int)$member['edat']);
    }

    // Sum previous payments for the family. If `id_familia` does not exist
    // in `pagaments`, only sum payments made by individual fallers in the family.
    if ($has_id_familia) {
      $stmt_pagos = $conn->prepare('SELECT SUM(quantitat) as total_aportat_previo FROM pagaments WHERE id_familia = ? OR id_faller IN (SELECT id FROM fallers WHERE familia_id = ?)');
      if (!$stmt_pagos) throw new Exception('Error preparando consulta pagos familia: ' . $conn->error);
      $stmt_pagos->bind_param('ii', $id_familia, $id_familia);
      $stmt_pagos->execute();
      $result_pagos = $stmt_pagos->get_result();
      $row_pagos = $result_pagos ? $result_pagos->fetch_assoc() : null;
      $stmt_pagos->close();
      $total_aportat_previo = (float)($row_pagos['total_aportat_previo'] ?? 0);
    } else {
      $stmt_pagos = $conn->prepare('SELECT SUM(quantitat) as total_aportat_previo FROM pagaments WHERE id_faller IN (SELECT id FROM fallers WHERE familia_id = ?)');
      if (!$stmt_pagos) throw new Exception('Error preparando consulta pagos familia (fallback): ' . $conn->error);
      $stmt_pagos->bind_param('i', $id_familia);
      $stmt_pagos->execute();
      $result_pagos = $stmt_pagos->get_result();
      $row_pagos = $result_pagos ? $result_pagos->fetch_assoc() : null;
      $stmt_pagos->close();
      $total_aportat_previo = (float)($row_pagos['total_aportat_previo'] ?? 0);
    }

    $stmtFamName = $conn->prepare('SELECT apellidos FROM familias WHERE id = ? LIMIT 1');
    if ($stmtFamName) {
      $stmtFamName->bind_param('i', $id_familia);
      $stmtFamName->execute();
      $resultFamName = $stmtFamName->get_result();
      $familyRow = $resultFamName ? $resultFamName->fetch_assoc() : null;
      $familyName = $familyRow['apellidos'] ?? null;
      $stmtFamName->close();
    }
  } else {
    $stmtF = $conn->prepare('SELECT nom, cognoms, dni, edat, `grup`, familia_id FROM fallers WHERE id = ? LIMIT 1');
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

    $stmt_pagos = $conn->prepare('SELECT SUM(quantitat) as total_aportat_previo FROM pagaments WHERE id_faller = ?');
    if (!$stmt_pagos) throw new Exception('Error preparando consulta pagos: ' . $conn->error);
    $stmt_pagos->bind_param('i', $id_faller);
    $stmt_pagos->execute();
    $result_pagos = $stmt_pagos->get_result();
    $row_pagos = $result_pagos->fetch_assoc();
    $stmt_pagos->close();

    $total_aportat_previo = (float)($row_pagos['total_aportat_previo'] ?? 0);
  }


  $aportat_pagament_total = $total_aportat_previo + $quantitat_actual;
  $falta_per_aportar = max(0, round($total_pagament - $aportat_pagament_total, 2));
  $aportat_pagament = $quantitat_actual;
  $data_aportacio = $data_pagament;

  // Normalize payment method early so distribution code can use it
  $m = mb_strtolower($metode_pagament);
  if ($m === 'transferència') $m = 'transferencia';

  // If this is a family payment and either the DB lacks id_familia OR id_faller does not allow NULL,
  // use the per-member distribution fallback (insert one row per faller) and return a summary.
  $need_distribution_direct = false;
  if ($id_familia > 0) {
    if (!$has_id_familia) $need_distribution_direct = true;
    if ($has_id_familia && $id_faller_param === null && !$id_faller_nullable) $need_distribution_direct = true;
  }

  if ($need_distribution_direct) {
    // Perform per-member distribution now and return success summary
    if (empty($familiarMembers)) {
      http_response_code(500);
      echo json_encode(['success' => false, 'message' => "No s'han trobat membres per distribuir el pagament"]);
      $conn->close();
      exit;
    }

    $shares = [];
    $accum = 0.0;
    foreach ($familiarMembers as $i => $member) {
      $member_quota = calcular_total_pagament($member['grup'], (int)$member['edat']);
      $share = ($total_pagament > 0) ? round($quantitat * ($member_quota / $total_pagament), 2) : round($quantitat / count($familiarMembers), 2);
      $shares[$i] = ['id' => (int)$member['id'], 'quota' => $member_quota, 'share' => $share];
      $accum += $share;
    }
    $diff = round($quantitat - $accum, 2);
    if ($diff != 0) {
      $lastIndex = count($shares) - 1;
      $shares[$lastIndex]['share'] = round($shares[$lastIndex]['share'] + $diff, 2);
    }

    $insert_stmt = $conn->prepare('INSERT INTO pagaments (id_faller, comentaris, quantitat, data_pagament, metode_pagament, total_pagament, aportat_pagament, falta_per_aportar, data_aportacio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
    if (!$insert_stmt) throw new Exception('Prepare distribucion fallback: ' . $conn->error);

    $inserted_ids = [];
    $total_aportat_previo_family = 0.0;
    foreach ($shares as $s) {
      $member_id = $s['id'];
      $member_quota = $s['quota'];
      $member_share = $s['share'];

      $stmt_prev = $conn->prepare('SELECT SUM(quantitat) as total FROM pagaments WHERE id_faller = ?');
      $stmt_prev->bind_param('i', $member_id);
      $stmt_prev->execute();
      $res_prev = $stmt_prev->get_result();
      $row_prev = $res_prev ? $res_prev->fetch_assoc() : null;
      $prev_total = (float)($row_prev['total'] ?? 0);
      $stmt_prev->close();

      $total_aportat_previo_family += $prev_total;

      $falta_member = max(0, round($member_quota - ($prev_total + $member_share), 2));

      if (!$insert_stmt->bind_param('isdssddds', $member_id, $comentaris, $member_share, $data_pagament, $m, $member_quota, $member_share, $falta_member, $data_aportacio)) {
        throw new Exception('bind_param distribucion failed: ' . $insert_stmt->error);
      }
      if (!$insert_stmt->execute()) {
        throw new Exception('Error al insertar distribucion: ' . $insert_stmt->error);
      }
      $inserted_ids[] = $insert_stmt->insert_id;
    }
    $insert_stmt->close();

    // Build recibo summary for the whole family
    $aportat_pagament_total = $total_aportat_previo_family + $quantitat_actual;
    $falta_per_aportar_family = max(0, round($total_pagament - $aportat_pagament_total, 2));

    $recibo = [
      'nom_complet' => $id_familia > 0 ? ("Família " . ($familyName ?? $id_familia)) : '',
      'dni' => '',
      'comentaris' => $comentaris,
      'data_pagament' => $data_pagament,
      'metode_pagament' => $metode_pagament,
      'total_pagament' => $total_pagament,
      'aportat_anterior' => $total_aportat_previo_family,
      'quantitat_pagada' => $quantitat_actual,
      'total_aportat' => $aportat_pagament_total
    ];

    $resum_pagament = [
      'entity' => 'Família',
      'nom' => $recibo['nom_complet'],
      'grup' => 'FAMÍLIA',
      'edat' => count($familiarMembers),
      'total_a_pagar' => $total_pagament,
      'aportat_previamente' => $total_aportat_previo_family,
      'aporte_actual' => $quantitat_actual,
      'total_aportado' => $aportat_pagament_total,
      'falta_por_aportar' => $falta_per_aporar_family = $falta_per_aportar_family,
      'porcentaje_completado' => $total_pagament > 0 ? round(($aportat_pagament_total / $total_pagament) * 100, 2) : 0,
      'estado' => $falta_per_aportar_family <= 0 ? 'COMPLETADO' : 'PENDIENTE'
    ];

    $conn->close();
    echo json_encode([
      'success' => true,
      'message' => 'Pagament de família distribuït entre membres correctament',
      'inserted_ids' => $inserted_ids,
      'recibo' => $recibo,
      'resum_pagament' => $resum_pagament
    ], JSON_UNESCAPED_UNICODE);
    exit;
  }

  // Build INSERT statement dynamically depending on whether pagaments.id_familia exists
  $m = mb_strtolower($metode_pagament);
  if ($m === 'transferència') $m = 'transferencia';

  $id_faller_param = $id_faller > 0 ? $id_faller : null;
  $id_familia_param = $id_familia > 0 ? $id_familia : null;

  // If paying an individual faller, and the DB supports id_familia, set id_familia_param
  if ($id_faller > 0 && !$id_familia_param && isset($faller['familia_id']) && $faller['familia_id']) {
    if ($has_id_familia) {
      $id_familia_param = (int)$faller['familia_id'];
    }
  }

  if ($has_id_familia) {
    // Prepare different INSERT variants to avoid binding NULL into integer placeholders
    if ($id_faller_param !== null && $id_familia_param !== null) {
      $sql = "INSERT INTO pagaments (
                id_faller, id_familia, comentaris, quantitat, data_pagament, metode_pagament,
                total_pagament, aportat_pagament, falta_per_aportar, data_aportacio
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      $stmt = $conn->prepare($sql);
      if (!$stmt) throw new Exception('Prepare: ' . $conn->error);
      if (!$stmt->bind_param('iisdssddds', $id_faller_param, $id_familia_param, $comentaris, $quantitat, $data_pagament, $m, $total_pagament, $aportat_pagament, $falta_per_aportar, $data_aportacio)) {
        throw new Exception('bind_param failed: ' . $stmt->error);
      }
    } elseif ($id_faller_param === null && $id_familia_param !== null) {
      $sql = "INSERT INTO pagaments (
                id_faller, id_familia, comentaris, quantitat, data_pagament, metode_pagament,
                total_pagament, aportat_pagament, falta_per_aportar, data_aportacio
              ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
      $stmt = $conn->prepare($sql);
      if (!$stmt) throw new Exception('Prepare (id_faller NULL): ' . $conn->error);
      if (!$stmt->bind_param('isdssddds', $id_familia_param, $comentaris, $quantitat, $data_pagament, $m, $total_pagament, $aportat_pagament, $falta_per_aportar, $data_aportacio)) {
        throw new Exception('bind_param failed (id_faller NULL): ' . $stmt->error);
      }
    } elseif ($id_faller_param !== null && $id_familia_param === null) {
      $sql = "INSERT INTO pagaments (
                id_faller, id_familia, comentaris, quantitat, data_pagament, metode_pagament,
                total_pagament, aportat_pagament, falta_per_aportar, data_aportacio
              ) VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)";
      $stmt = $conn->prepare($sql);
      if (!$stmt) throw new Exception('Prepare (id_familia NULL): ' . $conn->error);
      if (!$stmt->bind_param('isdssddds', $id_faller_param, $comentaris, $quantitat, $data_pagament, $m, $total_pagament, $aportat_pagament, $falta_per_aportar, $data_aportacio)) {
        throw new Exception('bind_param failed (id_familia NULL): ' . $stmt->error);
      }
    } else {
      // Both NULL should not happen due to earlier validation, but handle defensively
      $sql = "INSERT INTO pagaments (
                id_faller, id_familia, comentaris, quantitat, data_pagament, metode_pagament,
                total_pagament, aportat_pagament, falta_per_aportar, data_aportacio
              ) VALUES (NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?)";
      $stmt = $conn->prepare($sql);
      if (!$stmt) throw new Exception('Prepare (both NULL): ' . $conn->error);
      if (!$stmt->bind_param('sdssddds', $comentaris, $quantitat, $data_pagament, $m, $total_pagament, $aportat_pagament, $falta_per_aportar, $data_aportacio)) {
        throw new Exception('bind_param failed (both NULL): ' . $stmt->error);
      }
    }
  } else {
    $sql = "INSERT INTO pagaments (
              id_faller, comentaris, quantitat, data_pagament, metode_pagament,
              total_pagament, aportat_pagament, falta_per_aportar, data_aportacio
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)";
    $stmt = $conn->prepare($sql);
    if (!$stmt) throw new Exception('Prepare (fallback): ' . $conn->error);
    if (!$stmt->bind_param('isdssddds', $id_faller_param, $comentaris, $quantitat, $data_pagament, $m, $total_pagament, $aportat_pagament, $falta_per_aportar, $data_aportacio)) {
      throw new Exception('bind_param failed (fallback): ' . $stmt->error);
    }
  }

  if (!$stmt->execute()) throw new Exception('Error al insertar: ' . $stmt->error);

  // Handle family-payment fallback when DB has no id_familia: distribute amount across members
  if ($id_familia > 0 && !$has_id_familia) {
    // We already fetched $familiarMembers earlier when id_familia > 0
    if (empty($familiarMembers)) {
      // No members found, nothing to distribute
    } else {
      // Calculate each member quota
      $shares = [];
      $remaining = $quantitat;
      $accum = 0.0;
      // Compute raw shares proportional to each member's quota
      foreach ($familiarMembers as $i => $member) {
        $member_quota = calcular_total_pagament($member['grup'], (int)$member['edat']);
        $share = ($total_pagament > 0) ? round($quantitat * ($member_quota / $total_pagament), 2) : round($quantitat / count($familiarMembers), 2);
        $shares[$i] = ['id' => (int)$member['id'], 'quota' => $member_quota, 'share' => $share];
        $accum += $share;
      }
      // Adjust rounding difference on last member
      $diff = round($quantitat - $accum, 2);
      if ($diff != 0) {
        $lastIndex = count($shares) - 1;
        $shares[$lastIndex]['share'] = round($shares[$lastIndex]['share'] + $diff, 2);
      }

      // Prepare fallback insert (per faller)
      $insert_stmt = $conn->prepare('INSERT INTO pagaments (id_faller, comentaris, quantitat, data_pagament, metode_pagament, total_pagament, aportat_pagament, falta_per_aportar, data_aportacio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)');
      if (!$insert_stmt) throw new Exception('Prepare distribucion fallback: ' . $conn->error);

      foreach ($shares as $s) {
        $member_id = $s['id'];
        $member_quota = $s['quota'];
        $member_share = $s['share'];

        // previous paid by this member
        $stmt_prev = $conn->prepare('SELECT SUM(quantitat) as total FROM pagaments WHERE id_faller = ?');
        $stmt_prev->bind_param('i', $member_id);
        $stmt_prev->execute();
        $res_prev = $stmt_prev->get_result();
        $row_prev = $res_prev ? $res_prev->fetch_assoc() : null;
        $prev_total = (float)($row_prev['total'] ?? 0);
        $stmt_prev->close();

        $falta_member = max(0, round($member_quota - ($prev_total + $member_share), 2));

        $t_types = 'isdssddds';
        if (!$insert_stmt->bind_param($t_types, $member_id, $comentaris, $member_share, $data_pagament, $m, $member_quota, $member_share, $falta_member, $data_aportacio)) {
          throw new Exception('bind_param distribucion failed: ' . $insert_stmt->error);
        }
        if (!$insert_stmt->execute()) {
          throw new Exception('Error al insertar distribucion: ' . $insert_stmt->error);
        }
      }
      $insert_stmt->close();
    }
  }

  $insert_id = $stmt->insert_id;
  $stmt->close();
  $conn->close();

  $recibo_nombre = $id_familia > 0 ? "Família $familyName" : ($faller['nom'] . ' ' . $faller['cognoms']);
  $recibo_dni = $id_familia > 0 ? '' : $faller['dni'];
  $entity_name = $id_familia > 0 ? 'Família' : 'Faller';
  $entity_group = $id_familia > 0 ? 'FAMÍLIA' : $grup;
  $entity_age = $id_familia > 0 ? count($familiarMembers) : $edat;

  echo json_encode([
    'success' => true,
    'message' => 'Pagament registrat correctament',
    'id' => $insert_id,
    'recibo' => [
      'nom_complet' => $recibo_nombre,
      'dni' => $recibo_dni,
      'comentaris' => $comentaris,
      'data_pagament' => $data_pagament,
      'metode_pagament' => $metode_pagament,
      'total_pagament' => $total_pagament,
      'aportat_anterior' => $total_aportat_previo,
      'quantitat_pagada' => $quantitat_actual,
      'total_aportat' => $aportat_pagament_total
    ],
    'resum_pagament' => [
      'entity' => $entity_name,
      'nom' => $recibo_nombre,
      'grup' => $entity_group,
      'edat' => $entity_age,
      'total_a_pagar' => $total_pagament,
      'aportat_previamente' => $total_aportat_previo,
      'aporte_actual' => $quantitat_actual,
      'total_aportado' => $aportat_pagament_total,
      'falta_por_aportar' => $falta_per_aportar,
      'porcentaje_completado' => $total_pagament > 0 ? round(($aportat_pagament_total / $total_pagament) * 100, 2) : 0,
      'estado' => $falta_per_aportar <= 0 ? 'COMPLETADO' : 'PENDIENTE'
    ]
  ], JSON_UNESCAPED_UNICODE);
} catch (Exception $e) {
  http_response_code(400);
  echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
?>
