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

usort($amb_80, fn($a, $b) => $b['percentatge'] <=> $a['percentatge']);
usort($sense_80, fn($a, $b) => $b['percentatge'] <=> $a['percentatge']);

echo json_encode([
    'success' => true,
    'data' => [
        'amb_80' => $amb_80,
        'sense_80' => $sense_80,
        'total_amb_80' => count($amb_80),
        'total_sense_80' => count($sense_80)
    ]
]);

$conexion->close();
?>
