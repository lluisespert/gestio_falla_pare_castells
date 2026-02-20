<?php

function remove_accents($str) {
    $str = iconv('UTF-8', 'ASCII//TRANSLIT//IGNORE', (string)$str);
    return $str === false ? '' : $str;
}

function normalize_group_upper($grup) {
    $grup = preg_replace('/\s+/', ' ', trim((string)$grup));
    return mb_strtoupper($grup, 'UTF-8');
}

function normalize_group_key($grup) {
    return remove_accents(normalize_group_upper($grup));
}

function calcular_total_pagament($grup, $edat) {
    $key = normalize_group_key($grup);
    $edat = (int)$edat;

    // Grups especials de quota fixa.
    if (
        strpos($key, 'BRUSSO') !== false ||
        strpos($key, 'BRUSO') !== false ||
        strpos($key, 'BRUSSON') !== false
    ) {
        return 400.00;
    }

    if (strpos($key, "FALLERS D'HONOR") !== false || strpos($key, 'FALLERS DHONOR') !== false || strpos($key, 'CASALER') !== false) {
        return 100.00;
    }

    if (
        strpos($key, 'FAMILIAR DE FALLER/FALLERA') !== false ||
        strpos($key, 'FAMILIAR DE FALLER FALLERA') !== false ||
        strpos($key, 'COLABOR') !== false
    ) {
        return 300.00;
    }

    // Grups infantils/juvenils amb regles específiques.
    if (strpos($key, 'CAP DELS PARES ES FALLER') !== false || strpos($key, 'CAP DELS PARES ES') !== false) {
        if ($edat <= 3) return 70.00;
        if ($edat <= 10) return 100.00;
        if ($edat <= 13) return 150.00;
    }

    if (strpos($key, 'UN DELS PARES ES FALLER') !== false) {
        if ($edat <= 3) return 40.00;
        if ($edat <= 10) return 55.00;
        if ($edat <= 13) return 85.00;
    }

    if (strpos($key, 'ELS DOS PARES SON FALLERS') !== false) {
        if ($edat <= 3) return 0.00;
        if ($edat <= 10) return 35.00;
        if ($edat <= 13) return 55.00;
    }

    if (strpos($key, 'CAP ASCENDENT FALLER') !== false || strpos($key, 'CAP ASCENDET FALLER') !== false) {
        if ($edat >= 14 && $edat <= 17) return 250.00;
    }

    if (strpos($key, '1 ASCENDENT FALLER') !== false || strpos($key, '1 ASCENDET FALLER') !== false) {
        if ($edat >= 14 && $edat <= 17) return 200.00;
    }

    if (strpos($key, '2 ASCENDENTS FALLERS') !== false || strpos($key, '2 ASCENDETS FALLERS') !== false) {
        if ($edat >= 14 && $edat <= 17) return 185.00;
    }

    // Tarifa general per edat.
    if ($edat >= 18 && $edat <= 25) {
        return 425.00;
    }

    if ($edat >= 26) {
        return 575.00;
    }

    return 200.00;
}

