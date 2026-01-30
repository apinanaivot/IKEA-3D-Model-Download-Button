// ==UserScript==
// @name         IKEA 3D Model Downloader
// @namespace    http://tampermonkey.net/
// @version      2.2.1
// @description  Adds a download button for 3D models on IKEA product pages
// @match        https://*.ikea.com/*/p/*
// @match        https://*.ikea.com/*/*/p/*
// @run-at       document-start
// @grant        none
// ==/UserScript==

(function() {
'use strict';
window.mUrls = [];
let manualMode = false;

const oF = window.fetch;
window.fetch = function() {
const u = arguments[0]?.toString(); if(u && (u.includes('.glb') || u.includes('glb_draco'))) window.mUrls.push(u);
return oF.apply(this, arguments);
};
const oX = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function() {
const u = arguments[1]?.toString(); if(u && (u.includes('.glb') || u.includes('glb_draco'))) window.mUrls.push(u);
return oX.apply(this, arguments);
};
if(PerformanceObserver) { try {
const o = new PerformanceObserver((l) => { l.getEntries().forEach((e) => {
if(e.name && (e.name.includes('.glb') || e.name.includes('glb_draco'))) window.mUrls.push(e.name); }); });
o.observe({entryTypes: ['resource']}); } catch(e) {} }
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        startManualMode();
    }
});
function startManualMode() {
    if (manualMode) return;
    manualMode = true;
    const overlay = document.createElement('div');
    overlay.id = 'ikea-dl-overlay';
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:999998;pointer-events:none;';
    const msg = document.createElement('div');
    msg.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#0058a3;color:white;padding:16px 24px;border-radius:8px;z-index:999999;font-family:sans-serif;font-size:16px;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,0.3);';
    msg.innerHTML = '<strong>Click on the "View in 3D" button</strong><br><small>Press Escape to cancel</small>';
    document.body.appendChild(overlay);
    document.body.appendChild(msg);
    function cancelManual(e) {
        if (e.key === 'Escape') {
            cleanup();
        }
    }
    document.addEventListener('keydown', cancelManual);
    function handleClick(e) {
        const btn = e.target.closest('button');
        if (btn) {
            e.preventDefault();
            e.stopPropagation();
            cleanup();
            setupDownloadButton(btn);
            setTimeout(() => {
                btn.click();
                tFR();
            }, 100);
        }
    }

    document.addEventListener('click', handleClick, true);

    function cleanup() {
        manualMode = false;
        document.removeEventListener('keydown', cancelManual);
        document.removeEventListener('click', handleClick, true);
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        if (msg.parentNode) msg.parentNode.removeChild(msg);
    }
}

function setupDownloadButton(vBtn) {
    if (document.getElementById('i-m-d-btn')) return;
    let p = 'pip';
    if (vBtn.classList.contains('pipf-xr-button') || document.querySelector('[class*="pipf-"]')) {
        p = 'pipf';
    }

    const dBtn = document.createElement('button');
    dBtn.id = 'i-m-d-btn';
    dBtn.className = vBtn.className;
    dBtn.type = 'button';
    dBtn.style.marginLeft = '10px';

    const bIn = document.createElement('span');
    bIn.className = `${p}-typography-label-s ${p}-btn__inner`;

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('width', '24');
    svg.setAttribute('height', '24');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add(`${p}-svg-icon`, `${p}-btn__icon`);

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z');
    svg.appendChild(path);

    const lbl = document.createElement('span');
    lbl.className = `${p}-btn__label`;
    lbl.textContent = gTxt();

    bIn.appendChild(svg);
    bIn.appendChild(lbl);
    dBtn.appendChild(bIn);

    dBtn.addEventListener('click', function() { hDl(vBtn); });
    vBtn.parentNode.insertBefore(dBtn, vBtn.nextSibling);
}

function rdy() {
sBtn(); let cUrl = location.href;
new MutationObserver(() => { if(location.href !== cUrl) {
cUrl = location.href; window.mUrls = []; sBtn(); }}).observe(document, {subtree: true, childList: true});
const mObs = new MutationObserver((ms) => { for(const m of ms) { if(m.addedNodes) { for(const n of m.addedNodes) {
if(n.nodeType === 1 && n.querySelector) {
const vs = n.querySelectorAll('model-viewer'); if(n.nodeName === 'MODEL-VIEWER') cMv(n);
for(const v of vs) cMv(v); }}}}});
mObs.observe(document.body, {childList: true, subtree: true}); }

