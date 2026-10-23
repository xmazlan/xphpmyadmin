"""Local profile UI HTTP adapter checks; all state is disposable."""
import json
import re
import urllib.request
from http.cookies import SimpleCookie


def check_profiles_http(base, php_port, post, opener):
    origin = 'http://127.0.0.1:' + str(php_port)
    with opener.open(origin + '/local-connections.php') as response:
        page = response.read().decode()
        cookies = SimpleCookie()
        for value in response.headers.get_all('Set-Cookie', []): cookies.load(value)
    cookie = '; '.join(key + '=' + value.value for key, value in cookies.items())
    token = re.search(r'data-token="([^"]+)"', page)[1]
    assert 'Memuat profil' in page and 'keep' in page and 'type="password"' in page
    assert 'Simpan / ganti password terenkripsi' in page
    before_resources = [(base / name / 'queries.log').read_bytes() for name in ['mysql', 'mariadb']]
    with opener.open(origin + '/js/messages.php?l=en') as response:
        assert response.status == 200 and response.read().startswith(b'var Messages = ')
    with opener.open(origin + '/index.php') as response:
        assert response.status == 200 and '/local-connections.php' in response.url
    assert before_resources == [(base / name / 'queries.log').read_bytes() for name in ['mysql', 'mariadb']], 'Connection page and translation JS must never query remote servers'

    endpoint = origin + '/local-profiles.php'
    def action(payload):
        status, body, headers = post(endpoint, {'token': token, **payload}, cookie)
        assert headers['Cache-Control'] == 'no-store'
        return status, json.loads(body)
    assert post(endpoint, {'action': 'list'}, cookie)[0] == 403
    assert post(endpoint, {'token': token, 'action': 'list'})[0] == 403
    assert post(endpoint, {}, cookie, method='GET')[0] == 405
    assert post(endpoint, {'token': token, 'action': 'list'}, cookie, {'X-Forwarded-For': '127.0.0.1'})[0] == 403
    assert action({'action': 'list', 'favorites': 'false'})[0] == 422
    draft = {'name': '<UI offline fixture>', 'host': 'offline-xpma.invalid', 'port': 3306,
             'username': 'ui_fixture', 'environment': 'Production', 'tls': {'enabled': True}}
    status, data = action({'action': 'create', 'draft': draft})
    assert status == 200
    profile = data['profile']; pid = profile['id']
    assert profile['last_used_at'] is None and not profile['has_saved_password']
    for search in ['<UI offline', 'offline-xpma', 'ui_fixture']:
        status, data = action({'action': 'list', 'search': search})
        assert status == 200 and any(p['id'] == pid for p in data['profiles'])
    assert action({'action': 'favorite', 'id': pid, 'favorite': True})[0] == 200
    status, data = action({'action': 'list', 'favorites': True})
    assert any(p['id'] == pid for p in data['profiles'])
    canary = 'synthetic-ui-password-fixture'
    status, data = action({'action': 'update', 'id': pid, 'revision': 1, 'draft': {'name': 'UI updated fixture'},
                           'password': {'action': 'replace', 'password': canary}})
    assert status == 200 and data['profile']['has_saved_password'] and canary not in json.dumps(data)
    status, data = action({'action': 'list', 'search': 'UI updated fixture'})
    assert data['profiles'][0]['name'] == 'UI updated fixture' and canary not in json.dumps(data)
    assert data['profiles'][0]['session_context'] is None
    assert action({'action': 'update', 'id': pid, 'revision': 1, 'draft': {}, 'password': {'action': 'remove'}})[1]['profile']['has_saved_password'] is False
    status, data = action({'action': 'update', 'id': pid, 'revision': 1, 'draft': {'port': 3307}})
    assert status == 200 and data['profile']['connection_revision'] == 2
    assert action({'action': 'delete', 'id': pid, 'revision': 1})[0] == 409
    assert action({'action': 'delete', 'id': pid, 'revision': 2})[0] == 200
    assert action({'action': 'list', 'search': 'UI updated fixture'})[1]['profiles'] == []
    assert canary.encode() not in (base / 'data/profiles.sqlite').read_bytes()
    print('Profile UI HTTP: offline CRUD, CSRF/local/method guards, search, favorites, reload, encrypted password replace/remove, revision conflicts, safe read payloads passed.', flush=True)
