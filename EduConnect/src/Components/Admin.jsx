import React, { useState, useEffect } from "react";

export default function Admin({ token }) {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    refNumber: "",
    contentType: "text",
    message: "",
    surveyQuestions: [],
    visibleTo: { students: false, faculty: false, alumni: false }
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function fetchAnnouncements() {
    setLoading(true);
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/admin/announcements", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setAnnouncements(data);
    } catch {
      alert("Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }

  function handleInputChange(e) {
    const { name, value, type, checked } = e.target;
    if (name.startsWith("visibleTo.")) {
      const key = name.split(".")[1];
      setFormData(fd => ({ ...fd, visibleTo: { ...fd.visibleTo, [key]: checked } }));
    } else {
      setFormData(fd => ({ ...fd, [name]: type === "checkbox" ? checked : value }));
    }
  }

  function addSurveyQuestion() {
    setFormData(fd => ({
      ...fd,
      surveyQuestions: [...fd.surveyQuestions, { question: "", inputType: "text", options: [] }]
    }));
  }

  function updateSurveyQuestion(i, key, value) {
    setFormData(fd => {
      const sq = [...fd.surveyQuestions];
      sq[i][key] = value;
      return { ...fd, surveyQuestions: sq };
    });
  }

  function removeSurveyQuestion(i) {
    setFormData(fd => {
      const sq = [...fd.surveyQuestions];
      sq.splice(i, 1);
      return { ...fd, surveyQuestions: sq };
    });
  }

  async function handleSubmit() {
    try {
      const res = await fetch("https://neuraliftx.onrender.com/api/admin/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to create announcement");
      alert("Announcement created");
      setFormData({
        title: "", date: "", time: "", refNumber: "", contentType: "text",
        message: "", surveyQuestions: [], visibleTo: { students: false, faculty: false, alumni: false }
      });
      fetchAnnouncements();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Announcement Management</h2>
      <div style={{ border: "1px solid #ccc", padding: 10, marginBottom: 20 }}>
        <h3>Create Announcement</h3>
        <input name="title" placeholder="Title" value={formData.title} onChange={handleInputChange} />
        <input name="date" type="date" value={formData.date} onChange={handleInputChange} />
        <input name="time" type="time" value={formData.time} onChange={handleInputChange} />
        <input name="refNumber" placeholder="Reference Number" value={formData.refNumber} onChange={handleInputChange} />
        <div>
          <label>Content Type:
            <select name="contentType" value={formData.contentType} onChange={handleInputChange}>
              <option value="text">Text</option>
              <option value="survey">Survey</option>
            </select>
          </label>
        </div>
        {formData.contentType === "text" ? (
          <textarea name="message" placeholder="Message" value={formData.message} onChange={handleInputChange} />
        ) : (
          <div>
            <button onClick={addSurveyQuestion}>Add Survey Question</button>
            {formData.surveyQuestions.map((q, i) => (
              <div key={i}>
                <input
                  placeholder="Question"
                  value={q.question}
                  onChange={e => updateSurveyQuestion(i, "question", e.target.value)}
                />
                <select value={q.inputType} onChange={e => updateSurveyQuestion(i, "inputType", e.target.value)}>
                  <option value="text">Text</option>
                  <option value="radio">Single Choice</option>
                  <option value="checkbox">Multiple Choice</option>
                  <option value="select">Dropdown</option>
                </select>
                {(q.inputType === "radio" || q.inputType === "checkbox" || q.inputType === "select") && (
                  <input
                    placeholder="Options (comma separated)"
                    value={q.options.join(",")}
                    onChange={e => updateSurveyQuestion(i, "options", e.target.value.split(",").map(o => o.trim()))}
                  />
                )}
                <button onClick={() => removeSurveyQuestion(i)}>Remove</button>
              </div>
            ))}
          </div>
        )}
        <div>
          <label><input type="checkbox" name="visibleTo.students" checked={formData.visibleTo.students} onChange={handleInputChange} /> Students</label>
          <label><input type="checkbox" name="visibleTo.faculty" checked={formData.visibleTo.faculty} onChange={handleInputChange} /> Faculty</label>
          <label><input type="checkbox" name="visibleTo.alumni" checked={formData.visibleTo.alumni} onChange={handleInputChange} /> Alumni</label>
        </div>
        <button onClick={handleSubmit}>Create</button>
      </div>

      <h3>Existing Announcements</h3>
      <ul>
        {announcements.map(a => (
          <li key={a._id}>
            <b>{a.title}</b> ({a.contentType}) — Visible to:
            {a.visibleTo.students && " Students"}
            {a.visibleTo.faculty && " Faculty"}
            {a.visibleTo.alumni && " Alumni"}
            <button onClick={async () => {
              if(window.confirm("Delete announcement?")) {
                await fetch(`https://neuraliftx.onrender.com/api/admin/announcements/${a._id}`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` }
                });
                fetchAnnouncements();
              }
            }}>Delete</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
