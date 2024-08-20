// ==UserScript==
// @name         IKEA 3D Model Downloader
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Adds a download button for 3D models on IKEA product pages
// @match        https://*.ikea.com/*/p/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let attemptCount = 0;
    const MAX_ATTEMPTS = 7; // 2 short delays + 5 long delays
    const SHORT_RETRY_INTERVAL = 1000; // 1 seconds
    const LONG_RETRY_INTERVAL = 3000; // 3 seconds

    function addDownloadButton() {
        const viewIn3dButton = document.querySelector('button[aria-label*="3D"]');
        if (!viewIn3dButton) {
            attemptCount++;
            if (attemptCount < MAX_ATTEMPTS) {
                const delay = attemptCount <= 2 ? SHORT_RETRY_INTERVAL : LONG_RETRY_INTERVAL;
                console.log(`Attempt ${attemptCount}: 3D button not found. Retrying in ${delay/1000} seconds...`);
                setTimeout(addDownloadButton, delay);
            } else {
                console.log("Max attempts reached. 3D button not found.");
            }
            return;
        }

        // Reset attempt count if button is found
        attemptCount = 0;

        if (document.getElementById('ikea-3d-download-button')) {
            console.log("Download button already exists.");
            return;
        }

        const downloadButton = document.createElement('button');
        downloadButton.id = 'ikea-3d-download-button';
        downloadButton.className = viewIn3dButton.className;
        downloadButton.type = 'button';
        downloadButton.style.marginLeft = '10px';

        const innerSpan = document.createElement('span');
        innerSpan.className = 'pip-btn__inner';

        const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        iconSvg.setAttribute('focusable', 'false');
        iconSvg.setAttribute('viewBox', '0 0 24 24');
        iconSvg.setAttribute('width', '24');
        iconSvg.setAttribute('height', '24');
        iconSvg.classList.add('pip-svg-icon', 'pip-btn__icon');
        iconSvg.setAttribute('aria-hidden', 'true');

        const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        iconPath.setAttribute('d', 'M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z');
        iconSvg.appendChild(iconPath);

        const labelSpan = document.createElement('span');
        labelSpan.className = 'pip-btn__label';
        labelSpan.textContent = 'Download 3D';

        innerSpan.appendChild(iconSvg);
        innerSpan.appendChild(labelSpan);
        downloadButton.appendChild(innerSpan);

        downloadButton.addEventListener('click', downloadGLB);

        viewIn3dButton.parentNode.insertBefore(downloadButton, viewIn3dButton.nextSibling);
        console.log("Download button added successfully.");
    }

    function downloadGLB() {
        const scriptElement = document.querySelector('#pip-xr-viewer-model');
        if (!scriptElement) {
            console.error('3D model script not found');
            return;
        }

        try {
            const data = JSON.parse(scriptElement.textContent);
            const glbUrl = data.url;

            if (!glbUrl) {
                console.error('GLB URL not found');
                return;
            }

            const xhr = new XMLHttpRequest();
            xhr.open('GET', glbUrl, true);
            xhr.responseType = 'blob';
            xhr.onload = function() {
                if (this.status === 200) {
                    const file = new Blob([xhr.response], { type: 'application/octet-stream' });
                    const a = document.createElement('a');
                    a.href = window.URL.createObjectURL(file);

                    // Get product name and color
                    const titleElement = document.querySelector('title');
                    let name = 'ikea_product';
                    let color = 'default';

                    if (titleElement) {
                        const fullTitle = titleElement.textContent.trim();
                        const nameParts = fullTitle.split(' - IKEA')[0].split(',');
                        if (nameParts.length > 1) {
                            name = nameParts[0].trim();
                            color = nameParts[1].trim();
                        } else {
                            name = nameParts[0].trim();
                        }
                    }

                    // Remove invalid characters from filename
                    const cleanName = (name + ' - ' + color).replace(/[<>:"/\\|?*]/g, '');
                    a.download = cleanName + '.glb';

                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                }
            };
            xhr.send();
        } catch (error) {
            console.error('Error parsing 3D model data:', error);
        }
    }

    // Initial attempt to add the download button
    addDownloadButton();

    // Also run the script when the URL changes (for single-page applications)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            attemptCount = 0; // Reset attempt count on URL change
            addDownloadButton();
        }
    }).observe(document, { subtree: true, childList: true });
})();
