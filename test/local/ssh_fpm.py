"""Private Herd FPM pool and raw FastCGI, without changing Herd/site configuration."""
import json
import os
from pathlib import Path
import secrets
import socket
import struct
import subprocess
import time

ROOT = Path(__file__).resolve().parents[2]
FPM = Path.home()/'Library/Application Support/Herd/bin/php84-fpm'

def record(kind, data=b''):
    return struct.pack('!BBHHBB', 1, kind, 1, len(data), 0, 0) + data

def length(n): return bytes([n]) if n < 128 else struct.pack('!I', n | 0x80000000)

def request(port, script, step):
    params = {'SCRIPT_FILENAME':str(script), 'SCRIPT_NAME':'/probe.php', 'REQUEST_METHOD':'GET', 'QUERY_STRING':'step='+step,
              'REQUEST_URI':'/probe.php?step='+step, 'SERVER_PROTOCOL':'HTTP/1.1', 'GATEWAY_INTERFACE':'CGI/1.1',
              'SERVER_NAME':'localhost', 'SERVER_PORT':str(port), 'REMOTE_ADDR':'127.0.0.1', 'REDIRECT_STATUS':'200'}
    pairs = b''.join(length(len(k.encode()))+length(len(v.encode()))+k.encode()+v.encode() for k,v in params.items())
    with socket.create_connection(('127.0.0.1',port), 15) as connection:
        connection.sendall(record(1, struct.pack('!HB5x',1,0))+record(4,pairs)+record(4)+record(5))
        def read(n):
            data=b''
            while len(data)<n:
                part=connection.recv(n-len(data))
                if not part: raise RuntimeError('FastCGI fixture closed')
                data+=part
            return data
        output=b''
        while True:
            _, kind, _, size, padding, _ = struct.unpack('!BBHHBB',read(8))
            data=read(size); read(padding)
            if kind==6: output+=data
            if kind==3: break
    return json.loads(output.split(b'\r\n\r\n',1)[1])

def check_fpm(base, env, fixture):
    assert FPM.is_file(), 'Herd PHP 8.4 FPM required for this acceptance gate'
    folder=base/('fpm-'+secrets.token_hex(3)); folder.mkdir(mode=0o700)
    context=secrets.token_hex(32)
    script=folder/'probe.php'
    script.write_text('''<?php
require %s;
use PhpMyAdmin\\Local\\{ProfileDatabase,ProfileRepository,SshTunnels,ConnectionFailure};
header('Content-Type: application/json');
session_id('disposable-fpm-ssh'); session_start();
try {
$d=ProfileDatabase::openExistingConfigured(); $t=new SshTunnels($d);
$p=array_values(array_filter((new ProfileRepository($d))->list(),static function($p){return $p['method']==='ssh';}))[0];
$override=getenv('XPM_FPM_SSH_KEY'); if ($override) { $p['ssh']['key']=$override; }
$id=%s;
if ($_GET['step']==='start') { $e=$t->start($p,$id); }
elseif ($_GET['step']==='resolve') { $e=$t->resolve($p,$id); }
else { $t->close($id); $e=['port'=>0]; }
echo json_encode(['ok'=>true,'port'=>$e['port'],'sapi'=>PHP_SAPI]);
} catch (ConnectionFailure $e) { echo json_encode($e->response()); }
''' % (repr(str(ROOT/'vendor/autoload.php')), repr(context)))
    script.chmod(0o600)
    for disabled in [False, True]:
        port=fixture.port()
        conf=folder/('disabled.conf' if disabled else 'pool.conf')
        conf.write_text(f'''[global]
daemonize = no
error_log = {folder}/error.log
pid = {folder}/pid
[fixture]
listen = 127.0.0.1:{port}
pm = static
pm.max_children = 1
clear_env = yes
env[XPHPMYADMIN_LOCAL_CONFIG] = {env['XPHPMYADMIN_LOCAL_CONFIG']}
php_admin_value[session.save_path] = {base}/sessions
php_admin_value[display_errors] = Off
php_admin_value[log_errors] = On
''' + ('env[SSH_AUTH_SOCK] = ' + env['SSH_AUTH_SOCK'] + '\n' if env.get('SSH_AUTH_SOCK') else '') + ('env[XPM_FPM_SSH_KEY] = ' + env['XPM_FPM_SSH_KEY'] + '\n' if env.get('XPM_FPM_SSH_KEY') else '') + ('php_admin_value[disable_functions] = proc_open\n' if disabled else ''))
        conf.chmod(0o600)
        process=fixture.start([FPM,'-F','-y',conf],folder/'process.log',env)
        try:
            fixture.ready(process,port)
            result=request(port,script,'start')
            if disabled:
                assert not result['ok'] and result['error']['category']=='ssh_prerequisite', result
            else:
                assert result['ok'] and result['sapi']=='fpm-fcgi', result
                assert request(port,script,'resolve')['port']==result['port']
                assert request(port,script,'close')['ok']
        finally:
            process.terminate(); process.wait(timeout=10)
    assert not list((base/'data/ssh').glob('*.json'))
    print('Herd PHP 8.4 FPM: real SSH across requests, control-socket cleanup and disabled proc_open prerequisite passed.',flush=True)
