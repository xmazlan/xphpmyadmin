"""Reuse administration sentinel gates with simultaneous direct A and SSH B."""
import json
import re
from http.cookies import SimpleCookie


def check_ssh_http(base, php_port, env, fixture):
    origin = 'http://127.0.0.1:' + str(php_port)
    with fixture.OPENER.open(origin + '/local-connections.php') as response:
        page = response.read().decode()
        jar = SimpleCookie()
        for value in response.headers.get_all('Set-Cookie', []): jar.load(value)
    cookie = '; '.join(k + '=' + v.value for k, v in jar.items())
    token = re.search(r'data-token="([^"]+)"', page)[1]
    cases = json.loads((base / 'cases.json').read_text())
    def post(endpoint, data):
        status, body, _ = fixture.post(origin + '/' + endpoint, {'token': token, **data}, cookie)
        assert status == 200, (endpoint, status, json.loads(body).get('error', {}).get('category'))
        return json.loads(body)
    direct = {'name':'direct A', 'host':'127.0.0.1', 'port':cases['mysql_port'], 'username':'xpma_fixture',
              'database':'fixture_allowed', 'tls':{'enabled':True, 'ca':cases['ca']}}
    ssh = {**direct, 'name':'SSH B', 'port':cases['mariadb_port'], 'tls':{'enabled':False}, 'method':'ssh',
           'ssh':{'host':'127.0.0.1', 'port':int(env['XPM_SSH_PORT']), 'username':env['XPM_SSH_USER'], 'key':env['XPM_SSH_KEY']}}
    a = post('local-profiles.php', {'action':'create', 'draft':direct, 'password':{'action':'replace','password':cases['password']}})['profile']
    b = post('local-profiles.php', {'action':'create', 'draft':ssh})['profile']
    # All new trust operations must be POST + session + CSRF and reject stale revisions.
    trust = {'action':'ssh_inspect', 'id':b['id'], 'revision':1}
    endpoint = origin + '/local-profiles.php'
    assert fixture.post(endpoint, trust, cookie)[0] == 403
    assert fixture.post(endpoint, {'token':token, **trust}, cookie, method='GET')[0] == 405
    assert fixture.post(endpoint, {'token':token, **trust, 'revision':99}, cookie)[0] == 409
    candidate = post('local-profiles.php', trust)['candidate']
    assert candidate['status'] == 'trusted'
    assert fixture.post(endpoint, {'token':token, 'action':'ssh_approve', 'id':b['id'], 'revision':1,
                                    'nonce':'stale','replace':False}, cookie)[0] == 409
    credential = {'source':'input','password':cases['password']}
    contexts = [post('local-connect.php', {'action':'connect','profile_id':p['id'],'revision':1,'credential':credential}) for p in [a,b]]
    assert contexts[1]['target']['method'] == 'ssh' and contexts[1]['target']['port'] == cases['mariadb_port']
    (base/'http-contexts.json').write_text(json.dumps({'cookie':cookie, 'token':token, 'a':contexts[0], 'b':contexts[1], 'b_profile':b['id'], 'profile_id':a['id']}))
    from context_http import check_context_http
    check_context_http(base, php_port, fixture.post, fixture.OPENER)
    assert not list((base/'data/ssh').glob('*.json'))
    for path in [base/'php-http.log', base/'application.log']:
        if path.exists(): assert cases['password'].encode() not in path.read_bytes()
    print('SSH HTTP: direct A / SSH B browse, SQL, AJAX, export, file import and probe writes; trust CSRF/revisions and logout cleanup passed.', flush=True)
