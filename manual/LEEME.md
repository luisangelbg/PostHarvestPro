# Manual de usuario de PostHarvestPro

Manual en español (y después en inglés), en HTML, pensado para imprimirse a PDF. Sigue la misma forma que los de
las demás aplicaciones LABG: hoja tamaño carta sin márgenes añadidos, Cormorant para los títulos, Crimson Pro para
el texto y Jost para los rótulos, y una portada **blanca** (regla del autor, también para la edición inglesa) que es
**una sola ilustración vectorial original**, dibujada por código con los motores de la propia app. La identidad es
la de la app: el naranja fruto (`#EF6C00`, texto `#B85000`) y el verde inmaduro (`#7CB342`, texto `#4E7A1E`) sobre
la crema (`#FFF3E0`), con el oro y el negro de la suite.

Reemplaza al manual viejo de la app, que ya se retiró del repositorio. La fuente de contenido de los capítulos es la
app misma: cada cifra y cada texto de la interfaz se comprueban en ella.

## Regla: sólo los datos de ejemplo simulados

Todas las capturas y todas las cifras salen de los **diez conjuntos de ejemplo** de la app (`js/datasets_data.js`,
generados por `tools/generar_datos.R` con la semilla 20261004; los mismos CSV están en `data/`) o de los valores que
traen escritos las herramientas sin entrada de datos. Son **simulados**: el texto dice «el mango del ejemplo», nunca
como si fuera un lote, un huerto o un panel reales. Ninguna receta abre archivos del disco: cargan el ejemplo con
`ejemplo()` de `recetas/_comun.js`.

## Carpetas

```
manual/
  LEEME.md              este archivo
  GUIA-CAPITULOS.md     el encargo para quien escriba los capítulos 1 a 9 y los apéndices
  manual.css            hoja de estilo de la portada
  interior.css          hoja de estilo de las páginas interiores (colores por bloque, recuadros, tablas, figuras)
  paginar.js            reparte cada parte en hojas carta, con encabezado, número y pestaña
  es/                   las partes en español (y manual-completo.html, generado)
  en/                   la edición inglesa (por ahora sólo la portada; misma estructura)
  img/                  las capturas en español, una por receta; img/en/ las inglesas
  herramientas/         captura, revisión, anchos, portada, referencias y unión
    recetas/            una receta por captura; _comun.js se antepone a todas
```

## Cómo está partido

Un archivo por parte, en `es/`, y **cada capítulo explica el bloque del mismo número**; la introducción no lleva
número (sus secciones son I.1, I.2…). Los rótulos son los de la app.

| Archivo | Contenido |
|---|---|
| `00a-portada.html` | Portada (la escribe `herramientas/genera-portada.js`; no se edita a mano) |
| `00b-introduccion.html` | Créditos, índice general, cómo leer el manual e introducción (I.1 a I.10) — **escrita** |
| `01-bloque1.html` | Capítulo 1 · Inicio: portada de la app, «Cómo funciona», «Los nueve bloques», «Datos de ejemplo», «Métodos y fuentes», «La poscosecha en breve», «Lo que no hace», «Referencias» y «Cómo citar» |
| `02-bloque2.html` | Capítulo 2 · Calidad y madurez: entrada de datos, Resumen de calidad, Color, Acidez/humedad/firmeza, Escalas, Calibres |
| `03-bloque3.html` | Capítulo 3 · Cinética y vida de anaquel: Modelos cinéticos, Temperatura, Prueba acelerada, Tiempo hasta rechazo |
| `04-bloque4.html` | Capítulo 4 · Respiración, etileno y atmósferas: Sistema estático, Flujo continuo, Climaterio, Atmósfera modificada, Preenfriamiento y carga térmica |
| `05-bloque5.html` | Capítulo 5 · Pérdidas y cadena de valor: Pérdidas por etapa, Simular mejoras, Daño mecánico |
| `06-bloque6.html` | Capítulo 6 · Evaluación sensorial: Discriminativas, Hedónica, Punto justo (JAR), CATA, Perfil descriptivo, Fichas de cata |
| `07-bloque7.html` | Capítulo 7 · Ensayos poscosecha: Factorial tratamiento × tiempo, Medidas repetidas, Pendientes, Aleatorización |
| `08-bloque8.html` | Capítulo 8 · Empaque y logística: Tarima y contenedor, Ventilación, Ambiente del almacén, Costo, Compatibilidad, Unidades |
| `09-bloque9.html` | Capítulo 9 · Informe y proyecto: datos y secciones del informe, recomendaciones de manejo, figuras, proyecto y cita |
| `10-apendices.html` | Apéndices A–F: A archivos, B reglas y fórmulas, C glosario, D cuando algo falla, E licencia y cita, F referencias (las escribe `genera-referencias.js`) |
| `manual-completo.html` | Las partes unidas, que es lo que se imprime (lo genera `herramientas/unir-manual.ps1`; no se edita a mano) |

