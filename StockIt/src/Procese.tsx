import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import elisLogo from "./assets/ELIS.png";
import "./CSS/App.css";

interface InventoryItem {
  _id: string;
  name: string;
  cat: string;
  stoc: number;
}

export default function App() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const navigate = useNavigate();
  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  // Fetch inventory
  useEffect(() => {
    fetch("http://localhost:5000/api/inventory")
      .then((res) => res.json())
      .then((data: InventoryItem[]) => {
        // tell TS the data is InventoryItem[]
        setInventory(data);
      })
      .catch((err) => console.error(err));
  }, []);

  // ✅ FILTERED INVENTORY
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesSearch = item.name
        .toLowerCase()
        .includes(search.toLowerCase());

      const matchesCategory = category === "all" || item.cat === category;

      const matchesStock =
        stockFilter === "all" ||
        (stockFilter === "in" && item.stoc > 1) ||
        (stockFilter === "out" && item.stoc < 2);

      const excludeToner = item.cat.toLowerCase() !== "toner"; // Exclude "Toner" category

      return matchesSearch && matchesCategory && matchesStock && excludeToner;
    });
  }, [inventory, search, category, stockFilter]);

  const categories = [...new Set(inventory.map((i) => i.cat))];

  return (
    <>
      <div>
        <a href="/" target="_blank">
          <img src={elisLogo} className="logo react" alt="Elis logo" />
        </a>
        <a href="/consumuri" target="_blank">
          <img src={elisLogo} className="logo react" alt="Elis logo" />
        </a>
        <a href="/procese" target="_blank">
          <img src={elisLogo} className="logo react" alt="Elis logo" />
        </a>
      </div>

      {/* FILTER BAR */}
      <div className="filters">
        <input
          type="text"
          placeholder="Caută produs…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="all">Toate categoriile</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
        >
          <option value="all">Tot</option>
          <option value="in">În stoc</option>
          <option value="out">Stoc critic</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="full-width-table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Categorie</th>
              <th>Nume</th>
              <th>Stoc</th>
              <th>Acte</th>
            </tr>
          </thead>

          <tbody>
            {/* EXISTING ITEMS */}
            {filteredInventory.map((item) => (
              <tr key={item._id}>
                <td>{item.cat}</td>

                <td>{item.name}</td>

                <td>{item.stoc}</td>
                <td>
                  <img
                    src={elisLogo}
                    className="logoElis"
                    alt="Elis logo"
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      window.open(
                        "http://localhost:5000/files/Model-Proces-Verbal.pdf",
                        "_blank",
                      )
                    }
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
