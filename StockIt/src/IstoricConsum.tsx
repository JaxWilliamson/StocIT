import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import elisLogo from "./assets/ELIS.png";
import "./CSS/Istoric.css";

interface FisaConsum {
  _id: string;
  productId: string;
  cant: number;
  date: string;
  user: string;
  locm: string;
}

interface InventoryItem {
  _id: string;
  name: string;
  cat: string;
  stoc: number;
}

export default function IstoricConsum() {
  const location = useLocation();
  const item: InventoryItem = location.state?.item;

  if (!item) return <div>No item data passed!</div>;

  const [consumptions, setConsumptions] = useState<FisaConsum[]>([]);
  const [newCant, setNewCant] = useState<number>(1);
  const [newUser, setNewUser] = useState<string>("");
  const [newLocm, setNewLocm] = useState<string>("");

  // Fetch consumptions
  useEffect(() => {
    fetch("http://localhost:5000/api/consum")
      .then((res) => res.json())
      .then((data: any[]) => {
        const formatted = data.map((c) => ({
          _id: c._id.$oid || c._id,
          productId: c.productId.$oid || c.productId,
          cant: c.cant,
          date: c.date?.$date
            ? new Date(c.date.$date).toISOString()
            : new Date(c.date).toISOString(),
          user: c.user,
          locm: c.locm,
        }));
        setConsumptions(formatted);
      })
      .catch((err) => console.error(err));
  }, []);

  // Add new consumption
  const handleAddConsum = async () => {
    if (!newCant || newCant <= 0)
      return alert("Introduceți o cantitate validă");

    try {
      const res = await fetch("http://localhost:5000/api/consum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: item._id,
          cant: newCant,
          user: newUser,
          locm: newLocm,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Eroare la adăugare consum");

      setConsumptions((prev) => [
        ...prev,
        {
          ...data,
          productId: item._id,
          date: new Date().toISOString(),
        },
      ]);

      setNewCant(1);
      setNewUser("");
      setNewLocm("");
    } catch (err) {
      console.error(err);
      alert("Eroare la adăugare consum: " + (err as Error).message);
    }
  };

  return (
    <>
      <div>
        <h1>Istoric Consum</h1>
        <h2>Produs: {item.name}</h2>
      </div>

      <div className="anexa">
        <img src={elisLogo} className="logo react" alt="Elis logo" />
        <h2>ELIS PAVAJE SRL</h2>
      </div>

      <div className="full-width-table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Categorie</th>
              <th>Nume</th>
              <th>Cantitate Consumata</th>
              <th>Data</th>
              <th>User</th>
              <th>Locație</th>
              <th>Acțiune</th>
            </tr>
          </thead>

          <tbody>
            {/* Add consumption row */}
            <tr>
              <td>{item.cat}</td>
              <td>{item.name}</td>
              <td>
                <input
                  type="number"
                  min={1}
                  value={newCant}
                  onChange={(e) => setNewCant(parseInt(e.target.value))}
                />
              </td>
              <td>{new Date().toLocaleDateString()}</td>
              <td>
                <input
                  type="text"
                  value={newUser}
                  onChange={(e) => setNewUser(e.target.value)}
                  placeholder="User"
                />
              </td>
              <td>
                <input
                  type="text"
                  value={newLocm}
                  onChange={(e) => setNewLocm(e.target.value)}
                  placeholder="Locație"
                />
              </td>
              <td>
                <button className="add-btn" onClick={handleAddConsum}>
                  +
                </button>
              </td>
            </tr>

            {/* Existing consumptions */}
            {consumptions
              .filter((c) => c.productId === item._id)
              .map((c) => (
                <tr key={c._id}>
                  <td>{item.cat}</td>
                  <td>{item.name}</td>
                  <td>{c.cant}</td>
                  <td>{new Date(c.date).toLocaleDateString()}</td>
                  <td>{c.user}</td>
                  <td>{c.locm}</td>
                  <td></td>
                </tr>
              ))}
            {consumptions.filter((c) => c.productId === item._id).length ===
              0 && (
              <tr>
                <td colSpan={7}>Nu există consumuri pentru acest produs.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
