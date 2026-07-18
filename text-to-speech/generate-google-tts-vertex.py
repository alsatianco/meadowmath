#!/usr/bin/env python3
"""Generate English narration WAVs through Google Vertex AI.

Authentication uses local Application Default Credentials. Run once:
  gcloud auth application-default login

Then generate all pending narration:
  .venv/bin/python text-to-speech/generate-google-tts-vertex.py --all

`text-to-speech/tts-catalog.json` is the only narration input. Add a new item
there with `"created": false`; a successful generation switches it to true.
Use `--recreate-all` only when every existing clip should be regenerated.

The browser manifest includes only files that exist, so incomplete generation
continues to use the browser's English speech fallback.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import mimetypes
import os
import re
import struct
import subprocess
import time
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_TEXT_MANIFEST = ROOT / "text-to-speech" / "tts-catalog.json"
DEFAULT_OUT_DIR = ROOT / "assets" / "audio" / "tts"
DEFAULT_ADC_PATH = Path.home() / ".config" / "gcloud" / "application_default_credentials.json"
MODEL = "gemini-3.1-flash-tts-preview"
VOICE_NAME = "Laomedeia"
DEFAULT_PROJECT = os.environ.get("GOOGLE_CLOUD_PROJECT") or os.environ.get("GCLOUD_PROJECT")
DEFAULT_LOCATION = os.environ.get("GOOGLE_CLOUD_LOCATION") or "us-central1"


def load_catalog(path: Path) -> tuple[dict, list[dict[str, str]]]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise SystemExit(f"Could not read {path}: {exc}") from exc
    if not isinstance(data, dict) or not isinstance(data.get("sections"), list):
        raise SystemExit(f"{path} must be an object with a sections array.")

    items = []
    seen_ids = set()
    for section in data["sections"]:
        if not isinstance(section, dict) or not section.get("id") or not isinstance(section.get("activities"), list):
            raise SystemExit("Each section needs an id and activities array.")
        for activity in section["activities"]:
            if not isinstance(activity, dict) or not activity.get("id") or not isinstance(activity.get("items"), list):
                raise SystemExit("Each activity needs an id and items array.")
            for item in activity["items"]:
                if (
                    not isinstance(item, dict) or not item.get("id") or not item.get("text")
                    or not isinstance(item.get("created"), bool)
                    or ("voiceText" in item and not isinstance(item["voiceText"], str))
                ):
                    raise SystemExit("Each narration item needs id, text, and boolean created fields.")
                if item["id"] in seen_ids:
                    raise SystemExit(f"Narration ids must be unique: {item['id']}")
                seen_ids.add(item["id"])
                items.append(item)
    return data, items


def write_catalog(catalog: dict, path: Path) -> None:
    # `file` is derived build state. Keep the editable catalog limited to its
    # stable source fields; the generated browser manifest owns file paths.
    serializable = json.loads(json.dumps(catalog))
    for section in serializable["sections"]:
        for activity in section["activities"]:
            for item in activity["items"]:
                item.pop("file", None)
    path.write_text(json.dumps(serializable, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def file_stem(item: dict[str, str]) -> str:
    # Include the explicit spoken form so a pronunciation correction gets a
    # fresh asset instead of accidentally reusing an older WAV.
    spoken_text = item.get("voiceText")
    fingerprint = item["text"] if spoken_text is None else item["text"] + "\0" + spoken_text
    digest = hashlib.sha1(fingerprint.encode("utf-8")).hexdigest()[:8]
    return f"{item['id']}-{digest}"


def convert_to_wav(audio_data: bytes, mime_type: str) -> bytes:
    """Wrap Vertex linear PCM (16-bit little-endian) in a WAV container."""
    rate_match = re.search(r"rate=(\d+)", mime_type or "")
    sample_rate = int(rate_match.group(1)) if rate_match else 24000
    channels_match = re.search(r"channels=(\d+)", mime_type or "")
    channels = int(channels_match.group(1)) if channels_match else 1
    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", 36 + len(audio_data), b"WAVE", b"fmt ", 16, 1, channels,
        sample_rate, sample_rate * channels * 2, channels * 2, 16, b"data", len(audio_data),
    )
    return header + audio_data


def project_from_adc() -> str | None:
    try:
        data = json.loads(DEFAULT_ADC_PATH.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return None
    return data.get("quota_project_id") or data.get("project_id")


def project_from_gcloud() -> str | None:
    try:
        result = subprocess.run(["gcloud", "config", "get-value", "project"], capture_output=True, text=True, timeout=10)
    except (OSError, subprocess.SubprocessError):
        return None
    value = result.stdout.strip()
    return value if result.returncode == 0 and value and value != "(unset)" else None


def resolve_project(cli_project: str | None) -> str:
    project = cli_project or DEFAULT_PROJECT or project_from_adc() or project_from_gcloud()
    if project:
        return project
    try:
        import google.auth
        _, project = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    except Exception as exc:
        raise SystemExit("Missing GCP project or ADC. Run `gcloud auth application-default login` and pass --project.") from exc
    if not project:
        raise SystemExit("Missing GCP project. Pass --project or set GOOGLE_CLOUD_PROJECT.")
    return project


def make_client(args: argparse.Namespace):
    try:
        from google import genai
        from google.genai import types
    except ModuleNotFoundError as exc:
        raise SystemExit(
            "Missing dependency. Create a virtual environment, then run: "
            "python3 -m venv .venv && .venv/bin/pip install -r text-to-speech/requirements.txt"
        ) from exc
    project = resolve_project(args.project)
    client = genai.Client(
        vertexai=True, project=project, location=args.location,
        http_options=types.HttpOptions(timeout=int(args.request_timeout_seconds * 1000)),
    )
    return client, types, project


def prompt_for(text: str) -> str:
    return f"""## Scene:
