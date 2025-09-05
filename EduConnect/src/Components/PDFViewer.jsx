// src/components/PdfViewerPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/entry.webpack.css";


// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

// Helper hook to parse query parameters
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function PdfViewerPage() {
  const query = useQuery();
  const file = query.get("file");
  const pageNumParam = query.get("page");
  const highlightText = query.get("highlight");

  const [numPages, setNumPages] = useState(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [textItems, setTextItems] = useState([]);
  const textLayerRef = useRef();

  useEffect(() => {
    const p = parseInt(pageNumParam);
    setPageNumber(p && p > 0 ? p : 1);
  }, [pageNumParam]);

  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }

  // Called after text layer rendered to get text spans
  useEffect(() => {
    if (!textLayerRef.current) return;

    const spans = textLayerRef.current.querySelectorAll("span");
    const items = Array.from(spans).map(span => ({
      element: span,
      text: span.textContent.toLowerCase(),
    }));

    setTextItems(items);
  }, [pageNumber]);

  // Highlight text occurrences and scroll to first
  useEffect(() => {
    if (!highlightText || textItems.length === 0) return;

    const lowerHighlight = highlightText.toLowerCase();

    textItems.forEach(({ element }) => {
      element.style.backgroundColor = "";
      element.style.color = "";
    });

    textItems.forEach(({ element, text }) => {
      if (text.includes(lowerHighlight)) {
        element.style.backgroundColor = "yellow";
        element.style.color = "black";
      }
    });

    const firstHighlight = textItems.find(({ text }) => text.includes(lowerHighlight));
    if (firstHighlight) {
      firstHighlight.element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [highlightText, textItems]);

  if (!file) return <div style={{ padding: 20 }}>No PDF file specified.</div>;

  return (
    <div style={{ padding: 20 }}>
      <Document
        file={file}
        onLoadSuccess={onDocumentLoadSuccess}
        loading="Loading PDF..."
      >
        <Page
          pageNumber={pageNumber}
          width={window.innerWidth * 0.8}
          loading="Loading page..."
          renderTextLayer={true}
          onRenderTextLayerSuccess={({ textLayer }) => {
            textLayerRef.current = textLayer.textLayerDiv;
          }}
        />
      </Document>
      <div style={{ marginTop: 10 }}>
        Page {pageNumber} of {numPages || "--"}
      </div>
    </div>
  );
}
