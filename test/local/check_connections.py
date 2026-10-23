"""Disposable MySQL/MariaDB/TLS integration. Never uses an existing server or datadir."""
import hashlib
import http.client
import json
import os
from pathlib import Path
import re
import secrets
import socket
import sqlite3
from http.cookies import SimpleCookie
import subprocess
import tempfile
import threading
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parents[2]
PRIVATE = Path.home() / 'Library/Application Support/xphpmyadmin'
MYSQL = Path(os.environ.get('XPM_TEST_MYSQL_BASE', '/Users/Shared/Herd/services/mysql/9.4.0'))
MARIADB = Path(os.environ['XPM_TEST_MARIADB_BASE']) if 'XPM_TEST_MARIADB_BASE' in os.environ else next((PRIVATE / 'test-tools').glob('mariadb@11.4/*'), Path('/nonexistent'))
TOOLS = PRIVATE / 'test-tools'
LIBRARIES = list(TOOLS.glob('openssl@4/*/lib')) + list(TOOLS.glob('pcre2/*/lib'))
SERVER_ENV = {**os.environ, 'DYLD_LIBRARY_PATH': ':'.join(map(str, LIBRARIES))}
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))
PROCESSES = []


def port():
    with socket.socket() as listener:
        listener.bind(('127.0.0.1', 0))
        return listener.getsockname()[1]


def run(command, *, data=None, env=None, timeout=40):
    result = subprocess.run(list(map(str, command)), input=data, env=env, capture_output=True, timeout=timeout)
    if result.returncode:
        # Do not print SQL, credentials, or native diagnostics from a failed fixture operation.
        diagnostic = ''
        if '--bootstrap' in command or '--batch' in command or Path(command[0]).name == 'php':
            diagnostic = '\n' + '\n'.join(re.sub(r'synthetic-[0-9a-f]+', '[redacted]', line) for line in result.stderr.decode(errors='replace').splitlines()[-8:] if 'IDENTIFIED' not in line)
        raise RuntimeError('Disposable fixture command failed: ' + Path(command[0]).name + diagnostic)
    return result.stdout


def start(command, log, env=None):
    handle = open(log, 'wb')
    process = subprocess.Popen(list(map(str, command)), stdout=handle, stderr=handle, env=env)
    handle.close()
    PROCESSES.append(process)
    return process


def ready(process, server_port):
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if process.poll() is not None:
            raise RuntimeError('Disposable server exited before readiness')
        try:
            with socket.create_connection(('127.0.0.1', server_port), .2):
                return
        except OSError:
            time.sleep(.1)
    raise RuntimeError('Disposable server did not become ready')


def post(url, payload, cookie='', extra=None, method='POST'):
    headers = {'Content-Type': 'application/json', 'Cookie': cookie}
    headers.update(extra or {})
    body = json.dumps(payload).encode()
    try:
        with OPENER.open(urllib.request.Request(url, data=body, headers=headers, method=method), timeout=20) as response:
            return response.status, response.read(), response.headers
    except urllib.error.HTTPError as error:
        return error.code, error.read(), error.headers


def cert(base, name, ca=None, hostname='localhost'):
    key, certificate = base / (name + '.key'), base / (name + '.pem')
    if ca is None:
        run(['openssl', 'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', certificate,
             '-subj', '/CN=' + name, '-days', '2'])
    else:
        request = base / (name + '.csr')
        extension = base / (name + '.ext')
        extension.write_text('subjectAltName=DNS:' + hostname + (',IP:127.0.0.1' if hostname == 'localhost' else '') + '\nextendedKeyUsage=serverAuth,clientAuth\n')
        run(['openssl', 'req', '-new', '-newkey', 'rsa:2048', '-nodes', '-keyout', key, '-out', request, '-subj', '/CN=' + hostname])
        run(['openssl', 'x509', '-req', '-in', request, '-CA', ca[1], '-CAkey', ca[0], '-CAcreateserial',
             '-out', certificate, '-days', '2', '-extfile', extension])
    os.chmod(key, 0o600)
    return key, certificate