`GUIA-CAPITULOS.md` trae, bloque por bloque, las pestañas, las tarjetas, los controles con sus valores por omisión y
las cifras de los ejemplos.

La portada usa sólo `manual.css`, porque es una hoja entera de dibujo. Todo lo demás usa `interior.css` y
`paginar.js`, que reparten el texto en hojas con su encabezado corrido («PostHarvestPro · Manual de usuario», o
«PostHarvestPro · User’s Manual» cuando la parte lleva `lang="en"`, con «(continued)» en las tablas partidas), su
número de página y la pestaña del capítulo en el margen (once pestañas: In, 1 a 9 y Ap, separadas 0.82 in). Los
números de página del índice se llenan solos; en una parte suelta quedan en blanco, que es lo esperado hasta que se
unen. El índice general de `00b-introduccion.html` ya trae el h1 y los h2 propuestos de cada capítulo con sus `id`
(`cap-N`, `sN-M`, `ap-a`…`ap-f`): quien escriba un capítulo lo ajusta si cambia un título.

## Los colores de los bloques

La app no tiene un color por bloque, así que se tomaron de su propia paleta (`css/style.css`): el naranja y el
verde de la identidad, cinco colores de la serie de las gráficas (`--s2`, `--s8`, `--s7`, `--s4`, `--s6`,
oscurecidos lo justo para llevar texto blanco), el café del cartón y el oro de la suite.

| Variable | Color | Bloque |
|---|---|---|
| `--b0` | `#2b1d10` café casi negro | Preliminares e introducción (pestaña In) |
| `--b1` | `#b85000` naranja fruto (texto) | 1 · Inicio |
| `--b2` | `#4e7a1e` verde inmaduro (texto) | 2 · Calidad y madurez |
| `--b3` | `#2a6f88` azul (`--s2`) | 3 · Cinética y vida de anaquel |
| `--b4` | `#2f7a68` verde azulado (`--s8`) | 4 · Respiración, etileno y atmósferas |
| `--b5` | `#b0362a` rojo (`--s7`) | 5 · Pérdidas y cadena de valor |
| `--b6` | `#943871` frambuesa (`--s4`) | 6 · Evaluación sensorial |
| `--b7` | `#5050a6` índigo (`--s6`) | 7 · Ensayos poscosecha |
| `--b8` | `#8a5a2b` café del cartón | 8 · Empaque y logística |
| `--b9` | `#94701c` oro de la suite | 9 · Informe y proyecto |
| `--bx` | `#2b1d10` café casi negro | Apéndices (pestaña Ap) |

Las clases `.k0` a `.k9` y `.kx` pintan los chips del índice y las franjas; cada capítulo pone
`style="--acento: var(--bN)"` en su `<section>`. Los recuadros «aviso» y «error» usan el rojo del fruto pasado
(`--ambar`, `#b5401a`) e «idea» el verde (`--verde`), fijos, para que no cambien de color con el capítulo. Los
títulos menores, los encabezados de tabla y los enlaces van en naranja tostado (`--marino`, `#7a3a08`).

## Las capturas

Las imágenes de `img/` salen de la app misma, a doble resolución, con una receta por imagen en
`herramientas/recetas/`. Cada receta es un fragmento que abre una herramienta con su ejemplo, ajusta los controles
y devuelve el recorte; su primera línea dice el tamaño de la ventana (`// ventana 1400x1000`).
`recetas/_comun.js` se antepone a todas:

| Ayudante | Qué hace |
|---|---|
| `ejemplo(clave)` | Abre la herramienta y carga su ejemplo, como los botones «Abrir en …» de la portada (`window.PHLoad[clave]`; claves `b2q b2c b2g b2k b3k b3s b4s b4c b5c b5d b6d b6h b6j b6c b6q b7f b7r b7p`; la tabla está en `_comun.js`) |
| `herramienta(n, tab)` | Abre el bloque `n` y su pestaña (`Tabs.go`); para las herramientas que ya abren con valores escritos |
| `listo()` | Espera dos cuadros y, si la hubiera, a que se cierre la capa de espera (`.lw-backdrop`). Los cálculos de la app son síncronos: no hay nada más que esperar |
| `tarjeta(txt)`, `figura(nombre)`, `seccion(id)` | Una tarjeta por el comienzo de su título h2, el recuadro de una figura por su nombre (`.fig-box[data-fig]`: `b3-cinetica`, `b4-atmosfera`…), una sección de la portada |
| `irA`, `caja`, `vis`, `porId`, `W`, `EN`, `L` | Llevar a la vista, recortar, buscar, esperar, idioma |