A warm math learning app for young children.

## Voice direction:
Read slowly and clearly in English with a friendly teacher voice, natural pauses, and gentle energy. Do not add words.

## Transcript:
{text}"""


def generate_one(client, types, item: dict[str, str], out_dir: Path, model: str) -> str:
    spoken_text = item.get("voiceText", item["text"])
    contents = [types.Content(role="user", parts=[types.Part.from_text(text=prompt_for(spoken_text))])]
    config = types.GenerateContentConfig(
        temperature=0.7,
        response_modalities=["audio"],
        speech_config=types.SpeechConfig(
            voice_config=types.VoiceConfig(prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name=VOICE_NAME))
        ),
    )
    chunks: list[bytes] = []
    mime_type = "audio/L16;rate=24000"
    for chunk in client.models.generate_content_stream(model=model, contents=contents, config=config):
        if not chunk.parts:
            continue
        inline_data = chunk.parts[0].inline_data
        if inline_data and inline_data.data:
            mime_type = inline_data.mime_type or mime_type
            chunks.append(inline_data.data)
    if not chunks:
        raise RuntimeError("No audio returned")
    extension = mimetypes.guess_extension(mime_type)
    audio_data = b"".join(chunks)
    if extension is None or extension == ".l16":
        extension = ".wav"
        audio_data = convert_to_wav(audio_data, mime_type)
    out_dir.mkdir(parents=True, exist_ok=True)
    name = f"{file_stem(item)}{extension}"
    (out_dir / name).write_bytes(audio_data)
    return name


def existing_audio(item: dict[str, str], out_dir: Path) -> str | None:
    matches = sorted(path for path in out_dir.glob(f"{file_stem(item)}.*") if path.name != "manifest.js")
    return matches[0].name if matches else None


def write_browser_manifest(items: list[dict[str, str]], out_dir: Path) -> None:
    lines = [
        "/* Generated by text-to-speech/generate-google-tts-vertex.py. */",
        "(function () {",
        "  'use strict';",
        "  var script = document.currentScript;",
        "  var base = script ? script.src.replace(/\\/[^\\/]*$/, '/') : '';",
        "  window.TTS_AUDIO = window.TTS_AUDIO || {};",
        "  window.TTS_AUDIO_BY_ID = window.TTS_AUDIO_BY_ID || {};",
    ]
    for item in items:
        if item.get("file"):
            lines.append("  window.TTS_AUDIO[%r] = base + %r;" % (item["text"], item["file"]))
            lines.append("  window.TTS_AUDIO_BY_ID[%r] = base + %r;" % (item["id"], item["file"]))
    lines.extend(["})();", ""])
    out_dir.mkdir(parents=True, exist_ok=True)
    (out_dir / "manifest.js").write_text("\n".join(lines), encoding="utf-8")


def retry_delay(exc: Exception, fallback: float) -> float:
    match = re.search(r"Please retry in ([0-9.]+)s", str(exc))
    return float(match.group(1)) + 5 if match else fallback


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate English narration through Vertex AI.")
    parser.add_argument("--all", action="store_true", help="generate every missing audio file")
    parser.add_argument("--max-new-files", type=int, default=5)
    parser.add_argument("--delay-seconds", type=float, default=1.0)
    parser.add_argument("--max-retries", type=int, default=3)
    parser.add_argument("--request-timeout-seconds", type=float, default=120.0)
    parser.add_argument("--project", default=DEFAULT_PROJECT)
    parser.add_argument("--location", default=DEFAULT_LOCATION)
    parser.add_argument("--model", default=MODEL)
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR)
    parser.add_argument("--text-manifest", type=Path, default=DEFAULT_TEXT_MANIFEST)
    parser.add_argument("--recreate-all", action="store_true", help="regenerate every catalog item, including created items")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    catalog, items = load_catalog(args.text_manifest)
    groups: dict[str, list[dict]] = {}
    for item in items:
        groups.setdefault(item["text"], []).append(item)

    pending = []
    catalog_changed = False
    for text, group in groups.items():
        existing = next((existing_audio(item, args.out_dir) for item in group if existing_audio(item, args.out_dir)), None)
        if existing and not args.recreate_all:
            # One WAV can serve every catalog item with the same transcript.
            for item in group:
                item["file"] = existing
                if not item["created"]:
                    item["created"] = True
                    catalog_changed = True
            continue
        representative = group[0]
        if args.recreate_all or not all(item["created"] for item in group) or not existing:
            pending.append((representative, group))
        else:
            for item in group:
                item["file"] = existing

    if catalog_changed and not args.dry_run:
        write_catalog(catalog, args.text_manifest)
    limit = len(pending) if (args.all or args.recreate_all) else max(0, args.max_new_files)
    ready = len(items) - sum(len(group) for _, group in pending)
    print(f"English narration: {ready}/{len(items)} ready; {min(len(pending), limit)} unique clips to generate")
    if args.dry_run:
        write_browser_manifest([item for item in items if item.get("file") and item["created"]], args.out_dir)
        return
    if pending and limit:
        client, types, project = make_client(args)
        print(f"Vertex AI project={project} location={args.location} model={args.model}")
        last_request = 0.0
        for item, group in pending[:limit]:
            for attempt in range(1, args.max_retries + 1):
                wait = args.delay_seconds - (time.monotonic() - last_request)
                if last_request and wait > 0:
                    time.sleep(wait)
                try:
                    last_request = time.monotonic()
                    print(f"generate {item['id']}: {item['text']}", flush=True)
                    item["file"] = generate_one(client, types, item, args.out_dir, args.model)
                    for duplicate in group:
                        duplicate["file"] = item["file"]
                        duplicate["created"] = True
                    write_catalog(catalog, args.text_manifest)
                    print(f"generated {item['file']}", flush=True)
                    break
                except Exception as exc:
                    if attempt == args.max_retries:
                        print(f"skipped {item['id']}: {exc}", flush=True)
                    else:
                        time.sleep(retry_delay(exc, args.delay_seconds))
    write_browser_manifest([item for item in items if item.get("file") and item["created"]], args.out_dir)
    ready = sum(bool(item.get("file")) and item["created"] for item in items)
    print(f"manifest {args.out_dir / 'manifest.js'} ({ready}/{len(items)} ready)")


if __name__ == "__main__":
    main()
