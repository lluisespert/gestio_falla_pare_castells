<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
require_once 'config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Recoger datos del formulario
$input = json_decode(file_get_contents('php://input'), true);

$nom = $input['nom'] ?? '';
$cognoms = $input['cognoms'] ?? '';
$domicili = $input['domicili'] ?? '';
$telefon = $input['telefon'] ?? '';
$dni = $input['dni'] ?? '';
$data_naixement = $input['data_naixement'] ?? '';
$email = $input['email'] ?? '';
$edat = $input['edat'] ?? '';
$grup_colaborador = $input['grup_colaborador'] ?? '';
$data_alta = $input['data_alta'] ?? '';

// Validación básica
$campos = [
    'nom', 'cognoms', 'domicili', 'telefon', 'dni', 'data_naixement', 'email', 'edat', 'grup_colaborador', 'data_alta'
];
$campos_vacios = [];
foreach ($campos as $campo) {
    if (empty($input[$campo])) {
        $campos_vacios[] = $campo;
    }
}
if (count($campos_vacios) > 0) {
    echo json_encode(['success' => false, 'message' => 'Faltan datos obligatorios: ' . implode(', ', $campos_vacios)]);
    exit;
}

// Conexión a la base de datos usando config.php
$conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($conn->connect_error) {
    echo json_encode([
        "success" => false,
        "message" => "Conexión fallida: " . $conn->connect_error
    ]);
    exit;
}

$stmt = $conn->prepare("INSERT INTO fallers (nom, cognoms, domicili, telefon, dni, data_naixement, email, edat, grup_colaborador, data_alta) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
if (!$stmt) {
    echo json_encode(['success' => false, 'message' => 'Error en prepare: ' . $conn->error]);
    $conn->close();
    exit;
}
$stmt->bind_param("sss", $nom, $cognoms, $domicili, $telefon, $dni, $data_naixement, $email, $edat, $grup_colaborador, $data_alta);

if ($stmt->execute()) {
    echo json_encode(['success' => true, 'message' => 'Faller insertado correctamente']);
    $stmt->close();
    $conn->close();
    exit;
} else {
    echo json_encode(['success' => false, 'message' => 'Error al insertar: ' . $stmt->error]);
    $stmt->close();
    $conn->close();
    exit;
}
?>
