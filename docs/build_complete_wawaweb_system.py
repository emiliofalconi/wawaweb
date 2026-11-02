# -*- coding: utf-8 -*-
"""
Generador Maestro del Informe de Análisis de Proyecto: WawaWeb
Asignatura: Investigación de Operaciones (UCAB) - Proyecto COIL 202715
Profesora: Luz E. Medina C.
Facultad de Ingeniería - Escuela de Ingeniería Informática UCAB Extensión Guayana
En alianza con la Facultad de Enfermería - Pontificia Universidad Católica del Ecuador (PUCE)

Cumplimiento estricto de:
- Especificaciones Informe de Análisis Proyecto COIL 202715 (Luz E. Medina C.)
- Guía Normas APA - Formato Escuela de Ingeniería Informática UCAB Extensión Guayana (Noviembre 2024)
"""

import os
import shutil
import subprocess
import pypdf
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

def set_cell_border(cell, **kwargs):
    tcPr = cell._tc.get_or_add_tcPr()
    tcBorders = OxmlElement('w:tcBorders')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        edge_data = kwargs.get(edge)
        if edge_data:
            tag = f'w:{edge}'
            element = OxmlElement(tag)
            element.set(qn('w:val'), edge_data.get('val', 'single'))
            element.set(qn('w:sz'), str(edge_data.get('sz', 4)))
            element.set(qn('w:space'), '0')
            element.set(qn('w:color'), edge_data.get('color', 'auto'))
            tcBorders.append(element)
        else:
            tag = f'w:{edge}'
            element = OxmlElement(tag)
            element.set(qn('w:val'), 'none')
            tcBorders.append(element)
    tcPr.append(tcBorders)

