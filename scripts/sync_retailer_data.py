#!/usr/bin/env python3
import json
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
WORKBOOK = ROOT / "data" / "diet-retailer-equivalents.xlsx"
OUTPUT = ROOT / "data" / "retailer-products.json"
NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
    "pkgrel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def col_index(cell_ref):
    letters = "".join(ch for ch in cell_ref if ch.isalpha())
    idx = 0
    for ch in letters:
        idx = idx * 26 + ord(ch.upper()) - 64
    return idx - 1


def read_shared_strings(zf):
    path = "xl/sharedStrings.xml"
    if path not in zf.namelist():
        return []
    root = ET.fromstring(zf.read(path))
    out = []
    for si in root.findall("main:si", NS):
        parts = [t.text or "" for t in si.findall(".//main:t", NS)]
        out.append("".join(parts))
    return out


def sheet_paths(zf):
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_by_id = {
        rel.attrib["Id"]: rel.attrib["Target"]
        for rel in rels.findall("pkgrel:Relationship", NS)
    }
    paths = {}
    for sheet in workbook.findall("main:sheets/main:sheet", NS):
        name = sheet.attrib["name"]
        rel_id = sheet.attrib[f"{{{NS['rel']}}}id"]
        target = rel_by_id[rel_id].lstrip("/")
        paths[name] = target if target.startswith("xl/") else f"xl/{target}"
    return paths


def cell_value(cell, shared_strings):
    value = cell.find("main:v", NS)
    if value is None:
        inline = cell.find("main:is", NS)
        if inline is None:
            return ""
        return "".join(t.text or "" for t in inline.findall(".//main:t", NS))
    raw = value.text or ""
    if cell.attrib.get("t") == "s":
        return shared_strings[int(raw)]
    if raw == "":
        return ""
    try:
        n = float(raw)
        return int(n) if n.is_integer() else n
    except ValueError:
        return raw


def read_sheet(zf, path, shared_strings):
    root = ET.fromstring(zf.read(path))
    rows = []
    for row in root.findall(".//main:sheetData/main:row", NS):
        values = []
        for cell in row.findall("main:c", NS):
            idx = col_index(cell.attrib["r"])
            while len(values) <= idx:
                values.append("")
            values[idx] = cell_value(cell, shared_strings)
        rows.append(values)
    return rows


def slug(value):
    return re.sub(r"[^a-z0-9]+", "-", str(value).lower()).strip("-")


def parse_rows(rows):
    header_idx = next(
        i for i, row in enumerate(rows) if row and row[0] == "Meal block"
    )
    headers = rows[header_idx]
    data = []
    for row in rows[header_idx + 1 :]:
        if not any(row):
            continue
        padded = row + [""] * (len(headers) - len(row))
        item = dict(zip(headers, padded))
        price = item.get("Ref price AUD")
        data.append(
            {
                "id": slug(f"{item.get('Meal block')} {item.get('App ingredient')} {item.get('Retailer product match')}"),
                "section": item.get("Meal block", ""),
                "appIngredient": item.get("App ingredient", ""),
                "quantity": item.get("App amount / role", ""),
                "name": item.get("Retailer product match", ""),
                "matchType": item.get("Match type", ""),
                "pack": item.get("Pack / sell unit", ""),
                "priceStatus": item.get("Price status", ""),
                "price": price if isinstance(price, (int, float)) else None,
                "sourceUrl": item.get("Source URL", ""),
                "notes": item.get("Notes", ""),
            }
        )
    return data


def main():
    if not WORKBOOK.exists():
        sys.exit(f"Missing workbook: {WORKBOOK}")
    with zipfile.ZipFile(WORKBOOK) as zf:
        shared_strings = read_shared_strings(zf)
        paths = sheet_paths(zf)
        retailers = {
            name.lower(): parse_rows(read_sheet(zf, path, shared_strings))
            for name, path in paths.items()
            if name in {"Coles", "Woolworths"}
        }
    payload = {
        "sourceWorkbook": "data/diet-retailer-equivalents.xlsx",
        "generatedFrom": "Spreadsheet sync script",
        "retailers": retailers,
    }
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    main()