Además esconde los botones flotantes del navegador LABG y los avisos emergentes. Cada captura tarda unos 7 s
(abrir el navegador, la app dos veces y el ejemplo).

Recetas ya hechas (introducción): `i-inicio` (portada de la app), `i-interfaz` (Bloque 3 › Modelos cinéticos con
el mango cargado, con 12 marcas), `i-buscar` («vida de anaquel» en `Ctrl + K`), `i-ejemplo` («Datos de ejemplo»,
las seis primeras tarjetas) e `i-flujo` («Cómo funciona»; a 1400 px los siete pasos quedan en 6 + 1).

Desde la raíz de la app (no hay `node` en el PATH de este equipo; se usa el de Creative Cloud):

```
set NODE="C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe"
%NODE% manual/herramientas/captura.js i-interfaz                    # una
%NODE% manual/herramientas/captura.js i-interfaz --idioma en --salida en/i-interfaz
%NODE% manual/herramientas/captura.js --todas                       # todas
%NODE% manual/herramientas/captura.js --todas --idioma en           # todas, en inglés, a img/en/
```

El idioma se elige escribiendo la clave `postharvestpro:lang` (valor `es` o `en`, sin comillas JSON; `js/i18n.js`)
en el almacenamiento del navegador antes de abrir la app. Si una receta deja en `window.__marcas` una lista
`[[n, x%, y%], …]`, la herramienta escribe además `img/<nombre>.marcas.json` con la posición de los círculos
numerados que el texto pone encima (`<span class="marca" style="left:…%;top:…%">n</span>`).
**Después de cambiar algo visible en la app, se vuelven a sacar las capturas afectadas**: el texto del manual cita
los números que se ven en ellas, y todos se comprueban en la app.

## Las herramientas

Todas usan `cdp.js`, que abre Edge (o Chrome) sin ventana con un perfil temporal propio
(`postharvestpro-manual-<puerto>` en la carpeta temporal), activa `Emulation.setFocusEmulationEnabled` (para que la
página se crea visible y siga pintando en tandas largas), le pide cerrarse con `Browser.close` y borra el perfil al
terminar; si el navegador no se cierra, cierra sólo los procesos de ese perfil. Nunca toca el navegador del usuario.
Node 18 o posterior; sin dependencias.

| Herramienta | Para qué |
|---|---|
| `captura.js` | Saca una captura de la app con su receta (`--idioma en` para la interfaz inglesa) |
| `revisar.js` | Dice cuántas hojas salen, si alguna desborda, las imágenes que no cargaron y los huecos grandes al pie de cada hoja, con la figura que los causa (`… revisar.js manual/es/03-bloque3.html --huecos 1.2`) |
| `anchos.js` | Pone o quita las clases de ancho de las figuras por el nombre de su imagen (`… anchos.js archivo b3-arrhenius=w70 …`; `=w100` la quita) |
| `genera-portada.js` | Dibuja la portada blanca con los motores de la app sobre los datos de ejemplo: cinco frutos con la silueta del logo (`Art.logo`) pintados con el color L*a*b* medio del mango a 20 °C los días 0 a 12 (`Color.labToHex`); la firmeza de los 72 mangos con la curva elegida por AIC a 13, 20 y 25 °C (`Kin.compare`), el límite de 25 N y la vida al límite (25.9, 10.4 y 6.3 d, `Kin.timeToLimit`); la franja de los nueve bloques; y tres viñetas: Arrhenius (Eₐ 84.2 kJ/mol), Kaplan–Meier del chayote y la tira de color por día. `--idioma en` para la inglesa. Tarda un par de segundos |
| `genera-referencias.js` | Escribe las referencias del apéndice F desde `js/refs.js` (`Refs.REFS`, 81 obras), agrupadas en siete temas por el primer bloque que las cita en `Refs.METHODS` (calidad y color, cinética, respiración, pérdidas, sensorial, ensayos, empaque), entre las marcas `<!-- REFERENCIAS -->` y `<!-- /REFERENCIAS -->` de `10-apendices.html`; `--idioma en` para la inglesa |
| `unir-manual.ps1` | Une las partes en `manual-completo.html`, con el título en el idioma de la carpeta («PostHarvestPro · Manual de usuario» o «PostHarvestPro · User’s Manual») |

