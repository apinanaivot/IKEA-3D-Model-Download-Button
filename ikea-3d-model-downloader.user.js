// ==UserScript==
// @name         IKEA 3D Model Downloader
// @namespace    http://tampermonkey.net/
// @version      2.4.0
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
    msg.innerHTML = `<strong>${tr('man')}</strong><br><small>${tr('esc')}</small>`;
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

    dBtn.addEventListener('click', async function() { const o = loadOpts() || await askOpts(); syncOpts(); if(o) hDl(vBtn, o); });
    const oBtn = document.createElement('button'); oBtn.id = 'i-m-d-opts'; oBtn.className = vBtn.className; oBtn.type = 'button';
    oBtn.title = tr('set'); oBtn.setAttribute('aria-label', tr('set'));
    const oIn = document.createElement('span'); oIn.className = `${p}-typography-label-s ${p}-btn__inner`;
    oIn.style.cssText = 'padding:0 12px;border-radius:0 64px 64px 0;border-left:1px solid rgba(255,255,255,0.45);';
    const cog = svg.cloneNode(false); cog.style.marginRight = '0';
    const cogP = path.cloneNode(false); cogP.setAttribute('d', 'M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z');
    cog.appendChild(cogP); oIn.appendChild(cog); oBtn.appendChild(oIn);
    oBtn.addEventListener('click', async function() { await askOpts(true); syncOpts(); });
    // IKEA gives the copied button class its own 8px margin, which would split the two halves.
    dBtn.style.margin = '0'; oBtn.style.margin = '0';
    const wrap = document.createElement('span'); wrap.style.cssText = 'display:inline-flex;vertical-align:top;margin-left:8px;'; wrap.append(dBtn, oBtn);
    vBtn.parentNode.insertBefore(wrap, vBtn.nextSibling); syncOpts();
}

// The cog is only useful once a choice is saved, otherwise every download asks anyway.
function syncOpts() { const d = document.getElementById('i-m-d-btn'), o = document.getElementById('i-m-d-opts'); if(!d || !o) return;
const s = !!loadOpts(), r = s ? '64px 0 0 64px' : ''; o.style.display = s ? '' : 'none'; d.style.borderRadius = r; d.firstChild.style.borderRadius = r; d.firstChild.style.paddingRight = s ? '16px' : ''; }

const OPTS_KEY = 'i-m-d-opts';
function loadOpts() { try { const o = JSON.parse(localStorage.getItem(OPTS_KEY)); return o && (o.fmt === 'original' || o.fmt === 'compat') ? o : null; } catch(e) { return null; }}
function saveOpts(o) { try { if(o) localStorage.setItem(OPTS_KEY, JSON.stringify(o)); else localStorage.removeItem(OPTS_KEY); } catch(e) {}}

