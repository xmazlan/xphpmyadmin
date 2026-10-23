"""Disposable system-OpenSSH fixture; no real profile/key/database is used."""
import os
import pwd
from pathlib import Path
import socket
import subprocess
import tempfile
import time

ROOT = Path(__file__).resolve().parents[2]

def run(command, **kw):
    result = subprocess.run(list(map(str, command)), capture_output=True, timeout=45, **kw)
    if result.returncode:
        raise RuntimeError('Fixture failed: ' + Path(command[0]).name + '\n' + result.stderr.decode(errors='replace')[-2000:])
    return result.stdout

def main():
    with tempfile.TemporaryDirectory(prefix='xs-', dir='/tmp') as temp:
        base = Path(temp).resolve(); base.chmod(0o700)
        for name in ['data', 'keys']: (base / name).mkdir(mode=0o700)
        config = base / 'local.json'
        import json
        config.write_text(json.dumps({'profiles_enabled': True, 'data_dir': str(base/'data'), 'key_dir': str(base/'keys')})); config.chmod(0o600)
        for key in ['host', 'identity', 'untrusted']:
            run(['/usr/bin/ssh-keygen', '-q', '-t', 'ed25519', '-N', '', '-f', base/key])
        (base/'authorized').write_bytes((base/'identity.pub').read_bytes()); (base/'authorized').chmod(0o600)
        with socket.socket() as sock:
            sock.bind(('127.0.0.1', 0)); port = sock.getsockname()[1]
        user = pwd.getpwuid(os.geteuid()).pw_name
        conf = base/'sshd_config'
        conf.write_text(f'''Port {port}
ListenAddress 127.0.0.1
HostKey {base}/host
PidFile {base}/sshd.pid
AuthorizedKeysFile {base}/authorized
StrictModes no
PasswordAuthentication no
KbdInteractiveAuthentication no
UsePAM no
AllowUsers {user}
AllowTcpForwarding local
GatewayPorts no
PerSourcePenalties no
MaxStartups 100
LogLevel ERROR
''')
        log = open(base/'sshd.log','wb')
        daemon = subprocess.Popen(['/usr/sbin/sshd','-D','-e','-f',str(conf)], stdout=log, stderr=log)
        try:
            for _ in range(50):
                if daemon.poll() is not None:
                    print('SSH integration unavailable: ' + (base/'sshd.log').read_text()[-1000:]); return 2
                try:
                    with socket.create_connection(('127.0.0.1',port),.1): break
                except OSError: time.sleep(.1)
            env = {**os.environ, 'XPHPMYADMIN_LOCAL_CONFIG':str(config), 'XPM_SSH_PORT':str(port), 'XPM_SSH_KEY':str(base/'identity'), 'XPM_SSH_USER':user, 'XPM_SSH_UNTRUSTED_KEY':str(base/'untrusted')}
            print(run(['php', ROOT/'test/local/ssh.php'], env=env).decode(),end='')
            # Reuse the existing disposable database setup; every server has a new datadir/socket.
            import check_connections as database_fixture
            import secrets
            password = 'synthetic-' + secrets.token_hex(16)
            databases = []
            (base/'certs').mkdir(mode=0o700)
            certificates = {'ca': database_fixture.cert(base/'certs', 'ca')}
            certificates['server'] = database_fixture.cert(base/'certs', 'server', certificates['ca'])
            try:
                for flavor in ['mysql', 'mariadb']:
                    databases.append(database_fixture.server(base, flavor, flavor, 'server', certificates, password))
                cases = base / 'cases.json'
                cases.write_text(json.dumps({'ports':[item['port'] for item in databases], 'password':password, 'base':str(base), 'mysql_port':databases[0]['port'], 'mariadb_port':databases[1]['port'], 'ca':str(certificates['ca'][1])})); cases.chmod(0o600)
                print(run(['php', ROOT/'test/local/ssh_database.php', cases], env=env).decode(),end='')
                run(['php', ROOT/'scripts/local-key.php', 'init'], env=env)
                (base/'sessions').mkdir(mode=0o700)
                php_port = database_fixture.port()
                php = database_fixture.start(['php', '-d', 'openssl.cafile=' + str(certificates['ca'][1]), '-d', 'session.save_path=' + str(base/'sessions'), '-d', 'display_errors=0', '-d', 'log_errors=1', '-d', 'error_log=' + str(base/'application.log'), '-S', '127.0.0.1:' + str(php_port), '-t', ROOT], base/'php-http.log', env)
                database_fixture.ready(php, php_port)
                from ssh_http import check_ssh_http
                check_ssh_http(base, php_port, env, database_fixture)
                daemon.terminate(); daemon.wait(timeout=10)
                (base/'host').unlink(); (base/'host.pub').unlink()
                run(['/usr/bin/ssh-keygen', '-q', '-t', 'ed25519', '-N', '', '-f', base/'host'])
                daemon = subprocess.Popen(['/usr/sbin/sshd','-D','-e','-f',str(conf)], stdout=log, stderr=log)
                database_fixture.ready(daemon, port)
                print(run(['php', ROOT/'test/local/ssh_changed.php'], env=env).decode(),end='')
                import threading
                stall = socket.socket(); stall.bind(('127.0.0.1',0)); stall.listen()
                stalled = []
                def accept_stall():
                    try:
                        connection,_=stall.accept(); stalled.append(connection); time.sleep(13); connection.close()
                    except OSError: pass
                threading.Thread(target=accept_stall,daemon=True).start()
                try:
                    print(run(['php',ROOT/'test/local/ssh_timeout.php',str(stall.getsockname()[1])],env=env).decode(),end='')
                finally:
                    stall.close()
                    for connection in stalled: connection.close()
                from ssh_fpm import check_fpm
                check_fpm(base, env, database_fixture)
                # Encrypted identity: no interactive prompts, then a disposable agent.
                run(['/usr/bin/ssh-keygen','-q','-t','ed25519','-N','synthetic-passphrase','-f',base/'encrypted'])
                with (base/'authorized').open('ab') as authorized: authorized.write((base/'encrypted.pub').read_bytes())
                protected_env = {**env,'XPM_SSH_KEY':str(base/'encrypted')}
                protected_env.pop('SSH_AUTH_SOCK',None)
                print(run(['php',ROOT/'test/local/ssh_agent.php','missing'],env=protected_env).decode(),end='')
                agent = database_fixture.start(['/usr/bin/ssh-agent','-D','-a',base/'agent.sock'],base/'agent.log')
                try:
                    for _ in range(50):
                        if (base/'agent.sock').exists(): break
                        time.sleep(.02)
                    ask = base/'askpass'; ask.write_text('#!/bin/sh\nprintf synthetic-passphrase\n'); ask.chmod(0o700)
                    protected_env.update({'SSH_AUTH_SOCK':str(base/'agent.sock'),'SSH_ASKPASS':str(ask),'SSH_ASKPASS_REQUIRE':'force','DISPLAY':':fixture'})
                    run(['/usr/bin/ssh-add',base/'encrypted'],env=protected_env,stdin=subprocess.DEVNULL)
                    print(run(['php',ROOT/'test/local/ssh_agent.php','loaded'],env=protected_env).decode(),end='')
                    settings=json.loads(config.read_text()); settings['ssh_agent_socket']=str(base/'agent.sock'); config.write_text(json.dumps(settings))
                    private_env={**protected_env,'XPM_FPM_SSH_KEY':str(base/'encrypted')}; private_env.pop('SSH_AUTH_SOCK',None)
                    print(run(['php',ROOT/'test/local/ssh_agent.php','loaded'],env=private_env).decode(),end='')
                    check_fpm(base, private_env, database_fixture)
                    settings.pop('ssh_agent_socket'); config.write_text(json.dumps(settings))
                    print('App-private agent override: CLI and FPM use encrypted identity without SSH_AUTH_SOCK environment.',flush=True)
                finally: agent.terminate(); agent.wait(timeout=10)
                if os.environ.get('XPM_SSH_UI_READY_FILE'):
                    ready_file=Path(os.environ['XPM_SSH_UI_READY_FILE']); ready_file.write_text(json.dumps({'url':'http://127.0.0.1:'+str(php_port)+'/local-connections.php'})); ready_file.chmod(0o600)
                    print('Disposable SSH browser QA ready.',flush=True)
                    deadline=time.monotonic()+1800
                    while ready_file.exists() and time.monotonic()<deadline: time.sleep(.25)
                    ready_file.unlink(missing_ok=True)


            finally:
                for process in database_fixture.PROCESSES:
                    if process.poll() is None: process.terminate()
                for process in database_fixture.PROCESSES:
                    try: process.wait(timeout=15)
                    except subprocess.TimeoutExpired: process.kill(); process.wait()

        finally:
            daemon.terminate(); daemon.wait(timeout=10); log.close()
    return 0

if __name__ == '__main__': raise SystemExit(main())
