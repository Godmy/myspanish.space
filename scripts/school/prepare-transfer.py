"""Pack the active archive import manifest/batches, excluding databases and credentials."""
import hashlib
import json
import zipfile
from pathlib import Path

source = Path('.school-import').resolve()
manifest_bytes = (source / 'manifest.json').read_bytes()
manifest = json.loads(manifest_bytes)
files = ['manifest.json', *manifest['batches']]
destination = Path('.school-transfer')
destination.mkdir(exist_ok=True)
archive = destination / ('archive-metadata-' + manifest['report']['snapshot'] + '.zip')
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as output:
    for name in files:
        path = (source / name).resolve()
        if Path(name).name != name or not name.endswith('.json') or not path.is_relative_to(source):
            raise ValueError('Unexpected archive entry')
        output.write(path, arcname=name)
with zipfile.ZipFile(archive) as output:
    if output.testzip() is not None or output.namelist() != files:
        raise ValueError('Transfer archive verification failed')
    if output.read('manifest.json') != manifest_bytes:
        raise ValueError('Transfer manifest mismatch')
checksum = hashlib.sha256(archive.read_bytes()).hexdigest()
(destination / (archive.name + '.sha256')).write_text(checksum + '  ' + archive.name + '\n', encoding='utf-8')
print(json.dumps({'archive': str(archive), 'sha256': checksum, 'entries': len(files), 'report': manifest['report']}, ensure_ascii=True, indent=2))