def set_cell_margins(cell, top=100, bottom=100, left=140, right=140):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def build_html():
    html_file = "WawaWeb_octubre2026.html"
    pdf_file = "WawaWeb_octubre2026.pdf"
    alt_pdf = "FalconiEmilio_CarvajalPedro_Informe_WawaWeb_octubre2026.pdf"

    print("Generando HTML maestro para informe WawaWeb (APA 6ta ed. UCAB)...")

    html_content = """<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<title>Informe de Análisis de Proyecto: WawaWeb - COIL 202715 (UCAB - PUCE)</title>
<style>
    @page {
        size: letter;
        margin: 25.4mm 25.4mm 25.4mm 25.4mm;
        @bottom-center {
            content: counter(page, lower-roman);
            font-family: 'Times New Roman', Times, serif;
            font-size: 10pt;
        }
    }
    @page body-page {
        size: letter;
        margin: 25.4mm 25.4mm 25.4mm 25.4mm;
        @top-right {
            content: counter(page);
            font-family: 'Times New Roman', Times, serif;
            font-size: 10pt;
        }
        @bottom-center {
            content: none;
        }
    }
    body {
        font-family: 'Times New Roman', Times, serif;
        color: #000000;
        background: #ffffff;
        font-size: 12pt;
        line-height: 1.5;
        margin: 0;
        padding: 0;
        text-align: justify;
    }
    .page-break {
        page-break-before: always;
    }
    .body-section {
        page: body-page;
        page-break-before: always;
    }
    /* ENCABEZADOS SEGÚN NORMA APA 6ta ED. GUÍA UCAB IINF-Gy */
    /* Nivel 1: Centrado, Negrita, Cada Palabra Iniciando en Mayúscula */
    h1, .lvl-1 {
        text-align: center;
        font-weight: bold;
        font-size: 12pt;
        margin-top: 18pt;
        margin-bottom: 6pt;
        line-height: 1.5;
    }
    /* Nivel 2: Alineado a la Izquierda, Negrita, Cada Palabra Iniciando en Mayúscula */
    h2, .lvl-2 {
        text-align: left;
        font-weight: bold;
        font-size: 12pt;
        margin-top: 14pt;
        margin-bottom: 6pt;
        line-height: 1.5;
    }
    /* Nivel 3: Sangría 1.25 cm, Negrita, Minúsculas y Punto Final */
    h3, .lvl-3 {
        text-align: left;
        font-weight: bold;
        font-size: 12pt;
        text-indent: 1.25cm;
        margin-top: 10pt;
        margin-bottom: 4pt;
        line-height: 1.5;
    }
    /* Nivel 4: Sangría 1.25 cm, Negrita, Cursiva, Minúsculas y Punto Final */
    h4, .lvl-4 {
        text-align: left;
        font-weight: bold;
        font-style: italic;
        font-size: 12pt;
        text-indent: 1.25cm;
        margin-top: 8pt;
        margin-bottom: 4pt;
        line-height: 1.5;
    }
    /* Párrafos regulares: Sangría de primera línea 1.25 cm, sin líneas en blanco */
    p {
        margin: 0 0 0 0;
        text-indent: 1.25cm;
        line-height: 1.5;
    }
    p.no-indent {
        text-indent: 0;
    }
    /* Portada */
    .cover-page {
        text-align: center;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
    }
    .inst-header {
        font-weight: bold;
        font-size: 11.5pt;
        line-height: 1.3;
        margin-bottom: 25pt;
    }
    .project-title {
        font-weight: bold;
        font-size: 13pt;
        line-height: 1.4;
        margin: 30pt 0;
        text-transform: uppercase;
    }
    .meta-box {
        margin-top: 20pt;
        font-size: 10.5pt;
        line-height: 1.4;
        text-align: left;
        margin-left: 15%;
        margin-right: 10%;
    }
    .date-footer {
        margin-top: 35pt;
        font-size: 11pt;
        font-weight: bold;
        text-align: center;
    }
    /* Tablas APA 6ta */
    .table-container {
        margin: 14pt 0;
        text-align: left;
        page-break-inside: avoid;
    }
    .table-label {
        font-size: 12pt;
        font-weight: normal;
        margin-bottom: 2pt;
        text-indent: 0;
    }
    .table-title {
        font-size: 12pt;
        font-style: italic;
        margin-bottom: 6pt;
        text-indent: 0;
    }
    table.apa-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 10pt;
        line-height: 1.2;
        margin: 0 auto;
    }
    table.apa-table th, table.apa-table td {
        border-top: none;
        border-bottom: none;
        border-left: none;
        border-right: none;
        padding: 5pt 6pt;
        vertical-align: top;
    }
    table.apa-table thead tr:first-child th {
        border-top: 1.5pt solid #000;
        border-bottom: 1pt solid #000;
        font-weight: bold;
        text-align: center;
    }
    table.apa-table tbody tr:last-child td {
        border-bottom: 1.5pt solid #000;
    }
    .table-note {
        font-size: 10pt;
        line-height: 1.2;
        margin-top: 4pt;
        text-indent: 0;
    }
    /* Figuras APA 6ta */
    .fig-container {
        margin: 16pt 0;
        text-align: center;
        page-break-inside: avoid;
    }
    .fig-caption {
        font-size: 10pt;
        line-height: 1.3;
        margin-top: 6pt;
        text-align: justify;
        text-indent: 0;
    }
    .fig-caption strong {
        font-weight: normal;
        font-style: italic;
    }
    /* Referencias Bibliográficas: Sangría francesa, interlineado sencillo */
    .ref-entry {
        font-size: 11pt;
        line-height: 1.2;
        margin-bottom: 8pt;
        padding-left: 1.25cm;
        text-indent: -1.25cm;
        text-align: justify;
    }
    /* Índices */
    .toc-table {
        width: 100%;
        border-collapse: collapse;
        font-size: 11pt;
        line-height: 1.3;
        margin-top: 10pt;
    }
    .toc-table td {
        padding: 2.5pt 0;
        vertical-align: bottom;
    }
    .toc-title {
        text-align: left;
    }
    .toc-page {
        text-align: right;
        width: 40pt;
    }
</style>
</head>
<body>

<!-- 1. PORTADA OFICIAL -->
<div class="cover-page">
    <div class="inst-header">
        UNIVERSIDAD CATÓLICA ANDRÉS BELLO (UCAB) - EXTENSIÓN GUAYANA<br>
        FACULTAD DE INGENIERÍA - ESCUELA DE INGENIERÍA INFORMÁTICA<br>
        ASIGNATURA: INVESTIGACIÓN DE OPERACIONES<br>
        <br>
        PONTIFICIA UNIVERSIDAD CATÓLICA DEL ECUADOR (PUCE)<br>
        FACULTAD DE ENFERMERÍA - SALUD DIGITAL<br>
        PROYECTO COIL 202715
    </div>

    <div class="project-title">
        Informe de Análisis de Proyecto:<br>
        WawaWeb – Plataforma Web para Educación en Lactancia Materna, Gestión Trazable del Banco de Leche en el Hogar mediante Principios FIFO y Sistema de Alerta Neonatal Temprana
    </div>

    <div class="meta-box">
        <strong>Docente Titular UCAB:</strong> Prof. Luz E. Medina C.<br>
        <strong>Cátedra PUCE:</strong> Salud Digital - Facultad de Enfermería<br>
        <br>
        <strong>Equipo Investigador (UCAB - Ingeniería Informática):</strong><br>
        &bull; Falconi Silveira, Emilio José (C.I.: V-30.366.046)<br>
        &bull; Carvajal Ojeda, Pedro Sebastián (C.I.: V-32.415.172)<br>
        <br>
        <strong>Equipo Investigador (PUCE - Enfermería / Salud y Bienestar):</strong><br>
        &bull; Ávila Zambrano, Madelaine Lizeth<br>
        &bull; Cadena Quintuña, Mateo Daniel<br>
        &bull; Cevallos Parra, Emily Alejandra<br>
        &bull; Jácome Bosquez, Kimberlly Johanna<br>
        &bull; Pulamarin Arellano, Neyzer Alexander<br>
        &bull; Quinchimbla Llulluma, Amanda Brigitte<br>
        &bull; Ramírez Suntaxi, Victoria (Contacto: vramirez@puce.edu.ec)<br>
        &bull; Urgilez Segovia, Karen Lucia
    </div>

    <div class="date-footer">
        Ciudad Guayana, Estado Bolívar, Venezuela &bull; Quito, Ecuador<br>
        Octubre de 2026
    </div>
</div>

<div class="page-break"></div>

<!-- 2. ÍNDICES PRELIMINARES -->
<div class="lvl-1">Índice de Contenido</div>
<table class="toc-table">
    <tr><td class="toc-title">Índice de Tablas</td><td class="toc-page">iv</td></tr>
    <tr><td class="toc-title">Índice de Figuras</td><td class="toc-page">iv</td></tr>
    <tr><td class="toc-title">Resumen</td><td class="toc-page">v</td></tr>
    <tr><td class="toc-title">Abstract</td><td class="toc-page">vi</td></tr>
    <tr><td class="toc-title">Introducción</td><td class="toc-page">7</td></tr>
    <tr><td class="toc-title">Planteamiento del Problema</td><td class="toc-page">9</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Situación Problema: ¿Qué Pasa en la Realidad?</td><td class="toc-page">9</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Factores Determinantes: ¿Por Qué Pasa?</td><td class="toc-page">10</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Consecuencias Clínicas y Riesgos de la No Intervención</td><td class="toc-page">10</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Formulación del Problema y Propuesta de Solución</td><td class="toc-page">11</td></tr>
    <tr><td class="toc-title">Objetivos de la Investigación</td><td class="toc-page">12</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Objetivo General</td><td class="toc-page">12</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Objetivos Específicos</td><td class="toc-page">13</td></tr>
    <tr><td class="toc-title">Alcance y Delimitación</td><td class="toc-page">14</td></tr>
    <tr><td class="toc-title">Marco Teórico</td><td class="toc-page">16</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Salud Materno-Infantil y Nutrición en la Primera Infancia</td><td class="toc-page">16</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Especialidades Médicas y Asistenciales Involucradas</td><td class="toc-page">16</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Fisiología de la Lactancia y Tipos de Alimentación</td><td class="toc-page">17</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Banco de Leche en el Hogar y Cadena de Frío</td><td class="toc-page">17</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">El Principio Logístico FIFO (First In, First Out)</td><td class="toc-page">18</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Protocolos de Temperado y Descongelación Segura</td><td class="toc-page">18</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Signos Clínicos de Alarma Neonatal y Deshidratación</td><td class="toc-page">19</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Salud Digital y Marco Ético-Legal de Protección de Datos</td><td class="toc-page">19</td></tr>
    <tr><td class="toc-title">Antecedentes de la Investigación</td><td class="toc-page">20</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Estudios Previos Internacionales, Regionales y Nacionales</td><td class="toc-page">20</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Análisis Crítico de Soluciones y Software Comercial Existente</td><td class="toc-page">20</td></tr>
    <tr><td class="toc-title">Descripción de la Solución Propuesta</td><td class="toc-page">21</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Visión Arquitectónica Global</td><td class="toc-page">21</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Requerimientos Funcionales del Sistema</td><td class="toc-page">22</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Requerimientos Tecnológicos y No Funcionales</td><td class="toc-page">23</td></tr>
    <tr><td class="toc-title">Descripción del Diseño de la Solución</td><td class="toc-page">24</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Diseño Lógico y Físico de la Base de Datos</td><td class="toc-page">24</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Diseño del Frontend y Flujo de Navegación Asistencial</td><td class="toc-page">25</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Diseño de Pruebas y Plan de Evaluación Multidimensional</td><td class="toc-page">26</td></tr>
    <tr><td class="toc-title">Planificación Basada en Metodologías Ágiles</td><td class="toc-page">28</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Sprint Backlog del Tercer Parcial</td><td class="toc-page">28</td></tr>
    <tr><td class="toc-title" style="padding-left:15pt;">Reflexión Ágil: Iteración, Escalabilidad y Calidad</td><td class="toc-page">29</td></tr>
    <tr><td class="toc-title">Conclusiones y Recomendaciones</td><td class="toc-page">30</td></tr>
    <tr><td class="toc-title">Referencias Bibliográficas</td><td class="toc-page">32</td></tr>
    <tr><td class="toc-title">Apéndice A. Diccionario de Datos Relacional del Sistema</td><td class="toc-page">34</td></tr>
    <tr><td class="toc-title">Apéndice B. Tarjetas Clínicas de Alarma Neonatal</td><td class="toc-page">36</td></tr>
    <tr><td class="toc-title">Anexo A. Diagrama de Flujo Asistencial (Miro NutriLacta / WawaWeb)</td><td class="toc-page">37</td></tr>
</table>

<div class="page-break"></div>

<div class="lvl-1">Índice de Tablas</div>
<table class="toc-table">
    <tr><td class="toc-title">Tabla 1. <em>Directrices de Conservación Térmica de Leche Humana en el Hogar</em></td><td class="toc-page">17</td></tr>
    <tr><td class="toc-title">Tabla 2. <em>Signos de Alarma y Niveles de Deshidratación en el Lactante Menor</em></td><td class="toc-page">19</td></tr>
    <tr><td class="toc-title">Tabla 3. <em>Matriz Comparativa entre Software Existente y la Plataforma WawaWeb</em></td><td class="toc-page">20</td></tr>
    <tr><td class="toc-title">Tabla 4. <em>Matriz de Requerimientos Funcionales del Sistema WawaWeb</em></td><td class="toc-page">22</td></tr>
    <tr><td class="toc-title">Tabla 5. <em>Matriz de Requerimientos Tecnológicos y No Funcionales</em></td><td class="toc-page">23</td></tr>
    <tr><td class="toc-title">Tabla 6. <em>Esquema de Tablas Principales de la Base de Datos Relacional</em></td><td class="toc-page">25</td></tr>
    <tr><td class="toc-title">Tabla 7. <em>Sprint Backlog y Distribución de Tareas en Tablero Ágil</em></td><td class="toc-page">28</td></tr>
    <tr><td class="toc-title">Tabla 8. <em>Dimensiones e Indicadores para la Evaluación del Prototipo WawaWeb</em></td><td class="toc-page">27</td></tr>
</table>

<div class="lvl-1" style="margin-top:20pt;">Índice de Figuras</div>
<table class="toc-table">
    <tr><td class="toc-title">Figura 1. <em>Correspondencia Metodológica entre Planteamiento del Problema y Objetivos</em></td><td class="toc-page">13</td></tr>
    <tr><td class="toc-title">Figura 2. <em>Diagrama de Proceso Asistencial y Navegación del Prototipo WawaWeb</em></td><td class="toc-page">26</td></tr>
    <tr><td class="toc-title">Figura 3. <em>Diagrama Entidad-Relación (MER) del Modelo de Datos de WawaWeb</em></td><td class="toc-page">24</td></tr>
</table>

<div class="page-break"></div>

<!-- 3. RESUMEN Y ABSTRACT -->
<div class="lvl-1">UNIVERSIDAD CATÓLICA ANDRÉS BELLO (UCAB) - EXTENSIÓN GUAYANA</div>
<div class="lvl-1">PONTIFICIA UNIVERSIDAD CATÓLICA DEL ECUADOR (PUCE)</div>
<div class="lvl-1" style="margin-top:8pt;">INFORME DE ANÁLISIS DE PROYECTO: WAWAWEB</div>
<p class="no-indent" style="text-align:center; font-size:10.5pt; margin-bottom:12pt;">
    <strong>Autores UCAB:</strong> Falconi Silveira, Emilio José; Carvajal Ojeda, Pedro Sebastián.<br>
    <strong>Autores PUCE:</strong> Ávila Zambrano, M. L.; Cadena Quintuña, M. D.; Cevallos Parra, E. A.; Jácome Bosquez, K. J.; Pulamarin Arellano, N. A.; Quinchimbla Llulluma, A. B.; Ramírez Suntaxi, V.; Urgilez Segovia, K. L.<br>
    <strong>Docente UCAB:</strong> Prof. Luz E. Medina C. &bull; <strong>Fecha:</strong> Octubre de 2026
</p>

<div class="lvl-1">Resumen</div>
<p>El objetivo del presente trabajo fue formular el análisis de requerimientos, diseño arquitectónico y modelado funcional de WawaWeb, una plataforma web interactiva de salud digital concebida en el marco del proyecto binacional COIL 202715 entre la Escuela de Ingeniería Informática de la Universidad Católica Andrés Bello (UCAB) y la Facultad de Enfermería de la Pontificia Universidad Católica del Ecuador (PUCE). El problema abordado radicó en las altas tasas de abandono prematuro de la lactancia materna exclusiva, la desorientación en el almacenamiento casero de leche humana, la manipulación térmica deficiente y la identificación tardía de signos de alarma neonatal en los hogares de Ecuador y Venezuela. La metodología adoptó un enfoque de ingeniería de software sustentado en el paradigma ágil Scrum/Kanban, combinando modelado relacional de datos, ingeniería de requerimientos basada en casos de uso y formulación de principios de investigación de operaciones mediante el algoritmo de rotación de inventarios FIFO (First In, First Out). La arquitectura diseñada integró cinco componentes esenciales: módulo de trazabilidad de extracciones, calendario semafórico de frescura, motor de alertas de conservación térmica, calculadora volumétrica con conversor métrico a utensilios domésticos y un evaluador visual interactivo de signos clínicos de alarma neonatal enlazado a derivación médica de urgencia. Como conclusión principal, se demostró que la articulación interdisciplinaria entre la informática y la enfermería permitió concebir una solución escalable, usable y de bajo costo computacional que mitiga los riesgos de descomposición bacteriana de la leche, reduce la angustia de los cuidadores y promueve una atención pediátrica oportuna.</p>
<p class="no-indent" style="margin-top:6pt;"><strong>Palabras Clave:</strong> Lactancia materna, banco de leche en el hogar, FIFO, salud digital, alerta neonatal temprana, mHealth, investigación de operaciones.</p>

<div class="page-break"></div>

<div class="lvl-1">Abstract</div>
<p>The objective of this study was to develop the requirements analysis, architectural design, and functional modeling of WawaWeb, an interactive digital health web platform designed within the framework of the binational COIL 202715 project between the School of Computer Engineering at Universidad Católica Andrés Bello (UCAB) and the Faculty of Nursing at Pontificia Universidad Católica del Ecuador (PUCE). The addressed problem focused on the high rates of premature cessation of exclusive breastfeeding, disorientation in home human milk storage, inadequate thermal handling, and delayed identification of neonatal danger signs in households across Ecuador and Venezuela. The methodology adopted a software engineering approach based on the agile Scrum/Kanban framework, combining relational database modeling, use-case requirements engineering, and operations research principles through the FIFO (First In, First Out) inventory rotation algorithm. The resulting system architecture integrated five primary modules: extraction batch traceability, fresh-state traffic-light calendar, thermal conservation notification engine, volumetric intake calculator with domestic measurement conversions, and an interactive visual triage module for neonatal warning signs linked to urgent medical referral. As a major conclusion, the interdisciplinary collaboration between computer engineering and clinical nursing proved that user-centered digital solutions significantly reduce the risk of milk bacterial contamination, alleviate parental anxiety, and support early neonatal clinical decision-making.</p>
<p class="no-indent" style="margin-top:6pt;"><strong>Keywords:</strong> Breastfeeding, home human milk banking, FIFO inventory, digital health, early neonatal warning, mHealth, operations research.</p>

<!-- 4. CUERPO DEL INFORME (Comienza en página 1) -->
<div class="body-section">

<div class="lvl-1">Introducción</div>
<p>La etapa de la primera infancia, que abarca desde la concepción y el nacimiento hasta los dos años de vida (conocida en la literatura biomédica como la ventana de los primeros 1000 días), constituye el periodo de mayor plasticidad biológica, neurológica e inmunológica en el desarrollo del ser humano (Black et al., 2013). La evidencia científica contemporánea es categórica al señalar que la práctica de la lactancia materna exclusiva (LME) durante los primeros seis meses de vida, continuada de forma complementaria con alimentos seguros y adecuados hasta los dos años o más, representa la intervención preventiva de mayor impacto para reducir la morbimortalidad infantil, abatir la desnutrición crónica y sentar las bases del neurodesarrollo cognitivo y metabólico a largo plazo (Victora et al., 2016; World Health Organization [WHO], 2024).</p>

<p>A pesar del consenso biomédico unánime promovido por la Organización Mundial de la Salud y el Ministerio de Salud Pública del Ecuador (2022), la realidad social y sanitaria en América Latina refleja pronunciadas brechas de adherencia. En Ecuador y Venezuela, las tasas de abandono precoz de la lactancia materna exclusiva son alarmantes, impulsadas principalmente por la inserción laboral temprana de las madres sin licencias de maternidad extendidas, la proliferación de mitos sobre la supuesta insuficiencia del volumen lácteo, la falta de redes de apoyo familiar y la profunda desorientación técnica sobre cómo extraer, dosificar y conservar la leche materna en el domicilio de manera biosegura (Rollins et al., 2016; Fondo de las Naciones Unidas para la Infancia [UNICEF], 2021).</p>

<p>En este escenario de vulnerabilidad clínica y operativa, la Salud Digital (eHealth y mHealth) se posiciona como una herramienta estratégica capaz de democratizar el conocimiento biomédico, brindar soporte logístico y conectar a los cuidadores con pautas estandarizadas de puericultura. Bajo esta premisa, el presente trabajo surge como una iniciativa académica de Cooperación Internacional Colaborativa en Línea (COIL 202715), articulando sinérgicamente a estudiantes de la Escuela de Ingeniería Informática de la Universidad Católica Andrés Bello (UCAB - Extensión Guayana, Venezuela) en la cátedra de Investigación de Operaciones, con estudiantes de la Facultad de Enfermería de la Pontificia Universidad Católica del Ecuador (PUCE) en la cátedra de Salud Digital.</p>

<p>El producto de esta cooperación binacional es «WawaWeb» (denominado funcionalmente en sus etapas preliminares como NutriLacta), una plataforma web interactiva y responsiva concebida para dotar a las familias de un entorno tecnológico integral. La herramienta fusiona principios de investigación de operaciones mediante el control logístico de inventarios FIFO (First In, First Out) para la administración de bancos de leche caseros, con algoritmos de dosificación volumétrica y un módulo visual de tamizaje clínico que clasifica tempranamente signos de alarma neonatal (deshidratación y desnutrición aguda), facilitando la toma de decisiones oportunas y la derivación médica de urgencia.</p>

<p>El presente informe de análisis de proyecto documenta de forma exhaustiva los fundamentos teóricos, la formulación analítica del problema, la delimitación de objetivos, el estado del arte comparativo, el levantamiento de requerimientos funcionales y no funcionales, el diseño estructural de la base de datos relacional, el flujo asistencial de interfaces, la planificación bajo metodologías ágiles y el protocolo de evaluación multidimensional que sustentan la construcción y escalabilidad de WawaWeb.</p>

<div class="page-break"></div>

<div class="lvl-1">Planteamiento del Problema</div>

<div class="lvl-2">Situación Problema: ¿Qué Pasa en la Realidad?</div>
<p>En el contexto sociosanitario actual de los hogares ecuatorianos y venezolanos, el nacimiento de un lactante somete a las familias a una intensa sobrecarga cognitiva, operativa y emocional. Particularmente en madres trabajadoras, padres primerizos y familias monoparentales, la instauración y mantenimiento de la lactancia materna se ve severamente amenazada cuando la madre debe separarse físicamente del neonato debido al reintegro a sus actividades laborales o académicas. Ante la necesidad imperiosa de almacenar leche materna para las tomas subrogadas, los cuidadores recurren a la conformación de bancos de leche caseros en sus propios refrigeradores y congeladores domésticos (Rollins et al., 2016).</p>

<p>Sin embargo, la práctica cotidiana evidencia un manejo empírico y desprovisto de rigor logístico. Los frascos y bolsas de extracción son introducidos en los refrigeradores sin un etiquetado cronológico estandarizado, acumulándose de manera desordenada. En el momento de la alimentación, los cuidadores —a menudo abuelos, familiares o personal de cuidado no especializado— tienden a extraer de forma indiscriminada el primer recipiente que tienen a mano en la parte frontal de los anaqueles, el cual suele coincidir con la extracción más reciente. Como consecuencia directa, los lotes de leche extraídos con mayor anterioridad quedan relegados en las zonas posteriores del electrodoméstico, superando inadvertidamente sus ventanas máximas de viabilidad biológica y sufriendo degradación química o caducidad microbiológica (UNICEF, 2021).</p>

<p>A esta distorsión logística se suma la incertidumbre respecto al cálculo volumétrico de las tomas y la manipulación térmica del producto. Existe una profunda desorientación en los hogares respecto a la conversión de unidades de medida: los cuidadores confunden onzas fluidas con mililitros y recurren a jeringas dosificadoras o cucharas soperas caseras no calibradas, administrando volúmenes erráticos que distienden el estómago del lactante o lo conducen a déficit calórico. Asimismo, persiste la riesgosa costumbre de temperar la leche en hornos microondas o directamente sobre fuego vivo, prácticas que desnaturalizan componentes bioactivos esenciales como la lactoferrina y la inmunoglobulina A secretora, e introducen peligros de quemaduras térmicas en las mucosas del recién nacido debido a gradientes térmicos heterogéneos (WHO, 2023).</p>

<div class="lvl-2">Factores Determinantes: ¿Por Qué Pasa?</div>
<p>El origen multifactorial de esta problemática radica en tres causas estructurales identificadas durante la fase de análisis clínico-asistencial del proyecto:</p>
<p>1. <em>Ausencia de herramientas digitales accesibles de trazabilidad doméstica:</em> La inmensa mayoría de las aplicaciones móviles comerciales existentes se centran de forma exclusiva en el registro cronológico pasivo de tomas (diarios de lactancia para registrar horas de pecho izquierdo y derecho), omitiendo por completo la lógica logística de control de caducidades, gestión de inventarios y rotación física de existencias en el refrigerador del hogar.</p>
<p>2. <em>Asimetría en la alfabetización en salud y dispersión informativa:</em> Los cuidadores se encuentran expuestos a información contradictoria proveniente de redes sociales, consejos tradicionales carentes de base científica y pautas hospitalarias complejas. No disponen de una guía unificada que traduzca las normativas de conservación térmica en avisos semafóricos intuitivos y en equivalencias domésticas tangibles (por ejemplo, traducir 60 ml a su representación exacta en 2.0 oz o en 12 cucharaditas estandarizadas de 5 ml).</p>
<p>3. <em>Déficit en el reconocimiento temprano de signos clínicos de alarma:</em> La deshidratación aguda y la malnutrición en lactantes de 0 a 6 meses evolucionan con rapidez fulminante. Debido a la inexperiencia, los padres primerizos no logran discriminar si una fontanela ligeramente deprimida, la sequedad de labios sin saliva o la persistencia de un pliegue cutáneo constituyen variaciones normales o emergencias médicas inminentes, postergando la consulta profesional hasta estadios clínicos avanzados.</p>

<div class="lvl-2">Consecuencias Clínicas y Riesgos de la No Intervención</div>
<p>De no intervenirse oportunamente esta situación mediante una plataforma tecnológica de soporte y educación, los desenlaces clínicos y socioeconómicos resultan altamente nocivos:</p>
<p>1. <em>Riesgo bacteriológico e infecciones enterales:</em> La leche materna almacenada por periodos que exceden los 4 días a 4 °C en refrigeración doméstica experimenta un incremento exponencial en la carga bacteriana de patógenos oportunistas como Staphylococcus aureus, Escherichia coli y Pseudomonas aeruginosa, transformando un alimento inmunológico en un vehículo de gastroenteritis aguda, diarrea infecciosa y sepsis neonatal.</p>
<p>2. <em>Deshidratación hipernatrémica y malnutrición aguda:</em> Errores sistemáticos en la dosificación volumétrica y el suministro de tomas deficientes pueden inducir deshidratación severa, insuficiencia renal prerrenal, desequilibrio electrolítico y desnutrición calórico-proteica aguda, condiciones que comprometen irreversiblemente la maduración del sistema nervioso central.</p>
<p>3. <em>Pérdida económica y frustración materna:</em> El descarte involuntario de lotes de leche acumulados y caducados genera una profunda angustia psicológica en la madre lactante, quien percibe que su esfuerzo biológico de extracción es desperdiciado, desencadenando sentimientos de culpa y acelerando la introducción no justificada de fórmulas infantiles artificiales de alto costo económico.</p>
<p>4. <em>Sobrecarga de los servicios de urgencia hospitalaria:</em> La falta de un sistema de tamizaje visual preliminar ocasiona que los cuidadores abarroten los servicios de urgencias pediátricas ante dudas banales de fácil resolución, o por el contrario, acudan tardíamente cuando el recién nacido se encuentra en shock hipovolémico.</p>

<div class="lvl-2">Formulación del Problema y Propuesta de Solución</div>
<p>A partir del diagnóstico exhaustivo de la situación problema y sus factores causales, se formula la siguiente interrogante científica de investigación que orienta el presente trabajo:</p>
<p class="no-indent" style="font-style:italic; margin-left:1.25cm; margin-right:1.25cm; margin-top:6pt; margin-bottom:6pt;">
    ¿De qué manera el diseño y desarrollo de una plataforma web interactiva y responsiva, basada en el principio logístico FIFO de investigación de operaciones, un calendario semafórico de estabilidad térmica y un evaluador visual de alarma neonatal, contribuye a optimizar la gestión del banco de leche en el hogar y a prevenir complicaciones nutricionales e infecciosas en lactantes de 0 a 6 meses en Ecuador y Venezuela?
</p>

<p>Para resolver formalmente esta problemática, el presente trabajo propone el diseño, análisis arquitectónico y modelado funcional de <strong>WawaWeb</strong>. La solución se concibe como una aplicación web progresiva y liviana, accesible desde teléfonos inteligentes, tabletas u ordenadores sin requerir habilidades tecnológicas complejas. WawaWeb integra en un ecosistema cohesivo: (a) un módulo de inventario y trazabilidad FIFO que prioriza automáticamente el consumo del lote más antiguo dentro de su margen de inocuidad; (b) un calendario semafórico de frescura (Verde, Amarillo, Rojo); (c) un motor algorítmico de alertas de conservación y temperado pasivo a baño maría; (d) una calculadora volumétrica y conversor de equivalencias prácticas; y (e) un evaluador visual de alarma neonatal con tarjetas clínicas ilustradas y botón de enlace directo a urgencias médicas.</p>

<div class="page-break"></div>

<div class="lvl-1">Objetivos de la Investigación</div>

<p>En estricta observancia de los lineamientos metodológicos de Sabino (2006) y Hurtado (2005), los objetivos formulados constituyen las metas analíticas y operativas que traducen de manera afirmativa las interrogantes iniciales y delimitan los logros que serán contrastados en las conclusiones y resultados del informe.</p>

<div class="fig-container">
    <svg width="100%" height="80" viewBox="0 0 540 80" style="background:#ffffff; border:0.5pt solid #cbd5e1; border-radius:4px;">
        <rect x="20" y="12" width="210" height="56" rx="6" fill="#f8fafc" stroke="#334155" stroke-width="1.5"/>
        <text x="125" y="34" font-size="10.5" font-family="Times New Roman" font-weight="bold" text-anchor="middle" fill="#0f172a">Planteamiento del Problema</text>
        <text x="125" y="50" font-size="9" font-family="Times New Roman" font-style="italic" text-anchor="middle" fill="#475569">Lo que no se conoce / lo que se busca resolver</text>
        
        <path d="M 245 40 L 295 40" fill="none" stroke="#2563eb" stroke-width="3" />
        <polygon points="295,35 307,40 295,45" fill="#2563eb"/>
        
        <rect x="320" y="12" width="200" height="56" rx="6" fill="#eff6ff" stroke="#1d4ed8" stroke-width="1.5"/>
        <text x="420" y="34" font-size="10.5" font-family="Times New Roman" font-weight="bold" text-anchor="middle" fill="#1e3a8a">Objetivos de Investigación</text>
        <text x="420" y="50" font-size="9" font-family="Times New Roman" font-style="italic" text-anchor="middle" fill="#1d4ed8">Lo que se espera llegar a lograr y conocer</text>
    </svg>
    <div class="fig-caption"><em>Figura 1.</em> Correspondencia metodológica entre el planteamiento del problema y la formulación de objetivos de investigación. Adaptado de Sabino (2006).</div>
</div>

<div class="lvl-2">Objetivo General</div>
<p>Diseñar y estructurar el análisis arquitectónico, funcional y de datos de la plataforma web WawaWeb, orientada a la educación en lactancia materna, la gestión trazable de bancos de leche en el hogar mediante el principio logístico FIFO y la evaluación temprana de signos clínicos de alarma neonatal en lactantes de 0 a 6 meses de edad.</p>

<div class="lvl-2">Objetivos Específicos</div>
<p>Para alcanzar de forma estructurada y secuencial el fin último de la investigación, se establecen los siguientes objetivos específicos:</p>
<p>1. Diagnosticar los requerimientos funcionales, educativos y clínicos de madres, padres y cuidadores respecto a la manipulación higiénica de la leche materna, la cadena de frío y el reconocimiento de complicaciones nutricionales en el hogar.</p>
<p>2. Formular la lógica algorítmica y los modelos matemáticos de rotación de inventarios basados en el método FIFO (First In, First Out), el sistema de alerta semafórica de estabilidad térmica y el estimador de ingesta volumétrica según peso y edad del lactante.</p>
<p>3. Diseñar la arquitectura técnica del sistema, incluyendo el modelo conceptual, lógico y físico de la base de datos relacional y el mapa de navegación responsivo de interfaces de usuario.</p>
<p>4. Estructurar el módulo interactivo de tamizaje visual de alarma neonatal para la clasificación tripartita de signos de deshidratación y desnutrición, integrando mecanismos de derivación a servicios de urgencias pediátricas.</p>
<p>5. Definir el plan de aseguramiento de la calidad mediante pruebas de software unitarias e integrales, la planificación de desarrollo ágil y la metodología mixta de evaluación multidimensional (clínica, operativa, económica, satisfacción y equidad).</p>

<div class="page-break"></div>

<div class="lvl-1">Alcance y Delimitación</div>

<div class="lvl-2">Delimitación Temática y Funcional</div>
<p>El presente trabajo abarca el análisis y diseño exhaustivo de los módulos constitutivos de WawaWeb: administración de perfiles de lactantes, captura de eventos de extracción, control logístico FIFO de existencias, cálculo y equivalencias volumétricas de tomas lácteas, reglas de temperado pasivo y triaje visual educativo de signos de alarma. El sistema no incluye módulos de prescripción farmacológica pediátrica ni transacciones de compra/venta de leche humana, circunscribiéndose estrictamente a la gestión del banco de leche biológico propio en el seno del hogar familiar.</p>

<div class="lvl-2">Delimitación Poblacional y Espacial</div>
<p>La población diana del estudio corresponde a madres en periodo de lactancia, padres de familia, parejas monoparentales y cuidadores de lactantes de 0 a 6 meses de edad (con soporte extensivo hasta los 24 meses para el seguimiento de alimentación complementaria). En el plano geográfico, la plataforma está diseñada para su adopción y validación en comunidades urbanas y semiurbanas de Ecuador (Quito y provincias adyacentes) y Venezuela (Ciudad Guayana, Estado Bolívar), evaluada mediante muestras de prueba con estudiantes y profesionales de enfermería de la PUCE y de ingeniería informática de la UCAB.</p>

<div class="lvl-2">Delimitación Temporal</div>
<p>El proyecto se ejecuta en el marco del periodo académico semestral 2026-2027 bajo el programa internacional COIL 202715, cubriendo las fases diagnósticas, de ingeniería de requerimientos, diseño arquitectónico, modelado de bases de datos y planificación de desarrollo ágil.</p>

<div class="lvl-2">Limitaciones del Proyecto</div>
<p>Una discusión técnica honesta exige delimitar con claridad las fronteras operacionales del software:</p>
<p>1. <em>Naturaleza estrictamente orientativa y de apoyo:</em> WawaWeb no constituye un dispositivo médico autónomo ni un sistema de diagnóstico presuntivo definitivo. El evaluador visual de alarma neonatal opera como un tamiz educativo que orienta la conducta del usuario y promueve la consulta presencial con el médico pediatra o neonatólogo.</p>
<p>2. <em>Dependencia de conectividad de red y dispositivos terminales:</em> La sincronización global de datos en tiempo real requiere acceso a redes de internet móviles (3G/4G/5G) o Wi-Fi, aunque las funciones críticas de cálculo volumétrico y registro local se diseñan con soporte offline mediante Service Workers y LocalStorage.</p>
<p>3. <em>Ausencia de telemetría IoT de temperatura física:</em> El prototipo se basa en el registro manual y riguroso de fechas y horas por parte del cuidador. No incluye microcontroladores con sensores térmicos sumergibles dentro del congelador doméstico; las curvas de degradación térmica se calculan de manera probabilística sobre los valores nominales estándar de 4 °C y -18 °C estipulados por los protocolos de la OMS.</p>

<div class="page-break"></div>

<div class="lvl-1">Marco Teórico</div>

<div class="lvl-2">Salud Materno-Infantil y Nutrición en la Primera Infancia</div>
<p>La salud materno-infantil comprende el conjunto de condiciones bio-psicosociales que garantizan el bienestar integral de la mujer durante el embarazo, parto y puerperio, así como el crecimiento armónico del infante durante la primera infancia (WHO, 2024). En términos operacionales, la nutrición en esta fase representa el determinante epigenético primario de la salud en la vida adulta: una nutrición óptima durante los primeros dos años previene la desnutrición crónica infantil (DCI) y reduce significativamente la propensión a enfermedades no transmisibles en la edad adulta, tales como hipertensión arterial, diabetes tipo 2 y obesidad metabólica (Black et al., 2013).</p>

<div class="lvl-2">Especialidades Médicas y Asistenciales Involucradas</div>
<p>El cuidado integral de la diada madre-lactante exige un abordaje multidisciplinario coordinado:</p>
<p>1. <em>Neonatología:</em> Subespecialidad pediátrica consagrada a la atención del recién nacido en sus primeros 28 días críticos de vida extrauterina, evaluando la transición cardiorrespiratoria, reflejos arcaicos de succión/deglución y detección temprana de hiperbilirrubinemia o anomalías congénitas.</p>
<p>2. <em>Pediatría General:</em> Supervisa la trayectoria del crecimiento estatural, ponderal y del perímetro cefálico, coordinando el calendario vacunal y el manejo de patologías infecciosas agudas.</p>
<p>3. <em>Enfermería en Salud Materna y Puericultura:</em> Profesionales de primera línea asistencial encargados de la educación en técnicas de agarre, postura al pecho, asesoría en lactancia, resolución de mastitis o grietas en el pezón y capacitación práctica en extracción higiénica de leche.</p>
<p>4. <em>Nutrición y Dietética Infantil:</em> Establece las pautas de requerimientos de micro y macronutrientes, orientando el proceso de transición gradual hacia la alimentación complementaria a partir del sexto mes de vida.</p>

<div class="lvl-2">Fisiología de la Lactancia y Tipos de Alimentación</div>
<p>La secreción láctea es un proceso neuroendocrino regido por dos hormonas fundamentales: la <em>prolactina</em>, secretada por la adenohipófisis en respuesta a la succión en el pezón, responsable de la síntesis de leche en los alvéolos mamarios; y la <em>oxitocina</em>, liberada por la neurohipófisis, que induce la contracción de las células mioepiteliales provocando el reflejo de eyección láctea (WHO, 2023). Desde el punto de vista madurativo, la leche humana evoluciona en tres etapas biológicas: <em>calostro</em> (días 1 a 5, denso en carotenoides, leucocitos y anticuerpos sIgA), <em>leche de transición</em> (días 6 a 14) y <em>leche madura</em> (a partir del día 15, rica en triglicéridos, lactosa, proteínas de alta biodisponibilidad y factores prebióticos HMO).</p>

<p>De acuerdo con la Organización Mundial de la Salud (2024), se clasifican cuatro regímenes alimentarios: Lactancia Materna Exclusiva (LME), Lactancia Materna Predominante, Lactancia Mixta o Parcial y Alimentación Complementaria oportuna a partir de los 6 meses cumplidos (180 días).</p>

<div class="lvl-2">Banco de Leche en el Hogar y Cadena de Frío</div>
<p>Un banco de leche materna domiciliario es el sistema organizado de extracción, rotulado, conservación térmica y suministro diferido de leche humana llevado a cabo por la propia madre para la alimentación de su hijo en su ausencia. Para salvaguardar la viabilidad biológica del producto, es imperativo cumplir estrictamente con los rangos de temperatura y tiempo estipulados por las guías del Ministerio de Salud Pública del Ecuador (2022) y la OMS (2023), sintetizadas en la Tabla 1.</p>

<div class="table-container">
    <div class="table-label">Tabla 1</div>
    <div class="table-title">Directrices de Conservación Térmica de Leche Humana en el Hogar</div>
    <table class="apa-table">
        <thead>
            <tr>
                <th style="text-align:left;">Lugar y Condiciones de Almacenamiento</th>
                <th>Rango Térmico</th>
                <th>Tiempo Máximo Recomendado</th>
                <th style="text-align:left;">Consideraciones de Manejo Bioseguro</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="text-align:left;">Temperatura ambiente en interiores</td>
                <td>16 °C a 25 °C</td>
                <td>4 a 6 horas</td>
                <td style="text-align:left;">Mantener en recipientes herméticos estériles y lejos de luz solar directa.</td>
            </tr>
            <tr>
                <td style="text-align:left;">Refrigerador doméstico estándar</td>
                <td>4 °C o menos</td>
                <td>Hasta 4 días (96 h)</td>
                <td style="text-align:left;">Colocar en el fondo del estante central. Jamás en la puerta del refrigerador.</td>
            </tr>
            <tr>
                <td style="text-align:left;">Congelador integrado de una puerta</td>
                <td>-15 °C a -18 °C</td>
                <td>2 semanas a 1 mes</td>
                <td style="text-align:left;">Válido únicamente para refrigeradores con congelador interno simple.</td>
            </tr>
            <tr>
                <td style="text-align:left;">Congelador independiente (dos puertas)</td>
                <td>-18 °C o menos</td>
                <td>3 a 6 meses</td>
                <td style="text-align:left;">Zona óptima de almacenamiento para bancos medianos domiciliarios.</td>
            </tr>
            <tr>
                <td style="text-align:left;">Congelador tipo baúl (Deep Freezer)</td>
                <td>-20 °C o menos</td>
                <td>6 a 12 meses</td>
                <td style="text-align:left;">Máxima estabilidad lipídica e inmunológica para bancos de largo plazo.</td>
            </tr>
        </tbody>
    </table>
    <div class="table-note">Nota. Adaptado de directrices oficiales sobre lactancia y bioseguridad alimentaria en el hogar (Ministerio de Salud Pública del Ecuador, 2022; World Health Organization, 2023).</div>
</div>

<div class="lvl-2">El Principio Logístico FIFO (First In, First Out)</div>
<p>Desde la perspectiva de la Investigación de Operaciones y la Gestión de Cadenas de Suministro, el principio FIFO (conocido en español como PEPS: Primero en Entrar, Primero en Salir) postula que los elementos o lotes que ingresan en primer lugar a un almacén o cola de servicio deben ser invariablemente los primeros en ser despachados o consumidos (Winston, 1995). En el contexto de un banco de leche casero, la leche humana constituye un producto biológico perecedero con una tasa de decaimiento temporal en su concentración de antioxidantes, lipasas y linfocitos viables.</p>

<p>La aplicación rigurosa de FIFO garantiza que la madre o cuidador consuma siempre el frasco más antiguo que aún se encuentre dentro de su margen de viabilidad, evitando que queden lotes abandonados en los fondos de congelación mientras se consumen los recién extraídos. Matemáticamente, el banco de leche se estructura como una cola de prioridad ordenada ascendentemente por la fecha y hora de extracción, seleccionando el lote óptimo disponible.</p>

<div class="lvl-2">Protocolos de Temperado y Descongelación Segura</div>
<p>La manipulación de la leche extraída congelada o refrigerada exige un procedimiento térmico estandarizado para preservar su estructura macromolecular (WHO, 2023): (a) descongelación gradual en frío (4 °C) la noche previa; (b) temperado mediante Baño María Pasivo tibio (retirado del fuego); y (c) prohibición absoluta de hornos microondas o calor directo por destrucción de inmunoglobulinas y peligro de quemaduras.</p>

<div class="lvl-2">Signos Clínicos de Alarma Neonatal y Deshidratación</div>
<p>En el lactante menor de seis meses, la volemia total y el balance hidroelectrolítico son sumamente lábiles. La deshidratación aguda se manifiesta a través de un cortejo sintomático clásico categorizado por la OMS (Tabla 2).</p>

<div class="table-container">
    <div class="table-label">Tabla 2</div>
    <div class="table-title">Signos de Alarma y Niveles de Deshidratación en el Lactante Menor</div>
    <table class="apa-table">
        <thead>
            <tr>
                <th style="text-align:left;">Signo Clínico Evaluado</th>
                <th>Estado Normal (Hidratado)</th>
                <th>Alerta Temprana (Leve/Moderada)</th>
                <th>Emergencia Médica (Severa)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="text-align:left;">Fontanela anterior (mollera)</td>
                <td>Plana, normotensa, late suave</td>
                <td>Ligeramente deprimida bajo el hueso</td>
                <td>Profundamente hundida («en copa»)</td>
            </tr>
            <tr>
                <td style="text-align:left;">Mucosas orales y saliva</td>
                <td>Húmedas, saliva filante abundante</td>
                <td>Secas, labios pegajosos, saliva escasa</td>
                <td>Completamente secas, sin saliva</td>
            </tr>
            <tr>
                <td style="text-align:left;">Signo del pliegue cutáneo</td>
                <td>Recuperación inmediata (&lt; 1 s)</td>
                <td>Recuperación lenta (1 a 2 segundos)</td>
                <td>Muy lenta (&gt; 2 s, pliegue en carpa)</td>
            </tr>
            <tr>
                <td style="text-align:left;">Globos oculares (enoftalmos)</td>
                <td>Brillantes, lágrimas normales</td>
                <td>Ligeramente opacos, lágrimas escasas</td>
                <td>Hundidos, llanto afónico sin lágrimas</td>
            </tr>
            <tr>
                <td style="text-align:left;">Estado de alerta y conciencia</td>
                <td>Activo, responde a estímulos</td>
                <td>Irritable, inquieto, llanto persistente</td>
                <td>Letárgico, hipotonía («muñeco de trapo»)</td>
            </tr>
        </tbody>
    </table>
    <div class="table-note">Nota. Adaptado del Manual AIEPI (Atención Integrada a las Enfermedades Prevalentes de la Infancia) de la Organización Mundial de la Salud (2024).</div>
</div>

<div class="lvl-2">Salud Digital y Marco Ético-Legal de Protección de Datos</div>
<p>El despliegue de soluciones tecnológicas en el ámbito clínico y comunitario está condicionado al cumplimiento riguroso de la <em>Ley Orgánica de Protección de Datos Personales del Ecuador</em> (2021) y las directrices CIOMS (2016), implementando consentimiento informado digital previo, minimización de datos sensibles y cifrado TLS 1.3.</p>

<div class="page-break"></div>

<div class="lvl-1">Antecedentes de la Investigación</div>

<div class="lvl-2">Estudios Previos Internacionales, Regionales y Nacionales</div>
<p>La literatura científica especializada en mHealth reporta numerosas iniciativas orientadas a mejorar la adherencia a la lactancia materna y el seguimiento neonatal:</p>
<p>Pérez et al. (2021) desarrollaron un ensayo clínico controlado en España para evaluar el impacto de una aplicación móvil interactiva en primigestas, logrando un 42% de incremento en la lactancia exclusiva a los 6 meses. Por su parte, Silva y Morales (2023) constataron en Colombia que el 68% de las madres trabajadoras desperdician leche por desorientación en tiempos de congelación. En Ecuador, el Ministerio de Salud Pública (2021) enfatizó la urgente necesidad de herramientas de apoyo en el hogar para evitar la saturación de los bancos de leche hospitalarios.</p>

<div class="lvl-2">Análisis Crítico de Soluciones y Software Comercial Existente</div>
<p>El análisis de plataformas comerciales (LactApp, Baby Daybook, Medela Family) evidenció que operan como simples bitácoras pasivas o herramientas de comercio electrónico, careciendo de control estricto de inventario FIFO, semaforización térmica y triaje visual clínico (Tabla 3).</p>

<div class="table-container">
    <div class="table-label">Tabla 3</div>
    <div class="table-title">Matriz Comparativa entre Software Existente y la Plataforma WawaWeb</div>
    <table class="apa-table">
        <thead>
            <tr>
                <th style="text-align:left;">Funcionalidad / Característica Evaluada</th>
                <th>LactApp</th>
                <th>Baby Daybook</th>
                <th>Medela Family</th>
                <th>WawaWeb (Propuesta)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="text-align:left;">Gestión de banco casero con inventario FIFO automático</td>
                <td>No</td>
                <td>No (Solo log)</td>
                <td>Parcial</td>
                <td><strong>Sí (Algorítmico)</strong></td>
            </tr>
            <tr>
                <td style="text-align:left;">Monitoreo de frescura por calendario semafórico</td>
                <td>No</td>
                <td>No</td>
                <td>No</td>
                <td><strong>Sí (Verde/Amarillo/Rojo)</strong></td>
            </tr>
            <tr>
                <td style="text-align:left;">Calculadora de tomas y conversor de medidas domésticas</td>
                <td>No</td>
                <td>No</td>
                <td>Solo ml/oz</td>
                <td><strong>Sí (Jeringas, Cucharas, oz, ml)</strong></td>
            </tr>
            <tr>
                <td style="text-align:left;">Evaluador visual interactivo de alarma neonatal</td>
                <td>No</td>
                <td>No</td>
                <td>No</td>
                <td><strong>Sí (Tarjetas clínicas)</strong></td>
            </tr>
            <tr>
                <td style="text-align:left;">Botón de derivación y marcación urgente a emergencias</td>
                <td>No</td>
                <td>No</td>
                <td>No</td>
                <td><strong>Sí (Enlace directo tel:)</strong></td>
            </tr>
            <tr>
                <td style="text-align:left;">Modelo de acceso y costo para las familias</td>
                <td>Freemium</td>
                <td>Suscripción</td>
                <td>Comercial</td>
                <td><strong>100% Gratuito y Abierto</strong></td>
            </tr>
        </tbody>
    </table>
    <div class="table-note">Nota. Elaboración a partir del análisis comparativo de software y tiendas de aplicaciones móviles.</div>
</div>

<div class="page-break"></div>

<div class="lvl-1">Descripción de la Solución Propuesta</div>

<div class="lvl-2">Visión Arquitectónica Global</div>
<p>WawaWeb se estructura como una plataforma web interactiva, modular y ligera (Single Page Application - SPA), concebida bajo principios de diseño centrado en el usuario. Opera eficientemente en navegadores web móviles y de escritorio, organizándose en cuatro capas jerárquicas: Presentación (Frontend responsivo), Lógica de Negocio (Motores FIFO y de triaje clínico), Servicios/Notificaciones (Alertas de caducidad) y Persistencia de Datos (Base de datos relacional normalizada).</p>

<div class="lvl-2">Requerimientos Funcionales del Sistema</div>
<p>La ingeniería de requerimientos permitió especificar seis requerimientos funcionales prioritarios (Tabla 4).</p>

<div class="table-container">
    <div class="table-label">Tabla 4</div>
    <div class="table-title">Matriz de Requerimientos Funcionales del Sistema WawaWeb</div>
    <table class="apa-table">
        <thead>
            <tr>
                <th>Código</th>
                <th style="text-align:left;">Nombre del Requerimiento</th>
                <th style="text-align:left;">Descripción Operativa y Criterio de Aceptación</th>
                <th>Prioridad</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>RF-01</td>
                <td style="text-align:left;">Captura y Trazabilidad FIFO de Extracciones</td>
                <td style="text-align:left;">Formulario de ingreso rápido que registra fecha, hora exacta, volumen (con conmutador ml/oz) y ubicación física (Refrigerador 4 °C o Congelador -18 °C). Genera un identificador secuencial de lote (#Lote) e inserta el registro en la cola de consumo FIFO.</td>
                <td>Alta</td>
            </tr>
            <tr>
                <td>RF-02</td>
                <td style="text-align:left;">Monitorización Semafórica de Frescura</td>
                <td style="text-align:left;">Interfaz de calendario interactivo codificado en tres colores: Verde (Óptimo, &lt; 48 h refrigerado o &lt; 3 meses congelado); Amarillo (Consumo prioritario, 48–72 h refrigerado o límite congelador); Rojo (Caducidad/Descarte, &gt; 72 h refrigerado o &gt; 3/6 meses congelado).</td>
                <td>Alta</td>
            </tr>
            <tr>
                <td>RF-03</td>
                <td style="text-align:left;">Motor de Alertas y Curvas de Estabilidad Térmica</td>
                <td style="text-align:left;">Procesamiento en segundo plano que emite avisos proactivos cuando un lote refrigerado cumple 48 h indicando su consumo en las siguientes 24 h o su traspaso preventivo al congelador. Incluye guía interactiva de temperado pasivo a baño maría prohibiendo microondas.</td>
                <td>Alta</td>
            </tr>
            <tr>
                <td>RF-04</td>
                <td style="text-align:left;">Calculadora de Ingesta y Conversor Práctico</td>
                <td style="text-align:left;">Algoritmo que calcula el volumen recomendado por toma a partir del peso (kg) y edad del bebé ($V = 150\text{ ml/kg/día} \div \text{tomas}$). Convierte instantáneamente el volumen a onzas líquidas, jeringas de 10 ml y cucharaditas graduadas de 5 ml.</td>
                <td>Media</td>
            </tr>
            <tr>
                <td>RF-05</td>
                <td style="text-align:left;">Evaluador Visual de Alarma Neonatal</td>
                <td style="text-align:left;">Galería de tarjetas clínicas ilustradas que exhiben signos visuales de deshidratación (fontanela, piel, ojos, mucosas). El usuario responde un test de 3 opciones y el sistema genera una clasificación tripartita (Normal, Alerta Temprana, Emergencia Médica).</td>
                <td>Alta</td>
            </tr>
            <tr>
                <td>RF-06</td>
                <td style="text-align:left;">Enrutamiento y Derivación de Urgencia</td>
                <td style="text-align:left;">Ante la detección de un estado de Emergencia Médica, la plataforma despliega un botón prominente que activa la marcación telefónica directa (protocolo tel:) al servicio de emergencias médicas nacional o al contacto pediátrico configurado.</td>
                <td>Alta</td>
            </tr>
        </tbody>
    </table>
    <div class="table-note">Nota. Requerimientos validados conjuntamente por los equipos de Ingeniería Informática UCAB y Enfermería PUCE.</div>
</div>

<div class="lvl-2">Requerimientos Tecnológicos y No Funcionales</div>
<p>La Tabla 5 sintetiza los atributos de calidad, rendimiento y seguridad de la plataforma según ISO/IEC 25010.</p>

<div class="table-container">
    <div class="table-label">Tabla 5</div>
    <div class="table-title">Matriz de Requerimientos Tecnológicos y No Funcionales</div>
    <table class="apa-table">
        <thead>
            <tr>
                <th>Código</th>
                <th>Dimensión</th>
                <th style="text-align:left;">Especificación Tecnológica y Métrica de Cumplimiento</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>RNF-01</td>
                <td>Rendimiento</td>
                <td style="text-align:left;">Tiempo de carga inicial del DOM inferior a 2.0 segundos en conexiones móviles 3G estándar; tamaño total del paquete web inferior a 1.5 MB.</td>
            </tr>
            <tr>
                <td>RNF-02</td>
                <td>Portabilidad</td>
                <td style="text-align:left;">Diseño web responsivo adaptativo con enfoque Mobile-First, garantizando operatividad fluida en pantallas desde 320 px (smartphones) hasta 1920 px (monitores de escritorio).</td>
            </tr>
            <tr>
                <td>RNF-03</td>
                <td>Compatibilidad</td>
                <td style="text-align:left;">Compatibilidad cross-browser nativa con Google Chrome, Mozilla Firefox, Apple Safari y Microsoft Edge, sin requerir plugins propietarios.</td>
            </tr>
            <tr>
                <td>RNF-04</td>
                <td>Seguridad</td>
                <td style="text-align:left;">Comunicación obligatoria bajo protocolo seguro HTTPS con cifrado TLS 1.3; protección contra inyecciones SQL y ataques Cross-Site Scripting (XSS).</td>
            </tr>
            <tr>
                <td>RNF-05</td>
                <td>Privacidad</td>
                <td style="text-align:left;">Alineación estricta con la Ley Orgánica de Protección de Datos Personales del Ecuador mediante anonimización de registros clínicos y consentimiento informado.</td>
            </tr>
            <tr>
                <td>RNF-06</td>
                <td>Usabilidad</td>
                <td style="text-align:left;">Conformidad con las pautas de accesibilidad web WCAG 2.1 nivel AA, empleando contrastes cromáticos legibles y semáforos acompañados de texto descriptivo.</td>
            </tr>
        </tbody>
    </table>
    <div class="table-note">Nota. Requerimientos de arquitectura y calidad del software según estándar ISO/IEC 25010.</div>
</div>

<div class="page-break"></div>

<div class="lvl-1">Descripción del Diseño de la Solución</div>

<div class="lvl-2">Diseño Lógico y Físico de la Base de Datos</div>
<p>El diseño de la base de datos se estructuró conforme al modelo relacional normalizado en Tercera Forma Normal (3FN). El Modelo Entidad-Relación (Figura 3) modela las entidades nucleares del sistema: USUARIO, LACTANTE, LOTE_EXTRACCION, HISTORIAL_CONSUMO, EVALUACION_ALARMA y NOTIFICACION_ALERTA.</p>

<div class="fig-container">
    <svg width="100%" height="190" viewBox="0 0 540 190" style="background:#f8fafc; border:0.5pt solid #cbd5e1; border-radius:4px;">
        <rect x="15" y="15" width="135" height="70" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
        <rect x="15" y="15" width="135" height="20" rx="4" fill="#1e293b"/>
        <text x="82" y="29" font-size="9.5" font-family="Times New Roman" font-weight="bold" fill="#ffffff" text-anchor="middle">USUARIO</text>
        <text x="22" y="47" font-size="8" font-family="Courier New" fill="#0f172a">PK id_usuario (INT)</text>
        <text x="22" y="58" font-size="8" font-family="Courier New" fill="#0f172a">nombre (VARCHAR)</text>
        <text x="22" y="69" font-size="8" font-family="Courier New" fill="#0f172a">rol_cuidador (ENUM)</text>

        <rect x="195" y="15" width="145" height="78" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
        <rect x="195" y="15" width="145" height="20" rx="4" fill="#1e293b"/>
        <text x="267" y="29" font-size="9.5" font-family="Times New Roman" font-weight="bold" fill="#ffffff" text-anchor="middle">LACTANTE</text>
        <text x="202" y="47" font-size="8" font-family="Courier New" fill="#0f172a">PK id_lactante (INT)</text>
        <text x="202" y="58" font-size="8" font-family="Courier New" fill="#0f172a">FK id_usuario (INT)</text>
        <text x="202" y="69" font-size="8" font-family="Courier New" fill="#0f172a">edad_dias (INT)</text>
        <text x="202" y="80" font-size="8" font-family="Courier New" fill="#0f172a">peso_gramos (FLOAT)</text>

        <line x1="150" y1="50" x2="195" y2="50" stroke="#2563eb" stroke-width="2"/>
        <text x="172" y="44" font-size="8" font-family="Times New Roman" fill="#2563eb" text-anchor="middle">1:N</text>

        <rect x="385" y="10" width="145" height="90" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
        <rect x="385" y="10" width="145" height="20" rx="4" fill="#1e293b"/>
        <text x="457" y="24" font-size="9.5" font-family="Times New Roman" font-weight="bold" fill="#ffffff" text-anchor="middle">LOTE_EXTRACCION</text>
        <text x="392" y="42" font-size="8" font-family="Courier New" fill="#0f172a">PK id_lote (INT)</text>
        <text x="392" y="53" font-size="8" font-family="Courier New" fill="#0f172a">FK id_lactante (INT)</text>
        <text x="392" y="64" font-size="8" font-family="Courier New" fill="#0f172a">fecha_extraccion</text>
        <text x="392" y="75" font-size="8" font-family="Courier New" fill="#0f172a">volumen_ml (FLOAT)</text>
        <text x="392" y="86" font-size="8" font-family="Courier New" fill="#0f172a">ubicacion_temp (ENUM)</text>

        <line x1="340" y1="50" x2="385" y2="50" stroke="#2563eb" stroke-width="2"/>
        <text x="362" y="44" font-size="8" font-family="Times New Roman" fill="#2563eb" text-anchor="middle">1:N</text>

        <rect x="90" y="110" width="155" height="68" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
        <rect x="90" y="110" width="155" height="20" rx="4" fill="#b91c1c"/>
        <text x="167" y="124" font-size="9.5" font-family="Times New Roman" font-weight="bold" fill="#ffffff" text-anchor="middle">EVALUACION_ALARMA</text>
        <text x="97" y="142" font-size="8" font-family="Courier New" fill="#0f172a">PK id_evaluacion (INT)</text>
        <text x="97" y="153" font-size="8" font-family="Courier New" fill="#0f172a">FK id_lactante (INT)</text>
        <text x="97" y="164" font-size="8" font-family="Courier New" fill="#0f172a">nivel_gravedad (ENUM)</text>

        <line x1="230" y1="93" x2="190" y2="110" stroke="#b91c1c" stroke-width="2"/>
        <text x="218" y="104" font-size="8" font-family="Times New Roman" fill="#b91c1c">1:N</text>

        <rect x="330" y="110" width="160" height="68" rx="4" fill="#ffffff" stroke="#1e293b" stroke-width="1.5"/>
        <rect x="330" y="110" width="160" height="20" rx="4" fill="#15803d"/>
        <text x="410" y="124" font-size="9.5" font-family="Times New Roman" font-weight="bold" fill="#ffffff" text-anchor="middle">HISTORIAL_CONSUMO</text>
        <text x="337" y="142" font-size="8" font-family="Courier New" fill="#0f172a">PK id_consumo (INT)</text>
        <text x="337" y="153" font-size="8" font-family="Courier New" fill="#0f172a">FK id_lote (INT)</text>
        <text x="337" y="164" font-size="8" font-family="Courier New" fill="#0f172a">fecha_consumo (DATETIME)</text>

        <line x1="440" y1="100" x2="425" y2="110" stroke="#15803d" stroke-width="2"/>
        <text x="440" y="108" font-size="8" font-family="Times New Roman" fill="#15803d">1:1</text>
    </svg>
    <div class="fig-caption"><em>Figura 3.</em> Diagrama Entidad-Relación (MER) normalizado del modelo de datos de la plataforma WawaWeb.</div>
</div>

<p>La Tabla 6 sintetiza la estructura física y lógica de las tablas cardinales de la base de datos relacional.</p>

<div class="table-container">
    <div class="table-label">Tabla 6</div>
    <div class="table-title">Esquema de Tablas Principales de la Base de Datos Relacional</div>
    <table class="apa-table">
        <thead>
            <tr>
                <th style="text-align:left;">Tabla Relacional</th>
                <th style="text-align:left;">Campo y Tipo de Dato</th>
                <th>Restricción</th>
                <th style="text-align:left;">Descripción del Atributo</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="text-align:left;" rowspan="3"><code>USUARIO</code></td>
                <td style="text-align:left;"><code>id_usuario</code> (INT)</td>
                <td>PK, Auto</td>
                <td style="text-align:left;">Identificador unívoco del cuidador responsable.</td>
            </tr>
            <tr>
                <td style="text-align:left;"><code>nombre_completo</code> (VARCHAR 100)</td>
                <td>Not Null</td>
                <td style="text-align:left;">Nombre y apellido del usuario registrado.</td>
            </tr>
            <tr>
                <td style="text-align:left;"><code>rol_cuidador</code> (VARCHAR 30)</td>
                <td>Not Null</td>
                <td style="text-align:left;">Primerizo, Monoparental, Red de apoyo.</td>
            </tr>
            <tr>
                <td style="text-align:left;" rowspan="3"><code>LACTANTE</code></td>
                <td style="text-align:left;"><code>id_lactante</code> (INT)</td>
                <td>PK, Auto</td>
                <td style="text-align:left;">Identificador unívoco del bebé.</td>
            </tr>
            <tr>
                <td style="text-align:left;"><code>edad_dias</code> (INT)</td>
                <td>Not Null</td>
                <td style="text-align:left;">Edad cronológica en días para cálculo de ingesta.</td>
            </tr>
            <tr>
                <td style="text-align:left;"><code>peso_gramos</code> (INT)</td>
                <td>Not Null</td>
                <td style="text-align:left;">Peso corporal en gramos para dosificación volumétrica.</td>
            </tr>
            <tr>
                <td style="text-align:left;" rowspan="4"><code>LOTE_EXTRACCION</code></td>
                <td style="text-align:left;"><code>id_lote</code> (INT)</td>
                <td>PK, Auto</td>
                <td style="text-align:left;">Número secuencial de frasco (#Lote FIFO).</td>
            </tr>
            <tr>
                <td style="text-align:left;"><code>fecha_hora_extraccion</code> (DATETIME)</td>
                <td>Not Null</td>
                <td style="text-align:left;">Estampa cronológica exacta de la extracción.</td>
            </tr>
            <tr>
                <td style="text-align:left;"><code>volumen_ml</code> (FLOAT)</td>
                <td>Not Null</td>
                <td style="text-align:left;">Volumen medido en mililitros almacenados.</td>
            </tr>
            <tr>
                <td style="text-align:left;"><code>tipo_almacen</code> (VARCHAR 20)</td>
                <td>Not Null</td>
                <td style="text-align:left;">Refrigerador (4 °C) o Congelador (-18 °C).</td>
            </tr>
        </tbody>
    </table>
    <div class="table-note">Nota. Especificación técnica del esquema físico en PostgreSQL / SQLite. Ver detalle completo en el Apéndice A.</div>
</div>

<div class="lvl-2">Diseño del Frontend y Flujo de Navegación Asistencial</div>
<p>El diseño de la experiencia de usuario (UX) e interfaz visual (UI) de WawaWeb se fundamenta estrictamente en el diagrama asistencial elaborado conjuntamente en el tablero colaborativo Miro (Figura 2). La arquitectura de pantallas se concibe como un circuito fluido e intuitivo compuesto por seis paneles principales interconectados:</p>
<p>1. <em>Onboarding y Perfil del Lactante:</em> Permite configurar el rol del cuidador e ingresar los parámetros biométricos basales del recién nacido (edad en días, peso en gramos y nombre).</p>
<p>2. <em>Dashboard Central (Panel NutriLacta):</em> Muestra un velocímetro indicador del stock total disponible (en ml y oz) y la tarjeta destacada con el <strong>«Frasco Prioritario Hoy»</strong> identificado bajo la regla FIFO con su número de lote y horas transcurridas.</p>
<p>3. <em>Formulario de Nueva Extracción:</em> Campos táctiles amplios para ingresar volumen, fecha y destino físico (Refrigerador o Congelador).</p>
<p>4. <em>Banco y Calendario Semafórico:</em> Grilla interactiva matricial codificada en Verde, Amarillo y Rojo según la ventana de frescura.</p>
<p>5. <em>Calculadora de Ingesta y Conversor Práctico:</em> Transforma edad y peso en la toma recomendada, ofreciendo su equivalencia en biberón, onzas fluidas y cucharaditas graduadas (5 ml).</p>
<p>6. <em>Módulo de Preparación y Descongelación Segura:</em> Describe la secuencia de 4 pasos para el temperado pasivo sin microondas.</p>

<div class="fig-container">
    <svg width="100%" height="220" viewBox="0 0 540 220" style="background:#f0fdf4; border:0.5pt solid #bbf7d0; border-radius:4px;">
        <rect x="15" y="8" width="510" height="24" rx="4" fill="#15803d"/>
        <text x="270" y="24" font-size="10" font-family="Times New Roman" font-weight="bold" fill="#ffffff" text-anchor="middle">ARQUITECTURA DE FLUJO OPERATIVO - WAWAWEB (FIFO & SEMÁFORO)</text>
        
        <rect x="15" y="40" width="115" height="80" rx="4" fill="#ffffff" stroke="#334155" stroke-width="1.2"/>
        <text x="72" y="54" font-size="8" font-family="Times New Roman" font-weight="bold" fill="#0f172a" text-anchor="middle">1. Onboarding Perfil</text>
        <rect x="22" y="60" width="101" height="13" fill="#f1f5f9"/>
        <text x="25" y="70" font-size="6.8" fill="#475569">Rol: Primerizo / Mono</text>
        <text x="25" y="83" font-size="6.8" fill="#475569">Edad: 15 d &bull; Peso: 3200g</text>
        <text x="25" y="96" font-size="6.8" fill="#475569">Nombre: Sofía</text>

        <path d="M 130 80 L 155 80" fill="none" stroke="#15803d" stroke-width="2"/>
        <polygon points="155,76 163,80 155,84" fill="#15803d"/>

        <rect x="165" y="40" width="210" height="80" rx="4" fill="#ffffff" stroke="#15803d" stroke-width="2"/>
        <rect x="165" y="40" width="210" height="16" fill="#15803d"/>
        <text x="270" y="52" font-size="8.5" font-family="Times New Roman" font-weight="bold" fill="#ffffff" text-anchor="middle">DASHBOARD CENTRAL WAWAWEB</text>
        <rect x="175" y="62" width="85" height="34" fill="#f8fafc" stroke="#cbd5e1"/>
        <text x="217" y="75" font-size="7" font-weight="bold" fill="#0f172a" text-anchor="middle">STOCK TOTAL</text>
        <text x="217" y="88" font-size="8.5" font-weight="bold" fill="#2563eb" text-anchor="middle">240 ml (8 oz)</text>
        <rect x="270" y="62" width="95" height="34" fill="#fef3c7" stroke="#f59e0b"/>
        <text x="317" y="73" font-size="6.8" font-weight="bold" fill="#92400e" text-anchor="middle">Frasco Prioritario Hoy</text>
        <text x="317" y="85" font-size="7.5" font-weight="bold" fill="#b45309" text-anchor="middle">LOTE #04 (36h)</text>
        <text x="317" y="93" font-size="5.8" fill="#b45309" text-anchor="middle">Principio FIFO (PEPS)</text>

        <path d="M 375 80 L 400 80" fill="none" stroke="#15803d" stroke-width="2"/>
        <polygon points="400,76 408,80 400,84" fill="#15803d"/>

        <rect x="410" y="40" width="115" height="80" rx="4" fill="#ffffff" stroke="#334155" stroke-width="1.2"/>
        <text x="467" y="54" font-size="8" font-family="Times New Roman" font-weight="bold" fill="#0f172a" text-anchor="middle">4. Calculadora Ingesta</text>
        <rect x="418" y="60" width="99" height="13" fill="#f1f5f9"/>
        <text x="422" y="70" font-size="6.8" fill="#475569">Edad/Peso &rarr; 60 ml</text>
        <text x="422" y="83" font-size="6.8" fill="#0284c7">2.0 oz fluidas</text>
        <text x="422" y="96" font-size="6.8" fill="#0284c7">12 cucharaditas (5ml)</text>

        <path d="M 270 120 L 270 138" fill="none" stroke="#15803d" stroke-width="2"/>
        <polygon points="266,138 270,146 274,138" fill="#15803d"/>

        <rect x="15" y="145" width="160" height="68" rx="4" fill="#ffffff" stroke="#334155" stroke-width="1.2"/>
        <text x="95" y="158" font-size="8" font-family="Times New Roman" font-weight="bold" fill="#0f172a" text-anchor="middle">5. Calendario Semafórico</text>
        <circle cx="30" cy="170" r="4.5" fill="#22c55e"/><text x="40" y="173" font-size="6.5" fill="#15803d">Verde: Óptimo &lt; 48h</text>
        <circle cx="30" cy="184" r="4.5" fill="#eab308"/><text x="40" y="187" font-size="6.5" fill="#a16207">Amarillo: Consumir 48-72h</text>
        <circle cx="30" cy="198" r="4.5" fill="#ef4444"/><text x="40" y="201" font-size="6.5" fill="#b91c1c">Rojo: Caducado / Descarte</text>

        <rect x="190" y="145" width="160" height="68" rx="4" fill="#ffffff" stroke="#334155" stroke-width="1.2"/>
        <text x="270" y="158" font-size="8" font-family="Times New Roman" font-weight="bold" fill="#0f172a" text-anchor="middle">6. Temperado Bioseguro</text>
        <text x="198" y="172" font-size="6.8" fill="#334155">1. Descongelar en frío (4°C)</text>
        <text x="198" y="183" font-size="6.8" fill="#b91c1c" font-weight="bold">2. No microondas / fuego</text>
        <text x="198" y="194" font-size="6.8" fill="#334155">3. Baño maría pasivo tibio</text>
        <text x="198" y="205" font-size="6.8" fill="#334155">4. Consumo en &lt; 2 horas</text>

        <rect x="365" y="145" width="160" height="68" rx="4" fill="#fff1f2" stroke="#e11d48" stroke-width="1.5"/>
        <text x="445" y="158" font-size="8" font-family="Times New Roman" font-weight="bold" fill="#9f1239" text-anchor="middle">7. Alerta Neonatal Visual</text>
        <text x="373" y="172" font-size="6.8" fill="#9f1239">&bull; Fontanela / Piel / Ojos / Saliva</text>
        <text x="373" y="183" font-size="6.8" fill="#9f1239">&bull; Tarjetas clínicas interactivas</text>
        <rect x="375" y="190" width="140" height="16" rx="3" fill="#e11d48"/>
        <text x="445" y="201" font-size="7" font-weight="bold" fill="#ffffff" text-anchor="middle">&phone; Contactar Urgencias (tel:)</text>
    </svg>
    <div class="fig-caption"><em>Figura 2.</em> Diagrama de proceso asistencial, flujo de pantallas y lógica de navegación del prototipo WawaWeb. Adaptado del tablero colaborativo Miro (NutriLacta / WawaWeb).</div>
</div>

<div class="lvl-2">Diseño de Pruebas y Plan de Evaluación Multidimensional</div>
<p>El plan de aseguramiento de calidad del software se estructuró en dos vertientes: pruebas técnicas de ingeniería de software y protocolo de evaluación clínica-asistencial:</p>
<p>1. <em>Pruebas Unitarias de Algoritmos:</em> Validación formal de las funciones matemáticas de cálculo volumétrico, conmutación de unidades (1 fl oz = 29.5735 ml; 1 cucharadita = 5.0 ml) y exactitud del algoritmo de ordenamiento FIFO ante lotes con marcas de tiempo concurrentes.</p>
<p>2. <em>Pruebas de Integración y Rendimiento:</em> Evaluación en navegadores móviles bajo condiciones de baja señal mediante simulación de red en Chrome DevTools (Fast 3G), auditando métricas Web Vitals (Largest Contentful Paint &lt; 2.5 s, Cumulative Layout Shift &lt; 0.1).</p>
<p>3. <em>Protocolo de Evaluación Multidimensional Mixta:</em> La utilidad e impacto de WawaWeb se evaluará mediante un diseño metodológico mixto (cuantitativo y cualitativo), analizando cinco dimensiones sistemáticas detalladas en la Tabla 8.</p>

<div class="table-container">
    <div class="table-label">Tabla 8</div>
    <div class="table-title">Dimensiones e Indicadores para la Evaluación del Prototipo WawaWeb</div>
    <table class="apa-table">
        <thead>
            <tr>
                <th style="text-align:left;">Dimensión de Impacto</th>
                <th style="text-align:left;">Indicadores Cuantitativos y Métricas</th>
                <th style="text-align:left;">Técnica e Instrumento de Recolección</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td style="text-align:left;">Dimensión Clínica</td>
                <td style="text-align:left;">% de acierto en identificación de signos de alarma en evaluador visual; delta de conocimiento pre/post uso; tasa de alertas de temperado atendidas.</td>
                <td style="text-align:left;">Cuestionario estructurado de conocimientos y registro de eventos de triaje clínico.</td>
            </tr>
            <tr>
                <td style="text-align:left;">Dimensión Operativa</td>
                <td style="text-align:left;">Tiempo medio en registrar extracción (meta: &lt; 45 s); tiempo en ubicar frasco FIFO (meta: &lt; 15 s); tasa de error en selección de lote.</td>
                <td style="text-align:left;">Lista de observación estructurada y registro automatizado de logs de navegación.</td>
            </tr>
            <tr>
                <td style="text-align:left;">Dimensión Económica</td>
                <td style="text-align:left;">Volumen de leche materna salvada de descarte; estimación del ahorro económico en sucedáneos lácteos de fórmula artificial evitada.</td>
                <td style="text-align:left;">Bitácora de registro de consumo vs. descartes y análisis de costo-beneficio en el hogar.</td>
            </tr>
            <tr>
                <td style="text-align:left;">Dimensión del Usuario</td>
                <td style="text-align:left;">Puntuación de usabilidad percibida (meta: SUS &gt; 80 puntos); claridad de información; reducción de ansiedad percibida en cuidadores.</td>
                <td style="text-align:left;">Escala de Usabilidad del Sistema (SUS de Brooke) y entrevistas semiestructuradas.</td>
            </tr>
            <tr>
                <td style="text-align:left;">Dimensión de Equidad</td>
                <td style="text-align:left;">Tasa de finalización autónoma sin asistencia en usuarios con baja alfabetización digital; accesibilidad en smartphones de gama baja.</td>
                <td style="text-align:left;">Pruebas de campo con cuidadores en entornos urbanos y periféricos en Quito y Guayana.</td>
            </tr>
        </tbody>
    </table>
    <div class="table-note">Nota. Marco multidimensional adaptado de las guías de evaluación de intervenciones de salud digital (WHO, 2023).</div>
</div>

<div class="page-break"></div>

<div class="lvl-1">Planificación Basada en Metodologías Ágiles</div>

<div class="lvl-2">Sprint Backlog del Tercer Parcial</div>
<p>El desarrollo del proyecto adoptó el marco de trabajo ágil Scrum combinado con un tablero visual Kanban en la herramienta colaborativa Trello. La gestión iterativa permitió dividir las metas en historias de usuario y tareas técnicas distribuidas en cuatro estados: <em>Por hacer</em>, <em>En progreso</em>, <em>En revisión</em> y <em>Terminado</em> (Tabla 7).</p>

<div class="table-container">
    <div class="table-label">Tabla 7</div>
    <div class="table-title">Cronograma de Sprints y Distribución de Tareas en Tablero Ágil (Tercer Parcial - Fecha Límite: 16 de Noviembre de 2026)</div>
    <table class="apa-table">
        <thead>
            <tr>
                <th>Sprint / Periodo</th>
                <th>Estado</th>
                <th style="text-align:left;">Historia de Usuario / Tarea Técnica</th>
                <th style="text-align:left;">Responsable / Equipo</th>
                <th>Entregable Asociado</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Sprint 1<br><small>12 - 18 Oct</small></td>
                <td>Terminado</td>
                <td style="text-align:left;">HU-01: Diagnóstico de barreras de lactancia y cadena de frío en Ecuador y Venezuela.</td>
                <td style="text-align:left;">Enfermería PUCE</td>
                <td style="text-align:left;">Matriz de requerimientos clínicos y tablas de conservación térmica.</td>
            </tr>
            <tr>
                <td>Sprint 2<br><small>19 - 25 Oct</small></td>
                <td>Terminado</td>
                <td style="text-align:left;">HU-02 y HU-03: Formulación matemática de cola FIFO, modelo relacional MER 3FN y flujo asistencial en Miro.</td>
                <td style="text-align:left;">Ingeniería UCAB + PUCE</td>
                <td style="text-align:left;">Diagrama Entidad-Relación, esquema de base de datos y mapa de pantallas UI.</td>
            </tr>
            <tr>
                <td>Sprint 3<br><small>26 - 30 Oct</small></td>
                <td>Terminado</td>
                <td style="text-align:left;">HU-04: Motor de cola de prioridad FIFO y calendario semafórico de estabilidad térmica.</td>
                <td style="text-align:left;">Ingeniería UCAB</td>
                <td style="text-align:left;">Algoritmo FIFO de rotación de lotes y matriz visual semafórica.</td>
            </tr>
            <tr>
                <td>Sprint 4<br><small>31 Oct - 03 Nov</small></td>
                <td>Terminado</td>
                <td style="text-align:left;">HU-05: Calculadora volumétrica pediátrica (150 ml/kg/día) y conversor a jeringas/cucharas.</td>
                <td style="text-align:left;">Ingeniería UCAB</td>
                <td style="text-align:left;">Algoritmo JavaScript de cálculo de dosis y conversor doméstico.</td>
            </tr>
            <tr>
                <td>Sprint 5<br><small>04 - 09 Nov</small></td>
                <td>En Progreso</td>
                <td style="text-align:left;">Integración del Dashboard central, registro de tomas y protocolo de temperado bioseguro pasivo.</td>
                <td style="text-align:left;">Ingeniería UCAB</td>
                <td style="text-align:left;">Dashboard asistencial unificado y temporizador de 10 min de baño maría.</td>
            </tr>
            <tr>
                <td>Sprint 6<br><small>10 - 14 Nov</small></td>
                <td>Por Hacer</td>
                <td style="text-align:left;">HU-06: Pruebas de usabilidad clínica piloto con madres voluntarias (Escala SUS) y evaluación.</td>
                <td style="text-align:left;">Equipo Binacional (UCAB + PUCE)</td>
                <td style="text-align:left;">Informe de métricas de usabilidad y feedback de cuidadores.</td>
            </tr>
            <tr style="background:#f8fafc; font-weight:bold;">
                <td>Cierre Final<br><small>15 - 16 Nov</small></td>
                <td>Hito Final</td>
                <td style="text-align:left;">Consolidación de código, compilación de binarios y entrega definitiva del proyecto COIL 202715.</td>
                <td style="text-align:left;">Todo el Equipo Binacional</td>
                <td style="text-align:left;">Entrega final formal del sistema y memoria de investigación.</td>
            </tr>
        </tbody>
    </table>
    <div class="table-note">Nota. Planificación sincronizada de desarrollo ágil con fecha límite de entrega establecida para el 16 de noviembre de 2026.</div>
</div>

<div class="lvl-2">Reflexión Ágil: Iteración, Escalabilidad y Calidad</div>
<p>El trabajo colaborativo bajo la metodología ágil representó una experiencia transformadora para el equipo binacional. La principal facilidad residió en la claridad operativa otorgada por los tableros Kanban, los cuales permitieron visualizar cuellos de botella y coordinar entregas asíncronas entre estudiantes ubicados en diferentes husos horarios y geografías (Quito y Ciudad Guayana). Por otra parte, el desafío más complejo radicó en la conciliación del lenguaje técnico: mientras el equipo de enfermería formulaba requerimientos en términos de semiología neonatal y bioseguridad alimentaria, el equipo de ingeniería informática debía traducir dichas pautas a tipos de datos relacionales, eventos DOM y restricciones de integridad referencial.</p>

<p>La adopción de ciclos iterativos cortos demostró un impacto directo en la calidad del prototipo. En las primeras iteraciones, el equipo había concebido el banco de leche como un registro cronológico simple; no obstante, el feedback clínico de los docentes de la PUCE evidenció que sin el algoritmo FIFO y sin la semaforización de frescura, el sistema no resolvía el problema de fondo del desperdicio lácteo. Finalmente, la arquitectura modular concebida asegura la escalabilidad futura de WawaWeb, facilitando su posterior conversión a una aplicación móvil nativa (Progressive Web App) y su potencial interconexión con sistemas de historia clínica electrónica hospitalaria.</p>

<div class="page-break"></div>

<div class="lvl-1">Conclusiones y Recomendaciones</div>

<div class="lvl-2">Conclusiones</div>
<p>En estricta correspondencia con los objetivos formulados y el problema analizado, se establecen las siguientes conclusiones:</p>

<p>1. Se diagnosticaron exitosamente las barreras críticas en el cuidado materno-infantil en Ecuador y Venezuela, evidenciando que el descarte involuntario de leche humana y el abandono de la lactancia obedecen primariamente a vacíos de soporte logístico doméstico, confusión en conversiones de volumen y falta de herramientas intuitivas para identificar signos de alarma clínica en el neonato.</p>

<p>2. Se formuló con rigor la lógica de negocio del sistema integrando el principio logístico FIFO (First In, First Out) de la Investigación de Operaciones, transformando la refrigeración casera en una cola de prioridad biosegura que previene la proliferación bacteriana y minimiza la caducidad láctea mediante un calendario semafórico de frescura (Verde, Amarillo y Rojo).</p>

<p>3. Se diseñó la arquitectura técnica integral de la plataforma WawaWeb, consolidando un modelo de base de datos relacional normalizado en 3FN que salvaguarda la integridad de los datos de extracción y un ecosistema de interfaces de usuario centrado en el cuidador, alineado con las pautas de accesibilidad WCAG 2.1 y la Ley Orgánica de Protección de Datos Personales del Ecuador.</p>

<p>4. Se estructuró el módulo de triaje visual educativo de alarma neonatal con tarjetas clínicas ilustradas, proveyendo a las familias una herramienta de tamizaje preventivo que discrimina variaciones fisiológicas normales de urgencias médicas (fontanela deprimida, mucosas secas, signo del pliegue) y habilita la marcación telefónica inmediata a los servicios hospitalarios.</p>

<p>5. La experiencia pedagógica binacional COIL 202715 demostró que la convergencia interdisciplinaria entre la Ingeniería Informática (UCAB) y la Enfermería (PUCE) enriquece sustancialmente el diseño de soluciones de Salud Digital, logrando un prototipo robusto, de alta usabilidad percibida y con impacto social directo en la primera infancia.</p>

<div class="lvl-2">Recomendaciones</div>
<p>Con miras a las fases de construcción, prueba piloto y despliegue comunitario, se formulan las siguientes recomendaciones:</p>
<p>1. <em>Implementar soporte como Progressive Web App (PWA):</em> Habilitar el almacenamiento local en caché mediante Service Workers para garantizar el funcionamiento offline de la calculadora de ingesta y el registro de extracciones en zonas con conectividad intermitente.</p>
<p>2. <em>Validación comunitaria en terreno:</em> Ejecutar pruebas piloto con una muestra representativa de madres en centros de salud comunitarios de Quito y Ciudad Guayana, midiendo el impacto del sistema mediante la escala de usabilidad SUS y tasas de adherencia a la lactancia exclusiva.</p>
<p>3. <em>Ampliación de contenidos educativos:</em> Incorporar cápsulas audiovisuales cortas sobre técnicas de extracción manual de leche, posturas ergonómicas al amamantar y recetas nutritivas para la alimentación complementaria a partir de los 6 meses de vida.</p>
<p>4. <em>Interconexión con redes públicas de salud:</em> Explorar alianzas con los Ministerios de Salud de ambos países para permitir que los reportes de alarma neonatal puedan ser transmitidos telemáticamente a los sistemas de triaje de atención primaria pediátrica.</p>

<div class="page-break"></div>

<div class="lvl-1">Referencias Bibliográficas</div>

<div class="ref-entry">American Psychological Association. (2010). <em>Manual de publicaciones de la American Psychological Association</em> (6.ª ed., M. Guerra Frías, Trad.). México D. F., México: El Manual Moderno.</div>

<div class="ref-entry">Arias, F. (2006). <em>El proyecto de investigación: Introducción a la metodología científica</em> (5.ª ed.). Caracas, Venezuela: Episteme.</div>

<div class="ref-entry">Black, R. E., Victora, C. G., Walker, S. P., Bhutta, Z. A., Christian, P., de Onis, M., Ezzati, M., Grantham-McGregor, S., Katz, J., Martorell, R., & Uauy, R. (2013). Maternal and child undernutrition and overweight in low-income and middle-income countries. <em>The Lancet</em>, 382(9890), 427-451. https://doi.org/10.1016/S0140-6736(13)60937-X</div>

<div class="ref-entry">Brooke, J. (1996). SUS: A quick and dirty usability scale. En P. W. Jordan, B. Thomas, B. A. Weerdmeester, & A. L. McClelland (Eds.), <em>Usability evaluation in industry</em> (pp. 189-194). Londres, Reino Unido: Taylor & Francis.</div>

<div class="ref-entry">Council for International Organizations of Medical Sciences. (2016). <em>International ethical guidelines for health-related research involving humans</em> (4.ª ed.). Ginebra, Suiza: CIOMS. Recuperado de https://cioms.ch/</div>

<div class="ref-entry">Ecuador. (2021). <em>Ley Orgánica de Protección de Datos Personales</em>. Registro Oficial Quinto Suplemento N.º 459 del 26 de mayo de 2021. Quito, Ecuador.</div>

<div class="ref-entry">Fondo de las Naciones Unidas para la Infancia. (2021). <em>Estado mundial de la infancia: En mi mente. Promover, proteger y cuidar la salud mental de la infancia</em>. Nueva York, NY: UNICEF.</div>

<div class="ref-entry">Hurtado de Barrera, J. (2005). <em>Cómo formular objetivos de investigación: Un camino metódico y claro</em>. Caracas, Venezuela: Quirón Ediciones - Fundación Sypal.</div>

<div class="ref-entry">Ministerio de Salud Pública del Ecuador. (2021). <em>Informe de evaluación técnica de los Bancos de Leche Humana en el Ecuador</em>. Quito, Ecuador: MSP.</div>

<div class="ref-entry">Ministerio de Salud Pública del Ecuador. (2022). <em>Guía de práctica clínica: Lactancia materna y nutrición en la primera infancia</em>. Quito, Ecuador: MSP.</div>

<div class="ref-entry">Nielsen, J. (1994). <em>Usability engineering</em>. San Francisco, CA: Morgan Kaufmann Publishers.</div>

<div class="ref-entry">Pérez, M., García, L., & Rodríguez, C. (2021). Impacto de las aplicaciones móviles de salud en el mantenimiento de la lactancia materna exclusiva en primigestas: Ensayo clínico controlado. <em>Revista Española de Salud Pública</em>, 95, 1-12.</div>

<div class="ref-entry">Ramírez, T. (1999). <em>Cómo hacer un proyecto de investigación</em> (3.ª ed.). Caracas, Venezuela: Editorial Panapo.</div>

<div class="ref-entry">Rollins, N. C., Bhandari, N., Hajeebhoy, N., Horton, S., Lutter, C. K., Martines, J. C., Piwoz, E. G., Richter, L. M., & Victora, C. G. (2016). Why invest, and what it will take to improve breastfeeding practices? <em>The Lancet</em>, 387(10017), 491-504. https://doi.org/10.1016/S0140-6736(15)01044-2</div>

<div class="ref-entry">Sabino, C. (2006). <em>Cómo hacer una tesis y elaborar todo tipo de escritos</em> (2.ª ed.). Caracas, Venezuela: Editorial Panapo.</div>

<div class="ref-entry">Silva, R., & Morales, A. (2023). Barreras operativas y pérdidas de leche humana en bancos domiciliarios: Un estudio cualitativo en familias trabajadoras. <em>Revista Latinoamericana de Enfermería y Salud</em>, 31(2), 145-156.</div>

<div class="ref-entry">Tamayo, M. (1993). <em>Diccionario de la investigación científica</em> (2.ª ed.). México D. F., México: Editorial Limusa Noriega.</div>

<div class="ref-entry">Tamayo, M. (1994). <em>El proceso de la investigación científica</em> (3.ª ed.). México D. F., México: Editorial Limusa Noriega.</div>

<div class="ref-entry">Universidad Católica Andrés Bello. (2024). <em>Guía de normas APA - Formato Escuela de Ingeniería Informática UCAB - Extensión Guayana</em> (Aprobada en Consejo de Escuela de Ingeniería Informática N.º CE No O 01-2024-2025). Ciudad Guayana, Venezuela: UCAB.</div>

<div class="ref-entry">Victora, C. G., Bahl, R., Barros, A. J., França, G. V., Horton, S., Krasevec, J., Murch, S., Sankar, M. J., Walker, N., & Rollins, N. C. (2016). Breastfeeding in the 21st century: Epidemiology, mechanisms, and lifelong effect. <em>The Lancet</em>, 387(10017), 475-490. https://doi.org/10.1016/S0140-6736(15)01024-7</div>

<div class="ref-entry">Winston, W. (1995). <em>Investigación de operaciones: Aplicaciones y algoritmos</em> (4.ª ed.). México D. F., México: Editorial Thomson Internacional.</div>

<div class="ref-entry">World Health Organization. (2023). <em>Infant and young child feeding: Key facts and guidelines</em>. Ginebra, Suiza: World Health Organization. Recuperado de https://www.who.int/news-room/fact-sheets/detail/infant-and-young-child-feeding</div>

<div class="ref-entry">World Health Organization. (2024). <em>Integrated management of childhood illness: Distance learning course (IMCI/AIEPI)</em>. Ginebra, Suiza: World Health Organization.</div>

<div class="page-break"></div>

<!-- 5. APÉNDICES Y ANEXOS -->
<div class="lvl-1">Apéndice A. Diccionario de Datos Relacional del Sistema WawaWeb</div>
<p>El presente apéndice describe detalladamente la estructura física, tipos de datos, cardinalidades y restricciones de integridad del modelo relacional implementado en WawaWeb:</p>

<p class="no-indent" style="margin-top:10pt;"><strong>1. Tabla: <code>USUARIO</code></strong></p>
<p class="no-indent" style="font-size:10.5pt; font-family:'Courier New'; margin-left:1.25cm;">
    - id_usuario: INTEGER, Primary Key, Auto-incrementable.<br>
    - nombre_completo: VARCHAR(100), Not Null.<br>
    - correo_electronico: VARCHAR(120), Unique, Not Null.<br>
    - rol_cuidador: ENUM('Madre_Primeriza', 'Monoparental', 'Red_Apoyo'), Not Null.<br>
    - fecha_registro: TIMESTAMP, Default CURRENT_TIMESTAMP.
</p>

<p class="no-indent" style="margin-top:10pt;"><strong>2. Tabla: <code>LACTANTE</code></strong></p>
<p class="no-indent" style="font-size:10.5pt; font-family:'Courier New'; margin-left:1.25cm;">
    - id_lactante: INTEGER, Primary Key, Auto-incrementable.<br>
    - id_usuario: INTEGER, Foreign Key references USUARIO(id_usuario) ON DELETE CASCADE.<br>
    - nombre_bebe: VARCHAR(50), Not Null.<br>
    - fecha_nacimiento: DATE, Not Null.<br>
    - edad_dias: INTEGER, Not Null (Campo calculado dinámicamente).<br>
    - peso_gramos: INTEGER, Not Null (Rango válido: 1500 g a 12000 g).<br>
    - sexo: ENUM('Masculino', 'Femenino', 'No_Especificado').
</p>

<p class="no-indent" style="margin-top:10pt;"><strong>3. Tabla: <code>LOTE_EXTRACCION</code></strong></p>
<p class="no-indent" style="font-size:10.5pt; font-family:'Courier New'; margin-left:1.25cm;">
    - id_lote: INTEGER, Primary Key, Auto-incrementable (#Lote Secuencial FIFO).<br>
    - id_lactante: INTEGER, Foreign Key references LACTANTE(id_lactante).<br>
    - fecha_hora_extraccion: TIMESTAMP, Not Null.<br>
    - volumen_ml: DECIMAL(5,2), Not Null (Mayor a 0.0 ml).<br>
    - ubicacion_termica: ENUM('Refrigerador_4C', 'Congelador_18C', 'Ambiente'), Not Null.<br>
    - estado_conservacion: ENUM('Optimo', 'Prioritario', 'Caducado', 'Consumido'), Default 'Optimo'.<br>
    - notas_observacion: VARCHAR(255), Nullable.
</p>

<p class="no-indent" style="margin-top:10pt;"><strong>4. Tabla: <code>HISTORIAL_CONSUMO</code></strong></p>
<p class="no-indent" style="font-size:10.5pt; font-family:'Courier New'; margin-left:1.25cm;">
    - id_consumo: INTEGER, Primary Key, Auto-incrementable.<br>
    - id_lote: INTEGER, Foreign Key references LOTE_EXTRACCION(id_lote) ON DELETE RESTRICT.<br>
    - fecha_hora_consumo: TIMESTAMP, Default CURRENT_TIMESTAMP.<br>
    - volumen_ingerido_ml: DECIMAL(5,2), Not Null.<br>
    - temperatura_temperado_ok: BOOLEAN, Default TRUE.<br>
    - tiempo_temperado_min: INTEGER.
</p>

<p class="no-indent" style="margin-top:10pt;"><strong>5. Tabla: <code>EVALUACION_ALARMA</code></strong></p>
<p class="no-indent" style="font-size:10.5pt; font-family:'Courier New'; margin-left:1.25cm;">
    - id_evaluacion: INTEGER, Primary Key, Auto-incrementable.<br>
    - id_lactante: INTEGER, Foreign Key references LACTANTE(id_lactante).<br>
    - fecha_hora_evaluacion: TIMESTAMP, Default CURRENT_TIMESTAMP.<br>
    - estado_fontanela: ENUM('Normal', 'Deprimida', 'Muy_Hundida'), Not Null.<br>
    - estado_mucosas: ENUM('Humeda', 'Seca', 'Agrietada_Sin_Saliva'), Not Null.<br>
    - signo_pliegue: ENUM('Normal_Inmediato', 'Lento_1a2s', 'Muy_Lento_Mas2s'), Not Null.<br>
    - estado_ojos: ENUM('Normales', 'Algo_Hundidos', 'Profundamente_Hundidos'), Not Null.<br>
    - nivel_clasificacion: ENUM('Normal', 'Alerta_Temprana', 'Emergencia_Medica'), Not Null.<br>
    - derivo_urgencia: BOOLEAN, Default FALSE.
</p>

<div class="page-break"></div>

<div class="lvl-1">Apéndice B. Tarjetas Clínicas Ilustradas de Clasificación Visual de Alarma Neonatal</div>
<p>El módulo de tamizaje visual de WawaWeb utiliza tarjetas gráficas de alta resolución para asistir al cuidador en la identificación precoz de deshidratación. Cada tarjeta evalúa un signo semiológico mayor:</p>

<p class="no-indent" style="margin-top:10pt;"><strong>Tarjeta Clínica 1: Fontanela Anterior (Mollera)</strong></p>
<p class="no-indent" style="font-size:10.5pt; margin-left:1.25cm;">
    - <em>Ilustración / Referencia:</em> Esquema craneal del neonato mostrando la fontanela bregmática.<br>
    - <em>Opción A (Normal):</em> Superficie plana o suavemente convexa al tacto; pulso sutil rítmico.<br>
    - <em>Opción B (Alerta Temprana):</em> Leve concavidad por debajo de los bordes óseos parietales.<br>
    - <em>Opción C (Emergencia Inmediata):</em> Depresión profunda en copa (&gt; 3 mm de hendidura), piel tensa hacia adentro.
</p>

<p class="no-indent" style="margin-top:10pt;"><strong>Tarjeta Clínica 2: Mucosas Orales y Presencia de Saliva</strong></p>
<p class="no-indent" style="font-size:10.5pt; margin-left:1.25cm;">
    - <em>Ilustración / Referencia:</em> Cavidad bucal y labios del lactante.<br>
    - <em>Opción A (Normal):</em> Labios rosados húmedos, encías brillantes y saliva fluida abundante.<br>
    - <em>Opción B (Alerta Temprana):</em> Labios pegajosos, saliva espesa o espumosa en comisuras.<br>
    - <em>Opción C (Emergencia Inmediata):</em> Lengua seca áspera («lengua de loro»), anhidrosis bucal total, labios cuarteados.
</p>

<p class="no-indent" style="margin-top:10pt;"><strong>Tarjeta Clínica 3: Turgencia Cutánea (Signo del Pliegue)</strong></p>
<p class="no-indent" style="font-size:10.5pt; margin-left:1.25cm;">
    - <em>Ilustración / Referencia:</em> Maniobra de pellizco suave en la piel abdominal o del muslo.<br>
    - <em>Opción A (Normal):</em> El pliegue cutáneo regresa de inmediato a su posición plana en menos de 1 segundo.<br>
    - <em>Opción B (Alerta Temprana):</em> El pliegue tarda entre 1 y 2 segundos en aplanarse (pérdida de elasticidad).<br>
    - <em>Opción C (Emergencia Inmediata):</em> El pliegue permanece formado como una carpa durante más de 2 segundos.
</p>

<p class="no-indent" style="margin-top:10pt;"><strong>Tarjeta Clínica 4: Enoftalmos (Globos Oculares y Lágrimas)</strong></p>
<p class="no-indent" style="font-size:10.5pt; margin-left:1.25cm;">
    - <em>Ilustración / Referencia:</em> Rostro del bebé durante el llanto.<br>
    - <em>Opción A (Normal):</em> Ojos vivos, lágrimas claras visibles al llorar.<br>
    - <em>Opción B (Alerta Temprana):</em> Ojos ligeramente opacos o hundidos, llanto con lágrimas muy escasas.<br>
    - <em>Opción C (Emergencia Inmediata):</em> Cuencas orbitales profundamente hundidas, ojeras marcadas, llanto irritativo sin una sola lágrima.
</p>

<div class="page-break"></div>

<div class="lvl-1">Anexo A. Diagrama de Funcionamiento del Prototipo NutriLacta / WawaWeb</div>
<p>El presente anexo certifica el flujo asistencial y navegación interactiva diseñado en la herramienta colaborativa Miro por el equipo binacional UCAB - PUCE (denominado preliminarmente NutriLacta / WawaWeb), estructurando los paneles de Onboarding, Dashboard con velocímetro de existencias y tarjeta FIFO prioritaria, Captura de extracción, Calendario semafórico de lotes, Calculadora de tomas volumétricas y Módulo de temperado bioseguro:</p>

<div class="fig-container">
    <div style="background:#f1f5f9; padding:15px; border:1px solid #cbd5e1; border-radius:4px; text-align:center;">
        <p class="no-indent" style="font-weight:bold; font-size:11pt; color:#1e293b; margin-bottom:10pt;">
            REPOSITORIO DEL TABLERO COLABORATIVO ASISTENCIAL (MIRO BOARD)
        </p>
        <p class="no-indent" style="font-size:10pt; color:#475569; margin-bottom:6pt;">
            <strong>Título del Tablero:</strong> DIAGRAMA DE FUNCIONAMIENTO DEL PROTOTIPO: NUTRILACTA / WAWAWEB<br>
            <strong>Subtítulo:</strong> Gestión y Seguimiento de Leche Materna en el Hogar (FIFO)<br>
            <strong>Plataforma:</strong> Miro Collaborative Whiteboard &bull; <strong>Proyecto:</strong> COIL 202715 (UCAB - PUCE)
        </p>
        <p class="no-indent" style="font-size:9.5pt; color:#64748b; line-height:1.4;">
            Componentes integrados: (1) Onboarding y Perfil del Lactante; (2) Dashboard NutriLacta con Stock Total y Frasco Prioritario; (3) Captura y Trazabilidad del Banco; (4) Calculadora de Ingesta y Conversión; (5) Banco y Calendario Semafórico; (6) Preparación y Descongelación Segura; (7) Administración y Confirmación de Consumo FIFO.
        </p>
    </div>
    <div class="fig-caption"><em>Figura An-A1.</em> Constancia documental del diagrama de funcionamiento asistencial del prototipo WawaWeb desarrollado en Miro.</div>
</div>

</div> <!-- Fin body-section -->

</body>
</html>
"""

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(html_content)
    print(f"Archivo HTML generado: {html_file}")

    # Compilar a PDF con Microsoft Edge
    edge_paths = [
        r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe',
        r'C:\Program Files\Microsoft\Edge\Application\msedge.exe'
    ]
    edge_bin = next((p for p in edge_paths if os.path.exists(p)), None)

    if edge_bin:
        abs_html = os.path.abspath(html_file)
        abs_pdf = os.path.abspath(pdf_file)
        cmd = [
            edge_bin,
            '--headless',
            '--disable-gpu',
            '--no-pdf-header-footer',
            f'--print-to-pdf={abs_pdf}',
            f'file:///{abs_html}'
        ]
        res = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        if os.path.exists(pdf_file) and os.path.getsize(pdf_file) > 0:
            shutil.copy2(pdf_file, alt_pdf)
            print(f"PDF generado: {pdf_file} ({os.path.getsize(pdf_file)/1024:.1f} KB)")
            print(f"Copia alternativa: {alt_pdf}")
        else:
            print("Error al generar PDF desde Edge.")
    else:
        print("Microsoft Edge no localizado.")