function cMv(v) {
const s = v.getAttribute('src'); if(s && (s.includes('.glb') || s.includes('glb_draco'))) window.mUrls.push(s);
const vObs = new MutationObserver((ms) => { for(const m of ms) { if(m.attributeName === 'src') {
const ns = v.getAttribute('src'); if(ns && (ns.includes('.glb') || ns.includes('glb_draco'))) window.mUrls.push(ns); }}});
vObs.observe(v, {attributes: true}); }

let rC = 0; const mR = 15;

function findViewIn3DButton() {
    let vBtn = document.querySelector('.pipf-xr-button, .pip-xr-button');
    if (vBtn) return vBtn;
    const paths = document.querySelectorAll('button svg path');
    for (const path of paths) {
        const d = path.getAttribute('d');
        if (d && d.includes('M11 16.9766') && d.includes('3.5146-3.864')) {
            return path.closest('button');
        }
    }

    return null;
}

function sBtn() {
    const vBtn = findViewIn3DButton();
    if(!vBtn) { rC++; if(rC < mR) setTimeout(sBtn, 1000); return; }
    rC = 0;
    setupDownloadButton(vBtn);
}

function gTxt() {
const cUrl = window.location.href; const t = {
'fi/fi': 'Lataa 3D', 'se/sv': 'Ladda ned 3D', 'fr/fr': 'Télécharger 3D', 'es/es': 'Descargar 3D',
'it/it': 'Scarica 3D', 'no/no': 'Last ned 3D', 'pl/pl': 'Pobierz 3D', 'pt/pt': 'Transferir 3D',
'jp/ja': '3Dをダウンロード', 'kr/ko': '3D 다운로드', 'cn/zh': '下载3D模型', 'ae/ar': 'تنزيل ثلاثي الأبعاد', };
for(const [k, v] of Object.entries(t)) { if(cUrl.includes(`ikea.com/${k}/`)) return v; }
return 'Download 3D'; }

function hDl(tBtn) {
if(window.mUrls.length > 0) { dl(window.mUrls[window.mUrls.length - 1]); return; }
const mvs = document.querySelectorAll('model-viewer');
for(const v of mvs) {
const s = v.getAttribute('src'); if(s && (s.includes('.glb') || s.includes('glb_draco'))) { dl(s); return; }}
tBtn.click(); tFR(); }

function tFR() {
let a = 0; const cI = setInterval(() => { a++;
if(window.mUrls.length > 0) { clearInterval(cI); dl(window.mUrls[window.mUrls.length - 1]); return; }
const mvs = document.querySelectorAll('model-viewer');
for(const v of mvs) {
const s = v.getAttribute('src'); if(s && (s.includes('.glb') || s.includes('glb_draco'))) {
clearInterval(cI); dl(s); return; }}
cIf(); if(a >= 30) { clearInterval(cI); alert('Error downloading model. Please refresh and try again.'); }
}, 500); }

function cIf() {
const ifs = document.querySelectorAll('iframe'); for(let i of ifs) { try {
if(i.contentDocument) {
const ms = i.contentDocument.querySelectorAll('model-viewer, a-entity[gltf-model]');
for(let e of ms) {
const s = e.getAttribute('src') || e.getAttribute('gltf-model');
if(s && (s.includes('.glb') || s.includes('glb_draco'))) window.mUrls.push(s); }}
} catch(e) {} }}

function dl(mUrl) {
fetch(mUrl).then(r => r.blob()).then(b => {
const mB = new Blob([b], {type: 'application/octet-stream'});
const dL = document.createElement('a'); dL.href = window.URL.createObjectURL(mB);
const tEl = document.querySelector('title'); let pN = 'ikea_product', pV = '';
if(tEl) {
const t = tEl.textContent.trim(); const tP = t.split(' - IKEA')[0].split(',');
pN = tP[0].trim(); if(tP.length > 1) pV = tP[1].trim(); }
let pId = ''; const iM = mUrl.match(/\/(\d+)_/) || mUrl.match(/\/(\d+)\//); if(iM?.[1]) pId = iM[1];
let fn = pN; if(pV) fn += ' - ' + pV; if(pId) fn += ' (' + pId + ')';
dL.download = fn.replace(/[<>:"\/\\|?*]/g, '') + '.glb';
document.body.appendChild(dL); dL.click(); document.body.removeChild(dL);
}).catch(e => { alert('Error downloading model: ' + e.message); }); }

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rdy); else rdy();
})();
