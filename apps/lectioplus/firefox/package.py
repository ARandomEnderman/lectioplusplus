"""Build the unsigned Firefox desktop test package from the shared extension."""
import argparse
import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

extension = Path(__file__).resolve().parents[1] / 'extension'
parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('output', type=Path)
options = parser.parse_args()
manifest = json.loads((extension / 'manifest.json').read_text())
manifest['background'] = {'scripts': ['translation.js', 'translation-worker.js', 'firefox-hosts.js']}
manifest['browser_specific_settings'] = {'gecko': {
    'id': 'lectioplus@lectioplus.invalid',
    # Firefox supports sandbox.pages beginning with 154.
    'strict_min_version': '154.0',
}}
# The Firefox background document owns the worker hosts. Only icons are public.
for rule in manifest['web_accessible_resources']:
    rule['resources'] = [path for path in rule['resources'] if path.endswith('.png')]
with ZipFile(options.output, 'w', ZIP_DEFLATED) as package:
    package.write(Path(__file__).with_name('runtime-hosts.js'), 'firefox-hosts.js')
    package.writestr('manifest.json', json.dumps(manifest, ensure_ascii=False, indent=2))
    for item in sorted(extension.rglob('*')):
        if item.is_file() and item.name != 'manifest.json':
            package.write(item, item.relative_to(extension))
