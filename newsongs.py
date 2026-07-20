#!/usr/bin/env python3
import json
from pathlib import Path
import re

# Configuration
SONGS_DIR = Path("songs")
JSON_FILE = Path("songs_tagged.json")

def get_sort_key(entry):
    """
    Returns a normalized string for sorting, ignoring a leading 'The '.
    """
    title = entry.get("title", "")
    # Check if the title starts with "The " case-insensitively and remove it for sorting
    normalized_title = re.sub(r"^(The)\s+", "", title, flags=re.IGNORECASE)
    return normalized_title.casefold()

def sync_and_sort_songs():
    # Load existing JSON data
    if JSON_FILE.exists():
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            try:
                songs_data = json.load(f)
            except json.JSONDecodeError:
                print(f"Error: {JSON_FILE} is not valid JSON. Starting fresh.")
                songs_data = []
    else:
        songs_data = []

    # Extract existing titles
    existing_titles = {entry["title"] for entry in songs_data if "title" in entry}

    if not SONGS_DIR.exists():
        print(f"Error: Directory '{SONGS_DIR}' does not exist.")
        return

    # Scan for new .txt files
    new_songs_added = 0
    for txt_file in SONGS_DIR.glob("*.txt"):
        title = txt_file.stem
        if title not in existing_titles:
            songs_data.append({
                "title": title,
                "tags": []
            })
            existing_titles.add(title)
            new_songs_added += 1
            print(f"Added: '{title}'")

    # Sort entries alphabetically by title, ignoring leading "The "
    songs_data.sort(key=get_sort_key)

    # Write sorted data back to file
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(songs_data, f, indent=2, ensure_ascii=False)

    print(f"Sync complete. Total entries: {len(songs_data)}. New added: {new_songs_added}.")

if __name__ == "__main__":
    sync_and_sort_songs()
