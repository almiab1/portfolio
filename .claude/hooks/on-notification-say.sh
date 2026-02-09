#!/usr/bin/env bash
# .claude/hooks/on-notification-say.sh
set -euo pipefail

payload="$(cat)"
message=$(echo "$payload" | jq -r '.message // empty')

# Salir si no hay mensaje
[[ -z "$message" ]] && exit 0

# Compatibilidad Linux/macOS
if command -v spd-say &>/dev/null; then
  spd-say -- "$message"
elif command -v espeak &>/dev/null; then
  espeak "$message"
elif [[ -x /usr/bin/say ]]; then
  /usr/bin/say "$message"
else
  echo "No TTS engine found" >&2
  exit 1
fi