function askOpts(settings) { return new Promise((resolve) => {
const saved = loadOpts(), cur = saved || {fmt: 'original', tex: 'png'};
const el = (tag, css, txt) => { const e = document.createElement(tag); if(css) e.style.cssText = css; if(txt) e.textContent = txt; return e; };
const d = el('dialog', 'border:0;border-radius:8px;padding:24px;max-width:420px;width:calc(100vw - 64px);font-size:14px;line-height:1.5;color:#111;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,0.3);');
const row = (txt, hint, val) => { const l = el('label', 'display:flex;gap:8px;align-items:flex-start;margin-bottom:12px;cursor:pointer;');
const r = el('input', 'margin:4px 0 0;flex:none;'); r.type = 'radio'; r.name = 'i-m-d-fmt'; r.value = val; r.checked = cur.fmt === val;
const t = el('span'); t.append(el('strong', 'display:block;font-weight:700;', txt), el('span', 'display:block;color:#484848;', hint)); l.append(r, t); return [l, r]; };
const [lO, rO] = row(tr('orig'), tr('origH'), 'original');
const [lC, rCp] = row(tr('comp'), tr('compH'), 'compat');
const lT = el('label', 'display:flex;align-items:center;gap:8px;margin:0 0 16px;margin-inline-start:21px;', tr('tex')), sel = el('select', 'font:inherit;color:inherit;padding:4px 8px;');
for(const [v, t] of [['png', tr('png')], ['jpg', tr('jpg')]]) { const op = el('option', '', t); op.value = v; op.selected = cur.tex === v; sel.appendChild(op); }
lT.appendChild(sel);
const sync = () => { sel.disabled = !rCp.checked; lT.style.opacity = rCp.checked ? '1' : '0.5'; };
rO.addEventListener('change', sync); rCp.addEventListener('change', sync); sync();
const lR = el('label', 'display:flex;gap:8px;align-items:flex-start;margin-bottom:20px;cursor:pointer;'), cb = el('input', 'margin:4px 0 0;flex:none;');
cb.type = 'checkbox'; cb.checked = true; lR.append(cb, el('span', '', tr('rem')));
const mk = (txt, css) => { const b = el('button', 'padding:8px 16px;border-radius:20px;font:inherit;font-weight:bold;cursor:pointer;' + css, txt); b.type = 'button'; return b; };
const no = mk(tr('cancel'), 'background:#fff;color:#111;border:1px solid #929292;'), ok = mk(tr(settings ? 'save' : 'dl'), 'background:#0058a3;color:#fff;border:1px solid #0058a3;');
const btns = el('div', 'display:flex;justify-content:flex-end;gap:8px;'); btns.append(no, ok);
const close = (o) => { d.close(); d.remove(); resolve(o); };
no.addEventListener('click', () => close(null));
d.addEventListener('cancel', (e) => { e.preventDefault(); close(null); });
ok.addEventListener('click', () => { const o = {fmt: rCp.checked ? 'compat' : 'original', tex: sel.value}; saveOpts(cb.checked ? o : null); close(o); });
d.append(el('h2', 'margin:0 0 16px;font-size:20px;font-weight:700;line-height:1.3;', tr('title')), lO, lC, lT, lR, btns);
document.body.appendChild(d); d.showModal(); ok.focus(); }); }

