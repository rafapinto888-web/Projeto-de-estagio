"""Exporta apenas as logs recolhidas para um Excel simples."""

import re
from pathlib import Path
from xml.sax.saxutils import escape
from zipfile import ZIP_DEFLATED, ZipFile


_CONTROL_CHARS_RE = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F]")


def _texto(valor):
    return _CONTROL_CHARS_RE.sub("", str(valor or ""))


def _coluna_excel(indice):
    letras = ""
    while indice > 0:
        indice, resto = divmod(indice - 1, 26)
        letras = chr(65 + resto) + letras
    return letras or "A"


def _celula(referencia, valor, cabecalho=False):
    estilo = "1" if cabecalho else "0"
    texto = escape(_texto(valor))
    return (
        f'<c r="{referencia}" t="inlineStr" s="{estilo}">'
        f'<is><t xml:space="preserve">{texto}</t></is></c>'
    )


def _sheet_xml(linhas):
    total_colunas = max(len(linha) for linha in linhas)
    total_linhas = len(linhas)
    ultima_celula = f"{_coluna_excel(total_colunas)}{total_linhas}"

    partes = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ',
        'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
        f'<dimension ref="A1:{ultima_celula}"/>',
        '<sheetViews><sheetView workbookViewId="0">',
        '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>',
        "</sheetView></sheetViews>",
        "<sheetData>",
    ]

    for linha_idx, linha in enumerate(linhas, start=1):
        partes.append(f'<row r="{linha_idx}">')
        for col_idx, valor in enumerate(linha, start=1):
            ref = f"{_coluna_excel(col_idx)}{linha_idx}"
            partes.append(_celula(ref, valor, cabecalho=(linha_idx == 1)))
        partes.append("</row>")

    partes.extend([
        "</sheetData>",
        f'<tableParts count="1"><tablePart r:id="rId1"/></tableParts>',
        "</worksheet>",
    ])
    return "".join(partes)


def _table_xml(headers, total_linhas):
    referencia = f"A1:{_coluna_excel(len(headers))}{total_linhas}"
    partes = [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<table xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ',
        f'id="1" name="LogsTabela" displayName="LogsTabela" ref="{referencia}">',
        f'<autoFilter ref="{referencia}"/>',
        f'<tableColumns count="{len(headers)}">',
    ]

    for indice, header in enumerate(headers, start=1):
        partes.append(f'<tableColumn id="{indice}" name="{escape(_texto(header))}"/>')

    partes.extend([
        "</tableColumns>",
        '<tableStyleInfo name="TableStyleMedium2" showFirstColumn="0" showLastColumn="0" '
        'showRowStripes="1" showColumnStripes="0"/>',
        "</table>",
    ])
    return "".join(partes)


def _styles_xml():
    return """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<fonts count="2">
<font><sz val="11"/><name val="Calibri"/><family val="2"/></font>
<font><b/><sz val="11"/><name val="Calibri"/><family val="2"/></font>
</fonts>
<fills count="2">
<fill><patternFill patternType="none"/></fill>
<fill><patternFill patternType="solid"><fgColor rgb="FFD9EAF7"/><bgColor indexed="64"/></patternFill></fill>
</fills>
<borders count="1">
<border><left/><right/><top/><bottom/><diagonal/></border>
</borders>
<cellStyleXfs count="1">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
</cellStyleXfs>
<cellXfs count="2">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="1" borderId="0" xfId="0" applyFont="1" applyFill="1"/>
</cellXfs>
<cellStyles count="1">
<cellStyle name="Normal" xfId="0" builtinId="0"/>
</cellStyles>
</styleSheet>"""


def guardar_logs_excel(caminho, linhas_logs):
    caminho = Path(caminho)
    if not linhas_logs:
        linhas_logs = [["IP", "Tipo", "Horario", "Evento ID", "Utilizador", "Origem", "Provider", "Mensagem", "Fonte", "Estado"]]

    headers = linhas_logs[0]

    with ZipFile(caminho, "w", compression=ZIP_DEFLATED) as xlsx:
        xlsx.writestr(
            "[Content_Types].xml",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
<Override PartName="/xl/tables/table1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.table+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>""",
        )
        xlsx.writestr(
            "_rels/.rels",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>""",
        )
        xlsx.writestr(
            "xl/workbook.xml",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets><sheet name="Logs" sheetId="1" r:id="rId1"/></sheets>
</workbook>""",
        )
        xlsx.writestr(
            "xl/_rels/workbook.xml.rels",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>""",
        )
        xlsx.writestr(
            "xl/worksheets/_rels/sheet1.xml.rels",
            """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/table" Target="../tables/table1.xml"/>
</Relationships>""",
        )
        xlsx.writestr("xl/styles.xml", _styles_xml())
        xlsx.writestr("xl/worksheets/sheet1.xml", _sheet_xml(linhas_logs))
        xlsx.writestr("xl/tables/table1.xml", _table_xml(headers, len(linhas_logs)))
