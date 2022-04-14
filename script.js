// Copyright 2022 Mitchell Kember. Subject to the MIT License.

window.addEventListener("load", () => {
  // Describes which cards get derived from which other cards, by HTML ID.
  const derivations = {
    asciimath: [],
    tex: ["asciimath"],
    mathml: ["tex"],
    mathjaxHtmlCss: ["tex"],
    katexHtmlCss: ["tex"],
    nativeMathml: ["mathml"],
  };

  const graph = {};
  let lastUpdateFn = () => {};

  // Populate nodes in the card graph.
  for (const [id, incoming] of Object.entries(derivations)) {
    const element = document.getElementById(id);
    let card = element;
    while (!card.classList.contains("card")) {
      card = card.parentElement;
    }
    const accessors = {};
    if (element.tagName === "TEXTAREA") {
      accessors.get = () => element.value;
      accessors.set = (value) => (element.value = value);
    } else {
      accessors.get = () => element.innerHTML;
      accessors.setHTML = (html) => (element.innerHTML = html);
      accessors.setChild = (child) => {
        while (element.firstChild) {
          element.removeChild(element.firstChild);
        }
        element.appendChild(child);
      };
    }
    graph[id] = {
      id,
      element,
      card,
      incoming,
      outgoing: [],
      ...accessors,
    };
  }

  // Populate outgoing edges in the card graph.
  for (const [id, incoming] of Object.entries(derivations)) {
    for (const other of incoming) {
      graph[other].outgoing.push(id);
    }
  }

  // Depth-first search helper.
  function dfs(x, prop, f) {
    for (const id of x[prop]) {
      const y = graph[id];
      f(x, y);
      dfs(y, prop, f);
    }
  }

  // Helpers for marking cards as stale.
  function markStale(node) {
    node.card.classList.add("card--stale");
  }
  function markFresh(node) {
    node.card.classList.remove("card--stale");
  }

  // Set up dropdown for choosing a sample equation.
  const sampleSelect = document.getElementById("sampleSelect");
  function onSampleSelectInput() {
    graph.asciimath.set(sampleSelect.value);
    graph.asciimath.update();
  }
  sampleSelect.addEventListener("input", onSampleSelectInput);

  // Add event listeners for reactive updates.
  for (const node of Object.values(graph)) {
    if (!node.outgoing) {
      continue;
    }
    node.update = () => {
      dfs(node, "incoming", (_, y) => markStale(y));
      markFresh(node);
      dfs(node, "outgoing", (x, y) => {
        markFresh(y);
        propagate(x, y);
      });
      lastUpdateFn = node.update;
    };
    node.element.addEventListener("input", () => {
      sampleSelect.value = "";
      node.update();
    });
  }

  const asciiMathParser = new AsciiMathParser();

  // Set up checkbox for toggling display math mode.
  const displayModeCheckbox = document.getElementById("displayMode");
  displayModeCheckbox.addEventListener("input", () => lastUpdateFn());

  // Set up radio buttons for controlling the TeX to MathML conversion.
  const mathmlRadioButtons = Array.from(
    document.querySelectorAll('input[name="mathmlGenerator"]')
  );
  let activeMathmlRadioButtton = mathmlRadioButtons.find((b) => b.checked);
  for (const button of mathmlRadioButtons) {
    button.addEventListener("input", () => {
      activeMathmlRadioButtton = mathmlRadioButtons.find((b) => b.checked);
      if (lastUpdateFn == graph.asciimath.update) {
        lastUpdateFn();
      } else {
        graph.tex.update();
      }
    });
  }

  // Returns the MathML generator to use ("mathjax" or "katex").
  function mathmlGenerator() {
    activeMathmlRadioButtton.checked = true;
    return activeMathmlRadioButtton.value;
  }

  // Special case for MathML converting to HTML+CSS.
  const updateNativeMathml = graph.mathml.update;
  graph.mathml.update = () => {
    activeMathmlRadioButtton.checked = false;
    markStale(graph.katexHtmlCss);
    updateNativeMathml();
    propagate(graph.mathml, graph.mathjaxHtmlCss);
  };

  // Add a <style> tag for injecting MathJax styles.
  const mathjaxStyle = document.createElement("style");
  document.head.appendChild(mathjaxStyle);

  // Returns options to use for MathJax rendering in the given graph node.
  function mathjaxOptions(node) {
    return {
      ...MathJax.getMetricsFor(node.element),
      display: displayModeCheckbox.checked,
    };
  }

  // Returns options to use for KaTeX rendering to the given output format.
  function katexOptions(output) {
    return {
      output,
      displayMode: displayModeCheckbox.checked,
      throwOnError: false,
    };
  }

  // Updates graph node y based on graph node x.
  function propagate(x, y) {
    switch (x.id) {
      case "asciimath":
        switch (y.id) {
          case "tex":
            y.set(asciiMathParser.parse(x.get()));
            break;
        }
        break;
      case "tex":
        switch (y.id) {
          case "mathml":
            switch (mathmlGenerator()) {
              case "mathjax":
                y.set(MathJax.tex2mml(x.get(), mathjaxOptions(y)));
                break;
              case "katex":
                y.set(
                  katex
                    .renderToString(x.get(), katexOptions("mathml"))
                    .replace(/^<span class="katex">/, "")
                    .replace(/<\/span>$/, "")
                );
                break;
            }
            break;
          case "mathjaxHtmlCss":
            y.setChild(MathJax.tex2chtml(x.get(), mathjaxOptions(y)));
            mathjaxStyle.replaceWith(MathJax.chtmlStylesheet());
            break;
          case "katexHtmlCss":
            katex.render(x.get(), y.element, katexOptions("html"));
            break;
        }
        break;
      case "mathml":
        switch (y.id) {
          case "mathjaxHtmlCss":
            y.setChild(MathJax.mathml2chtml(x.get(), mathjaxOptions(y)));
            mathjaxStyle.replaceWith(MathJax.chtmlStylesheet());
            break;
          case "nativeMathml":
            y.setHTML(x.get());
            break;
        }
        break;
    }
  }

  // Set up slider to change the size of rendered math.
  const sizeStyle = document.createElement("style");
  document.head.appendChild(sizeStyle);
  document.getElementById("sizeSlider").addEventListener("input", function () {
    const value = 1.5 + 0.75 * this.value;
    sizeStyle.innerHTML = `
      .card-value--rendered {
        font-size: ${value}em;
      }
    `;
  });

  // Allow cards to be dragged around.
  Sortable.create(document.querySelector(".card-grid"), {
    animation: 200,
    handle: ".card-handle",
  });

  // Start with a sample equation.
  onSampleSelectInput();
});
