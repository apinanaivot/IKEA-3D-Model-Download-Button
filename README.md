# IKEA 3D Model Downloader

This Tampermonkey script adds a download button for 3D models on IKEA product pages, allowing you to easily save .GLB files of IKEA furniture and decorations. It works across different language versions of IKEA websites and automatically names the downloaded files based on the product name and color. The files can be opened in 3D software like Blender.

<p align="left">
  <img src="https://raw.githubusercontent.com/apinanaivot/IKEA-3D-Model-Download-Button/main/sample.jpg" width="550" title="IKEA 3D Model Downloader">
</p>

NOTE: If you need to batch download entire cataloques at once, check out my other script: https://github.com/apinanaivot/IKEA-3d-model-batch-downloader/tree/main

## Features

- Adds a "Download 3D" button next to the "View in 3D" button on IKEA product pages
- Works on all language versions of IKEA websites
- Automatically names downloaded files using the product name and color

## Installation

1. Install the [Tampermonkey](https://www.tampermonkey.net/) browser extension for your browser.
2. Create a new script in Tampermonkey and paste the contents of `ikea-3d-model-downloader.user.js` into it.
3. Save the script and ensure it's enabled in Tampermonkey.

## Usage

1. Navigate to any IKEA product page that has a "View in 3D" button.
2. You'll see a new "Download 3D" button next to the "View in 3D" button.
3. Click the "Download 3D" button to download the GLB file of the 3D model.
4. The file will be saved with a name in the format: `[Product Name] - [Color].glb`

## Troubleshooting

- If the download button doesn't appear, ensure you're on a product page with a 3D model available and refresh the page.

## Disclaimer

This script is for personal use only. Ensure you comply with IKEA's terms of service when using this script. The authors are not responsible for any misuse or violation of terms.

## Credits

This script and README were created with the assistance of Claude 3.5 Sonnet, an AI language model by Anthropic.
