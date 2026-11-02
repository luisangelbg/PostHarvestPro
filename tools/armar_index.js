/* PostHarvestPro — Copyright (C) 2026 Luis Ángel Barrera-Guzmán. GPL-3.0-or-later; see LICENSE.

   Assembles index.html from its parts: the head (with the favicon drawn by
   js/art.js), the common bar of the LABG Suite (partes/_topbar.html), the
   home page (partes/_home.html), one shell per block (each block builds its
   own panel in js/bN.js) and the scripts in their order. The app needs no
   build: index.html is committed as it comes out of here. Run after editing
   any of those parts:

       node tools/armar_index.js */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const here = __dirname, root = path.resolve(here, '..');
const box = { window: {} }; box.window.window = box.window; vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(root, 'js', 'art.js'), 'utf8').replace('(typeof window !== \'undefined\' ? window : globalThis)', '(window)'), box);
const favicon = box.window.Art.favicon();
const topbar = fs.readFileSync(path.join(here, 'partes', '_topbar.html'), 'utf8').trim();
const home = fs.readFileSync(path.join(here, 'partes', '_home.html'), 'utf8').trim();
const shells = [2, 3, 4, 5, 6, 7, 8, 9].map(n => `<section class="step-panel" id="panel-${n}"></section>`).join('\n');
const engines = ['num.js', 'color.js', 'quality.js', 'kinetics.js', 'survival.js', 'resp.js', 'losses.js', 'sensory.js', 'trials.js', 'logistics.js', 'datasets_data.js', 'datasets.js', 'refs.js'];
const ui = ['sheets.js', 'zip.js', 'plot.js', 'art.js', 'core.js'];
const blocks = ['home.js', 'b2.js', 'b3.js', 'b4.js', 'b5.js', 'b6.js', 'b7.js', 'b8.js', 'b9.js'];
const tag = s => `<script src="js/${s}"></script>`;
const scripts = [
  tag('labg-core.js'),
  '<script src="js/labg-figure-studio.js" defer></script>',
  '<script src="js/labg-navigator.js" defer></script>',
  '<script src="js/labg-fx.js" data-app="postharvestpro" defer></script>',
  ...engines.map(tag), ...ui.map(tag),
  '<script src="js/labg-figedit.js" data-key="postharvestpro:figedit" data-title=".fig-title"></script>',
  ...blocks.map(tag),
].join('\n');
const desc = 'Postharvest physiology and technology, quality, shelf life and sensory evaluation in the browser: quality and colour indices, deterioration kinetics with Arrhenius and Q10, time to rejection, respiration and modified atmospheres, losses along the value chain, discrimination, affective and descriptive sensory tests, trials, packaging and cold-storage calculators.';
const html = `<!DOCTYPE html>
<!--
  PostHarvestPro — postharvest physiology and technology, quality, shelf life
  and sensory evaluation, in the browser.
  Copyright (C) 2026  Luis Ángel Barrera-Guzmán

  This program is free software: you can redistribute it and/or modify it under
  the terms of the GNU General Public License as published by the Free Software
  Foundation, either version 3 of the License, or (at your option) any later
  version.

  This program is distributed in the hope that it will be useful, but WITHOUT
  ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS
  FOR A PARTICULAR PURPOSE.  See the GNU General Public License for more details.

  You should have received a copy of the GNU General Public License along with
  this program, in the file LICENSE.  If not, see <https://www.gnu.org/licenses/>.

  This notice covers the whole program: index.html, css/ and the files in js/.
  This file is assembled by tools/armar_index.js.
-->
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title data-es="PostHarvestPro — Poscosecha, calidad, vida de anaquel y evaluación sensorial" data-en="PostHarvestPro — Postharvest, quality, shelf life and sensory evaluation">PostHarvestPro — Poscosecha, calidad, vida de anaquel y evaluación sensorial</title>
<meta name="description" content="${desc}">
<meta name="author" content="Luis Ángel Barrera-Guzmán">
<meta name="labg-repo" content="PostHarvestPro">
<meta property="og:type" content="website">
<meta property="og:title" content="PostHarvestPro — LABG Suite">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="https://luisangelbg.github.io/PostHarvestPro/img/og.png">
<meta property="og:url" content="https://luisangelbg.github.io/PostHarvestPro/">
<meta name="theme-color" content="#EF6C00">
<link rel="icon" href="${favicon}">
<link rel="stylesheet" href="css/labg-base.css">
<link rel="stylesheet" href="css/style.css">
<script src="js/i18n.js"></script>
</head>
<body class="on-home">

<a class="skip-link" href="#main"><span data-l="es">Saltar al contenido</span><span data-l="en">Skip to content</span></a>
${topbar}

<main id="main" tabindex="-1">

${home}

${shells}

</main>

${scripts}
</body>
</html>
`;
fs.writeFileSync(path.join(root, 'index.html'), html);
console.log('index.html:', html.length, 'caracteres.');
