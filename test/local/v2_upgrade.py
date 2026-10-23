"""Actual baseline schema-2 code, disposable data, v3 migration and old-code rollback."""
import json
import os
from pathlib import Path
import subprocess
import tempfile
ROOT = Path(__file__).resolve().parents[2]

def main():
    with tempfile.TemporaryDirectory(prefix='xu-', dir='/tmp') as name:
        base=Path(name).resolve(); base.chmod(0o700)
        for folder in ['data','keys','v1-app/libraries/classes/Local']: (base/folder).mkdir(mode=0o700,parents=True)
        names=subprocess.check_output(['git','ls-tree','--name-only','HEAD','libraries/classes/Local/'],cwd=ROOT,text=True).splitlines()
        for source in names:
            result=subprocess.run(['git','show','HEAD:'+source],cwd=ROOT,capture_output=True,check=True)
            target=base/'v1-app/libraries/classes/Local'/Path(source).name; target.write_bytes(result.stdout); target.chmod(0o600)
        config=base/'local.json'; config.write_text(json.dumps({'profiles_enabled':False,'data_dir':str(base/'data'),'key_dir':str(base/'keys')})); config.chmod(0o600)
        env={**os.environ,'XPHPMYADMIN_LOCAL_CONFIG':str(config),'XPM_V1_CODE':str(base/'v1-app/libraries/classes/Local')}
        for phase in ['legacy','upgrade','rollback']:
            if phase=='rollback': env['XPHPMYADMIN_LOCAL_CONFIG']=str(base/'rollback/local.json')
            result=subprocess.run(['php',str(ROOT/'test/local/v2_upgrade.php'),phase],env=env,capture_output=True,text=True)
            if result.returncode: raise RuntimeError('Disposable v2 migration/rollback failed: '+result.stderr[-1800:]+result.stdout[-1800:])
            print(result.stdout.strip())
if __name__=='__main__': main()
