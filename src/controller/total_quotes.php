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

// Consulta que agrupa por usuario para evitar duplicar el total_pagament
$query = "SELECT 
            COALESCE(SUM(datos.total_pagament), 0) as total_pagament,
            COALESCE(SUM(datos.aportat_total), 0) as aportat_pagament,
            COUNT(DISTINCT datos.id_faller) as total_fallers
          FROM (
            SELECT 
              id_faller,
              MAX(total_pagament) as total_pagament,
              SUM(quantitat) as aportat_total
            FROM pagaments
            GROUP BY id_faller
          ) as datos";

$result = $conexion->query($query);

if (!$result) {
    echo json_encode([
        'success' => false,
        'message' => 'Error en la consulta: ' . $conexion->error
    ]);
    exit;
}

$row = $result->fetch_assoc();

$total_pagament = floatval($row['total_pagament']);
$aportat_pagament = floatval($row['aportat_pagament']);
$falta_per_aportar = $total_pagament - $aportat_pagament;

echo json_encode([
    'success' => true,
    'data' => [
        'total_pagament' => $total_pagament,
        'aportat_pagament' => $aportat_pagament,
        'falta_per_aportar' => $falta_per_aportar,
        'total_fallers' => intval($row['total_fallers'])
    ]
]);

$conexion->close();
?>