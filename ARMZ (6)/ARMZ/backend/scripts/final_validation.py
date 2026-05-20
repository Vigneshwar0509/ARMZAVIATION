"""Final validation script - lightweight static checks for common issues.

Run as: python backend/scripts/final_validation.py
"""
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))


def find_files(root, pattern):
    for dirpath, _, filenames in os.walk(root):
        for fname in filenames:
            if fname.endswith(pattern):
                yield os.path.join(dirpath, fname)


def check_views_for_objects_usage():
    issues = []
    for path in find_files(os.path.join(ROOT, "backend"), "views.py"):
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        if re.search(r"\.objects\.", text):
            issues.append(path)
    return issues


def check_views_have_permissions():
    missing = []
    for path in find_files(os.path.join(ROOT, "backend"), "views.py"):
        with open(path, "r", encoding="utf-8") as f:
            text = f.read()
        # crude check: any class APIView without permission_classes
        classes = re.findall(r"class\s+\w+\(.*APIView.*\):", text)
        if not classes:
            continue
        # If permission_classes not in file, flag
        if "permission_classes" not in text:
            missing.append(path)
    return missing


def main():
    print("Running final validation checks...")
    objs = check_views_for_objects_usage()
    perms = check_views_have_permissions()

    print(f"Found {len(objs)} view files using .objects. (Manual review)")
    for p in objs[:20]:
        print(" - ", p)

    print(f"Found {len(perms)} view files missing explicit permission_classes")
    for p in perms[:20]:
        print(" - ", p)

    if not objs and not perms:
        print("Basic checks passed.")


if __name__ == "__main__":
    main()
