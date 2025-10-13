<?php
define('DB_HOST', 'localhost');
define('DB_NAME', 'pare_castells');
define('DB_USER', 'lluisespert');
define('DB_PASS', 'Andillaa1b2c3d4!');

$conexion = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conexion->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "Conexión fallida: " . $conexion->connect_error
    ]);
    exit;
}
?>