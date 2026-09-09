import os
from datetime import datetime

project_dir = os.path.dirname(os.path.abspath(__file__))
output_file = os.path.join(project_dir, "NIAS_Portal_Full_Context.md")

target_exts = ('.py', '.json', '.ts', '.tsx', '.csv')
ignore_patterns = (
    'node_modules',
    '.git',
    '.next',
    '.antigravity',
    '.claude',
    '.vite',
    'dist',
    'package-lock.json',
    'NIAS_Portal_Full_Context.md',
    'merge_context.py'
)

files_to_merge = []
for root, _, files in os.walk(project_dir):
    for f in files:
        if f.endswith(target_exts):
            full_path = os.path.join(root, f)
            if not any(pattern in full_path for pattern in ignore_patterns):
                files_to_merge.append(full_path)

files_to_merge.sort()

print(f"총 {len(files_to_merge)}개 대상 파일을 추출했습니다. 병합을 시작합니다...")

# Format date as 'September 9, 2026'
current_date_str = "September 9, 2026"

with open(output_file, 'w', encoding='utf-8') as out:
    # Header introductory comment block
    out.write("# NIAS LNG PORTAL - FULL CODEBASE & DATA CONTEXT\n\n")
    out.write("<!--\n")
    out.write(f"  Last Updated: {current_date_str}\n")
    out.write("  System: NIAS LNG Portal Industrial SCADA & CMMS Architecture\n")
    out.write(f"  Total Merged Files: {len(files_to_merge)}\n")
    out.write("  File Extensions: .py, .json, .ts, .tsx, .csv\n")
    out.write("-->\n\n")
    
    # Header metadata block
    out.write(f"> **Snapshot Date**: {current_date_str}  \n")
    out.write(f"> **Total Source Files**: {len(files_to_merge)}  \n")
    out.write(f"> **System Architecture**: Industrial SCADA & CMMS Portal (Next.js / TypeScript)  \n")
    out.write(f"> **Scope**: Complete codebase components, data models, hooks, services, and utility calculations  \n\n")
    out.write("---\n\n")
    
    for file_path in files_to_merge:
        rel_path = os.path.relpath(file_path, project_dir)
        ext = os.path.splitext(file_path)[1].lstrip('.').lower()
        
        lang = 'typescript' if ext in ['ts', 'tsx'] else ('python' if ext == 'py' else ('json' if ext == 'json' else 'text'))
        
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as src:
                content = src.read()
                out.write(f"## File: {rel_path}\n```{lang}\n{content}\n```\n\n---\n\n")
        except Exception as e:
            print(f"Error reading {rel_path}: {e}")

size_mb = round(os.path.getsize(output_file) / (1024 * 1024), 2)
print(f"병합 완료! 생성 위치: {output_file} ({size_mb} MB)")

