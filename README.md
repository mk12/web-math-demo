# Web Math Demo

Web Math Demo is a web app that compares ways of rendering math notation. This is useful if you're trying to choose a strategy for your blog or website.

It supports [AsciiMath], [TeX], and [MathML] input, and renders to [MathJax] HTML+CSS, [KaTeX] HTML+CSS, and using the browser's native [MathML] rendering. As of 2022, Firefox has the best MathML support, Safari has lower quality support, and Chrome has none at all.

## Usage

Clone and open index.html, or visit https://mk12.github.io/web-math-demo.

As you type in the input boxes, the app automatically updates other boxes, or marks them stale (indicated with a red background) if it cannot. For example, typing in AsciiMath will update everything, but typing in TeX will make AsciiMath stale because there is no reverse transformation. The conversion from TeX to MathML can be done via MathJax or KaTeX, controlled by radio buttons. If you type in the MathML box, it will show the rendered MathML and also MathJax HTML+CSS, but not KaTeX HTML+CSS because KaTeX does not support MathML as input (so unlike MathJax, it cannot act as a MathML polyfill).

## License

© 2022 Mitchell Kember

Web Math Demo is available under the MIT License; see [LICENSE](LICENSE.md) for details.

[AsciiMath]: http://asciimath.org
[TeX]: https://www.latex-project.org
[MathML]: https://www.w3.org/Math
[MathJax]: https://www.mathjax.org
[KaTeX]: https://katex.org