def server(base, name, flavor, tls, certificates, password):
    basedir = MYSQL if flavor == 'mysql' else MARIADB
    binary = basedir / 'bin' / ('mysqld' if flavor == 'mysql' else 'mariadbd')
    env = os.environ.copy() if flavor == 'mysql' else SERVER_ENV
    folder = base / name
    folder.mkdir(mode=0o700)
    datadir = folder / 'data'
    datadir.mkdir(mode=0o700)
    sock = base / (name + '.sock')
    server_port = port()
    common = [binary, '--no-defaults', '--basedir=' + str(basedir), '--datadir=' + str(datadir),
              '--socket=' + str(sock), '--pid-file=' + str(folder / 'server.pid'), '--port=' + str(server_port),
              '--bind-address=127.0.0.1', '--skip-log-bin', '--innodb-buffer-pool-size=32M']
    if flavor == 'mysql':
        run(common + ['--initialize-insecure', '--mysqlx=0'], env=env)
        options = ['--mysqlx=0']
    else:
        share = basedir / 'share/mysql'
        names = ['mariadb_system_tables.sql', 'mariadb_performance_tables.sql', 'mariadb_system_tables_data.sql',
                 'fill_help_tables.sql', 'maria_add_gis_sp_bootstrap.sql', 'mariadb_sys_schema.sql']
        sql = b'CREATE DATABASE mysql;\nUSE mysql;\nSET @auth_root_socket=NULL;\n' + b'\n'.join((share / name).read_bytes() for name in names)
        run(common + ['--bootstrap', '--lc-messages-dir=' + str(share), '--plugin-dir=' + str(basedir / 'lib/plugin')], data=sql, env=env)
        options = ['--lc-messages-dir=' + str(share), '--plugin-dir=' + str(basedir / 'lib/plugin')]
    if tls:
        options += ['--ssl-ca=' + str(certificates['ca'][1]), '--ssl-cert=' + str(certificates[tls][1]), '--ssl-key=' + str(certificates[tls][0])]
    else:
        options += ['--skip-ssl']
    process = start(common + options, folder / 'server.log', env)
    ready(process, server_port)
    client = basedir / 'bin' / ('mysql' if flavor == 'mysql' else 'mariadb')
    sql = ("CREATE DATABASE fixture_allowed; CREATE DATABASE fixture_forbidden; "
           "CREATE TABLE fixture_allowed.sentinel (id INT PRIMARY KEY, value VARCHAR(32)); "
           "INSERT INTO fixture_allowed.sentinel VALUES (1,'unchanged-" + flavor + "'); "
           "CREATE TABLE fixture_allowed.import_probe (marker VARCHAR(32) PRIMARY KEY); "
           "CREATE USER 'xpma_fixture'@'127.0.0.1' IDENTIFIED BY '" + password + "'; "
           "CREATE USER 'xpma_cert'@'127.0.0.1' IDENTIFIED BY '" + password + "' REQUIRE X509; "
           "GRANT SELECT ON fixture_allowed.* TO 'xpma_fixture'@'127.0.0.1'; "
           "GRANT SELECT ON fixture_allowed.* TO 'xpma_cert'@'127.0.0.1'; "
           "GRANT INSERT ON fixture_allowed.import_probe TO 'xpma_fixture'@'127.0.0.1'; "
           "SET GLOBAL general_log_file='" + str(folder / 'queries.log') + "'; SET GLOBAL general_log=ON;")
    # All setup SQL is sent only to the new Unix socket in this temporary directory.
    admin = [client, '--no-defaults', '--protocol=SOCKET', '--socket=' + str(sock), '--user=root', '--batch', '--skip-column-names', '--ssl-mode=DISABLED' if flavor == 'mysql' else '--skip-ssl']
    run(admin, data=sql.encode(), env=env)
    return {'port': server_port, 'folder': str(folder), 'admin': list(map(str, admin)), 'flavor': flavor, 'env': env}


