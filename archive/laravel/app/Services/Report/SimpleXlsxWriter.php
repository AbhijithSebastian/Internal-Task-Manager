<?php

namespace App\Services\Report;

use ZipArchive;

class SimpleXlsxWriter
{
    private array $rows = [];
    private array $headers = [];

    public function setHeaders(array $headers): void
    {
        $this->headers = $headers;
    }

    public function addRow(array $row): void
    {
        $this->rows[] = $row;
    }

    public function addRows(iterable $rows): void
    {
        foreach ($rows as $row) {
            $this->rows[] = (array) $row;
        }
    }

    public function toStream(callable $output): void
    {
        $zip = new ZipArchive;
        $tmp = tempnam(sys_get_temp_dir(), 'xlsx');
        $zip->open($tmp, ZipArchive::OVERWRITE | ZipArchive::CREATE);

        $zip->addFromString('[Content_Types].xml', $this->buildContentTypes());
        $zip->addFromString('_rels/.rels', $this->buildRelationships());
        $zip->addFromString('xl/_rels/workbook.xml.rels', $this->buildWorkbookRelations());
        $zip->addFromString('xl/workbook.xml', $this->buildWorkbook());
        $zip->addFromString('xl/styles.xml', $this->buildStyles());
        $zip->addFromString('xl/worksheets/sheet1.xml', $this->buildSheet());

        $zip->close();

        $fp = fopen($tmp, 'rb');
        $output($fp);
        fclose($fp);
        @unlink($tmp);
    }

    private function buildContentTypes(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>';
    }

    private function buildRelationships(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>';
    }

    private function buildWorkbookRelations(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>';
    }

    private function buildWorkbook(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"
          xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Report" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>';
    }

    private function buildStyles(): string
    {
        return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>';
    }

    private function buildSheet(): string
    {
        $xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>';
        $colCount = max(count($this->headers), 1);
        for ($i = 0; $i < $colCount; $i++) {
            $col = $i + 1;
            $xml .= "<col min=\"{$col}\" max=\"{$col}\" width=\"25\" customWidth=\"1\"/>";
        }
        $xml .= '</cols>
  <sheetData>';

        $rowIdx = 1;
        if (!empty($this->headers)) {
            $xml .= '<row r="' . $rowIdx . '">';
            foreach ($this->headers as $colIdx => $header) {
                $xml .= '<c r="' . $this->colLetter($colIdx + 1) . $rowIdx . '" t="inlineStr" s="1"><is><t>' . htmlspecialchars((string) $header, ENT_QUOTES) . '</t></is></c>';
            }
            $xml .= '</row>';
            $rowIdx++;
        }

        foreach ($this->rows as $row) {
            $values = array_values((array) $row);
            $xml .= '<row r="' . $rowIdx . '">';
            foreach ($values as $colIdx => $value) {
                $colL = $this->colLetter($colIdx + 1);
                if (is_numeric($value)) {
                    $xml .= '<c r="' . $colL . $rowIdx . '" t="n"><v>' . $value . '</v></c>';
                } else {
                    $xml .= '<c r="' . $colL . $rowIdx . '" t="inlineStr"><is><t>' . htmlspecialchars((string) ($value ?? ''), ENT_QUOTES) . '</t></is></c>';
                }
            }
            $xml .= '</row>';
            $rowIdx++;
        }

        $xml .= '</sheetData></worksheet>';
        return $xml;
    }

    private function colLetter(int $col): string
    {
        $letter = '';
        while ($col > 0) {
            $mod = ($col - 1) % 26;
            $letter = chr(65 + $mod) . $letter;
            $col = (int) (($col - $mod) / 26);
        }
        return $letter;
    }
}
