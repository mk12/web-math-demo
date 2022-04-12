// Copyright 2022 Mitchell Kember. Subject to the MIT License.

const $asciimath = document.getElementById("Asciimath");
const $tex = document.getElementById("Tex");
const $mathml = document.getElementById("Mathml");
const $mathjax = document.getElementById("Mathjax");
const $katex = document.getElementById("Katex");
const $mathmlBrowser = document.getElementById("MathmlBrowser");
const $mathmlCss = document.getElementById("MathmlCss");
const $mathmlMathjax = document.getElementById("MathmlMathjax");

const asciiMathParser = new AsciiMathParser();

function stale(textarea) {
    textarea.classList.add("stale");
}

function fresh(textarea) {
    textarea.classList.remove("stale");
}

$asciimath.oninput = function() {
    fresh(this);
    $tex.value = asciiMathParser.parse(this.value);
    const node = parseMath(this.value);
    console.log(node);
    // while ($mathml.firstChild) {
    //     $mathml.removeChild($mathml.firstChild);
    // }
    // $mathml.appendChild(asciimath.parseMath(this.value));
};

$tex.oninput = function() {
    fresh(this);
    stale($asciimath);
};

$mathml.oninput = function() {
    fresh(this);
    stale($asciimath);
    stale($tex);
}

$asciimath.oninput();