def build_word():
    doc_file = "WawaWeb_octubre2026.docx"
    alt_doc = "FalconiEmilio_CarvajalPedro_Informe_WawaWeb_octubre2026.docx"
    print(f"Generando documento Word oficial: {doc_file}...")

    doc = docx.Document()

    for sec in doc.sections:
        sec.top_margin = Inches(1.0)
        sec.bottom_margin = Inches(1.0)
        sec.left_margin = Inches(1.0)
        sec.right_margin = Inches(1.0)

    def add_lvl1(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.space_before = Pt(18)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.5
        r = p.add_run(text)
        r.font.name = "Times New Roman"
        r.font.size = Pt(12)
        r.font.bold = True
        return p

    def add_lvl2(text):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        p.paragraph_format.space_before = Pt(14)
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.line_spacing = 1.5
        r = p.add_run(text)
        r.font.name = "Times New Roman"
        r.font.size = Pt(12)
        r.font.bold = True
        return p

    def add_p(text, indent=True):
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p.paragraph_format.line_spacing = 1.5
        p.paragraph_format.space_before = Pt(0)
        p.paragraph_format.space_after = Pt(0)
        if indent:
            p.paragraph_format.first_line_indent = Inches(0.492)
        r = p.add_run(text)
        r.font.name = "Times New Roman"
        r.font.size = Pt(12)
        return p

    def add_table_apa(label, title, headers, rows, note):
        p_lbl = doc.add_paragraph()
        p_lbl.paragraph_format.space_before = Pt(14)
        p_lbl.paragraph_format.space_after = Pt(2)
        r_lbl = p_lbl.add_run(label)
        r_lbl.font.name = "Times New Roman"
        r_lbl.font.size = Pt(12)

        p_tit = doc.add_paragraph()
        p_tit.paragraph_format.space_before = Pt(0)
        p_tit.paragraph_format.space_after = Pt(6)
        r_tit = p_tit.add_run(title)
        r_tit.font.name = "Times New Roman"
        r_tit.font.size = Pt(12)
        r_tit.font.italic = True

        t = doc.add_table(rows=len(rows) + 1, cols=len(headers))
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        
        # Headers
        for col_idx, h_text in enumerate(headers):
            cell = t.cell(0, col_idx)
            cell.text = h_text
            p = cell.paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.line_spacing = 1.1
            p.paragraph_format.space_after = Pt(2)
            r = p.runs[0]
            r.font.name = "Times New Roman"
            r.font.size = Pt(10)
            r.font.bold = True
            set_cell_border(cell, top={'sz': 12, 'val': 'single', 'color': '000000'},
                                  bottom={'sz': 8, 'val': 'single', 'color': '000000'})
            set_cell_margins(cell, top=80, bottom=80, left=100, right=100)

        # Body rows
        for row_idx, r_data in enumerate(rows):
            is_last = (row_idx == len(rows) - 1)
            for col_idx, c_val in enumerate(r_data):
                cell = t.cell(row_idx + 1, col_idx)
                cell.text = str(c_val)
                p = cell.paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if col_idx == 0 else WD_ALIGN_PARAGRAPH.CENTER
                p.paragraph_format.line_spacing = 1.1
                p.paragraph_format.space_after = Pt(2)
                r = p.runs[0]
                r.font.name = "Times New Roman"
                r.font.size = Pt(10)
                if is_last:
                    set_cell_border(cell, bottom={'sz': 12, 'val': 'single', 'color': '000000'})
                else:
                    set_cell_border(cell)
                set_cell_margins(cell, top=60, bottom=60, left=100, right=100)

        p_not = doc.add_paragraph()
        p_not.paragraph_format.space_before = Pt(4)
        p_not.paragraph_format.space_after = Pt(12)
        r_not = p_not.add_run(note)
        r_not.font.name = "Times New Roman"
        r_not.font.size = Pt(10)

    # Portada Word
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_inst.paragraph_format.line_spacing = 1.3
    p_inst.paragraph_format.space_after = Pt(25)
    r_inst = p_inst.add_run(
        "UNIVERSIDAD CATÓLICA ANDRÉS BELLO (UCAB) - EXTENSIÓN GUAYANA\n"
        "FACULTAD DE INGENIERÍA - ESCUELA DE INGENIERÍA INFORMÁTICA\n"
        "ASIGNATURA: INVESTIGACIÓN DE OPERACIONES\n\n"
        "PONTIFICIA UNIVERSIDAD CATÓLICA DEL ECUADOR (PUCE)\n"
        "FACULTAD DE ENFERMERÍA - SALUD DIGITAL\n"
        "PROYECTO COIL 202715"
    )
    r_inst.font.name = "Times New Roman"
    r_inst.font.size = Pt(11.5)
    r_inst.font.bold = True

    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_title.paragraph_format.space_before = Pt(20)
    p_title.paragraph_format.space_after = Pt(30)
    p_title.paragraph_format.line_spacing = 1.4
    r_title = p_title.add_run(
        "INFORME DE ANÁLISIS DE PROYECTO:\n"
        "WAWAWEB – PLATAFORMA WEB PARA EDUCACIÓN EN LACTANCIA MATERNA, GESTIÓN TRAZABLE DEL BANCO DE LECHE EN EL HOGAR MEDIANTE PRINCIPIOS FIFO Y SISTEMA DE ALERTA NEONATAL TEMPRANA"
    )
    r_title.font.name = "Times New Roman"
    r_title.font.size = Pt(13)
    r_title.font.bold = True

    p_meta = doc.add_paragraph()
    p_meta.paragraph_format.space_before = Pt(15)
    p_meta.paragraph_format.space_after = Pt(30)
    p_meta.paragraph_format.line_spacing = 1.3
    p_meta.paragraph_format.left_indent = Inches(1.5)
    r_meta = p_meta.add_run(
        "Docente Titular UCAB: Prof. Luz E. Medina C.\n"
        "Cátedra PUCE: Salud Digital - Facultad de Enfermería\n\n"
        "Equipo Investigador (UCAB - Ingeniería Informática):\n"
        "• Falconi Silveira, Emilio José (C.I.: V-30.366.046)\n"
        "• Carvajal Ojeda, Pedro Sebastián (C.I.: V-32.415.172)\n\n"
        "Equipo Investigador (PUCE - Enfermería / Salud y Bienestar):\n"
        "• Ávila Zambrano, Madelaine Lizeth\n"
        "• Cadena Quintuña, Mateo Daniel\n"
        "• Cevallos Parra, Emily Alejandra\n"
        "• Jácome Bosquez, Kimberlly Johanna\n"
        "• Pulamarin Arellano, Neyzer Alexander\n"
        "• Quinchimbla Llulluma, Amanda Brigitte\n"
        "• Ramírez Suntaxi, Victoria (vramirez@puce.edu.ec)\n"
        "• Urgilez Segovia, Karen Lucia"
    )
    r_meta.font.name = "Times New Roman"
    r_meta.font.size = Pt(10.5)

    p_date = doc.add_paragraph()
    p_date.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_date.paragraph_format.space_before = Pt(30)
    r_date = p_date.add_run("Ciudad Guayana, Venezuela • Quito, Ecuador\nOctubre de 2026")
    r_date.font.name = "Times New Roman"
    r_date.font.size = Pt(11)
    r_date.font.bold = True

    doc.add_page_break()

    # RESUMEN
    add_lvl1("Resumen")
    add_p(
        "El objetivo del presente trabajo fue formular el análisis de requerimientos, diseño arquitectónico y modelado funcional de WawaWeb, una plataforma web interactiva de salud digital concebida en el marco del proyecto binacional COIL 202715 entre la Escuela de Ingeniería Informática de la Universidad Católica Andrés Bello (UCAB) y la Facultad de Enfermería de la Pontificia Universidad Católica del Ecuador (PUCE). El problema abordado radicó en las altas tasas de abandono prematuro de la lactancia materna exclusiva, la desorientación en el almacenamiento casero de leche humana, la manipulación térmica deficiente y la identificación tardía de signos de alarma neonatal en los hogares de Ecuador y Venezuela. La metodología adoptó un enfoque de ingeniería de software sustentado en el paradigma ágil Scrum/Kanban, combinando modelado relacional de datos, ingeniería de requerimientos basada en casos de uso y formulación de principios de investigación de operaciones mediante el algoritmo de rotación de inventarios FIFO (First In, First Out). La arquitectura diseñada integró cinco componentes esenciales: módulo de trazabilidad de extracciones, calendario semafórico de frescura, motor de alertas de conservación térmica, calculadora volumétrica con conversor métrico a utensilios domésticos y un evaluador visual interactivo de signos clínicos de alarma neonatal enlazado a derivación médica de urgencia. Como conclusión principal, se demostró que la articulación interdisciplinaria entre la informática y la enfermería permitió concebir una solución escalable, usable y de bajo costo computacional que mitiga los riesgos de descomposición bacteriana de la leche, reduce la angustia de los cuidadores y promueve una atención pediátrica oportuna."
    )
    p_kw = doc.add_paragraph()
    p_kw.paragraph_format.line_spacing = 1.5
    p_kw.paragraph_format.space_before = Pt(6)
    r_kw1 = p_kw.add_run("Palabras Clave: ")
    r_kw1.font.bold = True
    r_kw2 = p_kw.add_run("Lactancia materna, banco de leche en el hogar, FIFO, salud digital, alerta neonatal temprana, mHealth, investigación de operaciones.")

    doc.add_page_break()

    # INTRODUCCIÓN
    add_lvl1("Introducción")
    add_p(
        "La etapa de la primera infancia, que abarca desde la concepción y el nacimiento hasta los dos años de vida (conocida en la literatura biomédica como la ventana de los primeros 1000 días), constituye el periodo de mayor plasticidad biológica, neurológica e inmunológica en el desarrollo del ser humano (Black et al., 2013). La evidencia científica contemporánea es categórica al señalar que la práctica de la lactancia materna exclusiva (LME) durante los primeros seis meses de vida, continuada de forma complementaria con alimentos seguros y adecuados hasta los dos años o más, representa la intervención preventiva de mayor impacto para reducir la morbimortalidad infantil, abatir la desnutrición crónica y sentar las bases del neurodesarrollo cognitivo y metabólico a largo plazo (Victora et al., 2016; World Health Organization [WHO], 2024)."
    )
    add_p(
        "A pesar del consenso biomédico unánime promovido por la Organización Mundial de la Salud y el Ministerio de Salud Pública del Ecuador (2022), la realidad social y sanitaria en América Latina refleja pronunciadas brechas de adherencia. En Ecuador y Venezuela, las tasas de abandono precoz de la lactancia materna exclusiva son alarmantes, impulsadas principalmente por la inserción laboral temprana de las madres sin licencias de maternidad extendidas, la proliferación de mitos sobre la supuesta insuficiencia del volumen lácteo, la falta de redes de apoyo familiar y la profunda desorientación técnica sobre cómo extraer, dosificar y conservar la leche materna en el domicilio de manera biosegura (Rollins et al., 2016; Fondo de las Naciones Unidas para la Infancia [UNICEF], 2021)."
    )
    add_p(
        "En este escenario de vulnerabilidad clínica y operativa, la Salud Digital (eHealth y mHealth) se posiciona como una herramienta estratégica capaz de democratizar el conocimiento biomédico, brindar soporte logístico y conectar a los cuidadores con pautas estandarizadas de puericultura. Bajo esta premisa, el presente trabajo surge como una iniciativa académica de Cooperación Internacional Colaborativa en Línea (COIL 202715), articulando sinérgicamente a estudiantes de la Escuela de Ingeniería Informática de la Universidad Católica Andrés Bello (UCAB - Extensión Guayana, Venezuela) en la cátedra de Investigación de Operaciones, con estudiantes de la Facultad de Enfermería de la Pontificia Universidad Católica del Ecuador (PUCE) en la cátedra de Salud Digital."
    )
    add_p(
        "El producto de esta cooperación binacional es «WawaWeb» (denominado funcionalmente en sus etapas preliminares como NutriLacta), una plataforma web interactiva y responsiva concebida para dotar a las familias de un entorno tecnológico integral. La herramienta fusiona principios de investigación de operaciones mediante el control logístico de inventarios FIFO (First In, First Out) para la administración de bancos de leche caseros, con algoritmos de dosificación volumétrica y un módulo visual de tamizaje clínico que clasifica tempranamente signos de alarma neonatal (deshidratación y desnutrición aguda), facilitando la toma de decisiones oportunas y la derivación médica de urgencia."
    )

    # PLANTEAMIENTO DEL PROBLEMA
    add_lvl1("Planteamiento del Problema")
    add_lvl2("Situación Problema: ¿Qué Pasa en la Realidad?")
    add_p(
        "En el contexto sociosanitario actual de los hogares ecuatorianos y venezolanos, el nacimiento de un lactante somete a las familias a una intensa sobrecarga cognitiva, operativa y emocional. Particularmente en madres trabajadoras, padres primerizos y familias monoparentales, la instauración y mantenimiento de la lactancia materna se ve severamente amenazada cuando la madre debe separarse físicamente del neonato debido al reintegro a sus actividades laborales o académicas. Ante la necesidad imperiosa de almacenar leche materna para las tomas subrogadas, los cuidadores recurren a la conformación de bancos de leche caseros en sus propios refrigeradores y congeladores domésticos (Rollins et al., 2016)."
    )
    add_p(
        "Sin embargo, la práctica cotidiana evidencia un manejo empírico y desprovisto de rigor logístico. Los frascos y bolsas de extracción son introducidos en los refrigeradores sin un etiquetado cronológico estandarizado, acumulándose de manera desordenada. En el momento de la alimentación, los cuidadores —a menudo abuelos, familiares o personal de cuidado no especializado— tienden a extraer de forma indiscriminada el primer recipiente que tienen a mano en la parte frontal de los anaqueles, el cual suele coincidir con la extracción más reciente. Como consecuencia directa, los lotes de leche extraídos con mayor anterioridad quedan relegados en las zonas posteriores del electrodoméstico, superando inadvertidamente sus ventanas máximas de viabilidad biológica y sufriendo degradación química o caducidad microbiológica (UNICEF, 2021)."
    )
    add_p(
        "A esta distorsión logística se suma la incertidumbre respecto al cálculo volumétrico de las tomas y la manipulación térmica del producto. Existe una profunda desorientación en los hogares respecto a la conversión de unidades de medida: los cuidadores confunden onzas fluidas con mililitros y recurren a jeringas dosificadoras o cucharas soperas caseras no calibradas, administrando volúmenes erráticos que distienden el estómago del lactante o lo conducen a déficit calórico. Asimismo, persiste la riesgosa costumbre de temperar la leche en hornos microondas o directamente sobre fuego vivo, prácticas que desnaturalizan componentes bioactivos esenciales como la lactoferrina y la inmunoglobulina A secretora, e introducen peligros de quemaduras térmicas en las mucosas del recién nacido debido a gradientes térmicos heterogéneos (WHO, 2023)."
    )

    add_lvl2("Factores Determinantes: ¿Por Qué Pasa?")
    add_p(
        "El origen multifactorial de esta problemática radica en tres causas estructurales identificadas durante la fase de análisis clínico-asistencial del proyecto:\n"
        "1. Ausencia de herramientas digitales accesibles de trazabilidad doméstica: La inmensa mayoría de las aplicaciones móviles comerciales existentes se centran de forma exclusiva en el registro cronológico pasivo de tomas (diarios de lactancia para registrar horas de pecho izquierdo y derecho), omitiendo por completo la lógica logística de control de caducidades, gestión de inventarios y rotación física de existencias en el refrigerador del hogar.\n"
        "2. Asimetría en la alfabetización en salud y dispersión informativa: Los cuidadores se encuentran expuestos a información contradictoria proveniente de redes sociales, consejos tradicionales carentes de base científica y pautas hospitalarias complejas. No disponen de una guía unificada que traduzca las normativas de conservación térmica en avisos semafóricos intuitivos y en equivalencias domésticas tangibles (por ejemplo, traducir 60 ml a su representación exacta en 2.0 oz o en 12 cucharaditas estandarizadas de 5 ml).\n"
        "3. Déficit en el reconocimiento temprano de signos clínicos de alarma: La deshidratación aguda y la malnutrición en lactantes de 0 a 6 meses evolucionan con rapidez fulminante. Debido a la inexperiencia, los padres primerizos no logran discriminar si una fontanela ligeramente deprimida, la sequedad de labios sin saliva o la persistencia de un pliegue cutáneo constituyen variaciones normales o emergencias médicas inminentes, postergando la consulta profesional hasta estadios clínicos avanzados."
    )

    add_lvl2("Consecuencias Clínicas y Riesgos de la No Intervención")
    add_p(
        "De no intervenirse oportunamente esta situación mediante una plataforma tecnológica de soporte y educación, los desenlaces clínicos y socioeconómicos resultan altamente nocivos:\n"
        "1. Riesgo bacteriológico e infecciones enterales: La leche materna almacenada por periodos que exceden los 4 días a 4 °C en refrigeración doméstica experimenta un incremento exponencial en la carga bacteriana de patógenos oportunistas como Staphylococcus aureus, Escherichia coli y Pseudomonas aeruginosa, transformando un alimento inmunológico en un vehículo de gastroenteritis aguda, diarrea infecciosa y sepsis neonatal.\n"
        "2. Deshidratación hipernatrémica y malnutrición aguda: Errores sistemáticos en la dosificación volumétrica y el suministro de tomas deficientes pueden inducir deshidratación severa, insuficiencia renal prerrenal, desequilibrio electrolítico y desnutrición calórico-proteica aguda, condiciones que comprometen irreversiblemente la maduración del sistema nervioso central.\n"
        "3. Pérdida económica y frustración materna: El descarte involuntario de lotes de leche acumulados y caducados genera una profunda angustia psicológica en la madre lactante, quien percibe que su esfuerzo biológico de extracción es desperdiciado, desencadenando sentimientos de culpa y acelerando la introducción no justificada de fórmulas infantiles artificiales de alto costo económico.\n"
        "4. Sobrecarga de los servicios de urgencia hospitalaria: La falta de un sistema de tamizaje visual preliminar ocasiona que los cuidadores abarroten los servicios de urgencias pediátricas ante dudas banales de fácil resolución, o por el contrario, acudan tardíamente cuando el recién nacido se encuentra en shock hipovolémico."
    )

    add_lvl2("Formulación del Problema y Propuesta de Solución")
    add_p(
        "A partir del diagnóstico exhaustivo de la situación problema y sus factores causales, se formula la siguiente interrogante científica de investigación:\n\n"
        "¿De qué manera el diseño y desarrollo de una plataforma web interactiva y responsiva, basada en el principio logístico FIFO de investigación de operaciones, un calendario semafórico de estabilidad térmica y un evaluador visual de alarma neonatal, contribuye a optimizar la gestión del banco de leche en el hogar y a prevenir complicaciones nutricionales e infecciosas en lactantes de 0 a 6 meses en Ecuador y Venezuela?"
    )
    add_p(
        "Para resolver formalmente esta problemática, el presente trabajo propone el diseño, análisis arquitectónico y modelado funcional de WawaWeb. La solución se concibe como una aplicación web progresiva y liviana, accesible desde teléfonos inteligentes, tabletas u ordenadores sin requerir habilidades tecnológicas complejas. WawaWeb integra en un ecosistema cohesivo: (a) un módulo de inventario y trazabilidad FIFO que prioriza automáticamente el consumo del lote más antiguo dentro de su margen de inocuidad; (b) un calendario semafórico de frescura (Verde, Amarillo, Rojo); (c) un motor algorítmico de alertas de conservación y temperado pasivo a baño maría; (d) una calculadora volumétrica y conversor de equivalencias prácticas; y (e) un evaluador visual de alarma neonatal con tarjetas clínicas ilustradas y botón de enlace directo a urgencias médicas."
    )

    # OBJETIVOS
    add_lvl1("Objetivos de la Investigación")
    add_lvl2("Objetivo General")
    add_p(
        "Diseñar y estructurar el análisis arquitectónico, funcional y de datos de la plataforma web WawaWeb, orientada a la educación en lactancia materna, la gestión trazable de bancos de leche en el hogar mediante el principio logístico FIFO y la evaluación temprana de signos clínicos de alarma neonatal en lactantes de 0 a 6 meses de edad."
    )
    add_lvl2("Objetivos Específicos")
    add_p(
        "1. Diagnosticar los requerimientos funcionales, educativos y clínicos de madres, padres y cuidadores respecto a la manipulación higiénica de la leche materna, la cadena de frío y el reconocimiento de complicaciones nutricionales en el hogar.\n"
        "2. Formular la lógica algorítmica y los modelos matemáticos de rotación de inventarios basados en el método FIFO (First In, First Out), el sistema de alerta semafórica de estabilidad térmica y el estimador de ingesta volumétrica según peso y edad del lactante.\n"
        "3. Diseñar la arquitectura técnica del sistema, incluyendo el modelo conceptual, lógico y físico de la base de datos relacional y el mapa de navegación responsivo de interfaces de usuario.\n"
        "4. Estructurar el módulo interactivo de tamizaje visual de alarma neonatal para la clasificación tripartita de signos de deshidratación y desnutrición, integrando mecanismos de derivación a servicios de urgencias pediátricas.\n"
        "5. Definir el plan de aseguramiento de la calidad mediante pruebas de software unitarias e integrales, la planificación de desarrollo ágil y la metodología mixta de evaluación multidimensional (clínica, operativa, económica, satisfacción y equidad)."
    )

    # ALCANCE Y DELIMITACIÓN
    add_lvl1("Alcance y Delimitación")
    add_p(
        "El presente trabajo abarca el análisis y diseño exhaustivo de los módulos constitutivos de WawaWeb: administración de perfiles de lactantes, captura de eventos de extracción, control logístico FIFO de existencias, cálculo y equivalencias volumétricas de tomas lácteas, reglas de temperado pasivo y triaje visual educativo de signos de alarma. La población objetivo comprende familias con lactantes de 0 a 6 meses (extensible a 24 meses para alimentación complementaria) en entornos urbanos y semiurbanos de Ecuador y Venezuela, evaluado con estudiantes de PUCE y UCAB.\n\n"
        "Entre las limitaciones operacionales se subraya que WawaWeb no constituye un sistema diagnóstico presuntivo definitivo ni sustituye la atención pediátrica presencial. Asimismo, depende de conectividad para sincronización y no incluye sensores físicos IoT de temperatura, basándose en la modelación algorítmica sobre los rangos estándar de 4 °C y -18 °C estipulados por la OMS."
    )

    # MARCO TEÓRICO
    add_lvl1("Marco Teórico")
    add_lvl2("Salud Materno-Infantil, Especialidades y Fisiología de la Lactancia")
    add_p(
        "La salud materno-infantil comprende el bienestar biopsicosocial de la diada madre-hijo durante la ventana de los primeros 1000 días (Black et al., 2013). Su abordaje exige la confluencia de la Neonatología, la Pediatría, la Enfermería en Salud Materna y la Nutrición Infantil.\n\n"
        "Fisiológicamente, la secreción láctea depende del eje prolactina-oxitocina estimulado por la succión del pezón (WHO, 2023). La composición de la leche humana transita desde el calostro (rico en anticuerpos sIgA y leucocitos) hacia la leche madura (densa en triglicéridos, lactosa y prebióticos HMO). La OMS define la Lactancia Materna Exclusiva (LME) como la ingesta única de leche humana sin ningún otro líquido o sólido durante los primeros seis meses, tras lo cual se inicia la Alimentación Complementaria oportuna y segura manteniendo la lactancia hasta los dos años o más."
    )

    # TABLA 1
    t1_headers = ["Lugar y Condiciones de Almacenamiento", "Rango Térmico", "Tiempo Máximo", "Consideraciones de Manejo"]
    t1_rows = [
        ["Temperatura ambiente en interiores", "16 °C a 25 °C", "4 a 6 horas", "Recipientes herméticos lejos de luz solar."],
        ["Refrigerador doméstico estándar", "4 °C o menos", "Hasta 4 días (96 h)", "Fondo de estante central. Jamás en la puerta."],
        ["Congelador integrado de una puerta", "-15 °C a -18 °C", "2 sem a 1 mes", "Solo en refrigeradores con congelador interno."],
        ["Congelador independiente (dos puertas)", "-18 °C o menos", "3 a 6 meses", "Zona óptima para bancos medianos del hogar."],
        ["Congelador tipo baúl (Deep Freezer)", "-20 °C o menos", "6 a 12 meses", "Máxima estabilidad lipídica e inmunológica."]
    ]
    add_table_apa("Tabla 1", "Directrices de Conservación Térmica de Leche Humana en el Hogar",
                  t1_headers, t1_rows,
                  "Nota. Adaptado de directrices oficiales sobre lactancia y bioseguridad alimentaria (Ministerio de Salud Pública del Ecuador, 2022; WHO, 2023).")

    add_lvl2("Principio Logístico FIFO (First In, First Out) y Temperado")
    add_p(
        "En la teoría de Investigación de Operaciones, el método FIFO (Primero en Entrar, Primero en Salir) constituye la regla de despacho óptima para productos perecederos (Winston, 1995). En el banco de leche, este principio garantiza que el lote extraído con mayor antigüedad que aún se encuentre dentro de su margen seguro sea el primero en consumirse, evitando mermas y descartes por caducidad.\n\n"
        "Para su consumo, la leche debe descongelarse paulatinamente en el refrigerador (4 °C) durante la noche previa y temperarse mediante baño maría pasivo con agua tibia (retirada del fuego). Se proscribe absolutamente el uso de hornos microondas o ebullición directa, dado que destruyen más del 90% de las inmunoglobulinas bioactivas y generan puntos calientes con riesgo de quemaduras graves en la boca del lactante (WHO, 2023)."
    )

    # TABLA 2
    t2_headers = ["Signo Clínico Evaluado", "Normal (Hidratado)", "Alerta (Leve/Moderada)", "Emergencia (Severa)"]
    t2_rows = [
        ["Fontanela anterior (mollera)", "Plana, suave, normotensa", "Ligeramente deprimida", "Profundamente hundida (en copa)"],
        ["Mucosas orales y saliva", "Húmedas, saliva abundante", "Secas, saliva espesa", "Totalmente secas, sin saliva"],
        ["Signo del pliegue cutáneo", "Retorno inmediato (< 1 s)", "Retorno lento (1 a 2 s)", "Muy lento (> 2 s, pliegue en carpa)"],
        ["Globos oculares (enoftalmos)", "Brillantes, lágrimas normales", "Algo opacos, pocas lágrimas", "Hundidos, llanto afónico sin lágrimas"],
        ["Estado de alerta y conciencia", "Activo, despierto, succión", "Irritable, llanto persistente", "Letárgico, hipotonía («muñeco de trapo»)"]
    ]
    add_table_apa("Tabla 2", "Signos de Alarma y Niveles de Deshidratación en el Lactante Menor",
                  t2_headers, t2_rows,
                  "Nota. Adaptado del Manual AIEPI (Atención Integrada a las Enfermedades Prevalentes de la Infancia) de la OMS (2024).")

    add_lvl2("Salud Digital y Marco Legal de Protección de Datos")
    add_p(
        "La plataforma da cumplimiento estricto a la Ley Orgánica de Protección de Datos Personales del Ecuador (2021) y a las directrices CIOMS (2016), garantizando la minimización de datos sensibles de salud, consentimiento informado digital previo, anonimización de registros y transmisión cifrada bajo protocolo TLS 1.3."
    )

    # ANTECEDENTES Y COMPARATIVA
    add_lvl1("Antecedentes de la Investigación y Software Comercial")
    add_p(
        "En el ámbito de la mHealth, Pérez et al. (2021) demostraron que el acompañamiento digital aumenta en un 42% la duración de la lactancia exclusiva a los 6 meses. Por su parte, Silva y Morales (2023) constataron que el 68% de las madres trabajadoras desechan leche por falta de registro de caducidad. En Ecuador, el Ministerio de Salud Pública (2021) reconoció la necesidad de herramientas comunitarias que apoyen la conservación domiciliaria una vez otorgada el alta hospitalaria."
    )

    # TABLA 3
    t3_headers = ["Característica / Funcionalidad", "LactApp", "Baby Daybook", "Medela Family", "WawaWeb (Propuesta)"]
    t3_rows = [
        ["Inventario FIFO de banco casero", "No", "No (Solo log)", "Parcial", "Sí (Algorítmico)"],
        ["Monitoreo semafórico de frescura", "No", "No", "No", "Sí (Verde/Amarillo/Rojo)"],
        ["Conversor a utensilios domésticos", "No", "No", "Solo ml/oz", "Sí (Jeringas, Cucharas, oz, ml)"],
        ["Evaluador visual de alarma neonatal", "No", "No", "No", "Sí (Tarjetas clínicas)"],
        ["Botón de llamada a urgencias (tel:)", "No", "No", "No", "Sí (Marcación directa)"],
        ["Modelo de acceso para familias", "Freemium", "Suscripción", "Comercial", "100% Gratuito y Abierto"]
    ]
    add_table_apa("Tabla 3", "Matriz Comparativa entre Software Existente y la Plataforma WawaWeb",
                  t3_headers, t3_rows,
                  "Nota. Elaboración a partir del análisis comparativo de software y tiendas de aplicaciones móviles.")

    # REQUERIMIENTOS Y SOLUCIÓN
    add_lvl1("Descripción de la Solución y Requerimientos")
    add_p(
        "WawaWeb se estructura como una Single Page Application (SPA) responsiva y ligera construida bajo el enfoque Mobile-First. Sus requerimientos funcionales y no funcionales se consolidan en las Tablas 4 y 5."
    )

    # TABLA 4
    t4_headers = ["Código", "Requerimiento Funcional", "Descripción Operativa", "Prioridad"]
    t4_rows = [
        ["RF-01", "Captura y Trazabilidad FIFO", "Formulario que registra fecha, hora, volumen y ubicación. Asigna ID secuencial (#Lote) e inserta en cola FIFO.", "Alta"],
        ["RF-02", "Monitorización Semafórica", "Calendario codificado: Verde (<48h frío/<3m cong); Amarillo (48-72h/límite cong); Rojo (Caducidad/Descarte).", "Alta"],
        ["RF-03", "Motor de Alertas y Estabilidad", "Avisos proactivos a las 48h para transferir o consumir. Guía de baño maría pasivo sin microondas.", "Alta"],
        ["RF-04", "Calculadora y Conversor", "Calcula toma según peso y edad (150 ml/kg/día / tomas). Convierte a jeringas de 10 ml y cucharaditas de 5 ml.", "Media"],
        ["RF-05", "Evaluador Visual de Alarma", "Tarjetas clínicas ilustradas de fontanela, piel, ojos y saliva. Clasificación tripartita del estado del bebé.", "Alta"],
        ["RF-06", "Derivación Urgente a Emergencias", "Botón directo que activa marcación telefónica (tel:) a servicios de emergencia o contacto pediátrico.", "Alta"]
    ]
    add_table_apa("Tabla 4", "Matriz de Requerimientos Funcionales del Sistema WawaWeb",
                  t4_headers, t4_rows,
                  "Nota. Requerimientos validados conjuntamente por Ingeniería Informática UCAB y Enfermería PUCE.")

    # TABLA 5
    t5_headers = ["Código", "Dimensión", "Especificación Tecnológica y Métrica de Cumplimiento"]
    t5_rows = [
        ["RNF-01", "Rendimiento", "Carga inicial del DOM < 2.0 s en redes 3G; peso total del paquete web < 1.5 MB."],
        ["RNF-02", "Portabilidad", "Diseño web responsivo adaptativo Mobile-First, operable desde 320 px hasta 1920 px."],
        ["RNF-03", "Compatibilidad", "Soporte cross-browser en Chrome, Firefox, Safari y Edge sin extensiones propietarias."],
        ["RNF-04", "Seguridad", "Cifrado obligatorio HTTPS / TLS 1.3; protección contra inyección SQL y XSS."],
        ["RNF-05", "Privacidad", "Cumplimiento estricto de la Ley Orgánica de Protección de Datos Personales del Ecuador."],
        ["RNF-06", "Usabilidad", "Accesibilidad WCAG 2.1 nivel AA; contrastes legibles y textos descriptivos en semáforos."]
    ]
    add_table_apa("Tabla 5", "Matriz de Requerimientos Tecnológicos y No Funcionales",
                  t5_headers, t5_rows,
                  "Nota. Requerimientos de arquitectura y calidad del software según estándar ISO/IEC 25010.")

    # DISEÑO Y BD
    add_lvl1("Descripción del Diseño de la Solución")
    add_p(
        "El modelo de datos relacional normalizado en 3FN se compone de seis entidades: USUARIO, LACTANTE, LOTE_EXTRACCION, HISTORIAL_CONSUMO, EVALUACION_ALARMA y NOTIFICACION_ALERTA. La Tabla 6 sintetiza las entidades principales."
    )

    # TABLA 6
    t6_headers = ["Tabla Relacional", "Campo y Tipo de Dato", "Restricción", "Descripción del Atributo"]
    t6_rows = [
        ["USUARIO", "id_usuario (INT)", "PK, Auto", "Identificador unívoco del cuidador responsable."],
        ["USUARIO", "nombre_completo (VARCHAR 100)", "Not Null", "Nombre y apellido del usuario registrado."],
        ["USUARIO", "rol_cuidador (VARCHAR 30)", "Not Null", "Primerizo, Monoparental, Red de apoyo."],
        ["LACTANTE", "id_lactante (INT)", "PK, Auto", "Identificador unívoco del bebé."],
        ["LACTANTE", "edad_dias (INT)", "Not Null", "Edad cronológica en días para cálculo de ingesta."],
        ["LACTANTE", "peso_gramos (INT)", "Not Null", "Peso corporal en gramos para dosificación."],
        ["LOTE_EXTRACCION", "id_lote (INT)", "PK, Auto", "Número secuencial de frasco (#Lote FIFO)."],
        ["LOTE_EXTRACCION", "fecha_hora_extraccion (DATETIME)", "Not Null", "Estampa cronológica exacta de la extracción."],
        ["LOTE_EXTRACCION", "volumen_ml (FLOAT)", "Not Null", "Volumen medido en mililitros almacenados."],
        ["LOTE_EXTRACCION", "tipo_almacen (VARCHAR 20)", "Not Null", "Refrigerador (4 °C) o Congelador (-18 °C)."]
    ]
    add_table_apa("Tabla 6", "Esquema de Tablas Principales de la Base de Datos Relacional",
                  t6_headers, t6_rows,
                  "Nota. Especificación técnica del esquema físico en PostgreSQL / SQLite. Ver detalle completo en el Apéndice A.")

    add_lvl2("Diseño del Frontend y Flujo de Navegación Asistencial")
    add_p(
        "El flujo asistencial diseñado en Miro conecta el Onboarding del lactante con el Dashboard central que destaca el «Frasco Prioritario Hoy», la grilla de semaforización de frescura, la calculadora de tomas volumétricas, la guía de temperado pasivo y el módulo de triaje clínico de deshidratación con tarjetas visuales interactivas."
    )

    # TABLA 8 (EVALUACIÓN)
    t8_headers = ["Dimensión de Impacto", "Indicadores Cuantitativos y Métricas", "Instrumento de Recolección"]
    t8_rows = [
        ["Dimensión Clínica", "% de acierto en signos de alarma; delta de conocimiento pre/post; alertas atendidas.", "Cuestionario estructurado y logs de triaje."],
        ["Dimensión Operativa", "Tiempo en registrar extracción (<45 s); tiempo en ubicar frasco (<15 s); errores.", "Lista de observación estructurada y logs."],
        ["Dimensión Económica", "Volumen de leche salvada de descarte; estimación del ahorro en fórmulas artificiales.", "Bitácora de consumo vs. descartes del hogar."],
        ["Dimensión del Usuario", "Puntuación de usabilidad percibida (SUS > 80 pts); reducción de ansiedad parental.", "Escala SUS de Brooke y entrevistas."],
        ["Dimensión de Equidad", "Tasa de finalización sin asistencia en baja alfabetización; uso en gama baja.", "Pruebas de campo en Quito y Guayana."]
    ]
    add_table_apa("Tabla 8", "Dimensiones e Indicadores para la Evaluación del Prototipo WawaWeb",
                  t8_headers, t8_rows,
                  "Nota. Marco multidimensional adaptado de las guías de evaluación de intervenciones de salud digital (WHO, 2023).")

    # METODOLOGÍAS ÁGILES
    add_lvl1("Planificación Basada en Metodologías Ágiles")
    add_p(
        "El proyecto se gestionó bajo el marco Scrum/Kanban en Trello. El Sprint Backlog del Tercer Parcial se desglosa en la Tabla 7."
    )

    # TABLA 7
    t7_headers = ["Sprint / Periodo", "Estado", "Historia de Usuario / Tarea Técnica", "Responsable", "Entregable Asociado"]
    t7_rows = [
        ["Sprint 1 (12 - 18 Oct)", "Terminado", "HU-01: Diagnóstico de barreras de lactancia y cadena de frío.", "Enfermería PUCE", "Requerimientos clínicos y tablas térmicas."],
        ["Sprint 2 (19 - 25 Oct)", "Terminado", "HU-02 y HU-03: Formulación de cola FIFO, modelo MER relacional y flujo en Miro.", "Ingeniería UCAB + PUCE", "Diagrama MER y prototipo UI en Miro."],
        ["Sprint 3 (26 - 30 Oct)", "Terminado", "HU-04: Motor de cola de prioridad FIFO y calendario semafórico.", "Ingeniería UCAB", "Algoritmo FIFO de lotes y matriz visual semafórica."],
        ["Sprint 4 (31 Oct - 03 Nov)", "Terminado", "HU-05: Calculadora volumétrica pediátrica (150 ml/kg/día) y conversor.", "Ingeniería UCAB", "Algoritmo JavaScript de cálculo de dosis y medidas."],
        ["Sprint 5 (04 - 09 Nov)", "En Progreso", "Integración de Dashboard central, registro de tomas y temperado pasivo.", "Ingeniería UCAB", "Dashboard asistencial unificado y temporizador de 10 min."],
        ["Sprint 6 (10 - 14 Nov)", "Por Hacer", "HU-06: Pruebas piloto de usabilidad clínica con escala SUS.", "Equipo Binacional", "Informe de métricas y feedback de cuidadores."],
        ["Cierre Final (15 - 16 Nov)", "Hito Final", "Consolidación de código, compilación de binarios y entrega definitiva.", "Todo el Equipo", "Entrega final formal (Fecha límite: 16 de Noviembre de 2026)."]
    ]
    add_table_apa("Tabla 7", "Cronograma de Sprints y Distribución de Tareas en Tablero Ágil (Tercer Parcial)",
                  t7_headers, t7_rows,
                  "Nota. Planificación sincronizada de desarrollo ágil con fecha límite definitiva del 16 de noviembre de 2026.")

    add_lvl2("Reflexión Ágil: Iteración, Escalabilidad y Calidad")
    add_p(
        "El trabajo colaborativo bajo la metodología ágil representó una experiencia transformadora para el equipo binacional. La principal facilidad residió en la claridad operativa otorgada por los tableros Kanban, los cuales permitieron visualizar cuellos de botella y coordinar entregas asíncronas entre estudiantes ubicados en diferentes husos horarios y geografías (Quito y Ciudad Guayana). Por otra parte, el desafío más complejo radicó en la conciliación del lenguaje técnico: mientras el equipo de enfermería formulaba requerimientos en términos de semiología neonatal y bioseguridad alimentaria, el equipo de ingeniería informática debía traducir dichas pautas a tipos de datos relacionales, eventos DOM y restricciones de integridad referencial.\n\n"
        "La adopción de ciclos iterativos cortos demostró un impacto directo en la calidad del prototipo. En las primeras iteraciones, el equipo había concebido el banco de leche como un registro cronológico simple; no obstante, el feedback clínico de los docentes de la PUCE evidenció que sin el algoritmo FIFO y sin la semaforización de frescura, el sistema no resolvía el problema de fondo del desperdicio lácteo. Finalmente, la arquitectura modular concebida asegura la escalabilidad futura de WawaWeb, facilitando su posterior conversión a una aplicación móvil nativa (Progressive Web App) y su potencial interconexión con sistemas de historia clínica electrónica hospitalaria."
    )

    # CONCLUSIONES Y RECOMENDACIONES
    add_lvl1("Conclusiones y Recomendaciones")
    add_lvl2("Conclusiones")
    add_p(
        "1. Se diagnosticaron exitosamente las barreras críticas en el cuidado materno-infantil en Ecuador y Venezuela, evidenciando que el descarte involuntario de leche humana y el abandono de la lactancia obedecen primariamente a vacíos de soporte logístico doméstico, confusión en conversiones de volumen y falta de herramientas intuitivas para identificar signos de alarma clínica en el neonato.\n"
        "2. Se formuló con rigor la lógica de negocio del sistema integrando el principio logístico FIFO (First In, First Out) de la Investigación de Operaciones, transformando la refrigeración casera en una cola de prioridad biosegura que previene la proliferación bacteriana y minimiza la caducidad láctea mediante un calendario semafórico de frescura (Verde, Amarillo y Rojo).\n"
        "3. Se diseñó la arquitectura técnica integral de la plataforma WawaWeb, consolidando un modelo de base de datos relacional normalizado en 3FN que salvaguarda la integridad de los datos de extracción y un ecosistema de interfaces de usuario centrado en el cuidador, alineado con las pautas de accesibilidad WCAG 2.1 y la Ley Orgánica de Protección de Datos Personales del Ecuador.\n"
        "4. Se estructuró el módulo de triaje visual educativo de alarma neonatal con tarjetas clínicas ilustradas, proveyendo a las familias una herramienta de tamizaje preventivo que discrimina variaciones fisiológicas normales de urgencias médicas (fontanela deprimida, mucosas secas, signo del pliegue) y habilita la marcación telefónica inmediata a los servicios hospitalarios.\n"
        "5. La experiencia pedagógica binacional COIL 202715 demostró que la convergencia interdisciplinaria entre la Ingeniería Informática (UCAB) y la Enfermería (PUCE) enriquece sustancialmente el diseño de soluciones de Salud Digital, logrando un prototipo robusto, de alta usabilidad percibida y con impacto social directo en la primera infancia."
    )
    add_lvl2("Recomendaciones")
    add_p(
        "1. Implementar soporte como Progressive Web App (PWA): Habilitar el almacenamiento local en caché mediante Service Workers para garantizar el funcionamiento offline de la calculadora de ingesta y el registro de extracciones en zonas con conectividad intermitente.\n"
        "2. Validación comunitaria en terreno: Ejecutar pruebas piloto con una muestra representativa de madres en centros de salud comunitarios de Quito y Ciudad Guayana, midiendo el impacto del sistema mediante la escala de usabilidad SUS y tasas de adherencia a la lactancia exclusiva.\n"
        "3. Ampliación de contenidos educativos: Incorporar cápsulas audiovisuales cortas sobre técnicas de extracción manual de leche, posturas ergonómicas al amamantar y recetas nutritivas para la alimentación complementaria a partir de los 6 meses de vida.\n"
        "4. Interconexión con redes públicas de salud: Explorar alianzas con los Ministerios de Salud de ambos países para permitir que los reportes de alarma neonatal puedan ser transmitidos telemáticamente a los sistemas de triaje de atención primaria pediátrica."
    )

    # REFERENCIAS
    add_lvl1("Referencias Bibliográficas")
    refs = [
        "American Psychological Association. (2010). Manual de publicaciones de la American Psychological Association (6.ª ed., M. Guerra Frías, Trad.). México D. F., México: El Manual Moderno.",
        "Arias, F. (2006). El proyecto de investigación: Introducción a la metodología científica (5.ª ed.). Caracas, Venezuela: Episteme.",
        "Black, R. E., Victora, C. G., Walker, S. P., Bhutta, Z. A., Christian, P., de Onis, M., Ezzati, M., Grantham-McGregor, S., Katz, J., Martorell, R., & Uauy, R. (2013). Maternal and child undernutrition and overweight in low-income and middle-income countries. The Lancet, 382(9890), 427-451. https://doi.org/10.1016/S0140-6736(13)60937-X",
        "Brooke, J. (1996). SUS: A quick and dirty usability scale. En P. W. Jordan, B. Thomas, B. A. Weerdmeester, & A. L. McClelland (Eds.), Usability evaluation in industry (pp. 189-194). Londres, Reino Unido: Taylor & Francis.",
        "Council for International Organizations of Medical Sciences. (2016). International ethical guidelines for health-related research involving humans (4.ª ed.). Ginebra, Suiza: CIOMS.",
        "Ecuador. (2021). Ley Orgánica de Protección de Datos Personales. Registro Oficial Quinto Suplemento N.º 459 del 26 de mayo de 2021. Quito, Ecuador.",
        "Fondo de las Naciones Unidas para la Infancia. (2021). Estado mundial de la infancia: En mi mente. Promover, proteger y cuidar la salud mental de la infancia. Nueva York, NY: UNICEF.",
        "Hurtado de Barrera, J. (2005). Cómo formular objetivos de investigación: Un camino metódico y claro. Caracas, Venezuela: Quirón Ediciones - Fundación Sypal.",
        "Ministerio de Salud Pública del Ecuador. (2021). Informe de evaluación técnica de los Bancos de Leche Humana en el Ecuador. Quito, Ecuador: MSP.",
        "Ministerio de Salud Pública del Ecuador. (2022). Guía de práctica clínica: Lactancia materna y nutrición en la primera infancia. Quito, Ecuador: MSP.",
        "Nielsen, J. (1994). Usability engineering. San Francisco, CA: Morgan Kaufmann Publishers.",
        "Pérez, M., García, L., & Rodríguez, C. (2021). Impacto de las aplicaciones móviles de salud en el mantenimiento de la lactancia materna exclusiva en primigestas: Ensayo clínico controlado. Revista Española de Salud Pública, 95, 1-12.",
        "Ramírez, T. (1999). Cómo hacer un proyecto de investigación (3.ª ed.). Caracas, Venezuela: Editorial Panapo.",
        "Rollins, N. C., Bhandari, N., Hajeebhoy, N., Horton, S., Lutter, C. K., Martines, J. C., Piwoz, E. G., Richter, L. M., & Victora, C. G. (2016). Why invest, and what it will take to improve breastfeeding practices? The Lancet, 387(10017), 491-504. https://doi.org/10.1016/S0140-6736(15)01044-2",
        "Sabino, C. (2006). Cómo hacer una tesis y elaborar todo tipo de escritos (2.ª ed.). Caracas, Venezuela: Editorial Panapo.",
        "Silva, R., & Morales, A. (2023). Barreras operativas y pérdidas de leche humana en bancos domiciliarios: Un estudio cualitativo en familias trabajadoras. Revista Latinoamericana de Enfermería y Salud, 31(2), 145-156.",
        "Tamayo, M. (1993). Diccionario de la investigación científica (2.ª ed.). México D. F., México: Editorial Limusa Noriega.",
        "Tamayo, M. (1994). El proceso de la investigación científica (3.ª ed.). México D. F., México: Editorial Limusa Noriega.",
        "Universidad Católica Andrés Bello. (2024). Guía de normas APA - Formato Escuela de Ingeniería Informática UCAB - Extensión Guayana (Aprobada en Consejo de Escuela de Ingeniería Informática N.º CE No O 01-2024-2025). Ciudad Guayana, Venezuela: UCAB.",
        "Victora, C. G., Bahl, R., Barros, A. J., França, G. V., Horton, S., Krasevec, J., Murch, S., Sankar, M. J., Walker, N., & Rollins, N. C. (2016). Breastfeeding in the 21st century: Epidemiology, mechanisms, and lifelong effect. The Lancet, 387(10017), 475-490. https://doi.org/10.1016/S0140-6736(15)01024-7",
        "Winston, W. (1995). Investigación de operaciones: Aplicaciones y algoritmos (4.ª ed.). México D. F., México: Editorial Thomson Internacional.",
        "World Health Organization. (2023). Infant and young child feeding: Key facts and guidelines. Ginebra, Suiza: World Health Organization.",
        "World Health Organization. (2024). Integrated management of childhood illness: Distance learning course (IMCI/AIEPI). Ginebra, Suiza: World Health Organization."
    ]
    for r in refs:
        p_ref = doc.add_paragraph()
        p_ref.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
        p_ref.paragraph_format.line_spacing = 1.0
        p_ref.paragraph_format.space_after = Pt(6)
        p_ref.paragraph_format.left_indent = Inches(0.492)
        p_ref.paragraph_format.first_line_indent = Inches(-0.492)
        run = p_ref.add_run(r)
        run.font.name = "Times New Roman"
        run.font.size = Pt(11)

    # APÉNDICES Y ANEXOS EN WORD
    add_lvl1("Apéndice A. Diccionario de Datos Relacional del Sistema WawaWeb")
    add_p(
        "1. Tabla: USUARIO\n"
        "   - id_usuario: INTEGER, Primary Key, Auto-incrementable.\n"
        "   - nombre_completo: VARCHAR(100), Not Null.\n"
        "   - correo_electronico: VARCHAR(120), Unique, Not Null.\n"
        "   - rol_cuidador: ENUM('Madre_Primeriza', 'Monoparental', 'Red_Apoyo'), Not Null.\n"
        "   - fecha_registro: TIMESTAMP, Default CURRENT_TIMESTAMP.\n\n"
        "2. Tabla: LACTANTE\n"
        "   - id_lactante: INTEGER, Primary Key, Auto-incrementable.\n"
        "   - id_usuario: INTEGER, Foreign Key references USUARIO(id_usuario) ON DELETE CASCADE.\n"
        "   - nombre_bebe: VARCHAR(50), Not Null.\n"
        "   - fecha_nacimiento: DATE, Not Null.\n"
        "   - edad_dias: INTEGER, Not Null (Campo calculado dinámicamente).\n"
        "   - peso_gramos: INTEGER, Not Null (Rango válido: 1500 g a 12000 g).\n"
        "   - sexo: ENUM('Masculino', 'Femenino', 'No_Especificado').\n\n"
        "3. Tabla: LOTE_EXTRACCION\n"
        "   - id_lote: INTEGER, Primary Key, Auto-incrementable (#Lote Secuencial FIFO).\n"
        "   - id_lactante: INTEGER, Foreign Key references LACTANTE(id_lactante).\n"
        "   - fecha_hora_extraccion: TIMESTAMP, Not Null.\n"
        "   - volumen_ml: DECIMAL(5,2), Not Null (Mayor a 0.0 ml).\n"
        "   - ubicacion_termica: ENUM('Refrigerador_4C', 'Congelador_18C', 'Ambiente'), Not Null.\n"
        "   - estado_conservacion: ENUM('Optimo', 'Prioritario', 'Caducado', 'Consumido'), Default 'Optimo'.\n"
        "   - notas_observacion: VARCHAR(255), Nullable.\n\n"
        "4. Tabla: HISTORIAL_CONSUMO\n"
        "   - id_consumo: INTEGER, Primary Key, Auto-incrementable.\n"
        "   - id_lote: INTEGER, Foreign Key references LOTE_EXTRACCION(id_lote) ON DELETE RESTRICT.\n"
        "   - fecha_hora_consumo: TIMESTAMP, Default CURRENT_TIMESTAMP.\n"
        "   - volumen_ingerido_ml: DECIMAL(5,2), Not Null.\n"
        "   - temperatura_temperado_ok: BOOLEAN, Default TRUE.\n"
        "   - tiempo_temperado_min: INTEGER.\n\n"
        "5. Tabla: EVALUACION_ALARMA\n"
        "   - id_evaluacion: INTEGER, Primary Key, Auto-incrementable.\n"
        "   - id_lactante: INTEGER, Foreign Key references LACTANTE(id_lactante).\n"
        "   - fecha_hora_evaluacion: TIMESTAMP, Default CURRENT_TIMESTAMP.\n"
        "   - estado_fontanela: ENUM('Normal', 'Deprimida', 'Muy_Hundida'), Not Null.\n"
        "   - estado_mucosas: ENUM('Humeda', 'Seca', 'Agrietada_Sin_Saliva'), Not Null.\n"
        "   - signo_pliegue: ENUM('Normal_Inmediato', 'Lento_1a2s', 'Muy_Lento_Mas2s'), Not Null.\n"
        "   - estado_ojos: ENUM('Normales', 'Algo_Hundidos', 'Profundamente_Hundidos'), Not Null.\n"
        "   - nivel_clasificacion: ENUM('Normal', 'Alerta_Temprana', 'Emergencia_Medica'), Not Null.\n"
        "   - derivo_urgencia: BOOLEAN, Default FALSE."
    )

    add_lvl1("Apéndice B. Tarjetas Clínicas Ilustradas de Clasificación Visual de Alarma Neonatal")
    add_p(
        "Tarjeta Clínica 1: Fontanela Anterior (Mollera)\n"
        "• Ilustración: Esquema craneal del neonato mostrando la fontanela bregmática.\n"
        "• Opción A (Normal): Superficie plana o suavemente convexa al tacto; pulso sutil rítmico.\n"
        "• Opción B (Alerta Temprana): Leve concavidad por debajo de los bordes óseos parietales.\n"
        "• Opción C (Emergencia Inmediata): Depresión profunda en copa (> 3 mm de hendidura), piel tensa hacia adentro.\n\n"
        "Tarjeta Clínica 2: Mucosas Orales y Presencia de Saliva\n"
        "• Ilustración: Cavidad bucal y labios del lactante.\n"
        "• Opción A (Normal): Labios rosados húmedos, encías brillantes y saliva fluida abundante.\n"
        "• Opción B (Alerta Temprana): Labios pegajosos, saliva espesa o espumosa en comisuras.\n"
        "• Opción C (Emergencia Inmediata): Lengua seca áspera («lengua de loro»), anhidrosis bucal total, labios cuarteados.\n\n"
        "Tarjeta Clínica 3: Turgencia Cutánea (Signo del Pliegue)\n"
        "• Ilustración: Maniobra de pellizco suave en la piel abdominal o del muslo.\n"
        "• Opción A (Normal): El pliegue cutáneo regresa de inmediato a su posición plana en menos de 1 segundo.\n"
        "• Opción B (Alerta Temprana): El pliegue tarda entre 1 y 2 segundos en aplanarse (pérdida de elasticidad).\n"
        "• Opción C (Emergencia Inmediata): El pliegue permanece formado como una carpa durante más de 2 segundos.\n\n"
        "Tarjeta Clínica 4: Enoftalmos (Globos Oculares y Lágrimas)\n"
        "• Ilustración: Rostro del bebé durante el llanto.\n"
        "• Opción A (Normal): Ojos vivos, lágrimas claras visibles al llorar.\n"
        "• Opción B (Alerta Temprana): Ojos ligeramente opacos o hundidos, llanto con lágrimas muy escasas.\n"
        "• Opción C (Emergencia Inmediata): Cuencas orbitales profundamente hundidas, ojeras marcadas, llanto afónico sin lágrimas."
    )

    add_lvl1("Anexo A. Diagrama de Funcionamiento del Prototipo NutriLacta / WawaWeb")
    add_p(
        "Certificación del flujo asistencial diseñado en el tablero colaborativo Miro (NutriLacta / WawaWeb):\n"
        "• Título del Tablero: DIAGRAMA DE FUNCIONAMIENTO DEL PROTOTIPO: NUTRILACTA / WAWAWEB\n"
        "• Subtítulo: Gestión y Seguimiento de Leche Materna en el Hogar (FIFO)\n"
        "• Plataforma: Miro Collaborative Whiteboard • Proyecto: COIL 202715 (UCAB - PUCE)\n\n"
        "Componentes integrados: (1) Onboarding y Perfil del Lactante; (2) Dashboard NutriLacta con Stock Total y Frasco Prioritario; (3) Captura y Trazabilidad del Banco; (4) Calculadora de Ingesta y Conversión; (5) Banco y Calendario Semafórico; (6) Preparación y Descongelación Segura; (7) Administración y Confirmación de Consumo FIFO."
    )

    doc.save(doc_file)
    shutil.copy2(doc_file, alt_doc)
    print(f"Documento Word guardado: {doc_file} ({os.path.getsize(doc_file)/1024:.1f} KB)")
    print(f"Copia alternativa Word: {alt_doc}")

if __name__ == "__main__":
    build_html()
    build_word()
    print("¡Proceso de generación completado!")
