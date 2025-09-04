(async () => {
  const urlParams = new URLSearchParams(window.location.search);
  const file = urlParams.get("file");
  const highlightRaw = urlParams.get("highlight") || "";
  if (!file) return alert("No PDF ?file= provided");

  // Decode and prepare highlight words set
  const highlightText = decodeURIComponent(highlightRaw).toLowerCase().trim();
  const highlightWords = highlightText.length > 0
    ? highlightText.split(/\s+/).filter(Boolean)  // split into words ignoring extra spaces
    : [];

  const container = document.getElementById("viewerContainer");
  container.innerHTML = "";
  container.style.position = "relative";
  container.style.overflowY = "auto";  // Allow vertical scrolling for multi-page
  container.style.height = "100vh";

  pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.9.179/pdf.worker.min.js";

  try {
    const pdf = await pdfjsLib.getDocument(file).promise;
    const pageCount = pdf.numPages;

    const highlightSpan = (span) => {
      span.style.backgroundColor = "yellow";
      span.style.color = "black";
      span.style.fontWeight = "bold";
    };

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      const pageDiv = document.createElement("div");
      pageDiv.style.position = "relative";
      pageDiv.style.marginBottom = "20px";
      container.appendChild(pageDiv);

      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      pageDiv.appendChild(canvas);

      await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

      const textLayerDiv = document.createElement("div");
      textLayerDiv.className = "pdf-text-layer";
      textLayerDiv.style.position = "absolute";
      textLayerDiv.style.top = "0";
      textLayerDiv.style.left = "0";
      textLayerDiv.style.width = `${viewport.width}px`;
      textLayerDiv.style.height = `${viewport.height}px`;
      textLayerDiv.style.pointerEvents = "none";
      pageDiv.appendChild(textLayerDiv);

      const textContent = await page.getTextContent();
      await pdfjsLib.renderTextLayer({
        textContent,
        container: textLayerDiv,
        viewport,
        textDivs: [],
        enhanceTextSelection: false,
      }).promise;

      // Highlight spans that contain any word from highlightWords
      if (highlightWords.length > 0) {
        textLayerDiv.querySelectorAll("span").forEach(span => {
          const spanText = span.textContent.toLowerCase();
          for (const word of highlightWords) {
            if (word.length > 1 && spanText.includes(word)) {
              highlightSpan(span);
              break; // Highlight once per span
            }
          }
        });
      }
    }
  } catch (err) {
    container.innerHTML = "<div style='color:red'>Failed to load PDF!</div>";
    console.error(err);
  }
})();
