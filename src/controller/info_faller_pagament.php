<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

ini_set('display_errors', 0);
error_reporting(0);

require_once 'config.php';

$id_faller = isset($_GET['id_faller']) ? intval($_GET['id_faller']) : 0;

if ($id_faller <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'ID del faller no vàlid'
    ]);
    exit;
}

if (!$conexion) {
    echo json_encode([
        'success' => false,
        'message' => 'Error de connexió a la base de dades'
    ]);
    exit;
}

// Obtener información del faller y sus pagos
$query = "SELECT 
            f.id,
            f.nom,
            f.cognoms,
            CONCAT(f.nom, ' ', f.cognoms) as nom_complet,
            f.dni,
            COALESCE(p.total_pagament, 0) as total_pagament,
            COALESCE(p.aportat_pagament, 0) as aportat_pagament,
            COALESCE(p.total_pagament - p.aportat_pagament, 0) as falta_per_aportar
          FROM fallers f
          LEFT JOIN (
            SELECT 
              id_faller,
              MAX(total_pagament) as total_pagament,
              SUM(quantitat) as aportat_pagament
            FROM pagaments
            WHERE id_faller = ?
            GROUP BY id_faller
          ) p ON f.id = p.id_faller
          WHERE f.id = ?";

$stmt = $conexion->prepare($query);
$stmt->bind_param("ii", $id_faller, $id_faller);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Faller no trobat'
    ]);
    exit;
}

$row = $result->fetch_assoc();

echo json_encode([
    'success' => true,
    'data' => [
        'id' => intval($row['id']),
        'nom_complet' => $row['nom_complet'],
        'dni' => $row['dni'],
        'total_pagament' => floatval($row['total_pagament']),
        'aportat_pagament' => floatval($row['aportat_pagament']),
        'falta_per_aportar' => floatval($row['falta_per_aportar'])
    ]
]);

$stmt->close();
$conexion->close();
?>
