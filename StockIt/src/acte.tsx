import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "./CSS/App.css";

interface Document {
  _id: string;
  fileName: string;
  documentType: string;
  uploadedAt: string;
}

interface History {
  _id: string;
  fromLocation: string;
  toLocation: string;
  movedAt: string;
}

export default function Acte() {
  const { id } = useParams();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("other");

  const [documents, setDocuments] = useState<Document[]>([]);
  const [history, setHistory] = useState<History[]>([]);

  // Fetch Documents
  useEffect(() => {
    fetch(`http://localhost:5000/api/inventory/${id}/documents`)
      .then((res) => res.json())
      .then((data) => setDocuments(data))
      .catch((err) => console.error(err));
  }, [id]);

  // Fetch Location History
  useEffect(() => {
    fetch(`http://localhost:5000/api/inventory/${id}/history`)
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch((err) => console.error(err));
  }, [id]);

  const handleUpload = async () => {
    if (!selectedFile) return alert("Select a file first");

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("documentType", documentType);

    try {
      const response = await fetch(
        `http://localhost:5000/api/inventory/${id}/documents`,
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const newDoc = await response.json();

      // Add new doc instantly without refetch
      setDocuments((prev) => [...prev, newDoc]);

      setSelectedFile(null);
      alert("Upload successful");
    } catch (err) {
      console.error(err);
      alert("Upload error");
    }
  };

  const handleDelete = async (docId: string) => {
    if (!window.confirm("Sigur vrei să ștergi documentul?")) return;

    try {
      const res = await fetch(`http://localhost:5000/api/documents/${docId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      setDocuments((prev) => prev.filter((doc) => doc._id !== docId));
    } catch (err) {
      console.error(err);
      alert("Eroare la ștergere");
    }
  };

  const [newLocation, setNewLocation] = useState("");

  const handleMove = async () => {
    if (!newLocation) return alert("Introdu locația");

    try {
      const res = await fetch(
        `http://localhost:5000/api/inventory/${id}/move`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ toLocation: newLocation }),
        },
      );

      if (!res.ok) throw new Error("Move failed");

      // Refresh history
      const historyRes = await fetch(
        `http://localhost:5000/api/inventory/${id}/history`,
      );
      const historyData = await historyRes.json();
      setHistory(historyData);

      setNewLocation("");
      alert("Locație actualizată");
    } catch (err) {
      console.error(err);
      alert("Eroare la mutare");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Documente</h2>
      <div style={{ marginBottom: "20px" }}>
        <h3>Upload document nou</h3>

        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setSelectedFile(e.target.files[0]);
            }
          }}
        />

        <select
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value)}
        >
          <option value="invoice">Factură</option>
          <option value="warranty">Garanție</option>
          <option value="manual">Manual</option>
          <option value="transfer">Proces verbal</option>
          <option value="other">Altul</option>
        </select>

        <button onClick={handleUpload}>Upload</button>
      </div>
      <div style={{ marginTop: "30px", marginBottom: "20px" }}>
        <h3>Mută produsul</h3>

        <input
          type="text"
          placeholder="Noua locație"
          value={newLocation}
          onChange={(e) => setNewLocation(e.target.value)}
        />

        <button onClick={handleMove}>Mută</button>
      </div>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>Tip</th>
            <th>Nume fișier</th>
            <th>Data</th>
            <th>Deschide</th>
            <th>Șterge</th>
          </tr>
        </thead>
        <tbody>
          {documents.map((doc) => (
            <tr key={doc._id}>
              <td>{doc.documentType}</td>
              <td>{doc.fileName}</td>
              <td>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
              <td>
                <button
                  onClick={() =>
                    window.open(
                      `http://localhost:5000/api/documents/${doc._id}`,
                      "_blank",
                    )
                  }
                >
                  View
                </button>
              </td>
              <td>
                <button onClick={() => handleDelete(doc._id)}>🗑</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "40px" }}>Istoric Locații</h2>

      <table className="inventory-table">
        <thead>
          <tr>
            <th>De la</th>
            <th>La</th>
            <th>Data</th>
          </tr>
        </thead>
        <tbody>
          {history.map((entry) => (
            <tr key={entry._id}>
              <td>{entry.fromLocation || "-"}</td>
              <td>{entry.toLocation}</td>
              <td>{new Date(entry.movedAt).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
