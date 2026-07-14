<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Deshabilitar la visualización de errores en la salida
ini_set('display_errors', 0);
error_reporting(0);

require_once __DIR__ . '/config.php';
require_once __DIR__ . '/tarifes_pagament.php';

if (!$conexion) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de connexió a la base de dades'
    ]);
    exit;
}

// Consulta de aportaciones por faller.
$query = "SELECT 
            f.id,
            f.nom,
            f.cognoms,
            CONCAT(f.nom, ' ', f.cognoms) as nom_complet,
            f.edat,
            f.grup,
            datos.aportat_pagament
          FROM fallers f
          INNER JOIN (
            SELECT 
              id_faller,
              SUM(quantitat) as aportat_pagament
            FROM pagaments
            GROUP BY id_faller
          ) as datos ON f.id = datos.id_faller
          ORDER BY f.cognoms, f.nom";

$result = $conexion->query($query);

if (!$result) {
    echo json_encode([
        'success' => false,
        'message' => 'Error en la consulta: ' . $conexion->error
    ]);
    exit;
}

$amb_80 = [];
$sense_80 = [];

while ($row = $result->fetch_assoc()) {
    $total_pagament = calcular_total_pagament($row['grup'], (int)$row['edat']);
    $aportat_pagament = floatval($row['aportat_pagament']);
    $percentatge = $total_pagament > 0 ? round(($aportat_pagament / $total_pagament) * 100, 2) : 0.0;

    $faller = [
        'id' => intval($row['id']),
        'nom_complet' => $row['nom_complet'],
        'total_pagament' => floatval($total_pagament),
        'aportat_pagament' => $aportat_pagament,
        'percentatge' => $percentatge
    ];
    
    if ($faller['percentatge'] >= 80) {
        $amb_80[] = $faller;
    } else {
        $sense_80[] = $faller;
    }
}

$families = [];
$sql_families = "SELECT id, apellidos FROM familias ORDER BY apellidos";
$result_families = $conexion->query($sql_families);
if ($result_families) {
    while ($fam = $result_families->fetch_assoc()) {
        $family_id = (int)$fam['id'];

        $stmt_members = $conexion->prepare('SELECT id, grup, edat FROM fallers WHERE familia_id = ?');
        $stmt_members->bind_param('i', $family_id);
        $stmt_members->execute();
        $members_res = $stmt_members->get_result();

        $total_quota = 0.0;
        $member_ids = [];
        while ($member_row = $members_res->fetch_assoc()) {
            $total_quota += calcular_total_pagament($member_row['grup'], (int)$member_row['edat']);
            $member_ids[] = (int)$member_row['id'];
        }
        $stmt_members->close();

        $total_pay = 0.0;
        // Some installations may not have the `id_familia` column in `pagaments`.
        // Detect column existence and use a compatible query to avoid SQL errors.
        $has_id_familia = false;
        $colCheck = $conexion->query("SHOW COLUMNS FROM pagaments LIKE 'id_familia'");
        if ($colCheck && $colCheck->num_rows > 0) {
            $has_id_familia = true;
        }

        if ($has_id_familia) {
            $sql_family_pay = 'SELECT SUM(quantitat) as total FROM pagaments WHERE id_familia = ? OR id_faller IN (SELECT id FROM fallers WHERE familia_id = ?)';
            $stmt_family_pay = $conexion->prepare($sql_family_pay);
            if ($stmt_family_pay) {
                $stmt_family_pay->bind_param('ii', $family_id, $family_id);
                $stmt_family_pay->execute();
                $family_pay_res = $stmt_family_pay->get_result();
                $family_pay_row = $family_pay_res ? $family_pay_res->fetch_assoc() : null;
                $stmt_family_pay->close();
                $total_pay = (float)($family_pay_row['total'] ?? 0);
            } else {
                // Fallback to using only payments by faller if prepare failed for any reason
                $stmt_family_pay = $conexion->prepare('SELECT SUM(quantitat) as total FROM pagaments WHERE id_faller IN (SELECT id FROM fallers WHERE familia_id = ?)');
                $stmt_family_pay->bind_param('i', $family_id);
                $stmt_family_pay->execute();
                $family_pay_res = $stmt_family_pay->get_result();
                $family_pay_row = $family_pay_res ? $family_pay_res->fetch_assoc() : null;
                $stmt_family_pay->close();
                $total_pay = (float)($family_pay_row['total'] ?? 0);
            }
        } else {
            // Table doesn't have id_familia column: sum payments for fallers in the family
            $stmt_family_pay = $conexion->prepare('SELECT SUM(quantitat) as total FROM pagaments WHERE id_faller IN (SELECT id FROM fallers WHERE familia_id = ?)');
            $stmt_family_pay->bind_param('i', $family_id);
            $stmt_family_pay->execute();
            $family_pay_res = $stmt_family_pay->get_result();
            $family_pay_row = $family_pay_res ? $family_pay_res->fetch_assoc() : null;
            $stmt_family_pay->close();
            $total_pay = (float)($family_pay_row['total'] ?? 0);
        }
        $percentatge_fam = $total_quota > 0 ? round(($total_pay / $total_quota) * 100, 2) : 0.0;

        $families[] = [
            'id' => $family_id,
            'nom_complet' => $fam['apellidos'],
            'total_pagament' => floatval($total_quota),
            'aportat_pagament' => $total_pay,
            'percentatge' => $percentatge_fam
        ];
    }
}

$amb_80_fam = [];
$sense_80_fam = [];
foreach ($families as $family) {
    if ($family['percentatge'] >= 80) {
        $amb_80_fam[] = $family;
    } else {
        $sense_80_fam[] = $family;
    }
}

usort($amb_80, fn($a, $b) => $b['percentatge'] <=> $a['percentatge']);
usort($sense_80, fn($a, $b) => $b['percentatge'] <=> $a['percentatge']);
usort($amb_80_fam, fn($a, $b) => $b['percentatge'] <=> $a['percentatge']);
usort($sense_80_fam, fn($a, $b) => $b['percentatge'] <=> $a['percentatge']);

echo json_encode([
    'success' => true,
    'data' => [
        'amb_80' => $amb_80,
        'sense_80' => $sense_80,
        'total_amb_80' => count($amb_80),
        'total_sense_80' => count($sense_80),
        'amb_80_families' => $amb_80_fam,
        'sense_80_families' => $sense_80_fam,
        'total_amb_80_families' => count($amb_80_fam),
        'total_sense_80_families' => count($sense_80_fam)
    ]
]);

$conexion->close();
?>
