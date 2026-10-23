/* global CommonParams, jQuery, bootstrap */
'use strict';
(() => {
    if (window.xpmaTargetGuardLoaded) { return; }
    window.xpmaTargetGuardLoaded = true;
    let leaving = false;
    function positionTarget() {
        const menu = document.getElementById('floating_menubar');
        document.documentElement.style.setProperty('--xpma-menu-height', (menu ? menu.getBoundingClientRect().height : 0) + 'px');
    }
    window.addEventListener('load', positionTarget);
    window.addEventListener('resize', positionTarget);
    function edited() {
        return [...document.querySelectorAll('.CodeMirror')].some(node => {
            const editor = node.CodeMirror;
            return editor && !editor.isClean();
        }) || [...document.querySelectorAll('textarea[name="sql_query"],textarea[name="sql_query_edit"],#sqlquery')]
            .some(node => node.value !== node.defaultValue);
    }
    function confirmLeave(link) {
        let modal = document.getElementById('xpma-leave-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'xpma-leave-modal'; modal.className = 'modal fade'; modal.tabIndex = -1;
            modal.setAttribute('aria-labelledby', 'xpma-leave-title');
            modal.setAttribute('aria-describedby', 'xpma-leave-description');
            modal.innerHTML = '<div class="modal-dialog modal-dialog-centered"><div class="modal-content">'
                + '<div class="modal-header"><h2 class="modal-title fs-5" id="xpma-leave-title">Tinggalkan editor?</h2></div>'
                + '<div class="modal-body"><p id="xpma-leave-description">Query memiliki perubahan belum disimpan. Buka pengelola koneksi dan tinggalkan editor ini?</p></div>'
                + '<div class="modal-footer"><button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Tetap di editor</button>'
                + '<button type="button" class="btn btn-primary" data-xpma-leave>Buka Koneksi</button></div></div></div>';
            document.body.append(modal);
        }
        const instance = bootstrap.Modal.getOrCreateInstance(modal);
        modal.querySelector('[data-xpma-leave]').onclick = () => { leaving = true; window.location.assign(link.href); };
        modal.addEventListener('shown.bs.modal', () => { modal.querySelector('[data-bs-dismiss]').focus(); }, { once: true });
        modal.addEventListener('hidden.bs.modal', () => { link.focus(); }, { once: true });
        instance.show();
    }
    document.addEventListener('click', event => {
        const link = event.target.closest('[data-xpma-manage]');
        if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.button !== 0) { return; }
        if (edited()) {
            event.preventDefault(); event.stopImmediatePropagation(); confirmLeave(link);
        } else { leaving = true; }
    }, true);
    window.addEventListener('beforeunload', event => {
        if (!leaving && edited()) { event.preventDefault(); event.returnValue = ''; }
    });
    function revoked(xhr) {
        if (xhr.status !== 409 || xhr.responseJSON?.error?.category !== 'reconnect') { return; }
        const bar = document.getElementById('xpma-target');
        if (!bar) { return; }
        bar.classList.add('xpma-target-reconnect');
        const notice = bar.querySelector('[data-xpma-reconnect]');
        notice.hidden = false;
        notice.textContent = 'Target ini perlu dihubungkan kembali. Konteks telah kedaluwarsa, dicabut, atau profil berubah. Query Anda tetap di editor.';
        document.querySelectorAll('#page_content button[type="submit"],#page_content input[type="submit"]').forEach(button => { button.disabled = true; });
    }
    if (typeof jQuery !== 'undefined') {
        jQuery(document).ajaxError((_event, xhr) => revoked(xhr));
        jQuery(document).ajaxSuccess((_event, xhr) => {
            positionTarget();
            const params = xhr.responseJSON?.params;
            const target = params?.validated_target;
            const bar = document.getElementById('xpma-target');
            if (!bar || !target || params.xpma_context !== CommonParams.get('xpma_context')) { return; }
            bar.querySelector('[data-xpma-name]').textContent = target.name;
            bar.querySelector('[data-xpma-host]').textContent = target.host + ':' + target.port;
            bar.querySelector('[data-xpma-user]').textContent = target.username;
            const env = bar.querySelector('[data-xpma-env]');
            env.textContent = target.environment;
            env.className = 'xpma-env xpma-env-' + target.environment.toLowerCase();
        });
    }
})();
