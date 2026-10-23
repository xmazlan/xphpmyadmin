"""Run the personal local v1 release gates, recording only non-secret test summaries."""
import argparse
import datetime
import json
from pathlib import Path
import platform
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
SUITES = [
    ['php', 'test/local/foundation.php'],
    ['php', 'test/local/profiles.php'],
    ['php', 'test/local/passwords.php'],
    ['php', 'test/local/recovery.php'],
    ['node', 'test/local/context-js.cjs'],
    ['python3', 'test/local/rollback.py'],
    ['python3', 'test/local/check_http.py'],
    ['python3', 'test/local/check_connections.py'],
]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--report', type=Path, help='Write a sanitized JSON report (no secrets or session state)')
    args = parser.parse_args()
    report = {'started_at_utc': datetime.datetime.now(datetime.timezone.utc).isoformat(),
              'scope': 'personal-local-v1', 'macos': platform.mac_ver()[0],
              'php': subprocess.check_output(['php', '-r', 'echo PHP_VERSION;'], text=True),
              'python': platform.python_version(), 'node': subprocess.check_output(['node', '--version'], text=True).strip(),
              'results': [], 'passed': True}
    for command in SUITES:
        started = time.monotonic()
        result = subprocess.run(command, cwd=ROOT, capture_output=True, text=True, timeout=240)
        item = {'command': ' '.join(command), 'passed': result.returncode == 0,
                'seconds': round(time.monotonic() - started, 2)}
        if result.returncode == 0:
            item['summary'] = result.stdout.strip()
            print(result.stdout.strip(), flush=True)
        else:
            # Do not persist arbitrary exception arguments, configuration, or SQL.
            item['summary'] = 'Failed; rerun this isolated suite locally to inspect the failure.'
            report['passed'] = False
            print('FAILED: ' + item['command'], flush=True)
        report['results'].append(item)
        if not item['passed']: break
    report['finished_at_utc'] = datetime.datetime.now(datetime.timezone.utc).isoformat()
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, indent=2) + '\n')
    print('Release gates: ' + ('PASS' if report['passed'] else 'FAIL'), flush=True)
    raise SystemExit(0 if report['passed'] else 1)


if __name__ == '__main__':
    main()
