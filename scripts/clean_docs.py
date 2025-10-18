#!/usr/bin/env python3
import re
from pathlib import Path

# Files to process
ROOT = Path(__file__).resolve().parents[1]
INCLUDE_EXTS = {".md", ".mdx", ".markdown", ".rst", ".txt"}

# Regex patterns
# Em dash character
EM_DASH = "—"

# "It's not just X, it's also Y" -> "It includes X and Y"
PATTERN_NOT_JUST = re.compile(
    r"\bIt(?:’|')s\s+not\s+just\s+([^,;]+?)\s*,\s*It(?:’|')s\s+also\s+(.+?)([.!?]|$)",
    flags=re.IGNORECASE,
)

# Also handle lowercase second clause (it's)
PATTERN_NOT_JUST_2 = re.compile(
    r"\bIt(?:’|')s\s+not\s+just\s+([^,;]+?)\s*,\s*it(?:’|')s\s+also\s+(.+?)([.!?]|$)",
    flags=re.IGNORECASE,
)

# "It's not about X, it's about Y" -> "It is about Y"
PATTERN_NOT_ABOUT = re.compile(
    r"\bIt(?:’|')s\s+not\s+about\s+([^,;]+?)\s*,\s*it(?:’|')s\s+about\s+(.+?)([.!?]|$)",
    flags=re.IGNORECASE,
)

# Emoji ranges (broad approximation)
EMOJI_RE = re.compile(
    r"[\U0001F300-\U0001FAFF\U00002700-\U000027BF\U00002600-\U000026FF\U0001F1E6-\U0001F1FF\U0001F900-\U0001F9FF\U00002B50\U0000231A]",
    flags=re.UNICODE,
)

def sanitize_line(line: str, is_heading: bool) -> str:
    # Replace em dash with spaced hyphen
    if EM_DASH in line:
        line = line.replace(EM_DASH, " - ")

    # Phrase rewrites
    line = PATTERN_NOT_JUST.sub(lambda m: f"It includes {m.group(1).strip()} and {m.group(2).strip()}{m.group(3)}", line)
    line = PATTERN_NOT_JUST_2.sub(lambda m: f"It includes {m.group(1).strip()} and {m.group(2).strip()}{m.group(3)}", line)
    line = PATTERN_NOT_ABOUT.sub(lambda m: f"It is about {m.group(2).strip()}{m.group(3)}", line)

    # Emoji handling
    if is_heading:
        # Keep at most one emoji in headings
        emojis = EMOJI_RE.findall(line)
        if len(emojis) > 1:
            first = emojis[0]
            # Remove all, then add back the first occurrence at its first position
            # Get index of first emoji
            first_idx = None
            acc = 0
            for ch in line:
                if EMOJI_RE.match(ch):
                    first_idx = acc
                    break
                acc += 1
            line_wo_emoji = EMOJI_RE.sub("", line)
            if first_idx is None:
                line = line_wo_emoji
            else:
                # Insert a single emoji at the original first index
                line = line_wo_emoji[:first_idx] + first + line_wo_emoji[first_idx:]
        # Otherwise leave as-is
    else:
        # Strip all emojis from non-heading content
        if EMOJI_RE.search(line):
            line = EMOJI_RE.sub("", line)

    return line

def process_file(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    lines = original.splitlines(keepends=False)

    cleaned_lines = []
    prev_line = None
    for raw in lines:
        is_heading = raw.lstrip().startswith("#")
        line = sanitize_line(raw, is_heading)

        # Remove consecutive duplicate lines (ignoring trailing/leading whitespace)
        if prev_line is not None and prev_line.strip() == line.strip():
            # Skip duplicate
            continue

        cleaned_lines.append(line)
        prev_line = line

    cleaned = "\n".join(cleaned_lines) + ("\n" if original.endswith("\n") else "")
    if cleaned != original:
        path.write_text(cleaned, encoding="utf-8")
        return True
    return False

def main():
    files = []
    # Collect candidate files
    for p in ROOT.rglob("*"):
        if p.is_file() and p.suffix.lower() in INCLUDE_EXTS:
            # Skip node_modules and .git
            if any(part in {"node_modules", ".git", "dist", "build"} for part in p.parts):
                continue
            files.append(p)

    changed = []
    for f in files:
        if process_file(f):
            changed.append(str(f.relative_to(ROOT)))

    if changed:
        print("Updated files:\n" + "\n".join(sorted(changed)))
    else:
        print("No changes needed.")

if __name__ == "__main__":
    main()

