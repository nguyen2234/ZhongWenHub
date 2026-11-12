"""
Strict Mandarin Pinyin Validator with Unicode NFC, Phonotactic Syllable Validation,
Tone Mark Placement Rules, and Dictionary Cross-Checking.
"""

import unicodedata
import re
from pypinyin import pinyin, Style

# Canonical Mandarin base syllables (without tones, lowercase, ü represented as v or ü)
MANDARIN_BASE_SYLLABLES = {
    'a', 'ai', 'an', 'ang', 'ao', 'ba', 'bai', 'ban', 'bang', 'bao', 'bei', 'ben', 'beng',
    'bi', 'bian', 'biao', 'bie', 'bin', 'bing', 'bo', 'bu', 'ca', 'cai', 'can', 'cang',
    'cao', 'ce', 'cen', 'ceng', 'cha', 'chai', 'chan', 'chang', 'chao', 'che', 'chen',
    'cheng', 'chi', 'chong', 'chou', 'chu', 'chua', 'chuai', 'chuan', 'chuang', 'chui',
    'chun', 'chuo', 'ci', 'cong', 'cou', 'cu', 'cuan', 'cui', 'cun', 'cuo', 'da', 'dai',
    'dan', 'dang', 'dao', 'de', 'dei', 'den', 'deng', 'di', 'dia', 'dian', 'diao', 'die',
    'ding', 'diu', 'dong', 'dou', 'du', 'duan', 'dui', 'dun', 'duo', 'e', 'ei', 'en',
    'eng', 'er', 'fa', 'fan', 'fang', 'fei', 'fen', 'feng', 'fiao', 'fo', 'fou', 'fu',
    'ga', 'gai', 'gan', 'gang', 'gao', 'ge', 'gei', 'gen', 'geng', 'gong', 'gou', 'gu',
    'gua', 'guai', 'guan', 'guang', 'gui', 'gun', 'guo', 'ha', 'hai', 'han', 'hang',
    'hao', 'he', 'hei', 'hen', 'heng', 'hong', 'hou', 'hu', 'hua', 'huai', 'huan',
    'huang', 'hui', 'hun', 'huo', 'ji', 'jia', 'jian', 'jiang', 'jiao', 'jie', 'jin',
    'jing', 'jiong', 'jiu', 'ju', 'juan', 'jue', 'jun', 'ka', 'kai', 'kan', 'kang',
    'kao', 'ke', 'kei', 'ken', 'keng', 'kong', 'kou', 'ku', 'kua', 'kuai', 'kuan',
    'kuang', 'kui', 'kun', 'kuo', 'la', 'lai', 'lan', 'lang', 'lao', 'le', 'lei',
    'leng', 'li', 'lia', 'lian', 'liang', 'liao', 'lie', 'lin', 'ling', 'liu', 'lo',
    'long', 'lou', 'lu', 'luan', 'lun', 'luo', 'lv', 'lü', 'lve', 'lüe', 'ma', 'mai',
    'man', 'mang', 'mao', 'me', 'mei', 'men', 'meng', 'mi', 'mian', 'miao', 'mie',
    'min', 'ming', 'miu', 'mo', 'mou', 'mu', 'na', 'nai', 'nan', 'nang', 'nao', 'ne',
    'nei', 'nen', 'neng', 'ni', 'nian', 'niang', 'niao', 'nie', 'nin', 'ning', 'niu',
    'nong', 'nou', 'nu', 'nuan', 'nun', 'nuo', 'nv', 'nü', 'nve', 'nüe', 'o', 'ou',
    'pa', 'pai', 'pan', 'pang', 'pao', 'pei', 'pen', 'peng', 'pi', 'pian', 'piao',
    'pie', 'pin', 'ping', 'po', 'pou', 'pu', 'qi', 'qia', 'qian', 'qiang', 'qiao',
    'qie', 'qin', 'qing', 'qiong', 'qiu', 'qu', 'quan', 'que', 'qun', 'ran', 'rang',
    'rao', 're', 'ren', 'reng', 'ri', 'rong', 'rou', 'ru', 'rua', 'ruan', 'rui', 'run',
    'ruo', 'sa', 'sai', 'san', 'sang', 'sao', 'se', 'sen', 'seng', 'sha', 'shai',
    'shan', 'shang', 'shao', 'she', 'shei', 'shen', 'sheng', 'shi', 'shou', 'shu',
    'shua', 'shuai', 'shuan', 'shuang', 'shui', 'shun', 'shuo', 'si', 'song', 'sou',
    'su', 'suan', 'sui', 'sun', 'suo', 'ta', 'tai', 'tan', 'tang', 'tao', 'te', 'tei',
    'teng', 'ti', 'tian', 'tiao', 'tie', 'ting', 'tong', 'tou', 'tu', 'tuan', 'tui',
    'tun', 'tuo', 'wa', 'wai', 'wan', 'wang', 'wei', 'wen', 'weng', 'wo', 'wu', 'xi',
    'xia', 'xian', 'xiang', 'xiao', 'xie', 'xin', 'xing', 'xiong', 'xiu', 'xu', 'xuan',
    'xue', 'xun', 'ya', 'yan', 'yang', 'yao', 'ye', 'yi', 'yin', 'ying', 'yo', 'yong',
    'you', 'yu', 'yuan', 'yue', 'yun', 'za', 'zai', 'zan', 'zang', 'zao', 'ze', 'zei',
    'zen', 'zeng', 'zha', 'zhai', 'zhan', 'zhang', 'zhao', 'zhe', 'zhei', 'zhen',
    'zheng', 'zhi', 'zhong', 'zhou', 'zhu', 'zhua', 'zhuai', 'zhuan', 'zhuang',
    'zhui', 'zhun', 'zhuo', 'zi', 'zong', 'zou', 'zu', 'zuan', 'zui', 'zun', 'zuo',
    # Common suffix variants / particles
    'r', 'er'
}

