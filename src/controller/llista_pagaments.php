<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once 'config.php';

// Importar funciones de cálculo de tarifas de insertar_pagament.php
function remove_accents($str) {
  $str = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', $str);
  return $str === false ? '' : $str;
}

function norm($s) {
  $s = mb_strtolower(trim($s));
  $s = remove_accents($s);
  $s = preg_replace('/\s+/', ' ', $s);
  return $s;
}

function calcular_total($grup, $edat) {
  $g = norm($grup);

  // ========== PRIORIDAD 1: GRUPOS ESPECIALES (independiente de edad) ==========
  
  // Grup: Fallers/falleres de brussó - siempre 400€
  $grup_original_lower = mb_strtolower($grup);
  $grup_sin_acentos = remove_accents($grup_original_lower);
  
  $variaciones_brusso = [
    'brussó', 'brusso', 'brusson', 'brasso', 'bruso', 'brusó',
    'fallers de brussó', 'falleres de brussó', 'fallers de brusso', 
    'falleres de brusso', 'fallers/falleres de brussó', 'fallers/falleres de brusso',
    'fallers falleres de brussó', 'fallers falleres de brusso'
  ];
  
  foreach ($variaciones_brusso as $variacion) {
    if (strpos($grup_original_lower, $variacion) !== false || 
        strpos($grup_sin_acentos, remove_accents($variacion)) !== false ||
        strpos($g, remove_accents($variacion)) !== false) {
      return 400.00;
    }
  }
  
  // Detección de emergencia para brussó
  if (preg_match('/bru[sç]*/i', $grup) || preg_match('/bru[sç]*/i', $g)) {
    return 400.00;
  }
  
  // Grup: Fallers d'honor - siempre 100€
  if (strpos($g, "fallers d'honor") !== false || strpos($g, 'fallers dhonor') !== false) {
    return 100.00;
  }
  
  // Grup: Familiar de faller/fallera - siempre 300€
  if (strpos($g, 'familiar de faller/fallera') !== false || strpos($g, 'familiar de faller fallera') !== false) {
    return 300.00;
  }

  // Resto de lógica por edad...
  if ($edat >= 18 && $edat <= 25) {
    return 425.00;
  }
  
  if ($edat >= 26) {
    return 575.00;
  }
  
  return 200.00; // Por defecto
}

try {
    // Consulta mejorada que incluye grup y edat del faller
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
                f.dni,
                f.edat,
                f.grup
            FROM pagaments p 
            INNER JOIN fallers f ON p.id_faller = f.id 
            ORDER BY p.data_pagament DESC, p.id DESC";
    
    $result = $conexion->query($sql);
    
    if (!$result) {
        throw new Exception("Error en la consulta: " . $conexion->error);
    }
    
    $pagaments = [];
    
    // Obtener todos los registros y recalcular valores correctos
    while ($row = $result->fetch_assoc()) {
        // RECALCULAR total_pagament correcto según grup y edat
        $total_correcte = calcular_total($row['grup'], (int)$row['edat']);
        
        // Consultar total aportado por este faller
        $stmt_total = $conexion->prepare('SELECT SUM(quantitat) as total_aportat FROM pagaments WHERE id_faller = ?');
        $stmt_total->bind_param('i', $row['id_faller']);
        $stmt_total->execute();
        $result_total = $stmt_total->get_result();
        $total_aportat_real = (float)($result_total->fetch_assoc()['total_aportat'] ?? 0);
        $stmt_total->close();
        
        // Calcular falta_per_aportar correcta
        $falta_correcta = max(0, $total_correcte - $total_aportat_real);
        
        // Formatear fechas
        if ($row['data_pagament']) {
            $row['data_pagament_formatted'] = date('d/m/Y', strtotime($row['data_pagament']));
        }
        if ($row['data_aportacio']) {
            $row['data_aportacio_formatted'] = date('d/m/Y', strtotime($row['data_aportacio']));
        }
        
        // Usar valores corregidos
        $row['quantitat'] = number_format((float)$row['quantitat'], 2, '.', '');
        $row['total_pagament'] = number_format($total_correcte, 2, '.', ''); // VALOR CORREGIDO
        $row['aportat_pagament'] = number_format((float)$row['quantitat'], 2, '.', ''); // CANTIDAD DE ESTE PAGO ESPECÍFICO
        $row['falta_per_aportar'] = number_format($falta_correcta, 2, '.', ''); // VALOR CORREGIDO
        
        // Información adicional útil
        $row['nom_complet'] = $row['nom'] . ' ' . $row['cognoms'];
        $row['total_aportat_acumulat'] = number_format($total_aportat_real, 2, '.', ''); // TOTAL ACUMULADO (nuevo campo)
        $row['porcentatge_completat'] = round(($total_aportat_real / $total_correcte) * 100, 1); // PORCENTAJE (nuevo campo)
        
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