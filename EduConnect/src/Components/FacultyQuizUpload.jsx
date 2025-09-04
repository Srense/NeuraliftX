import React, { useState, useEffect } from "react";

export default function FacultyQuizComponent() {
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfList, setPdfList] = useState([]);

  const BACKEND_URL = "http://localhost:4000"; // Your backend server URL

  // Fetch PDFs from backend
  const fetchPdfs = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/quizzes`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPdfList(data);
      } else {
        alert("Failed to load PDFs");
      }
    } catch (error) {
      console.error(error);
      alert("Error fetching PDFs");
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  const onFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      alert("Please select a PDF file.");
      e.target.value = null;
      setPdfFile(null);
    }
  };

  const uploadPdf = async () => {
    if (!pdfFile) {
      alert("No PDF selected.");
      return;
    }
    const formData = new FormData();
    formData.append("pdf", pdfFile);

    try {
      const res = await fetch(`${BACKEND_URL}/api/quizzes/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
        body: formData,
      });
      if (res.ok) {
        alert("PDF uploaded.");
        setPdfFile(null);
        fetchPdfs();
      } else {
        const err = await res.json();
        alert("Upload failed: " + (err.message || res.statusText));
      }
    } catch (error) {
      alert("Upload error.");
      console.error(error);
    }
  };

  const deletePdf = async (id) => {
    if (!window.confirm("Delete this PDF?")) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/quizzes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      if (res.ok) {
        alert("PDF deleted.");
        setPdfList(pdfList.filter((pdf) => pdf._id !== id));
      } else {
        const err = await res.json();
        alert("Delete failed: " + (err.message || res.statusText));
      }
    } catch (error) {
      alert("Delete error.");
      console.error(error);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Upload Quiz PDF</h2>
      <input type="file" accept="application/pdf" onChange={onFileChange} />
      <button onClick={uploadPdf} disabled={!pdfFile} style={{ marginTop: 10 }}>
        Upload PDF
      </button>

      <h3 style={{ marginTop: 30 }}>Uploaded PDFs</h3>
      {pdfList.length === 0 && <p>No PDFs uploaded yet.</p>}
      <ul>
        {pdfList.map((pdf) => (
          <li key={pdf._id}>
            <a href={`${BACKEND_URL}/api/quizzes/${pdf._id}`} target="_blank" rel="noopener noreferrer">
              {pdf.filename}
            </a>
            <button onClick={() => deletePdf(pdf._id)} style={{ marginLeft: 10, color: "red" }}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
