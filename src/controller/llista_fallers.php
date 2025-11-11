<?php
// Limpiar cualquier output previo
if (ob_get_level()) {
    ob_end_clean();
}

// Desactivar errores que contaminen JSON
ini_set('display_errors', 0);
error_reporting(0);

// Cabeceras CORS
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejo de preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    // Cargar configuración
    require_once __DIR__ . '/config.php';
    
    // Verificar constantes de BD
    if (!defined('DB_HOST') || !defined('DB_USER') || !defined('DB_PASS') || !defined('DB_NAME')) {
        throw new Exception('Constantes de base de datos no definidas');
    }
    
    // Conexión a la base de datos
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        throw new Exception('Error de conexión: ' . $conn->connect_error);
    }
    $conn->set_charset('utf8mb4');

    // Consulta
    $sql = "SELECT 
                id, 
                nom, 
                cognoms, 
                domicili, 
                telefon, 
                dni, 
                DATE_FORMAT(data_naixement, '%Y-%m-%d') AS data_naixement, 
                email, 
                edat, 
                `grup`, 
                colaborador,
                categoria, 
                DATE_FORMAT(data_alta, '%Y-%m-%d') AS data_alta 
            FROM fallers 
            ORDER BY id DESC";
            
    $result = $conn->query($sql);
    if ($result === false) {
        throw new Exception('Error en la consulta: ' . $conn->error);
    }

    // Procesar resultados
    $rows = [];
    while ($r = $result->fetch_assoc()) {
        // Normalizar tipos de datos
        $r['id'] = (int)$r['id'];
        $r['edat'] = isset($r['edat']) ? (int)$r['edat'] : null;
        $r['colaborador'] = (int)$r['colaborador'];
        $rows[] = $r;
    }

    $result->free();
    $conn->close();

    // Respuesta JSON
    echo json_encode([
        'success' => true, 
        'count' => count($rows), 
        'data' => $rows,
        'message' => 'Fallers obtenidos correctamente'
    ], JSON_UNESCAPED_UNICODE);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'message' => 'Error del servidor: ' . $e->getMessage(),
        'data' => []
    ], JSON_UNESCAPED_UNICODE);
}
?>