# Accent to base vowel mapping & tone number
TONE_MAP = {
    'ā': ('a', 1), 'á': ('a', 2), 'ǎ': ('a', 3), 'à': ('a', 4),
    'ē': ('e', 1), 'é': ('e', 2), 'ě': ('e', 3), 'è': ('e', 4),
    'ī': ('i', 1), 'í': ('i', 2), 'ǐ': ('i', 3), 'ì': ('i', 4),
    'ō': ('o', 1), 'ó': ('o', 2), 'ǒ': ('o', 3), 'ò': ('o', 4),
    'ū': ('u', 1), 'ú': ('u', 2), 'ǔ': ('u', 3), 'ù': ('u', 4),
    'ǖ': ('ü', 1), 'ǘ': ('ü', 2), 'ǚ': ('ü', 3), 'ǜ': ('ü', 4),
}

def decompose_syllable(s):
    """
    Decomposes an accented syllable into (base_syllable, tone_number, tone_index).
    Tone is 5 for neutral tone.
    """
    s = unicodedata.normalize("NFC", s.strip())
    # Handle r-coloring (儿化音) like 'nǎr', 'zhèr', 'yìdiǎnr'
    is_erhua = False
    if s.endswith('r') and len(s) > 2 and s not in ['er', 'ér', 'ěr', 'èr']:
        s_main = s[:-1]
        is_erhua = True
    else:
        s_main = s

    base_chars = []
    tones_found = []
    for idx, char in enumerate(s_main):
        if char in TONE_MAP:
            base_vowel, tone_num = TONE_MAP[char]
            base_chars.append(base_vowel)
            tones_found.append((tone_num, idx, char))
        else:
            base_chars.append(char)

    base_syllable = "".join(base_chars)
    if is_erhua:
        base_syllable += 'r'

    if len(tones_found) == 0:
        return base_syllable, 5, -1
    elif len(tones_found) == 1:
        return base_syllable, tones_found[0][0], tones_found[0][1]
    else:
        # Multiple tone marks in a single syllable is invalid!
        return base_syllable, -1, -1

