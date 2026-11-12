#!/bin/bash
# Installs or updates the LectioPlus+ Safari extension from the latest GitHub release.
# Run the same command again to update. The release workflow replaces
# __GITHUB_REPOSITORY__ with the real owner/repo before attaching this script to a release.
set -euo pipefail

REPO="__GITHUB_REPOSITORY__"
URL="https://github.com/$REPO/releases/latest/download/lectioplus-safari-macos.zip"
APPS="/Applications"
[ -w "$APPS" ] || APPS="$HOME/Applications"
APP="$APPS/LectioPlus.app"

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

echo "Henter nyeste LectioPlus+ ..."
curl -fsSL "$URL" -o "$tmp/lectioplus.zip"
ditto -x -k "$tmp/lectioplus.zip" "$tmp"

osascript -e 'quit app "LectioPlus"' >/dev/null 2>&1 || true
mkdir -p "$APPS"
rm -rf "$APP"
ditto "$tmp/LectioPlus.app" "$APP"
xattr -dr com.apple.quarantine "$APP" 2>/dev/null || true

# Opening the app once registers the extension with Safari.
open "$APP"

version=$(defaults read "$APP/Contents/Info" CFBundleShortVersionString 2>/dev/null || echo "?")
echo
echo "LectioPlus+ $version er installeret i $APPS."
echo "Første gang: Safari → Indstillinger → Avanceret → slå funktioner til webudviklere til,"
echo "vælg Udvikler → Tillad usignerede udvidelser, og slå LectioPlus+ til under Indstillinger → Udvidelser."
echo "Genstart Safari, hvis du opdaterede. Kør samme kommando igen for at opdatere."
