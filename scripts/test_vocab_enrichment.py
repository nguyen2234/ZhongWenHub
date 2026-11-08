import os
import sys
import re
import pyodbc

sys.stdout.reconfigure(encoding='utf-8')

# Tone conversions
P_TONES = {
    'ā': ('a', '1'), 'á': ('a', '2'), 'ǎ': ('a', '3'), 'à': ('a', '4'),
    'ē': ('e', '1'), 'é': ('e', '2'), 'ě': ('e', '3'), 'è': ('e', '4'),
    'ī': ('i', '1'), 'í': ('i', '2'), 'ǐ': ('i', '3'), 'ì': ('i', '4'),
    'ō': ('o', '1'), 'ó': ('o', '2'), 'ǒ': ('o', '3'), 'ò': ('o', '4'),
    'ū': ('u', '1'), 'ú': ('u', '2'), 'ǔ': ('u', '3'), 'ù': ('u', '4'),
    'ǖ': ('v', '1'), 'ǘ': ('v', '2'), 'ǚ': ('v', '3'), 'ǜ': ('v', '4'), 'ü': ('v', '5')
}

def normalize_pinyin(py_str):
    if not py_str:
        return ""
    # remove spaces and punctuation
    clean = re.sub(r"[ '·\-\.]", "", py_str.lower())
    res = []
    tones = []
    for ch in clean:
        if ch in P_TONES:
            res.append(P_TONES[ch][0])
            tones.append(P_TONES[ch][1])
        else:
            res.append(ch)
    return "".join(res)

print("Test normalize:", normalize_pinyin("wèi shénme"), normalize_pinyin("huā"), normalize_pinyin("lǜsè"))
