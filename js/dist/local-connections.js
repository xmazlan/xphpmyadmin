/* global bootstrap */
'use strict';
(() => {
    const $ = id => document.getElementById(id);
    const form = $('profile-form');
    const drawerElement = $('profile-drawer');
    const drawer = new bootstrap.Offcanvas(drawerElement);
    const deleteElement = $('delete-modal');
    const deleteModal = new bootstrap.Modal(deleteElement);
    const csrf = document.body.dataset.token;
    let candidate = null;
    let items = [];
    let selected = null;
    let deleting = null;
    let baseline = '';
    let working = false;
    let returnFocus = null;
    let deleteFocus = null;
    let listGeneration = 0;
    let searchTimer;
    const nullable = value => value.trim() || null;

    function message(element, text, kind = 'info') {
        element.className = text ? 'alert alert-' + kind : '';
        element.textContent = text;
    }
    async function api(endpoint, payload) {
        const response = await fetch(endpoint, {
            method: 'POST', credentials: 'same-origin', cache: 'no-store',
            headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token: csrf, ...payload })
        });
        let data;
        try { data = await response.json(); } catch (_) { throw new Error('Respons layanan tidak tersedia. Periksa penyimpanan lokal lalu coba lagi.'); }
        if (data.diagnostics) { showDiagnostics(data.diagnostics); }
        if (!response.ok || !data.ok) {
            throw new Error(data.error?.message || 'Aksi gagal. Periksa koneksi dan coba lagi.');
        }
        return data;
    }
    function showDiagnostics(rows) {
        $('connection-diagnostics').replaceChildren();
        for (const row of rows) {
            const item = document.createElement('li');
            item.textContent = row.stage + ': ' + row.status + ' · ' + row.duration_ms + ' ms · ' + row.code;
            $('connection-diagnostics').append(item);
        }
    }
    function draft() {
        return {
            method: $('connection-method').value,
            ssh: $('connection-method').value === 'ssh' ? { host: $('ssh-host').value.trim(), port: Number($('ssh-port').value), username: $('ssh-username').value.trim(), key: $('ssh-key').value.trim() } : null,
            name: form.elements.name.value.trim(), host: form.elements.host.value.trim(),
            port: Number(form.elements.port.value), username: form.elements.username.value.trim(),
            database: nullable(form.elements.database.value), environment: form.elements.environment.value,
            favorite: form.elements.favorite.checked,
            tls: { enabled: $('tls-enabled').checked, verify: true,
                ca: nullable($('tls-ca').value), cert: nullable($('tls-cert').value), key: nullable($('tls-key').value) }
        };
    }
    function snapshot() {
        return JSON.stringify({ draft: draft(), action: $('password-action').value,
            password: $('password-action').value === 'replace' ? $('profile-password').value : null });
    }
    const dirty = () => snapshot() !== baseline;
    function update() {
        $('ssh-fields').hidden = $('connection-method').value !== 'ssh';
        $('ssh-inspect').disabled = working || !selected || dirty();
        $('tls-files').hidden = !$('tls-enabled').checked;
        const needsSave = !selected || dirty();
        $('connect-profile').disabled = working || needsSave;
        $('dirty-note').textContent = needsSave ? 'Simpan perubahan sebelum Hubungkan.' : 'Profil tersimpan. Hubungkan akan membuka target ini di tab ini.';
    }
    async function task(fn, notice = $('drawer-notice')) {
        if (working) { return; }
        working = true;
        const controls = [...document.querySelectorAll('button, input, select')];
        const disabled = controls.map(control => control.disabled);
        controls.forEach(control => { control.disabled = true; });
        message(notice, 'Memproses…');
        try { await fn(); }
        catch (error) { message(notice, error.message, 'danger'); }
        finally {
            working = false;
            controls.forEach((control, index) => { control.disabled = disabled[index]; });
            update();
        }
    }
    function button(text, className, action, label) {
        const result = document.createElement('button');
        result.type = 'button'; result.className = 'btn ' + className; result.textContent = text;
        if (label) { result.setAttribute('aria-label', label); }
        result.addEventListener('click', action);
        return result;
    }
    function cell(row, content, className = '') {
        const td = document.createElement('td'); td.className = className;
        if (typeof content === 'string') { td.textContent = content; } else { td.append(content); }
        row.append(td); return td;
    }
    function render() {
        $('profiles').replaceChildren();
        for (const profile of items) {
            const row = document.createElement('tr');
            const star = button(profile.favorite ? '★' : '☆', 'btn-outline-secondary xpma-star', () => task(async () => {
                await api('local-profiles.php', { action: 'favorite', id: profile.id, favorite: !profile.favorite });
                message($('notice'), 'Favorit diperbarui.', 'success'); await load();
            }, $('notice')), (profile.favorite ? 'Hapus favorit ' : 'Tandai favorit ') + profile.name);
            star.setAttribute('aria-pressed', String(profile.favorite));
            cell(row, star);
            const name = document.createElement('div');
            const title = document.createElement('span'); title.className = 'xpma-profile-name'; title.textContent = profile.name;
            const env = document.createElement('span'); env.className = 'xpma-env xpma-env-' + profile.environment.toLowerCase(); env.textContent = profile.environment;
            name.append(title, env); cell(row, name);
            cell(row, (profile.method === 'ssh' ? 'SSH · ' : 'Direct / VPN · ') + profile.host + ':' + profile.port, 'xpma-host');
            cell(row, profile.username);
            const used = profile.last_used_at ? new Date(profile.last_used_at).toLocaleString('id-ID') : 'Belum digunakan';
            cell(row, used);
            const actions = document.createElement('div'); actions.className = 'xpma-actions';
            actions.append(button('Hubungkan', 'btn-primary btn-sm', event => {
                returnFocus = event.currentTarget;
                if (profile.has_saved_password || profile.session_context) {
                    task(() => connect(profile), $('notice'));
                } else {
                    open(profile, event.currentTarget);
                    message($('drawer-notice'), 'Masukkan password, atau pilih input kosong untuk akun tanpa password.');
                    $('use-password').checked = true;
                }
            }, 'Hubungkan ' + profile.name));
            actions.append(button('Edit', 'btn-outline-secondary btn-sm', event => open(profile, event.currentTarget), 'Edit ' + profile.name));
            actions.append(button('Hapus', 'btn-outline-danger btn-sm', event => {
                deleting = profile; deleteFocus = event.currentTarget;
                $('delete-description').textContent = 'Hapus “' + profile.name + '” (' + profile.host + ':' + profile.port + ')?';
                message($('delete-notice'), ''); deleteModal.show();
            }, 'Hapus ' + profile.name));
            cell(row, actions); $('profiles').append(row);
        }
        $('profile-table').hidden = items.length === 0;
        $('list-state').hidden = items.length > 0;
        if (items.length === 0) {
            const filtered = $('search').value || $('favorites').checked;
            $('list-state').replaceChildren();
            const title = document.createElement('strong'); title.textContent = filtered ? 'Tidak ada profil yang cocok' : 'Belum ada koneksi';
            const text = document.createElement('p'); text.textContent = filtered ? 'Ubah pencarian atau nonaktifkan filter favorit.' : 'Tambahkan profil pertama. Profil dapat disimpan meskipun server offline.';
            $('list-state').append(title, text);
            if (!filtered) { $('list-state').append(button('Tambah koneksi', 'btn-primary', event => open(null, event.currentTarget))); }
        }
    }
    async function load() {
        const generation = ++listGeneration;
        $('list-state').hidden = false; $('list-state').textContent = 'Memuat profil koneksi…';
        $('profile-table').hidden = true;
        try {
            const data = await api('local-profiles.php', { action: 'list', search: $('search').value,
                favorites: $('favorites').checked, order: $('sort').value });
            if (generation !== listGeneration) { return; }
            items = data.profiles; render();
        } catch (error) {
            if (generation !== listGeneration) { return; }
            $('list-state').textContent = error.message + ' Gunakan Muat ulang untuk mencoba lagi.';
        }
    }
    function open(profile, trigger) {
        if (working) { return; }
        selected = profile; returnFocus = trigger; form.reset();
        $('drawer-title').textContent = profile ? 'Edit koneksi' : 'Tambah koneksi';
        if (profile) {
            for (const name of ['name', 'host', 'port', 'username', 'database', 'environment']) {
                form.elements[name].value = profile[name] ?? '';
            }
            form.elements.favorite.checked = profile.favorite;
            $('tls-enabled').checked = profile.tls.enabled;
            for (const name of ['ca', 'cert', 'key']) { $('tls-' + name).value = profile.tls[name] ?? ''; }
        }
        $('connection-method').value = profile?.method || 'direct';
        for (const name of ['host', 'port', 'username', 'key']) { $('ssh-' + name).value = profile?.ssh?.[name] ?? (name === 'port' ? 22 : ''); }
        candidate = null; $('ssh-approve').hidden = true; $('ssh-trust').textContent = ''; showDiagnostics([]);
        $('password-status').textContent = profile?.has_saved_password ? 'Password terenkripsi tersimpan. Nilainya tidak ditampilkan.' : 'Belum ada password tersimpan.';
        $('password-action').options[0].textContent = profile?.has_saved_password ? 'Pertahankan password tersimpan (keep)' : 'Jangan simpan password';
        $('password-action').value = 'keep';
        $('profile-password').value = ''; $('use-password').checked = false;
        message($('drawer-notice'), ''); baseline = snapshot(); update(); drawer.show();
    }
    function close() {
        if (working) { return; }
        if (dirty() && !window.confirm('Perubahan profil belum disimpan. Tutup dan buang perubahan?')) { return; }
        baseline = snapshot(); drawer.hide();
    }
    function sameTarget(profile) {
        const current = draft();
        return ['host', 'port', 'username', 'database', 'tls', 'method', 'ssh'].every(key => JSON.stringify(current[key]) === JSON.stringify(profile[key]));
    }
    function credential(profile, forTest = false) {
        if ($('use-password').checked || $('profile-password').value !== '' || $('password-action').value === 'replace') {
            return { source: 'input', password: $('profile-password').value };
        }
        if (!profile || (forTest && !sameTarget(profile))) {
            throw new Error('Masukkan password untuk target ini. Password profil lain tidak akan dipakai untuk draft yang berubah.');
        }
        if (profile.session_context) {
            return forTest ? { source: 'session', profile_id: profile.id, revision: profile.connection_revision, context: profile.session_context }
                : { source: 'session', context: profile.session_context };
        }
        if (profile.has_saved_password) {
            return forTest ? { source: 'saved', profile_id: profile.id, revision: profile.connection_revision } : { source: 'saved' };
        }
        throw new Error('Password belum tersedia. Masukkan password atau pilih input kosong, lalu coba lagi.');
    }
    async function connect(profile, fromDrawer = false) {
        let auth;
        if (fromDrawer) { auth = credential(profile); }
        else { auth = profile.session_context ? { source: 'session', context: profile.session_context } : { source: 'saved' }; }
        const data = await api('local-connect.php', { action: 'connect', profile_id: profile.id,
            revision: profile.connection_revision, credential: auth });
        baseline = snapshot(); window.location.assign(data.url);
    }
    $('ssh-inspect').addEventListener('click', () => task(async () => {
        if (!selected || dirty()) { throw new Error('Simpan profil terlebih dahulu.'); }
        const result = await api('local-profiles.php', { action: 'ssh_inspect', id: selected.id, revision: selected.connection_revision });
        candidate = result.candidate;
        $('ssh-trust').textContent = candidate.host + ':' + candidate.port + ' · ' + candidate.algorithm + ' · ' + candidate.status + '\nFingerprint baru: ' + candidate.fingerprint + '\nFingerprint lama: ' + (candidate.old_fingerprint || 'belum ada') + '\nVerifikasi melalui sumber terpisah sebelum menyetujui.';
        $('ssh-approve').textContent = candidate.status === 'changed' ? 'Ganti trust dengan fingerprint baru yang telah diverifikasi' : 'Percayai fingerprint yang telah diverifikasi';
        $('ssh-approve').hidden = candidate.status === 'trusted';
        message($('drawer-notice'), 'Pemeriksaan key tidak melakukan login MySQL.');
    }));
    $('ssh-approve').addEventListener('click', () => task(async () => {
        if (!candidate || !selected || dirty()) { throw new Error('Periksa ulang host key profil tersimpan.'); }
        await api('local-profiles.php', { action: 'ssh_approve', id: selected.id, revision: selected.connection_revision, nonce: candidate.nonce, replace: candidate.status === 'changed' });
        candidate = null; $('ssh-approve').hidden = true;
        message($('drawer-notice'), 'Host key dipercaya. Konteks lama dicabut; hubungkan kembali.', 'success');
        await load();
        selected = items.find(profile => profile.id === selected.id) || selected;
    }));
    $('add-profile').addEventListener('click', event => open(null, event.currentTarget));
    $('close-drawer').addEventListener('click', close);
    drawerElement.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); close(); } });
    drawerElement.addEventListener('shown.bs.offcanvas', () => { $('profile-name').focus(); });
    drawerElement.addEventListener('hidden.bs.offcanvas', () => { $('profile-password').value = ''; returnFocus?.isConnected ? returnFocus.focus() : $('add-profile').focus(); });
    deleteElement.addEventListener('hidden.bs.modal', () => { deleteFocus?.isConnected ? deleteFocus.focus() : $('add-profile').focus(); });
    deleteElement.addEventListener('shown.bs.modal', () => { deleteElement.querySelector('.modal-footer [data-bs-dismiss]').focus(); });
    form.addEventListener('input', update); form.addEventListener('change', update);
    $('profile-password').addEventListener('input', () => { $('use-password').checked = true; });
    $('password-action').addEventListener('change', () => { if ($('password-action').value === 'replace') { $('use-password').checked = true; $('profile-password').focus(); } });
    form.addEventListener('submit', event => {
        event.preventDefault(); if (!form.reportValidity()) { return; }
        task(async () => {
            const action = $('password-action').value;
            const password = action === 'replace' ? { action, password: $('profile-password').value } : { action };
            const payload = { action: selected ? 'update' : 'create', draft: draft(), password };
            if (selected) { payload.id = selected.id; payload.revision = selected.connection_revision; }
            const data = await api('local-profiles.php', payload);
            selected = data.profile;
            $('drawer-title').textContent = 'Edit koneksi';
            $('password-status').textContent = selected.has_saved_password ? 'Password terenkripsi tersimpan.' : 'Belum ada password tersimpan.';
            $('password-action').options[0].textContent = selected.has_saved_password ? 'Pertahankan password tersimpan (keep)' : 'Jangan simpan password';
            $('password-action').value = 'keep';
            if (action === 'replace') { $('profile-password').value = ''; $('use-password').checked = false; }
            baseline = snapshot();
            message($('drawer-notice'), 'Profil disimpan. Anda dapat menutup drawer atau memilih Hubungkan.', 'success');
            await load();
            selected = items.find(profile => profile.id === selected.id) || selected;
        });
    });
    $('test-profile').addEventListener('click', () => {
        if (!form.reportValidity()) { return; }
        task(async () => {
            const result = await api('local-connection-test.php', { draft: draft(), credential: credential(selected, true) });
            message($('drawer-notice'), 'Tes koneksi berhasil. ' + (result.tls ? 'TLS terverifikasi.' : 'Tanpa TLS sesuai pilihan.') + ' Profil dan target aktif tidak berubah.', 'success');
        });
    });
    $('connect-profile').addEventListener('click', () => {
        if (!selected || dirty()) { message($('drawer-notice'), 'Simpan perubahan sebelum Hubungkan.', 'warning'); return; }
        task(() => connect(selected, true));
    });
    $('confirm-delete').addEventListener('click', () => task(async () => {
        await api('local-profiles.php', { action: 'delete', id: deleting.id, revision: deleting.connection_revision });
        deleteModal.hide(); message($('notice'), 'Profil “' + deleting.name + '” dihapus dari penyimpanan lokal. Database server tidak dihapus.', 'success');
        await load();
    }, $('delete-notice')));
    $('reload').addEventListener('click', load);
    $('search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(load, 200); });
    $('favorites').addEventListener('change', load); $('sort').addEventListener('change', load);
    $('disconnect')?.addEventListener('click', () => task(async () => {
        await api('local-connect.php', { action: 'disconnect', context: document.body.dataset.context });
        window.location.assign('local-connections.php?xpma_context=' + encodeURIComponent(document.body.dataset.context));
    }, $('notice')));
    $('logout').addEventListener('click', () => {
        if (!window.confirm('Logout akan memutus seluruh konteks sesi, termasuk tab lain. Lanjutkan?')) { return; }
        task(async () => { await api('local-connect.php', { action: 'logout' }); baseline = snapshot(); window.location.assign('local-connections.php'); }, $('notice'));
    });
    window.addEventListener('beforeunload', event => {
        if (drawerElement.classList.contains('show') && dirty()) { event.preventDefault(); event.returnValue = ''; }
    });
    baseline = snapshot(); load();
})();