function rdy() {
sBtn(); let cUrl = location.href, rT = null;
new MutationObserver(() => { if(location.href !== cUrl) {
cUrl = location.href; window.mUrls = []; sBtn(); }
// IKEA can re-render the gallery, e.g. after closing the 3D viewer, which removes our button.
if(!rT && !document.getElementById('i-m-d-btn')) rT = setTimeout(() => { rT = null; const v = findViewIn3DButton(); if(v) setupDownloadButton(v); }, 200);
}).observe(document, {subtree: true, childList: true});
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

const EN = {btn: 'Download 3D', title: 'Download 3D model', orig: 'Original', origH: 'Original IKEA file. Usually the smallest filesize, but some software may not support it.', comp: 'Compatible', compH: 'Removes any Draco compression and converts any WebP textures, for wider software support.', tex: 'Convert textures to:', png: 'PNG (lossless)', jpg: 'JPG (smaller)', rem: 'Remember my choice (change it later with the cog icon)', cancel: 'Cancel', dl: 'Download', save: 'Save', set: 'Download settings', err: 'Error downloading model. Please refresh and try again.', conv: 'Could not convert the model ({e}). Downloading the original file instead.', man: 'Click on the "View in 3D" button', esc: 'Press Escape to cancel'};
const L10N = {
'fi/fi': {btn: 'Lataa 3D', title: 'Lataa 3D-malli', orig: 'Alkuperäinen', origH: 'Alkuperäinen IKEA-tiedosto. Yleensä pienin tiedostokoko, mutta kaikki ohjelmat eivät välttämättä tue sitä.', comp: 'Yhteensopiva', compH: 'Poistaa mahdollisen Draco-pakkauksen ja muuntaa mahdolliset WebP-tekstuurit, jotta useammat ohjelmat tukevat tiedostoa.', tex: 'Muunna tekstuurit muotoon:', png: 'PNG (häviötön)', jpg: 'JPG (pienempi)', rem: 'Muista valintani (voit muuttaa sitä myöhemmin rataskuvakkeesta)', cancel: 'Peruuta', dl: 'Lataa', save: 'Tallenna', set: 'Latausasetukset', err: 'Mallin lataus epäonnistui. Päivitä sivu ja yritä uudelleen.', conv: 'Mallin muuntaminen epäonnistui ({e}). Ladataan alkuperäinen tiedosto.', man: 'Napsauta "Näytä 3D-muodossa"-painiketta', esc: 'Peruuta painamalla Esc'},
'se/sv': {btn: 'Ladda ned 3D', title: 'Ladda ned 3D-modell', orig: 'Original', origH: 'Originalfil från IKEA. Oftast minst filstorlek, men viss programvara kanske inte stöder den.', comp: 'Kompatibel', compH: 'Tar bort eventuell Draco-komprimering och konverterar eventuella WebP-texturer, för bredare programvarustöd.', tex: 'Konvertera texturer till:', png: 'PNG (förlustfri)', jpg: 'JPG (mindre)', rem: 'Kom ihåg mitt val (ändra det senare med kugghjulsikonen)', cancel: 'Avbryt', dl: 'Ladda ned', save: 'Spara', set: 'Nedladdningsinställningar', err: 'Det gick inte att ladda ned modellen. Uppdatera sidan och försök igen.', conv: 'Det gick inte att konvertera modellen ({e}). Laddar ned originalfilen i stället.', man: 'Klicka på knappen "Visa i 3D"', esc: 'Tryck på Esc för att avbryta'},
'fr/fr': {btn: 'Télécharger 3D', title: 'Télécharger le modèle 3D', orig: 'Original', origH: "Fichier IKEA d'origine. Généralement le plus petit, mais certains logiciels peuvent ne pas le prendre en charge.", comp: 'Compatible', compH: 'Supprime toute compression Draco et convertit les éventuelles textures WebP, pour une meilleure compatibilité logicielle.', tex: 'Convertir les textures en :', png: 'PNG (sans perte)', jpg: 'JPG (plus léger)', rem: "Mémoriser mon choix (modifiable plus tard avec l'icône d'engrenage)", cancel: 'Annuler', dl: 'Télécharger', save: 'Enregistrer', set: 'Paramètres de téléchargement', err: 'Erreur lors du téléchargement du modèle. Actualisez la page et réessayez.', conv: "Impossible de convertir le modèle ({e}). Téléchargement du fichier d'origine.", man: 'Cliquez sur le bouton "Visualiser en 3D"', esc: 'Appuyez sur Échap pour annuler'},
'es/es': {btn: 'Descargar 3D', title: 'Descargar modelo 3D', orig: 'Original', origH: 'Archivo original de IKEA. Suele ser el de menor tamaño, pero es posible que algunos programas no lo admitan.', comp: 'Compatible', compH: 'Elimina cualquier compresión Draco y convierte las texturas WebP, para una mayor compatibilidad.', tex: 'Convertir texturas a:', png: 'PNG (sin pérdida)', jpg: 'JPG (más pequeño)', rem: 'Recordar mi elección (puedes cambiarla luego con el icono del engranaje)', cancel: 'Cancelar', dl: 'Descargar', save: 'Guardar', set: 'Ajustes de descarga', err: 'Error al descargar el modelo. Actualiza la página e inténtalo de nuevo.', conv: 'No se pudo convertir el modelo ({e}). Se descargará el archivo original.', man: 'Haz clic en el botón "Ver en 3D"', esc: 'Pulsa Esc para cancelar'},
'it/it': {btn: 'Scarica 3D', title: 'Scarica il modello 3D', orig: 'Originale', origH: 'File IKEA originale. Di solito è il più piccolo, ma alcuni software potrebbero non supportarlo.', comp: 'Compatibile', compH: "Rimuove l'eventuale compressione Draco e converte le eventuali texture WebP, per una maggiore compatibilità.", tex: 'Converti le texture in:', png: 'PNG (senza perdita)', jpg: 'JPG (più piccolo)', rem: "Ricorda la mia scelta (puoi cambiarla in seguito con l'icona dell'ingranaggio)", cancel: 'Annulla', dl: 'Scarica', save: 'Salva', set: 'Impostazioni di download', err: 'Errore durante il download del modello. Aggiorna la pagina e riprova.', conv: 'Impossibile convertire il modello ({e}). Verrà scaricato il file originale.', man: 'Fai clic sul pulsante "Visualizza in 3D"', esc: 'Premi Esc per annullare'},
'no/no': {btn: 'Last ned 3D', title: 'Last ned 3D-modell', orig: 'Original', origH: 'Originalfil fra IKEA. Vanligvis minst filstørrelse, men noe programvare støtter den kanskje ikke.', comp: 'Kompatibel', compH: 'Fjerner eventuell Draco-komprimering og konverterer eventuelle WebP-teksturer, for bredere programvarestøtte.', tex: 'Konverter teksturer til:', png: 'PNG (tapsfri)', jpg: 'JPG (mindre)', rem: 'Husk valget mitt (endre det senere med tannhjulikonet)', cancel: 'Avbryt', dl: 'Last ned', save: 'Lagre', set: 'Nedlastingsinnstillinger', err: 'Kunne ikke laste ned modellen. Oppdater siden og prøv igjen.', conv: 'Kunne ikke konvertere modellen ({e}). Laster ned originalfilen i stedet.', man: 'Klikk på knappen "Se i 3D"', esc: 'Trykk på Esc for å avbryte'},
'pl/pl': {btn: 'Pobierz 3D', title: 'Pobierz model 3D', orig: 'Oryginalny', origH: 'Oryginalny plik IKEA. Zwykle najmniejszy rozmiar, ale niektóre programy mogą go nie obsługiwać.', comp: 'Zgodny', compH: 'Usuwa ewentualną kompresję Draco i konwertuje ewentualne tekstury WebP, aby zwiększyć obsługę w programach.', tex: 'Konwertuj tekstury do:', png: 'PNG (bezstratny)', jpg: 'JPG (mniejszy)', rem: 'Zapamiętaj mój wybór (możesz go później zmienić ikoną koła zębatego)', cancel: 'Anuluj', dl: 'Pobierz', save: 'Zapisz', set: 'Ustawienia pobierania', err: 'Błąd pobierania modelu. Odśwież stronę i spróbuj ponownie.', conv: 'Nie udało się przekonwertować modelu ({e}). Pobieranie oryginalnego pliku.', man: 'Kliknij przycisk "Zobacz w 3D"', esc: 'Naciśnij Esc, aby anulować'},
'pt/pt': {btn: 'Transferir 3D', title: 'Transferir modelo 3D', orig: 'Original', origH: 'Ficheiro original da IKEA. Normalmente o mais pequeno, mas alguns programas podem não o suportar.', comp: 'Compatível', compH: 'Remove qualquer compressão Draco e converte quaisquer texturas WebP, para maior compatibilidade.', tex: 'Converter texturas para:', png: 'PNG (sem perdas)', jpg: 'JPG (mais pequeno)', rem: 'Lembrar a minha escolha (altere mais tarde no ícone da roda dentada)', cancel: 'Cancelar', dl: 'Transferir', save: 'Guardar', set: 'Definições de transferência', err: 'Erro ao transferir o modelo. Atualize a página e tente novamente.', conv: 'Não foi possível converter o modelo ({e}). A transferir o ficheiro original.', man: 'Clique no botão "Ver em 3D"', esc: 'Prima Esc para cancelar'},
'jp/ja': {btn: '3Dをダウンロード', title: '3Dモデルをダウンロード', orig: 'オリジナル', origH: 'IKEAのオリジナルファイルです。通常は最もファイルサイズが小さくなりますが、一部のソフトウェアでは対応していない場合があります。', comp: '互換', compH: 'Draco圧縮を解除し、WebPテクスチャを変換して、より多くのソフトウェアで使えるようにします。', tex: 'テクスチャの変換先:', png: 'PNG(可逆圧縮)', jpg: 'JPG(小さいサイズ)', rem: '選択を記憶する(後で歯車アイコンから変更できます)', cancel: 'キャンセル', dl: 'ダウンロード', save: '保存', set: 'ダウンロード設定', err: 'モデルのダウンロードに失敗しました。ページを更新してもう一度お試しください。', conv: 'モデルを変換できませんでした({e})。元のファイルをダウンロードします。', man: '「3Dで見る」ボタンをクリックしてください', esc: 'Escキーでキャンセル'},
'kr/ko': {btn: '3D 다운로드', title: '3D 모델 다운로드', orig: '원본', origH: 'IKEA 원본 파일입니다. 일반적으로 파일 크기가 가장 작지만 일부 소프트웨어에서는 지원되지 않을 수 있습니다.', comp: '호환', compH: 'Draco 압축을 제거하고 WebP 텍스처를 변환하여 더 많은 소프트웨어에서 사용할 수 있게 합니다.', tex: '텍스처 변환 형식:', png: 'PNG (무손실)', jpg: 'JPG (더 작음)', rem: '선택 기억하기 (나중에 톱니바퀴 아이콘으로 변경 가능)', cancel: '취소', dl: '다운로드', save: '저장', set: '다운로드 설정', err: '모델을 다운로드하지 못했습니다. 페이지를 새로고침한 후 다시 시도하세요.', conv: '모델을 변환하지 못했습니다({e}). 원본 파일을 다운로드합니다.', man: '"3D로 보기" 버튼을 클릭하세요', esc: 'Esc 키를 눌러 취소'},
'cn/zh': {btn: '下载3D模型', title: '下载3D模型', orig: '原始', origH: 'IKEA 原始文件。通常文件最小,但某些软件可能不支持。', comp: '兼容', compH: '移除 Draco 压缩并转换 WebP 纹理,以支持更多软件。', tex: '将纹理转换为:', png: 'PNG(无损)', jpg: 'JPG(较小)', rem: '记住我的选择(之后可通过齿轮图标更改)', cancel: '取消', dl: '下载', save: '保存', set: '下载设置', err: '下载模型时出错。请刷新页面后重试。', conv: '无法转换模型({e})。将改为下载原始文件。', man: '点击"3D 查看"按钮', esc: '按 Esc 键取消'},
'ae/ar': {btn: 'تنزيل ثلاثي الأبعاد', title: 'تنزيل نموذج ثلاثي الأبعاد', orig: 'الأصلي', origH: 'ملف IKEA الأصلي. عادةً ما يكون حجمه الأصغر، لكن قد لا تدعمه بعض البرامج.', comp: 'متوافق', compH: 'يزيل أي ضغط Draco ويحوّل أي خامات WebP لدعم عدد أكبر من البرامج.', tex: 'تحويل الخامات إلى:', png: 'PNG (بدون فقدان)', jpg: 'JPG (أصغر)', rem: 'تذكّر اختياري (يمكن تغييره لاحقًا من أيقونة الترس)', cancel: 'إلغاء', dl: 'تنزيل', save: 'حفظ', set: 'إعدادات التنزيل', err: 'حدث خطأ أثناء تنزيل النموذج. يرجى تحديث الصفحة والمحاولة مرة أخرى.', conv: 'تعذّر تحويل النموذج ({e}). سيتم تنزيل الملف الأصلي بدلاً من ذلك.', man: 'انقر على زر "عرض ثلاثي الأبعاد"', esc: 'اضغط على Esc للإلغاء'}, };

function tr(k) {
const cUrl = window.location.href;
for(const [l, v] of Object.entries(L10N)) { if(cUrl.includes(`ikea.com/${l}/`)) return v[k]; }
return EN[k]; }

function gTxt() { return tr('btn'); }

function itemInfo() {
const m = location.pathname.match(/^\/(\w+)\/(\w+)\/.*?-(s?)(\d{8})\/?$/i); if(!m) return null;
return {cc: m[1], lg: m[2], s: m[3], id: m[4]}; }

// The model endpoint answers 401 to plain requests, so this only succeeds once IKEA's
// own request for the item (the id without the s) is in the browser cache.
async function apiUrl() {
const i = itemInfo(); if(!i) return null;
for(const pid of i.s ? [i.id, i.s + i.id] : [i.id]) { try {
const r = await fetch(`https://web-api.ikea.com/${i.cc}/${i.lg}/rotera/data/model/${pid}/`, {signal: AbortSignal.timeout(8000)});
if(r.ok) { const j = await r.json(); if(j.modelUrl) return j.modelUrl; }
} catch(e) {} }
return null; }

function directUrl() {
const i = itemInfo(); if(!i) return null;
return `https://web-api.ikea.com/${i.cc}/${i.lg}/rotera/static/models/${i.id}-mini.glb`; }

function seenUrls() {
const us = window.mUrls.slice().reverse();
for(const v of document.querySelectorAll('model-viewer')) {
const s = v.getAttribute('src'); if(s && (s.includes('.glb') || s.includes('glb_draco'))) us.push(s); }
return us; }

async function fetchGlb(u) {
const r = await fetch(u, {signal: AbortSignal.timeout(60000)}); if(!r.ok) throw new Error('HTTP ' + r.status);
const b = await r.arrayBuffer();
if(b.byteLength < 12 || new DataView(b).getUint32(0, true) !== 0x46546C67) throw new Error('Not a GLB file');
return b; }

// Tries each URL at most once per download. True once a model has been saved.
async function tryUrls(us, tried, o) {
for(const u of us) { if(!u || tried.has(u)) continue; tried.add(u);
try { const b = await fetchGlb(u); await dl(u, b, o); return true; } catch(e) { console.warn('IKEA 3D download:', u, e); } }
return false; }

let busy = false;
function setBusy(v) { busy = v;
const b = document.getElementById('i-m-d-btn'); if(b) { b.disabled = v; b.style.opacity = v ? '0.6' : ''; b.style.cursor = v ? 'progress' : ''; }}

async function hDl(tBtn, o) {
if(busy) return; setBusy(true); try {
if(await tryUrls([await apiUrl(), directUrl(), ...seenUrls()], new Set(), o)) return;
(findViewIn3DButton() || tBtn).click(); await pollDl(new Set(), o);
} finally { setBusy(false); } }

async function tFR() {
if(busy) return; setBusy(true); try { await pollDl(new Set(), loadOpts() || {fmt: 'original'}); } finally { setBusy(false); } }

async function pollDl(tried, o) {
for(let a = 0; a < 30; a++) { await new Promise(r => setTimeout(r, 500)); cIf();
if(await tryUrls([a % 4 === 3 ? await apiUrl() : null, ...seenUrls()], tried, o)) return; }
alert(tr('err')); }

function cIf() {
const ifs = document.querySelectorAll('iframe'); for(let i of ifs) { try {
if(i.contentDocument) {
const ms = i.contentDocument.querySelectorAll('model-viewer, a-entity[gltf-model]');
for(let e of ms) {
const s = e.getAttribute('src') || e.getAttribute('gltf-model');
if(s && (s.includes('.glb') || s.includes('glb_draco'))) window.mUrls.push(s); }}
} catch(e) {} }}

let dracoP = null;
function loadDraco() {
return dracoP || (dracoP = new Promise((res, rej) => {
const s = document.createElement('script');
s.src = 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/draco_decoder_gltf.js';
s.integrity = 'sha384-Q6CLhya7FZx2313plsfZTLi4DQdlPX52h7qR/xmG+oxFn4uYX9kx5k6zJ2/cgQlu';
s.crossOrigin = 'anonymous';
s.onload = () => window.DracoDecoderModule({onModuleLoaded: m => res({m})});
s.onerror = () => { dracoP = null; rej(new Error('Could not load the Draco decoder')); };
document.head.appendChild(s); })).then(w => w.m); }

async function toImg(bytes, mime, tex) {
const bmp = await createImageBitmap(new Blob([bytes], {type: mime}), {premultiplyAlpha: 'none', colorSpaceConversion: 'none'});
const c = document.createElement('canvas'); c.width = bmp.width; c.height = bmp.height;
const x = c.getContext('2d', {willReadFrequently: true}); x.drawImage(bmp, 0, 0); bmp.close();
const px = x.getImageData(0, 0, c.width, c.height).data; let alpha = false;
for(let i = 3; i < px.length; i += 4) { if(px[i] < 255) { alpha = true; break; } }
// JPG has no alpha channel, so textures that use it stay PNG.
const type = tex === 'jpg' && !alpha ? 'image/jpeg' : 'image/png';
const b = await new Promise(r => c.toBlob(r, type, 0.95)); if(!b) throw new Error('Could not encode texture');
return {bytes: new Uint8Array(await b.arrayBuffer()), mime: type}; }

function dracoAccessor(D, dec, mesh, attr, acc) {
const [T, dt] = {5120: [Int8Array, D.DT_INT8], 5121: [Uint8Array, D.DT_UINT8], 5122: [Int16Array, D.DT_INT16],
5123: [Uint16Array, D.DT_UINT16], 5125: [Uint32Array, D.DT_UINT32], 5126: [Float32Array, D.DT_FLOAT32]}[acc.componentType];
const n = attr.num_components(), pts = mesh.num_points(); if(pts !== acc.count) throw new Error('Draco point count mismatch');
const size = n * pts * T.BYTES_PER_ELEMENT, ptr = D._malloc(size);
try { if(!dec.GetAttributeDataArrayForAllPoints(mesh, attr, dt, size, ptr)) throw new Error('Draco attribute decode failed');
const bytes = new Uint8Array(D.HEAPU8.buffer, ptr, size).slice();
// Draco quantization shifts values slightly, so the declared bounds no longer match exactly.
if(acc.min && acc.max) { const v = new T(bytes.buffer); acc.min = Array(n).fill(Infinity); acc.max = Array(n).fill(-Infinity);
for(let i = 0; i < v.length; i++) { const k = i % n; if(v[i] < acc.min[k]) acc.min[k] = v[i]; if(v[i] > acc.max[k]) acc.max[k] = v[i]; }}
return {bytes, elem: n * T.BYTES_PER_ELEMENT}; } finally { D._free(ptr); } }

function dracoIndices(D, dec, mesh, acc) {
const n = mesh.num_faces() * 3; if(n !== acc.count) throw new Error('Draco index count mismatch');
const size = n * 4, ptr = D._malloc(size); let a;
try { if(!dec.GetTrianglesUInt32Array(mesh, size, ptr)) throw new Error('Draco index decode failed');
a = new Uint32Array(D.HEAPU8.buffer, ptr, n).slice(); } finally { D._free(ptr); }
const T = {5121: Uint8Array, 5123: Uint16Array, 5125: Uint32Array}[acc.componentType];
const o = T.from(a); return new Uint8Array(o.buffer); }

// Rewrites a GLB without Draco compression and WebP textures.
async function toCompat(buf, tex) {
const dv = new DataView(buf), jl = dv.getUint32(12, true);
const g = JSON.parse(new TextDecoder().decode(new Uint8Array(buf, 20, jl)));
const bin = 28 + jl <= buf.byteLength ? new Uint8Array(buf, 28 + jl, dv.getUint32(20 + jl, true)) : new Uint8Array(0);
const used = g.extensionsUsed || [];
if(used.includes('EXT_meshopt_compression')) throw new Error('Unsupported compression: meshopt');
if((g.buffers || []).length > 1 || g.buffers?.[0]?.uri) throw new Error('Unsupported buffer layout');

const views = [], parts = []; let len = 0;
const add = (bytes, extra) => {
const pad = (4 - len % 4) % 4; if(pad) { parts.push(new Uint8Array(pad)); len += pad; }
views.push({buffer: 0, byteOffset: len, byteLength: bytes.length, ...extra}); parts.push(bytes); len += bytes.length;
return views.length - 1; };

const oldV = g.bufferViews || [];
const prims = (g.meshes || []).flatMap(m => m.primitives).filter(p => p.extensions?.KHR_draco_mesh_compression);
const done = new Set();
if(prims.length) { const D = await loadDraco(), dec = new D.Decoder();
try { for(const p of prims) {
const ext = p.extensions.KHR_draco_mesh_compression, v = oldV[ext.bufferView];
const arr = new Uint8Array(bin.buffer, bin.byteOffset + (v.byteOffset || 0), v.byteLength);
const mesh = new D.Mesh();
try { const st = dec.DecodeArrayToMesh(arr, arr.length, mesh); const ok = st.ok(), msg = st.error_msg(); D.destroy(st); if(!ok) throw new Error('Draco: ' + msg);
for(const [name, uid] of Object.entries(ext.attributes)) {
const ai = p.attributes[name], acc = g.accessors[ai]; if(done.has(ai)) continue; done.add(ai);
const a = dracoAccessor(D, dec, mesh, dec.GetAttributeByUniqueId(mesh, uid), acc);
let b = a.bytes, extra = {target: 34962};
if(a.elem % 4) { const st2 = Math.ceil(a.elem / 4) * 4, o = new Uint8Array(acc.count * st2);
for(let i = 0; i < acc.count; i++) o.set(b.subarray(i * a.elem, (i + 1) * a.elem), i * st2);
b = o; extra.byteStride = st2; }
acc.bufferView = add(b, extra); delete acc.byteOffset; }
if(p.indices !== undefined && !done.has(p.indices)) { done.add(p.indices); const acc = g.accessors[p.indices];
acc.bufferView = add(dracoIndices(D, dec, mesh, acc), {target: 34963}); delete acc.byteOffset; }
} finally { D.destroy(mesh); }
delete p.extensions.KHR_draco_mesh_compression; if(!Object.keys(p.extensions).length) delete p.extensions; }
} finally { D.destroy(dec); } }

const moved = new Map();
const move = (i) => { if(!moved.has(i)) { const v = oldV[i], {byteOffset, buffer, ...rest} = v;
moved.set(i, add(bin.subarray(byteOffset || 0, (byteOffset || 0) + v.byteLength), rest)); } return moved.get(i); };
(g.accessors || []).forEach((a, i) => { if(!done.has(i) && a.bufferView !== undefined) a.bufferView = move(a.bufferView);
if(a.sparse) { a.sparse.indices.bufferView = move(a.sparse.indices.bufferView); a.sparse.values.bufferView = move(a.sparse.values.bufferView); }});
for(const im of g.images || []) { if(im.bufferView === undefined) continue;
const v = oldV[im.bufferView], b = bin.subarray(v.byteOffset || 0, (v.byteOffset || 0) + v.byteLength);
if(im.mimeType === 'image/webp') { const c = await toImg(b, im.mimeType, tex); im.bufferView = add(c.bytes); im.mimeType = c.mime; }
else im.bufferView = move(im.bufferView); }
for(const t of g.textures || []) { const e = t.extensions?.EXT_texture_webp; if(!e) continue;
t.source = e.source; delete t.extensions.EXT_texture_webp; if(!Object.keys(t.extensions).length) delete t.extensions; }

for(const k of ['extensionsUsed', 'extensionsRequired']) { if(!g[k]) continue;
g[k] = g[k].filter(e => e !== 'KHR_draco_mesh_compression' && e !== 'EXT_texture_webp'); if(!g[k].length) delete g[k]; }
g.bufferViews = views; g.buffers = [{byteLength: len}];

const js = new TextEncoder().encode(JSON.stringify(g)), jp = (4 - js.length % 4) % 4, bp = (4 - len % 4) % 4;
const total = 12 + 8 + js.length + jp + 8 + len + bp, out = new Uint8Array(total), od = new DataView(out.buffer);
od.setUint32(0, 0x46546C67, true); od.setUint32(4, 2, true); od.setUint32(8, total, true);
od.setUint32(12, js.length + jp, true); od.setUint32(16, 0x4E4F534A, true); out.set(js, 20); out.fill(0x20, 20 + js.length, 20 + js.length + jp);
let pos = 20 + js.length + jp; od.setUint32(pos, len + bp, true); od.setUint32(pos + 4, 0x004E4942, true); pos += 8;
for(const p of parts) { out.set(p, pos); pos += p.length; }
return out.buffer; }

async function dl(mUrl, buf, o) {
let data = buf;
if(o && o.fmt === 'compat') { try { data = await toCompat(buf, o.tex); } catch(e) {
console.warn('IKEA 3D download: conversion failed', e);
alert(tr('conv').replace('{e}', e.message)); }}
const mB = new Blob([data], {type: 'application/octet-stream'});
const dL = document.createElement('a'); const oU = window.URL.createObjectURL(mB); dL.href = oU;
const tEl = document.querySelector('title'); let pN = 'ikea_product', pV = '';
if(tEl) {
const t = tEl.textContent.trim(); const tP = t.split(' - IKEA')[0].split(',');
pN = tP[0].trim(); if(tP.length > 1) pV = tP[1].trim(); }
let pId = ''; const iM = mUrl.match(/\/(\d{8})-\w+\.glb/) || mUrl.match(/\/(\d+)_/) || mUrl.match(/\/(\d+)\//); if(iM?.[1]) pId = iM[1];
let fn = pN; if(pV) fn += ' - ' + pV; if(pId) fn += ' (' + pId + ')';
dL.download = fn.replace(/[<>:"\/\\|?*]/g, '') + '.glb';
document.body.appendChild(dL); dL.click(); document.body.removeChild(dL);
setTimeout(() => window.URL.revokeObjectURL(oU), 10000); }

if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', rdy); else rdy();
})();
