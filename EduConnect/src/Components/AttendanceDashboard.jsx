import React, { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import "./AttendanceDashboard.css";

// Dummy data matching your screenshot
const dummyData = [
  { code: "22CSH-401", title: "Research Methodology", delivered: 22, attended: 0, idl: 22, adl: 0, vdl: 0, medical: 0, eligibleDelivered: 22, eligibleAttended: 22, eligiblePercentage: 100 },
  { code: "22CSH-422", title: "IOT Protocols", delivered: 23, attended: 0, idl: 23, adl: 0, vdl: 0, medical: 0, eligibleDelivered: 23, eligibleAttended: 23, eligiblePercentage: 100 },
  { code: "22CSI-414", title: "INSTITUTE/INDUSTRIAL/SUMMER TRAINING", delivered: 0, attended: 0, idl: 0, adl: 0, vdl: 0, medical: 0, eligibleDelivered: 0, eligibleAttended: 0, eligiblePercentage: 0 },
  { code: "22CSR-414", title: "Capstone Project - 1", delivered: 0, attended: 0, idl: 0, adl: 0, vdl: 0, medical: 0, eligibleDelivered: 0, eligibleAttended: 0, eligiblePercentage: 0 },
  { code: "ECO-351", title: "Foundation Course in Wireless & Mobile Communication", delivered: 5, attended: 0, idl: 5, adl: 0, vdl: 0, medical: 0, eligibleDelivered: 5, eligibleAttended: 5, eligiblePercentage: 100 }
];

export default function AttendanceDashboard() {
  const [data, setData] = useState(dummyData);

  useEffect(() => {
    // Uncomment and adapt this for backend:
    // fetch("/api/attendance")
    //   .then(res => res.json())
    //   .then(setData)
    //   .catch(() => setData(dummyData));
    setData(dummyData); // for demo
  }, []);

  // Only courses with eligibleDelivered > 0
  const chartData = data.filter(row => row.eligibleDelivered > 0);

  return (
    <div className="attendance-dashboard">
      <h2>Attendance Dashboard</h2>

      
      {/* Chart */}
<div className="attendance-chart-wrapper">
  <ResponsiveContainer width="100%" height={280}>
    <BarChart data={chartData} barSize={35}>
      <XAxis dataKey="code" />
      <YAxis domain={[0, 125]} />
      <Tooltip />
      <Bar dataKey="eligiblePercentage" fill="#3556ad" radius={[8, 8, 0, 0]} />
    </BarChart>
  </ResponsiveContainer>
  <div className="chart-legend">
    <span className="legend-dot"></span>
    <span>Total Percentage</span>
  </div>
</div>

      {/* Table */}
      <div className="attendance-table-responsive">
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Course Code</th>
              <th>Title</th>
              <th>Total Delv.</th>
              <th>Total Attd.</th>
              <th>IDL</th>
              <th>ADL</th>
              <th>VDL</th>
              <th>Medical Leave</th>
              <th>Eligible Delivered</th>
              <th>Eligible Attended</th>
              <th>Eligible Percentage</th>
              <th>View Attendance</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, ix) => (
              <tr key={ix}>
                <td>{row.code}</td>
                <td>{row.title}</td>
                <td>{row.delivered}</td>
                <td>{row.attended}</td>
                <td>{row.idl}</td>
                <td>{row.adl}</td>
                <td>{row.vdl}</td>
                <td>{row.medical}</td>
                <td>{row.eligibleDelivered}</td>
                <td>{row.eligibleAttended}</td>
                <td>{row.eligiblePercentage}</td>
                <td>
                  <button className="view-btn">VIEW</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Types of Duty Leaves */}
      <div className="attendance-leave-types" style={{ marginTop: 18 }}>
        <b>Types of Duty Leaves</b><br />
        <span style={{ color: "red" }}>IDL : Industrial Duty Leave</span><br />
        <span style={{ color: "red" }}>ADL : Assigned Duty Leave</span><br />
        <span style={{ color: "red" }}>VDL : Voluntary Duty Leave</span>
      </div>

      {/* Download Button */}
      <div style={{ marginTop: 22, textAlign: "center" }}>
        <button className="download-pdf-btn">DOWNLOAD AS PDF</button>
      </div>
    </div>
  );
}