def validate_tone_placement(syllable, tone_idx):
    """Verifies that the tone mark is on the grammatically correct vowel."""
    if tone_idx == -1:
        return True # Neutral tone
    s = unicodedata.normalize("NFC", syllable)
    vowels = [(c, i) for i, c in enumerate(s) if c in 'aeiouü' or c in TONE_MAP]
    if not vowels:
        return False
    
    accented_vowel = s[tone_idx]
    if accented_vowel not in TONE_MAP:
        return False

    vowel_str = "".join([c if c not in TONE_MAP else TONE_MAP[c][0] for c, _ in vowels])
    
    expected_vowel = ""
    if 'a' in vowel_str:
        expected_vowel = 'a'
    elif 'o' in vowel_str:
        expected_vowel = 'o'
    elif 'e' in vowel_str:
        expected_vowel = 'e'
    elif vowel_str == 'iu':
        expected_vowel = 'u'
    elif vowel_str == 'ui':
        expected_vowel = 'i'
    else:
        expected_vowel = vowel_str[0]

    actual_base = TONE_MAP[accented_vowel][0]
    return actual_base == expected_vowel

def validate_single_pinyin_syllable(syllable):
    """Validates a single syllable phonotactically and tone-wise."""
    s = unicodedata.normalize("NFC", syllable.strip().lower())
    if not s:
        return False, "Empty syllable"
    
    # Must only contain valid latin + tones + apostrophe
    if re.search(r'[^a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü\']', s):
        return False, f"Illegal characters in syllable: '{s}'"

    base_syl, tone, tone_idx = decompose_syllable(s)
    if tone == -1:
        return False, f"Multiple tone marks in syllable: '{s}'"
    
    # Check tone placement
    if not validate_tone_placement(s, tone_idx):
        return False, f"Misplaced tone mark in syllable: '{s}'"

    lookup_syl = base_syl.replace('ü', 'ü')
    if lookup_syl not in MANDARIN_BASE_SYLLABLES and lookup_syl.rstrip('r') not in MANDARIN_BASE_SYLLABLES:
        return False, f"Not a valid Mandarin base syllable: '{base_syl}'"

    return True, "Valid"


def segment_pinyin_token(token):
    """
    Segments a contiguous Pinyin word (possibly multi-syllable without spaces,
    e.g. 'lǎoshī', 'zǎoshang', 'gāoxìng', 'yìdiǎnr') into valid Mandarin syllables.
    Returns (syllables_list, reason). If invalid, returns (None, reason).
    """
    s = unicodedata.normalize("NFC", token.strip().lower())
    if not s:
        return None, "Empty token"

    if re.search(r"[^a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]", s):
        return None, f"Illegal characters in token: '{s}'"

    # Fast path: valid single syllable
    single_ok, single_reason = validate_single_pinyin_syllable(s)
    if single_ok:
        return [s], "Valid"

    n = len(s)
    memo = {}

    def solve(start):
        if start == n:
            return []
        if start in memo:
            return memo[start]

        # Try longest valid syllable first (up to max Mandarin syllable length 7, e.g. 'zhuāng' + 'r')
        max_end = min(n, start + 7)
        for end in range(max_end, start, -1):
            cand = s[start:end]
            # Per Hanyu Pinyin Orthography, syllables starting with a/o/e mid-word require an apostrophe ('),
            # and bare 'r' is only valid as erhua suffix handled inside validate_single_pinyin_syllable.
            if start > 0 and (cand[0] in "aāáǎàoōóǒòeēéěè" or cand == "r"):
                continue
            ok, _ = validate_single_pinyin_syllable(cand)
            if ok:
                rest = solve(end)
                if rest is not None:
                    memo[start] = [cand] + rest
                    return memo[start]

        memo[start] = None
        return None

    segmented = solve(0)
    if segmented is not None:
        return segmented, "Valid"

    return None, single_reason


def tokenize_pinyin_phrase(phrase):
    """
    Splits a Pinyin phrase by whitespace, apostrophe ('), and hyphen (-),
    then segments each contiguous word into valid Mandarin syllables.
    Returns (syllables_list, error_reason).
    """
    p = unicodedata.normalize("NFC", phrase.strip())
    if not p:
        return None, "Empty pinyin phrase"

    raw_tokens = [t for t in re.split(r"[\s'\-]+", p) if t]
    if not raw_tokens:
        return None, "Empty pinyin tokens"

    all_syllables = []
    for tok in raw_tokens:
        syls, reason = segment_pinyin_token(tok)
        if syls is None:
            return None, reason
        all_syllables.extend(syls)

    return all_syllables, "Valid"