def main(base):
    if not (MYSQL / 'bin/mysqld').is_file() or not (MARIADB / 'bin/mariadbd').is_file():
        raise RuntimeError('MySQL and MariaDB isolated binaries are required; see doc/tes-koneksi-dan-tls.md')
    for name in ['data', 'keys', 'sessions', 'certs']:
        (base / name).mkdir(mode=0o700)
    certificates = {'ca': cert(base / 'certs', 'fixture-ca'), 'wrong_ca': cert(base / 'certs', 'other-ca')}
    for name, hostname in [('server', 'localhost'), ('client', 'localhost'), ('wrong_name', 'wrong.invalid')]:
        certificates[name] = cert(base / 'certs', name, certificates['ca'], hostname)
    certificates['wrong_client'] = cert(base / 'certs', 'wrong-client', certificates['ca'])
    password = 'synthetic-' + secrets.token_hex(20)
    servers = [server(base, 'mysql', 'mysql', 'server', certificates, password),
               server(base, 'mariadb', 'mariadb', 'server', certificates, password),
               server(base, 'bad-name', 'mariadb', 'wrong_name', certificates, password),
               server(base, 'no-tls', 'mariadb', None, certificates, password)]
    print('Disposable MySQL and MariaDB ready; TLS, wrong-name and no-TLS fixtures ready.', flush=True)
    # A TCP peer that accepts a socket but sends no MySQL greeting exercises a real 10-second timeout.
    stall = socket.socket(); stall.bind(('127.0.0.1', 0)); stall.listen()
    stalled = []
    def accept():
        while True:
            try:
                connection, _ = stall.accept(); stalled.append(connection)
            except OSError:
                return
    threading.Thread(target=accept, daemon=True).start()
    config = base / 'local.json'
    config.write_text(json.dumps({'profiles_enabled': True, 'data_dir': str(base / 'data'), 'key_dir': str(base / 'keys')}))
    config.chmod(0o600)
    cases = {'mysql_port': servers[0]['port'], 'mariadb_port': servers[1]['port'], 'bad_name_port': servers[2]['port'],
             'no_tls_port': servers[3]['port'], 'stall_port': stall.getsockname()[1], 'closed_port': port(),
             'password': password, 'ca': str(certificates['ca'][1]), 'wrong_ca': str(certificates['wrong_ca'][1]),
             'cert': str(certificates['client'][1]), 'key': str(certificates['client'][0]),
             'wrong_key': str(certificates['wrong_client'][0]), 'base': str(base)}
    case_file = base / 'cases.json'; case_file.write_text(json.dumps(cases)); case_file.chmod(0o600)
    env = {**os.environ, 'XPHPMYADMIN_LOCAL_CONFIG': str(config), 'XPM_TEST_CASES': str(case_file)}
    try:
        result = run(['php', '-d', 'openssl.cafile=' + cases['ca'], ROOT / 'test/local/connections.php'], env=env, timeout=70)
        assert password.encode() not in result
        print(result.decode().strip(), flush=True)
        session_data = json.loads((base / 'http-session.json').read_text())
        php_port = port()
        app_log = base / 'application.log'
        php = start(['php', '-d', 'openssl.cafile=' + cases['ca'], '-d', 'session.save_path=' + str(base / 'sessions'),
                     '-d', 'display_errors=0', '-d', 'log_errors=1', '-d', 'error_log=' + str(app_log),
                     '-S', '127.0.0.1:' + str(php_port), '-t', ROOT], base / 'php-server.log', env)
        ready(php, php_port)
        url = 'http://127.0.0.1:' + str(php_port) + '/local-connection-test.php'
        draft = {'name': 'HTTP draft', 'host': '127.0.0.1', 'port': cases['mysql_port'], 'username': 'xpma_fixture',
                 'database': 'fixture_allowed', 'tls': {'enabled': True, 'ca': cases['ca']}}
        payload = {'token': session_data['token'], 'draft': draft, 'credential': {'source': 'input', 'password': password}}
        cookie = session_data['cookie']
        snapshot = (base / 'data/profiles.sqlite').read_bytes()
        # CSRF is checked before any connector or credential access.
        for token in ['', 'bad', [session_data['token']]]:
            status, body, _ = post(url, {**payload, 'token': token}, cookie)
            assert status == 403 and json.loads(body)['error']['category'] == 'csrf'
        status, body, _ = post(url, payload)
        assert status == 403
        for method in ['GET', 'PUT']:
            assert post(url, {}, cookie, method=method)[0] == 405
        assert post(url + '?token=forbidden', payload, cookie)[0] == 422
        assert post(url, payload, cookie, {'X-Forwarded-For': '127.0.0.1'})[0] == 403
        status, body, headers = post(url, payload, cookie)
        assert status == 200 and {k: v for k, v in json.loads(body).items() if k != 'diagnostics'} == {'ok': True, 'tls': True, 'database_selected': True}
        assert headers['Cache-Control'] == 'no-store'
        payload['credential'] = {'source': 'input', 'password': 'synthetic-wrong'}
        status, body, _ = post(url, payload, cookie)
        assert status == 502 and json.loads(body)['error']['category'] == 'authentication'
        # Endpoint mappings use the same transport as CLI; none of these draft tests write profiles.
        for patch, category in [({'database': 'fixture_forbidden'}, 'database'),
                                ({'port': cases['closed_port']}, 'network'),
                                ({'host': 'nonexistent-xpma.invalid'}, 'dns'),
                                ({'tls': {'ca': cases['wrong_ca']}}, 'tls')]:
            selected = {**payload, 'draft': {**draft, **patch}, 'credential': {'source': 'input', 'password': password}}
            status, body, _ = post(url, selected, cookie)
            assert status == 502 and json.loads(body)['error']['category'] == category
            assert password.encode() not in body
        timed = {**payload, 'draft': {**draft, 'port': cases['stall_port'], 'tls': {'enabled': False}},
                 'credential': {'source': 'input', 'password': password}}
        status, body, _ = post(url, timed, cookie)
        assert status == 504 and json.loads(body)['error']['category'] == 'timeout'
        before_retarget = len(stalled)
        for source in ['saved', 'session']:

            credential = {'source': source, 'profile_id': session_data['profile_id'], 'revision': 1}
            if source == 'session': credential['context'] = session_data['context']
            selected = {**payload, 'credential': credential}
            status, body, _ = post(url, selected, cookie)
            assert status == 200 and json.loads(body)['ok']
            assert post(url, {**selected, 'draft': {**draft, 'port': cases['stall_port']}}, cookie)[0] == 422
        assert len(stalled) == before_retarget, 'Edited draft must not send a saved/session credential to another target'
        master = base / 'keys/master.key'
        original_key = master.read_bytes()
        master.unlink()
        try:
            saved = {'source': 'saved', 'profile_id': session_data['profile_id'], 'revision': 1}
            status, body, _ = post(url, {**payload, 'credential': saved}, cookie)
            assert status == 503 and json.loads(body)['error']['category'] == 'storage'
            assert not master.exists()
            assert post(url, {**payload, 'credential': {'source': 'input', 'password': password}}, cookie)[0] == 200
        finally:
            descriptor = os.open(master, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
            with os.fdopen(descriptor, 'wb') as handle: handle.write(original_key)
        session_bytes = (base / 'sessions' / ('sess_' + session_data['session_id'])).read_bytes()
        assert b'unchanged-context-A' in session_bytes and password.encode() not in session_bytes
        assert (base / 'data/profiles.sqlite').read_bytes() == snapshot
        from profiles_http import check_profiles_http
        check_profiles_http(base, php_port, post, OPENER)
        print(run(['php', ROOT / 'test/local/contexts.php'], env=env).decode().strip(), flush=True)
        from context_http import check_context_http
        check_context_http(base, php_port, post, OPENER)
        # Optional manual browser QA keeps only this disposable fixture alive.
        if os.environ.get('XPM_UI_READY_FILE'):
            ready_file = Path(os.environ['XPM_UI_READY_FILE'])
            ready_file.write_text(json.dumps({'url': 'http://127.0.0.1:' + str(php_port) + '/local-connections.php',
                                              'cases': str(case_file)}))
            ready_file.chmod(0o600)
            print('Disposable browser QA ready; remove the ready file to finish cleanup.', flush=True)
            deadline = time.monotonic() + 1800
            while ready_file.exists() and time.monotonic() < deadline:
                time.sleep(.25)
            ready_file.unlink(missing_ok=True)
        php.terminate(); php.wait()
        # A new PHP web process must read the same durable profiles and saved credential.
        with sqlite3.connect(base / 'data/profiles.sqlite') as stored:
            expected_ids = {row[0] for row in stored.execute('SELECT id FROM profiles')}
        php = start(['php', '-d', 'openssl.cafile=' + cases['ca'], '-d', 'session.save_path=' + str(base / 'sessions'),
                     '-d', 'display_errors=0', '-d', 'log_errors=1', '-d', 'error_log=' + str(app_log),
                     '-S', '127.0.0.1:' + str(php_port), '-t', ROOT], base / 'php-restart.log', env)
        ready(php, php_port)
        origin = 'http://127.0.0.1:' + str(php_port)
        with OPENER.open(origin + '/local-connections.php') as response:
            page = response.read().decode()
            jar = SimpleCookie()
            for value in response.headers.get_all('Set-Cookie', []): jar.load(value)
        restart_cookie = '; '.join(key + '=' + value.value for key, value in jar.items())
        restart_token = re.search(r'data-token="([^"]+)"', page)[1]
        status, body, _ = post(origin + '/local-profiles.php', {'token': restart_token, 'action': 'list'}, restart_cookie)
        assert status == 200 and {profile['id'] for profile in json.loads(body)['profiles']} == expected_ids
        status, body, _ = post(origin + '/local-connect.php', {'token': restart_token, 'action': 'connect',
            'profile_id': session_data['profile_id'], 'revision': 1, 'credential': {'source': 'saved'}}, restart_cookie)
        assert status == 200 and json.loads(body)['target']['port'] == cases['mysql_port']
        restart_context = json.loads(body)['context']
        php.terminate(); php.wait()
        print('Web process restart: identical profile IDs and saved-password reconnect passed.', flush=True)
        # Feature flag off fails before session/credential/network work; no real installation state changed.
        config.write_text(json.dumps({'profiles_enabled': False, 'data_dir': str(base / 'data'), 'key_dir': str(base / 'keys')}))
        php = start(['php', '-S', '127.0.0.1:' + str(php_port), '-t', ROOT], base / 'php-disabled.log', env)
        ready(php, php_port)
        before_disabled = [(Path(item['folder']) / 'queries.log').read_bytes() for item in servers]
        try:
            OPENER.open(urllib.request.Request(origin + '/index.php?route=/sql&xpma_context=' + restart_context,
                                              headers={'Cookie': restart_cookie}))
            raise AssertionError('Disabled profile context must not fall back to configured server')
        except urllib.error.HTTPError as error:
            assert error.code == 409
        assert before_disabled == [(Path(item['folder']) / 'queries.log').read_bytes() for item in servers]
        assert post(url, {}, cookie)[0] == 404
        assert post(url.replace('local-connection-test.php', 'local-profiles.php'), {}, cookie)[0] == 404
        try:
            OPENER.open(url.replace('local-connection-test.php', 'local-connections.php'))
            raise AssertionError('Disabled connection UI must return 404')
        except urllib.error.HTTPError as error:
            assert error.code == 404
        php.terminate(); php.wait()
        for item in servers:
            state = run(item['admin'], data=b'SELECT COUNT(*),MIN(value) FROM fixture_allowed.sentinel;', env=item['env'])
            assert state.strip() == ('1\tunchanged-' + item['flavor']).encode()
            queries = (Path(item['folder']) / 'queries.log').read_text(errors='replace')
            writes = re.findall(r'\b(?:Query|Execute)\s+((?:INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER|TRUNCATE)\b[^\n]*)', queries, re.I)
            expected = ["INSERT INTO import_probe (marker) VALUES ('import_" + ('a' if item['flavor'] == 'mysql' else 'b') + "')"] if Path(item['folder']).name in ['mysql', 'mariadb'] else []
            assert [query.strip().rstrip(';') for query in writes] == expected, 'Only the explicitly allowed disposable import write may occur'
            assert password not in queries
        for name in ['application.log', 'php-server.log', 'php-restart.log', 'php-disabled.log']:
            if (base / name).exists(): assert password not in (base / name).read_text(errors='replace')
        for item in servers[:2]:
            version = run(item['admin'], data=b'SELECT VERSION();', env=item['env']).decode().strip()
            print('Verified disposable engine: ' + item['flavor'] + ' ' + version, flush=True)
        print('HTTP: CSRF/method/flag/spoof guards, draft/saved/session credentials, target binding, no profile writes passed.', flush=True)
        print('Remote sentinel rows unchanged; only two allowed disposable import INSERTs; no other DDL/DML or plaintext fixture password.', flush=True)
    finally:
        stall.close()
        for connection in stalled: connection.close()


if __name__ == '__main__':
    try:
        with tempfile.TemporaryDirectory(prefix='xpma-connection-') as directory:
            base = Path(directory).resolve(); base.chmod(0o700)
            try:
                main(base)
            finally:
                for process in reversed(PROCESSES):
                    if process.poll() is None: process.terminate()
                for process in reversed(PROCESSES):
                    try: process.wait(timeout=15)
                    except subprocess.TimeoutExpired: process.kill(); process.wait()
    except Exception:
        raise
