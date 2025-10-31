<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

try {
    // Preparar la consulta con JOIN para obtener información del faller
    $sql = "SELECT 
                p.id,
                p.id_faller,
                p.comentaris,
                p.quantitat,
                p.data_pagament,
                p.metode_pagament,
                p.total_pagament,
                p.aportat_pagament,
                p.falta_per_aportar,
                p.data_aportacio,
                f.nom,
                f.cognoms,
                f.dni
            FROM pagaments p 
            INNER JOIN fallers f ON p.id_faller = f.id 
            ORDER BY p.data_pagament DESC, p.id DESC";
    
    $result = $conexion->query($sql);
    
    if (!$result) {
        throw new Exception("Error en la consulta: " . $conexion->error);
    }
    
    $pagaments = [];
    
    // Obtener todos los registros
    while ($row = $result->fetch_assoc()) {
        // Formatear fechas
        if ($row['data_pagament']) {
            $row['data_pagament_formatted'] = date('d/m/Y', strtotime($row['data_pagament']));
        }
        if ($row['data_aportacio']) {
            $row['data_aportacio_formatted'] = date('d/m/Y', strtotime($row['data_aportacio']));
        }
        
        // Formatear decimales
        $row['quantitat'] = number_format((float)$row['quantitat'], 2, '.', '');
        $row['total_pagament'] = number_format((float)$row['total_pagament'], 2, '.', '');
        $row['aportat_pagament'] = number_format((float)$row['aportat_pagament'], 2, '.', '');
        $row['falta_per_aportar'] = number_format((float)$row['falta_per_aportar'], 2, '.', '');
        
        // Nombre completo del faller
        $row['nom_complet'] = $row['nom'] . ' ' . $row['cognoms'];
        
        $pagaments[] = $row;
    }

    echo json_encode([
        'success' => true,
        'data' => $pagaments,
        'total' => count($pagaments),
        'message' => 'Pagaments obtinguts correctament'
    ], JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error del servidor: ' . $e->getMessage(),
        'data' => []
    ], JSON_UNESCAPED_UNICODE);
} finally {
    if (isset($conexion)) {
        $conexion->close();
    }
}
?>