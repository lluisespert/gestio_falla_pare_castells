<?php
ini_set('display_errors', 0);
error_reporting(0);

require_once __DIR__ . '/config.php';

// Cabeceras
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

try {
    // Conexión
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        throw new Exception('Error de conexión: ' . $conn->connect_error);
    }
    $conn->set_charset('utf8mb4');

    // Consulta
    $sql = "SELECT id, nom, cognoms, domicili, telefon, dni, DATE_FORMAT(data_naixement, '%Y-%m-%d') AS data_naixement, email, edat, `grup`, colaborador, DATE_FORMAT(data_alta, '%Y-%m-%d') AS data_alta FROM fallers ORDER BY id DESC";
    $result = $conn->query($sql);
    if ($result === false) {
        throw new Exception('Error en la consulta: ' . $conn->error);
    }

    $rows = [];
    while ($r = $result->fetch_assoc()) {
        // normalizar tipos
        $r['id'] = (int)$r['id'];
        $r['edat'] = isset($r['edat']) ? (int)$r['edat'] : null;
        $r['colaborador'] = (int)$r['colaborador'];
        $rows[] = $r;
    }

    $result->free();
    $conn->close();

    // Si se solicita formato HTML lo mostramos en tabla para ver en navegador
    $format = isset($_GET['format']) ? strtolower($_GET['format']) : 'json';
    if ($format === 'html') {
        ?>
        <!doctype html>
        <html lang="es">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>Listado de Fallers</title>
          <style>
            body{font-family:Inter,Segoe UI,Roboto,Arial;background:#f6f9fc;padding:24px;color:#0b1a2b}
            table{width:100%;border-collapse:collapse;background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 8px 30px rgba(2,6,23,0.08)}
            th,td{padding:10px 12px;text-align:left;border-bottom:1px solid #eef3f8;font-size:14px}
            th{background:linear-gradient(90deg,#f8fafc,#eef6fb);font-weight:700;color:#08415c}
            tr:hover td{background:#fbfdff}
            .badge{display:inline-block;padding:4px 8px;border-radius:999px;font-size:12px}
            .yes{background:#dcfce7;color:#064e3b}
            .no{background:#fff1f2;color:#7f1d1d;border:1px solid #ffdde0}
            .wrap{max-width:1200px;margin:0 auto;}
            h1{margin-bottom:12px}
          </style>
        </head>
        <body>
          <div class="wrap">
            <h1>Listado de Fallers (<?= count($rows) ?>)</h1>
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Nombre</th><th>Apellidos</th><th>Domicilio</th><th>Tel</th><th>DNI</th><th>FNacimiento</th><th>Email</th><th>Edat</th><th>Grup</th><th>Colaborador</th><th>Data alta</th>
                </tr>
              </thead>
              <tbody>
                <?php foreach ($rows as $r): ?>
                  <tr>
                    <td><?= htmlspecialchars($r['id']) ?></td>
                    <td><?= htmlspecialchars($r['nom']) ?></td>
                    <td><?= htmlspecialchars($r['cognoms']) ?></td>
                    <td><?= htmlspecialchars($r['domicili']) ?></td>
                    <td><?= htmlspecialchars($r['telefon']) ?></td>
                    <td><?= htmlspecialchars($r['dni']) ?></td>
                    <td><?= htmlspecialchars($r['data_naixement']) ?></td>
                    <td><?= htmlspecialchars($r['email']) ?></td>
                    <td><?= htmlspecialchars($r['edat']) ?></td>
                    <td><?= htmlspecialchars($r['grup']) ?></td>
                    <td><span class="badge <?= $r['colaborador'] ? 'yes' : 'no' ?>"><?= $r['colaborador'] ? 'Sí' : 'No' ?></span></td>
                    <td><?= htmlspecialchars($r['data_alta']) ?></td>
                  </tr>
                <?php endforeach; ?>
              </tbody>
            </table>
          </div>
        </body>
        </html>
        <?php
        exit;
    }

    // Respuesta JSON por defecto
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => true, 'count' => count($rows), 'data' => $rows], JSON_UNESCAPED_UNICODE);
    exit;
} catch (Exception $e) {
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
    exit;
}
?>