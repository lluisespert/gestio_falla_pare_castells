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

// Consulta de todos los fallers y sus aportaciones acumuladas (si existen).
$query = "SELECT 
            f.id,
            f.edat,
            f.grup,
            COALESCE(p.aportat_total, 0) as aportat_total
          FROM fallers f
          LEFT JOIN (
            SELECT id_faller, SUM(quantitat) as aportat_total
            FROM pagaments
            GROUP BY id_faller
          ) p ON p.id_faller = f.id";

$result = $conexion->query($query);

if (!$result) {
    echo json_encode([
        'success' => false,
        'message' => 'Error en la consulta: ' . $conexion->error
    ]);
    exit;
}

$total_pagament = 0.0;
$aportat_pagament = 0.0;
$total_fallers = 0;

while ($row = $result->fetch_assoc()) {
    $total_fallers++;
    $total_pagament += calcular_total_pagament($row['grup'], (int)$row['edat']);
    $aportat_pagament += floatval($row['aportat_total']);
}

$falta_per_aportar = max(0, $total_pagament - $aportat_pagament);

echo json_encode([
    'success' => true,
    'data' => [
        'total_pagament' => $total_pagament,
        'aportat_pagament' => $aportat_pagament,
        'falta_per_aportar' => $falta_per_aportar,
        'total_fallers' => $total_fallers
    ]
]);

$conexion->close();
?>
