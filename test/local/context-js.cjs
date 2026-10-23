'use strict';

// Exercise the actual shipped prefilter without loading unrelated DOM plugins.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
for (const file of ['js/src/functions.js', 'js/dist/functions.js']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const start = source.indexOf('$.ajaxPrefilter(');
    const end = source.indexOf('\n});', start) + 4;
    let prefilter;
    let context = 'a'.repeat(64);
    vm.runInNewContext(source.slice(start, end), {
        URL,
        window: { location: { href: 'https://fixture.test/index.php?route=/' } },
        CommonParams: { get: key => key === 'xpma_context' ? context : 'csrf' },
        $: { ajaxPrefilter: fn => { prefilter = fn; }, extend: Object.assign }
    });
    function filter(url) {
        const options = { url, data: '' };
        prefilter(options, options);
        return new URL(options.url, 'https://fixture.test/index.php');
    }
    assert.equal(filter('index.php?route=/sql').searchParams.get('xpma_context'), context);
    assert.equal(filter('/index.php?route=/navigation').searchParams.get('xpma_context'), context);
    assert.equal(filter('https://external.test/index.php').searchParams.get('xpma_context'), null);
    assert.equal(filter('/another/index.php').searchParams.get('xpma_context'), null);
    assert.equal(filter('index.php?xpma_context=explicit').searchParams.get('xpma_context'), 'explicit');
    context = null;
    assert.equal(filter('index.php?route=/sql').searchParams.get('xpma_context'), null);
}
console.log('12 AJAX context propagation checks passed for source and shipped JavaScript.');

// Run AJAX's real body-cleanup chain: persistent target controls must survive.
for (const file of ['js/src/ajax.js', 'js/dist/ajax.js']) {
    const source = fs.readFileSync(path.join(root, file), 'utf8');
    const start = source.indexOf("$('body').children()");
    const end = source.indexOf('.remove();', start) + '.remove();'.length;
    const nodes = ['#xpma-target', '#page_content', '#floating_menubar', '#pma_navigation', '#temporary-notice'];
    let remaining = [...nodes];
    let candidates = [...nodes];
    const chain = {
        children() { return this; },
        not(selector) { candidates = candidates.filter(node => node !== selector); return this; },
        remove() { remaining = remaining.filter(node => !candidates.includes(node)); }
    };
    vm.runInNewContext(source.slice(start, end), { $: () => chain });
    assert(remaining.includes('#xpma-target'), file + ': target switcher survives AJAX');
    assert(remaining.includes('#page_content'), file + ': page content survives cleanup');
    assert(!remaining.includes('#temporary-notice'), file + ': temporary containers still removed');
}
console.log('6 AJAX target-bar persistence checks passed for source and shipped JavaScript.');