def validate_pinyin_string(pinyin_str):
    """Validates a full pinyin string (single word or multi-syllable/phrase, e.g. 'nǐ hǎo', 'lǎoshī', 'nǚ'ér')."""
    if not pinyin_str or not isinstance(pinyin_str, str):
        return False, "Pinyin is empty or not string"

    p = unicodedata.normalize("NFC", pinyin_str.strip())
    alternatives = [a.strip() for a in p.split('/') if a.strip()]
    if not alternatives:
        return False, "Empty pinyin alternatives"

    for alt in alternatives:
        syls, reason = tokenize_pinyin_phrase(alt)
        if syls is None:
            return False, f"Invalid syllable in '{alt}': {reason}"

    return True, "Valid"

def check_pinyin_matches_hanzi(hanzi, pinyin_str):
    """
    Cross-checks that the pinyin matches at least one legitimate reading of the Hanzi.
    Uses pypinyin dictionary.
    """
    if not hanzi or not pinyin_str:
        return False, "Missing hanzi or pinyin"
    
    hz = unicodedata.normalize("NFC", hanzi.strip())
    py = unicodedata.normalize("NFC", pinyin_str.strip())

    # Get dictionary heteronym readings
    dict_readings = pinyin(hz, style=Style.TONE, heteronym=True)
    dict_base_readings = pinyin(hz, style=Style.NORMAL, heteronym=True)

    user_alts = [a.strip() for a in py.split('/') if a.strip()]
    
    match_found = False
    for alt in user_alts:
        user_tokens, tok_err = tokenize_pinyin_phrase(alt)
        if user_tokens is None:
            return False, tok_err
        if len(user_tokens) != len(hz):
            # Erhua special case (e.g. 那儿 nàr = 2 chars, 1 syllable)
            if hz.endswith('儿') and len(user_tokens) == len(hz) - 1:
                return True, "Valid (Erhua match)"
            return False, f"Syllable count mismatch: Hanzi '{hz}' ({len(hz)} chars) vs Pinyin '{alt}' ({len(user_tokens)} tokens)"

        char_matches = []
        for i, token in enumerate(user_tokens):
            readings = [unicodedata.normalize("NFC", r.lower()) for r in dict_readings[i]]
            base_syl, tone_num, _ = decompose_syllable(token)
            base_readings = [unicodedata.normalize("NFC", r.lower()) for r in dict_base_readings[i]]
            
            # Exact tone match
            if token in readings:
                char_matches.append(True)
            # Neutral tone (tone_num == 5) is allowed if base syllable matches
            elif tone_num == 5 and base_syl in base_readings:
                char_matches.append(True)
            else:
                char_matches.append(False)

        if all(char_matches):
            match_found = True
            break

    if not match_found:
        return False, f"Pinyin '{py}' does not match dictionary readings for Hanzi '{hz}'"

    return True, "Matched"

if __name__ == "__main__":
    test_cases = [
        ("你好", "nǐ hǎo", True),
        ("买", "mǎi", True),
        ("谁", "shéi/shuí", True),
        ("女儿", "nǚ'ér", True),
        ("那儿", "nàr", True),
        ("学生", "xué sheng", True), # Neutral tone on sheng
        # NEGATIVE CASES
        ("买", "mài", False), # Wrong tone (mài is 卖)
        ("你好", "asdfghjk", False), # Gibberish
        ("你好", "tā hǎo", False), # Mismatch
        ("中国", "zhōōng guó", False), # Double tone mark
        ("苹果", "píng guǒ 123", False), # Digits
    ]
    print("Testing Pinyin Validator:")
    for hz, py, expected in test_cases:
        v1, r1 = validate_pinyin_string(py)
        v2, r2 = check_pinyin_matches_hanzi(hz, py) if v1 else (False, r1)
        actual = v1 and v2
        status = "PASS" if actual == expected else "FAIL"
        print(f"  [{status}] {hz} ({py}) -> Actual: {actual}, Expected: {expected} | {r2}")
