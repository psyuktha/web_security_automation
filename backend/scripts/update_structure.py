#!/usr/bin/env python3
"""Deduplicate forms in scan_results/structure.json and add descriptions
from scan_results/endpoints.json (attack_surfaces descriptions).

Usage:
    python backend/scripts/update_structure.py
"""
import json
import os
import argparse
from urllib.parse import urlparse
from datetime import datetime


def load_json(path):
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)


def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4, ensure_ascii=False)


def form_signature(form):
    # Create a deduplication signature based on action, method and inputs
    action = form.get('action', '').strip()
    method = (form.get('method') or '').upper().strip()
    inputs = form.get('inputs') or []
    # Signature: sorted tuple of (name,type,required)
    inputs_sig = tuple(sorted(
        (
            (inp.get('name') or '').strip(),
            (inp.get('type') or '').strip(),
            bool(inp.get('required'))
        )
        for inp in inputs
    ))
    return (action, method, inputs_sig)


def build_description_map(endpoints_data):
    """Return a map from path -> description using attack_surfaces where available.
    Keys are normalized paths (leading slash, no trailing slash unless root).
    """
    desc_map = {}
    for item in endpoints_data.get('attack_surfaces', []) if isinstance(endpoints_data, dict) else []:
        url = item.get('url') or ''
        desc = item.get('description') or ''
        if not url:
            continue
        try:
            p = urlparse(url)
            path = p.path or '/'
            # normalize (remove trailing slash except for root)
            if path != '/' and path.endswith('/'):
                path = path[:-1]
            desc_map[path] = desc
        except Exception:
            continue
    # Also include entries from top-level "endpoints" (no descriptions) as empty string
    for e in endpoints_data.get('endpoints', []) if isinstance(endpoints_data, dict) else []:
        try:
            p = urlparse(e)
            path = p.path or '/'
            if path != '/' and path.endswith('/'):
                path = path[:-1]
            if path not in desc_map:
                desc_map[path] = ''
        except Exception:
            continue
    return desc_map


def normalize_action(action):
    if not action:
        return '/'
    # If action is full URL, extract path
    try:
        p = urlparse(action)
        if p.scheme and p.netloc:
            path = p.path or '/'
        else:
            # action may be relative like "/login"
            path = action
    except Exception:
        path = action
    if not path.startswith('/'):
        path = '/' + path
    if path != '/' and path.endswith('/'):
        path = path[:-1]
    return path


def main():
    parser = argparse.ArgumentParser()
    # default to project root/scan_results
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
    parser.add_argument('--structure', default=os.path.join(project_root, 'scan_results', 'structure.json'))
    parser.add_argument('--endpoints', default=os.path.join(project_root, 'scan_results', 'endpoints.json'))
    parser.add_argument('--backup', action='store_true', help='Save a backup copy of original structure.json')
    args = parser.parse_args()

    structure_path = args.structure
    endpoints_path = args.endpoints

    if not os.path.exists(structure_path):
        print('structure.json not found at', structure_path)
        return
    if not os.path.exists(endpoints_path):
        print('endpoints.json not found at', endpoints_path)
        return

    structure = load_json(structure_path)
    endpoints = load_json(endpoints_path)

    forms = structure.get('forms', [])
    print(f'Loaded {len(forms)} forms from {structure_path}')

    desc_map = build_description_map(endpoints)

    seen = set()
    unique_forms = []
    duplicates = 0

    for f in forms:
        sig = form_signature(f)
        if sig in seen:
            duplicates += 1
            continue
        seen.add(sig)

        # Normalize action and add description if available
        action = f.get('action') or ''
        norm_action = normalize_action(action)
        f['action'] = norm_action

        # Attach description from endpoints attack_surfaces if available
        description = desc_map.get(norm_action)
        if description:
            f['feedback'] = description
        else:
            # attempt fuzzy match: try removing query or matching suffix
            found = False
            for path, desc in desc_map.items():
                if path.endswith(norm_action) or norm_action.endswith(path):
                    if desc:
                        f['feedback'] = desc
                        found = True
                        break
            if not found:
                # leave empty feedback to be explicit
                f.setdefault('feedback', '')

        unique_forms.append(f)

    print(f'Removed {duplicates} duplicate forms; {len(unique_forms)} unique remain')

    # Update structure object
    structure['forms'] = unique_forms

    if args.backup:
        bak_path = structure_path + '.bak.' + datetime.now().strftime('%Y%m%d_%H%M%S')
        save_json(bak_path, load_json(structure_path))
        print('Backup saved to', bak_path)

    save_json(structure_path, structure)
    print('Updated structure.json saved to', structure_path)


if __name__ == '__main__':
    main()
