"""Run with python3 test/local/check_http.py; uses a temporary PHP server, never SQL."""
import hashlib
import json
import os
from pathlib import Path
import socket
import secrets
import subprocess
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def request(url, headers=None, method='GET'):
    try:
        with OPENER.open(urllib.request.Request(url, headers=headers or {}, method=method), timeout=5) as response:
            return response.status, response.read()
    except urllib.error.HTTPError as error:
        return error.code, error.read()


base = 'http://xphpmyadmin.test'
status, body = request(base + '/local-runtime.php')
assert status == 200 and json.loads(body)['runtime']['sapi'] == 'fpm-fcgi'
for header in ['Forwarded', 'X-Forwarded-For', 'X-Real-IP']:
    assert request(base + '/local-runtime.php', {header: '127.0.0.1'})[0] == 403
for entry in ['index.php', 'url.php', 'show_config_errors.php', 'setup/index.php',
              'setup/config.php', 'setup/validate.php', 'js/messages.php', 'local-connection-test.php',
              'examples/signon.php', 'examples/signon-script.php', 'examples/openid.php',
              'examples/config.manyhosts.inc.php']:
    assert request(base + '/' + entry, {'X-Forwarded-For': '127.0.0.1'})[0] == 403
assert request(base + '/local-runtime.php', method='POST')[0] == 405
for script in ['scripts/local-key.php', 'test/local/passwords.php']:
    assert request(base + '/' + script)[0] == 404
config = Path.home() / 'Library/Application Support/xphpmyadmin/local.json'
original = config.read_bytes()
# Real synthetic private files must not be downloadable through the app or traversal.
settings = json.loads(original)
marker = secrets.token_hex(32).encode()
canaries = [Path(settings['data_dir']) / 'foundation-canary.txt',
            Path(settings['key_dir']) / 'foundation-canary.txt']
try:
    for canary in canaries:
        descriptor = os.open(str(canary), os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
        with os.fdopen(descriptor, 'wb') as handle:
            handle.write(marker)
    for path in ['/local.json', '/data/foundation-canary.txt', '/keys/foundation-canary.txt',
                 '/Library/Application%20Support/xphpmyadmin/data/foundation-canary.txt',
                 '/%2e%2e/%2e%2e/Library/Application%20Support/xphpmyadmin/keys/foundation-canary.txt']:
        _, body = request(base + path)
        assert marker not in body and original not in body and b'"data_dir"' not in body
finally:
    for canary in canaries:
        canary.unlink(missing_ok=True)
print('Herd FPM: runtime 200; spoof headers and twelve entrypoints 403; POST 405; private content absent.')

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.connect(('192.0.2.1', 80))
lan = sock.getsockname()[0]
sock.close()


def serve(bind, host, remote=False, env=None, missing_dependency=False):
    command = ['php'] + (['-d', 'disable_functions=sodium_crypto_secretbox'] if missing_dependency else [])
    process = subprocess.Popen(command + ['-S', bind + ':18763', '-t', str(ROOT)],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env)
    try:
        for _ in range(30):
            try:
                result = request('http://' + host + ':18763/local-runtime.php')
                break
            except urllib.error.URLError:
                if process.poll() is not None:
                    raise RuntimeError('Temporary PHP server failed to start')
                time.sleep(.05)
        else:
            raise RuntimeError('Temporary PHP server did not become ready')
        if remote:
            assert result[0] == 403
            assert request('http://' + host + ':18763/local-runtime.php', {'X-Forwarded-For': '127.0.0.1'})[0] == 403
            assert request('http://127.0.0.1:18763/local-runtime.php')[0] == 200
        elif missing_dependency:
            assert result[0] == 503 and b'ext-pdo_sqlite and ext-sodium' in result[1]
        elif env:
            assert result[0] == 503 and b'Private location missing or unsafe' in result[1]
        else:
            assert result[0] == 200
    finally:
        process.terminate()
        process.wait()


serve('0.0.0.0', lan, remote=True)
serve('[::1]', '[::1]')
serve('127.0.0.1', '127.0.0.1', env={**os.environ, 'XPHPMYADMIN_LOCAL_CONFIG': '/nonexistent/xpma/local.json'})
serve('127.0.0.1', '127.0.0.1', missing_dependency=True)
assert config.read_bytes() == original
print('Direct HTTP: IPv4/IPv6 loopback accepted; real LAN and spoof denied; missing storage/dependency return safe 503.')
# Herd's actual nginx entry point must also be unavailable over the LAN address.
for port in [80, 443, 60]:
    connection = socket.socket()
    connection.settimeout(2)
    try:
        assert connection.connect_ex((lan, port)) != 0, 'Herd listening on LAN port ' + str(port)
    finally:
        connection.close()
print('Herd entry point: LAN connections rejected on ports 80, 443 and 60.')
