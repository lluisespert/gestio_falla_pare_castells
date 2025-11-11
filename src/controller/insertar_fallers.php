<?php
ini_set('display_errors', 0);
error_reporting(0);

require_once __DIR__ . '/config.php';

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Origin, Accept');

// Responder OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

try {
    $input = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('JSON incorrecto: ' . json_last_error_msg());
    }

    // Mapear posibles nombres de campos (cat / es / en)
    $nom = $input['nom'] ?? $input['nombre'] ?? $input['name'] ?? '';
    $cognoms = $input['cognoms'] ?? $input['apellidos'] ?? $input['lastname'] ?? '';
    $domicili = $input['domicili'] ?? $input['domicilio'] ?? $input['address'] ?? '';
    $telefon = $input['telefon'] ?? $input['telefono'] ?? $input['phone'] ?? '';
    $dni = $input['dni'] ?? $input['nif'] ?? $input['documento'] ?? '';
    $data_naixement = $input['data_naixement'] ?? $input['fecha_nacimiento'] ?? $input['birth_date'] ?? '';
    $email = $input['email'] ?? '';
    $edat = isset($input['edat']) ? (int)$input['edat'] : (isset($input['edad']) ? (int)$input['edad'] : null);
    $grup = $input['grup'] ?? $input['grupo'] ?? $input['grupo_colaborador'] ?? $input['group'] ?? '';
    // colaborar puede venir como booleano, string "true"/"false" o 0/1
    if (isset($input['colaborador'])) {
        $colaborador = $input['colaborador'];
    } elseif (isset($input['colaborator'])) {
        $colaborador = $input['colaborator'];
    } elseif (isset($input['is_colaborador'])) {
        $colaborador = $input['is_colaborador'];
    } else {
        $colaborador = 0;
    }
    // Normalizar colaborador a 0/1
    if (is_bool($colaborador)) {
        $colaborador = $colaborador ? 1 : 0;
    } elseif (is_string($colaborador)) {
        $lc = strtolower($colaborador);
        $colaborador = ($lc === 'true' || $lc === '1' || $lc === 'yes') ? 1 : 0;
    } else {
        $colaborador = (int)$colaborador;
        $colaborador = $colaborador ? 1 : 0;
    }
    $data_alta = $input['data_alta'] ?? $input['fecha_alta'] ?? $input['signup_date'] ?? '';

    // Añadir categoria (Home, Dona, Xiquet, Xiqueta)
    $categoria = $input['categoria'] ?? $input['category'] ?? 'Home';

    // Validación básica (exigir los campos que la tabla no acepta nulos)
    $required = [
        'nom' => $nom,
        'cognoms' => $cognoms,
        'domicili' => $domicili,
        'telefon' => $telefon,
        'dni' => $dni,
        'data_naixement' => $data_naixement,
        'email' => $email,
        'edat' => $edat,
        'grup' => $grup,
        'colaborador' => $colaborador,
        'data_alta' => $data_alta,
        'categoria' => $categoria
    ];
    $missing = [];
    foreach ($required as $k => $v) {
        if ($v === '' || $v === null) {
            $missing[] = $k;
        }
    }
    if (count($missing) > 0) {
        throw new Exception('Faltan campos obligatorios: ' . implode(', ', $missing));
    }

    // Conexión
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        throw new Exception('Error de conexión: ' . $conn->connect_error);
    }
    $conn->set_charset('utf8mb4');

    // Preparar INSERT acorde a la estructura bbdd.sql
    $sql = "INSERT INTO fallers 
        (nom, cognoms, domicili, telefon, dni, data_naixement, email, edat, grup, colaborador, data_alta, categoria)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        throw new Exception('Error en prepare: ' . $conn->error);
    }

    // Tipos: 7 strings, edat int, grup string, colaborador int, data_alta string, categoria string => "sssssssissis"
    $types = "sssssssissis";
    if (!$stmt->bind_param(
        $types,
        $nom, $cognoms, $domicili, $telefon, $dni,
        $data_naixement, $email, $edat, $grup, $colaborador, $data_alta, $categoria
    )) {
        throw new Exception('Error en bind_param: ' . $stmt->error);
    }

    if (!$stmt->execute()) {
        throw new Exception('Error al insertar: ' . $stmt->error);
    }

    echo json_encode(['success' => true, 'message' => 'Registro insertado', 'insert_id' => $stmt->insert_id]);

    $stmt->close();
    $conn->close();
} catch (Exception $e) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}
?>