Las figuras demasiado altas para la hoja se angostan con las clases `figure.w50` a `figure.w80` de `interior.css`;
los textos de las capturas no deben quedar por debajo de lo legible (una captura con mucho texto, no menos de
`w70`). `paginar.js` adelanta el texto que sigue a una figura que no cabe, así que un hueco al pie de una hoja no
siempre se arregla moviendo párrafos. Una figura con marcas arrastra su lista (`ul.leyenda-marcas`): el hueco antes
de ella es esperado.

## Cómo se trabaja

1. Escribir la parte en `es/NN-bloqueN.html` con la estructura de `GUIA-CAPITULOS.md`.
2. Sacar sus capturas con su receta y mirarlas una por una (la herramienta las deja en `img/`).
3. Revisar la paginación: `revisar.js` con `--huecos 1.2`; ningún desborde, ninguna imagen sin cargar, y los huecos
   grandes sólo antes de una figura que de verdad no cabe. Ajustar anchos con `anchos.js`.
4. Cuando estén todas las partes, escribir las referencias y unirlas:

```
"C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe" manual/herramientas/genera-referencias.js
cd manual
powershell -ExecutionPolicy Bypass -File herramientas\unir-manual.ps1 es
```

Escribe `es/manual-completo.html` con la portada como primera hoja y las once partes en orden, con un solo
`paginar.js`, de modo que la numeración sea continua y el índice encuentre las páginas de todos los capítulos. Los
estilos propios de cada parte se funden; si dos partes escriben el mismo selector con valores distintos, gana el
más frecuente y el otro se acota a las hojas de su capítulo. **El script tiene que guardarse con marca de orden de
bytes (BOM)**: Windows PowerShell 5.1 lee como ANSI un `.ps1` sin ella, y el `·` del título saldría mal.

## La edición inglesa

Misma estructura en `en/` (`<html lang="en">`), con las capturas de `img/en/` (`captura.js --todas --idioma en`),
la portada de `genera-portada.js --idioma en` y las referencias de `genera-referencias.js --idioma en`. Se escribe
cuando la española esté terminada y revisada; la unión es `unir-manual.ps1 en`.

## Cómo se obtiene el PDF

**Sólo al final**, cuando todas las partes están escritas y revisadas, y **de una sola vez**: unir PDF sueltos pierde
los enlaces del índice y reinicia la numeración. No se imprime tras cada parte ni tras cada corrección. Después de
unir, se imprime con el guion de PowerShell que maneja Chrome por el protocolo de DevTools y espera a que carguen las
tres tipografías y a que `paginar.js` reparta las hojas (no se usa `--print-to-pdf`, que imprime antes); es el mismo
`imprimir-pdf.ps1` que usaron PalynoPro y ForestPro (ver su `LEEME.md`), con `-Url` apuntando a
`manual/es/manual-completo.html` y `-Prof "%TEMP%\postharvestpro-pdf"`. Al terminar se borra ese perfil temporal y se
comprueba que no quedó ningún Chrome sin ventana de él (sin cerrar los navegadores del usuario). También se puede
imprimir a mano desde el navegador: destino **Guardar como PDF**, márgenes **Ninguno** y **Gráficos de fondo**
activado.

El resultado se guarda como `manual/PostHarvestPro_Manual_de_usuario_ES.pdf` (y
`manual/en/PostHarvestPro User's Manual (English).pdf`), igual que en las demás apps.

## El enlace desde la app

La app todavía no enlaza al manual nuevo (ni al viejo). Conviene ponerlo, como en ForestPro, en la nota del pie de la
portada (`tools/partes/_home.html`, que arma `index.html` con `tools/armar_index.js`):
`manual/es/manual-completo.html` en español y `manual/en/manual-completo.html` en inglés, con `target="_blank"`.

## De fuera

Las tres tipografías (Cormorant, Crimson Pro y Jost) vienen del servicio público de tipografías web y sólo las usa el
manual, no la app; tienen licencia SIL Open Font License. Todo lo demás —el texto, las capturas, la portada y las
herramientas— es propio. El manual no nombra programas ni marcas, salvo en la sección I.9 («Cómo se comprobó»), que
dice contra qué se validó la app; el detalle está en `tests/validacion/`.
