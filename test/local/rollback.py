"""Restore the archived code/config baseline privately, without executing its DB login."""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import subprocess
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[2]
BASELINE = Path(os.environ.get('XPM_BASELINE_DIR', str(Path.home() / 'Library/Application Support/xphpmyadmin/backups/20261022-161158')))


def main():
    manifest = json.loads((BASELINE / 'manifest.json').read_text())
    archive = BASELINE / 'baseline.tar.gz'
    assert hashlib.sha256(archive.read_bytes()).hexdigest() == manifest['archive_sha256']
    live_config = hashlib.sha256((ROOT / 'config.inc.php').read_bytes()).hexdigest()
    assert live_config == manifest['config_sha256'], 'Current legacy configuration differs from captured baseline; investigate before rollback'
    with tempfile.TemporaryDirectory(prefix='xpma-rollback-') as name:
        stage = Path(name).resolve(); stage.chmod(0o700)
        code = stage / 'baseline'; code.mkdir(mode=0o700)
        with tarfile.open(archive) as source:
            for member in source.getmembers():
                path = PurePosixPath(member.name)
                assert not path.is_absolute() and '..' not in path.parts
                assert member.isfile() or member.isdir(), 'Baseline must not contain links/devices'
            # Every member was checked above; support the Mac system Python without tar filters.
            source.extractall(code)
        (code / 'config.inc.php').chmod(0o600)
        assert hashlib.sha256((code / 'config.inc.php').read_bytes()).hexdigest() == live_config
        assert (code / 'index.php').is_file() and (code / 'vendor/autoload.php').is_file()
        assert (code / 'libraries/classes/Common.php').is_file()
        assert 'ProfileRequest' not in (code / 'libraries/classes/Common.php').read_text()
        assert not (code / 'local-connections.php').exists()
        # The current adapter's disabled path must preserve the legacy configuration,
        # without executing Config authentication or touching a remote server.
        private = stage / 'private'; private.mkdir(mode=0o700)
        for directory in ['data', 'keys']: (private / directory).mkdir(mode=0o700)
        config = private / 'local.json'
        config.write_text(json.dumps({'profiles_enabled': False, 'data_dir': str(private / 'data'), 'key_dir': str(private / 'keys')})); config.chmod(0o600)
        probe = stage / 'probe.php'
        probe.write_text('<?php define("ROOT_PATH",' + repr(str(ROOT) + '/') + '); define("PHPMYADMIN",true); require ROOT_PATH."libraries/constants.php"; require ' + repr(str(ROOT / 'vendor/autoload.php')) + ';'
                         '$c=new PhpMyAdmin\\Config(); $before=serialize($c->settings);'
                         'PhpMyAdmin\\Local\\ProfileRequest::bootstrap($c,[],[]);'
                         'if(serialize($c->settings)!==$before || PhpMyAdmin\\Local\\ProfileRequest::token()!==null){exit(1);} echo "legacy-config-preserved";')
        probe.chmod(0o600)
        result = subprocess.run(['php', str(probe)], env={**os.environ, 'XPHPMYADMIN_LOCAL_CONFIG': str(config)}, capture_output=True, timeout=15)
        assert result.returncode == 0 and result.stdout == b'legacy-config-preserved'
        assert not list((private / 'data').iterdir()) and not list((private / 'keys').iterdir())
    assert hashlib.sha256((ROOT / 'config.inc.php').read_bytes()).hexdigest() == live_config
    print('Rollback: archive digest, private code/config extraction, identical legacy config, disabled adapter without SQL, no metadata/key replacement passed.')


if __name__ == '__main__':
    main()
