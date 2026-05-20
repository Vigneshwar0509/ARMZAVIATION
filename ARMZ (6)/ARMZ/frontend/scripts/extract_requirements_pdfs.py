from pathlib import Path

from pypdf import PdfReader


PDFS = [
    r"c:\Users\LENOVO\Downloads\18228da9-1779-498e-a0ef-2cf3c5a3c8de (2).pdf",
    r"c:\Users\LENOVO\Downloads\Employer_Module_Requirement.pdf",
    r"c:\Users\LENOVO\Downloads\ARMZ Conclave Job Portal Development.pdf",
    r"c:\Users\LENOVO\Downloads\ARMZ_requirements.pdf",
    r"c:\Users\LENOVO\Downloads\ARMZ_Aviation_Requirement.pdf",
]


def extract_pdf_text(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    parts: list[str] = []
    for index, page in enumerate(reader.pages, start=1):
        text = page.extract_text() or ""
        parts.append(f"\n\n### Page {index}\n\n{text.strip()}")
    return "".join(parts).strip()


def main() -> None:
    out_dir = Path("requirements_analysis")
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / "customer_requirements_extracted.md"

    output_parts: list[str] = ["# Customer Requirement PDFs - Extracted Text\n"]

    for raw_path in PDFS:
        path = Path(raw_path)
        output_parts.append(f"\n\n## {path.name}\n")
        if not path.exists():
            output_parts.append("\n[Missing file]\n")
            continue
        try:
            output_parts.append(extract_pdf_text(path))
        except Exception as exc:
            output_parts.append(f"\n[Failed to extract: {exc}]\n")

    out_file.write_text("\n".join(output_parts), encoding="utf-8")
    print(f"Wrote extracted requirements to: {out_file}")


if __name__ == "__main__":
    main()
