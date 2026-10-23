"""HTTP request isolation checks run against check_connections.py's disposable servers."""
import json
import urllib.parse
import urllib.request
import urllib.error


def check_context_http(base, php_port, post, opener):
    data = json.loads((base / 'http-contexts.json').read_text())
    cases = json.loads((base / 'cases.json').read_text())
    origin = 'http://127.0.0.1:' + str(php_port)
    cookie = data['cookie']

    def request(params, body=None, use_cookie=True, content_type=None):
        url = origin + '/index.php?' + urllib.parse.urlencode(params)
        encoded = body if isinstance(body, bytes) else (urllib.parse.urlencode(body).encode() if body is not None else None)
        headers = {'Cookie': cookie if use_cookie else ''}
        if content_type:
            headers['Content-Type'] = content_type
        try:
            with opener.open(urllib.request.Request(url, data=encoded, headers=headers), timeout=20) as response:
                return response.status, response.read()
        except urllib.error.HTTPError as error:
            return error.code, error.read()

    before_rejections = [(base / name / 'queries.log').read_bytes() for name in ['mysql', 'mariadb']]
    for params in [{'route': '/sql'}, {'route': '/sql', 'xpma_context': 'f' * 64},
                   {'route': '/export', 'xpma_context': 'bad'}, {'route': '/import'}]:
        assert request(params)[0] == 409, 'Missing/forged context must fail before legacy authentication'
    assert request({'route': '/', 'xpma_context': data['a']['context']}, use_cookie=False)[0] == 409
    assert request({'route': '/', 'xpma_context': data['a']['context']},
                   {'xpma_context': data['b']['context'], 'token': data['token']})[0] == 409
    assert before_rejections == [(base / name / 'queries.log').read_bytes() for name in ['mysql', 'mariadb']], 'Rejected capabilities must execute no remote query'
    for tab, port_key in [('a', 'mysql_port'), ('b', 'mariadb_port'), ('a', 'mysql_port'), ('b', 'mariadb_port')]:
        context = data[tab]['context']
        params = {'route': '/sql', 'xpma_context': context, 'db': 'fixture_allowed', 'table': 'sentinel'}
        status, body = request(params)
        assert status == 200 and ('unchanged-' + ('mysql' if tab == 'a' else 'mariadb')).encode() in body, ('browse failed', status, body[:200])
        assert context.encode() in body, 'Rendered navigation/forms must retain context'
        assert b'id="xpma-target"' in body and b'validated_target:{' in body
        assert b'Array to string conversion' not in body
        status, body = request({'route': '/import', 'xpma_context': context}, {
            'token': data['token'], 'db': 'fixture_allowed', 'sql_query': 'SELECT @@port AS target_port',
            'show_query': '1', 'is_js_confirmed': '1', 'ajax_request': '1'})
        assert status == 200 and str(cases[port_key]).encode() in body, ('SQL target failed', status, body[:200])
    for tab, port_key in [('a', 'mysql_port'), ('b', 'mariadb_port')]:
        context = data[tab]['context']
        status, body = request({'route': '/export', 'xpma_context': context}, {
            'token': data['token'], 'db': 'fixture_allowed', 'table': 'sentinel',
            'export_type': 'table', 'what': 'csv', 'allrows': '1', 'output_format': 'sendit',
            'quick_or_custom': 'quick', 'export_method': 'quick', 'filename_template': 'fixture', 'csv_structure_or_data': 'data',
            'compression': '', 'charset': 'utf-8', 'csv_separator': ',', 'csv_enclosed': '"',
            'csv_escaped': '"', 'csv_terminated': '\\n', 'csv_null': 'NULL'})
        assert status == 200 and ('unchanged-' + ('mysql' if tab == 'a' else 'mariadb')).encode() in body and b'<html' not in body, ('export failed', status, body[:300])
        boundary = 'xpma-disposable-import-boundary'
        fields = {'token': data['token'], 'db': 'fixture_allowed', 'import_type': 'database',
                  'format': 'sql', 'charset_of_file': 'utf-8', 'ajax_request': '1'}
        parts = []
        for key, value in fields.items():
            parts.append('--' + boundary + '\r\nContent-Disposition: form-data; name="' + key + '"\r\n\r\n' + value + '\r\n')
        parts.append('--' + boundary + '\r\nContent-Disposition: form-data; name="import_file"; filename="fixture.sql"\r\nContent-Type: application/sql\r\n\r\nSELECT @@port AS imported_target;\r\n')
        parts.append('--' + boundary + '--\r\n')
        status, body = request({'route': '/import', 'xpma_context': context}, ''.join(parts).encode(),
                               content_type='multipart/form-data; boundary=' + boundary)
        assert status == 200 and str(cases[port_key]).encode() in body, ('file import failed', status, body[:300])
        insert = "INSERT INTO import_probe (marker) VALUES ('import_" + tab + "');"
        upload = ''.join(parts).replace('SELECT @@port AS imported_target;', insert).encode()
        status, body = request({'route': '/import', 'xpma_context': context}, upload,
                               content_type='multipart/form-data; boundary=' + boundary)
        assert status == 200 and json.loads(body)['success'], ('disposable import write failed', status)
        status, body = request({'route': '/import', 'xpma_context': context}, {
            'token': data['token'], 'db': 'fixture_allowed', 'sql_query': 'SELECT marker FROM import_probe', 'ajax_request': '1'})
        assert status == 200 and ('import_' + tab).encode() in body
        assert ('import_' + ('b' if tab == 'a' else 'a')).encode() not in body, 'Import write must remain on the intended server'

    assert request({'route': '/import', 'xpma_context': data['a']['context']},
                   {'token': 'bad', 'sql_query': 'SELECT 1'})[0] == 403
    endpoint = origin + '/local-connect.php'
    connect = {'token': data['token'], 'action': 'connect', 'profile_id': data['b_profile'], 'revision': 1,
               'credential': {'source': 'input', 'password': cases['password']}}
    status, body, _ = post(endpoint, {**connect, 'credential': {'source': 'input', 'password': 'wrong-synthetic'}}, cookie)
    assert status == 502 and json.loads(body)['error']['category'] == 'authentication'
    assert request({'route': '/', 'xpma_context': data['a']['context']})[0] == 200
    status, body, _ = post(endpoint, connect, cookie)
    assert status == 200 and json.loads(body)['target']['port'] == cases['mariadb_port']
    switched = json.loads(body)['context']
    assert switched != data['b']['context']
    assert request({'route': '/', 'xpma_context': data['b']['context']})[0] == 200
    status, body, _ = post(endpoint, {**connect, 'credential': {'source': 'session', 'context': switched}}, cookie)
    assert status == 200 and json.loads(body)['context'] != switched
    assert cases['password'].encode() not in body
    status, body, _ = post(endpoint, {**connect, 'profile_id': data['profile_id'],
                                      'credential': {'source': 'saved'}}, cookie)
    assert status == 200 and json.loads(body)['target']['port'] == cases['mysql_port']
    disconnect_token = json.loads(body)['context']
    profiles = origin + '/local-profiles.php'
    status, body, _ = post(profiles, {'token': data['token'], 'action': 'update', 'id': data['b_profile'],
                                    'revision': 1, 'draft': {'port': cases['mysql_port']}}, cookie)
    assert status == 200 and json.loads(body)['profile']['connection_revision'] == 2
    assert request({'route': '/', 'xpma_context': data['b']['context']})[0] == 409
    assert request({'route': '/', 'xpma_context': switched})[0] == 409
    assert request({'route': '/', 'xpma_context': data['a']['context']})[0] == 200
    status, body, _ = post(endpoint, {**connect, 'revision': 2}, cookie)
    assert status == 200 and json.loads(body)['target']['port'] == cases['mysql_port']
    revised = json.loads(body)['context']
    before_delete = [(base / name / 'queries.log').read_bytes() for name in ['mysql', 'mariadb']]
    assert post(profiles, {'token': data['token'], 'action': 'delete', 'id': data['b_profile'], 'revision': 2}, cookie)[0] == 200
    assert request({'route': '/', 'xpma_context': revised})[0] == 409
    assert before_delete == [(base / name / 'queries.log').read_bytes() for name in ['mysql', 'mariadb']], 'Delete/revocation must issue no remote SQL'
    # A duplicate is the same capability. Disconnect it and both copies must reconnect.
    endpoint = origin + '/local-connect.php'
    assert post(endpoint, {'token': 'bad', 'action': 'logout'}, cookie)[0] == 403
    status, body, _ = post(endpoint, {'token': data['token'], 'action': 'disconnect', 'context': disconnect_token}, cookie)
    assert status == 200 and json.loads(body)['ok']
    assert request({'route': '/', 'xpma_context': disconnect_token})[0] == 409
    assert request({'route': '/', 'xpma_context': disconnect_token})[0] == 409
    assert request({'route': '/', 'xpma_context': data['a']['context']})[0] == 200
    assert post(endpoint, {'token': data['token'], 'action': 'logout'}, cookie)[0] == 200
    assert request({'route': '/', 'xpma_context': data['a']['context']})[0] == 409
    print('HTTP context isolation: missing/forged/cross-session, A/B browse/SQL/file import/export, connect/reconnect/failure, edit/delete revocation without remote SQL, duplicate revocation, disconnect and logout passed.', flush=True)
