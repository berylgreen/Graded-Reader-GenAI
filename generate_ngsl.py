import csv
import json

groups = []
current_group = []
families = {}
headword_variants = {}

with open('source/NGSL-1.01.csv', 'r', encoding='utf-8') as f:
    reader = csv.reader(f)
    for row in reader:
        words = [w.strip() for w in row if w.strip()]
        if not words:
            continue
            
        headword = words[0]
        current_group.append(headword)
        
        variants = []
        for variant in words[1:]:
            if variant.lower() != headword.lower():
                families[variant.lower()] = headword.lower()
                variants.append(variant.lower())
                
        if variants:
            headword_variants[headword.lower()] = variants
                
        if len(current_group) == 100:
            groups.append(current_group)
            current_group = []

if current_group:
    groups.append(current_group)

# Generate TS code
ts_lines = [
    "import { WordGroup } from './types';",
    "",
    "// Auto-generated NGSL Word Families mapping (Variant -> Headword)",
    f"export const NGSL_FAMILIES: Record<string, string> = {json.dumps(families, separators=(',', ':'))};",
    "",
    "// Auto-generated NGSL Headword Variants mapping (Headword -> Variants array)",
    f"export const NGSL_HEADWORD_VARIANTS: Record<string, string[]> = {json.dumps(headword_variants, separators=(',', ':'))};",
    "",
    "// Auto-generated NGSL Word Groups (100 words per level)",
    "export const NGSL_WORD_GROUPS: WordGroup[] = ["
]

for i, group in enumerate(groups):
    level = i + 1
    label = f"NGSL Level {level} (Words {i*100 + 1}-{i*100 + len(group)})"
    words_json = json.dumps(group, ensure_ascii=False)
    ts_lines.append(f"  {{ level: {level}, label: '{label}', words: {words_json} }},")

ts_lines.append("];")

with open('ngsl_data.ts', 'w', encoding='utf-8') as f:
    f.write("\n".join(ts_lines) + "\n")

print(f"Generated {len(groups)} groups, {len(families)} family mappings, and {len(headword_variants)} headword variant lists.")

