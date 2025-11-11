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

require_once 'config.php';

if (!$conexion) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de connexió a la base de dades'
    ]);
    exit;
}

// Consulta para obtener los fallers agrupados con su porcentaje de pago
$query = "SELECT 
            f.id,
            f.nom,
            f.cognoms,
            CONCAT(f.nom, ' ', f.cognoms) as nom_complet,
            datos.total_pagament,
            datos.aportat_pagament,
            ROUND((datos.aportat_pagament / datos.total_pagament * 100), 2) as percentatge
          FROM fallers f
          INNER JOIN (
            SELECT 
              id_faller,
              MAX(total_pagament) as total_pagament,
              SUM(quantitat) as aportat_pagament
            FROM pagaments
            GROUP BY id_faller
          ) as datos ON f.id = datos.id_faller
          WHERE datos.total_pagament > 0
          ORDER BY percentatge DESC, f.cognoms, f.nom";

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
    $faller = [
        'id' => intval($row['id']),
        'nom_complet' => $row['nom_complet'],
        'total_pagament' => floatval($row['total_pagament']),
        'aportat_pagament' => floatval($row['aportat_pagament']),
        'percentatge' => floatval($row['percentatge'])
    ];
    
    if ($faller['percentatge'] >= 80) {
        $amb_80[] = $faller;
    } else {
        $sense_80[] = $faller;
    }
}

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
