import { useEffect, useState, useMemo } from "react";
import elisLogo from "./assets/ELIS.png";
import "./CSS/App.css";

interface InventoryItem {
  _id: string;
  name: string;
  cat: string;
  stoc: number;
  currentLocation: string;
}

export default function App() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  // Filters
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  // New product
  const [newItem, setNewItem] = useState({
    name: "",
    cat: "",
    stoc: 0,
    currentLocation: "Depozit Container",
  });

  // Fetch inventory
  useEffect(() => {
    fetch("http://localhost:5000/api/inventory")
      .then((res) => res.json())
      .then((data: InventoryItem[]) => {
        // tell TS the data is InventoryItem[]
        setInventory(data);

        // Low stock toner check
        const lowToner = data.filter(
          (item: InventoryItem) =>
            item.cat.toLowerCase() === "toner" && item.stoc < 2,
        );

        if (lowToner.length > 0) {
          const names = lowToner
            .map((item: InventoryItem) => item.name)
            .join(" ---- ");
          alert(
            `⚠ Urmatoarele Tonere au stocul mai mic de 2 ---- ${names} ----`,
          );
        }
      })
      .catch((err) => console.error(err));
  }, []);

  //Page Names

  // ✅ UPDATE EXISTING ITEM (by _id)
  async function handleChange(
    id: string,
    field: keyof InventoryItem,
    value: string | number,
  ) {
    setInventory((prev) =>
      prev.map((item) =>
        item._id === id ? { ...item, [field]: value } : item,
      ),
    );

    const item = inventory.find((i) => i._id === id);
    if (!item) return;

    try {
      await fetch(`http://localhost:5000/api/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...item,
          [field]: value,
        }),
      });
    } catch (err) {
      console.error("Failed to update MongoDB", err);
    }
  }

  // ✅ ADD NEW PRODUCT
  async function handleAddProduct() {
    if (!newItem.name || !newItem.cat) return;

    try {
      const res = await fetch("http://localhost:5000/api/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });

      const createdItem: InventoryItem = await res.json();

      setInventory((prev) => [...prev, createdItem]);
      setNewItem({
        name: "",
        cat: "",
        stoc: 0,
        currentLocation: "Depozit Container", // or your default
      });
    } catch (err) {
      console.error("Failed to add product", err);
    }
  }

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

      return matchesSearch && matchesCategory && matchesStock;
    });
  }, [inventory, search, category, stockFilter]);

  const categories = [...new Set(inventory.map((i) => i.cat))];

  return (
    <>
      <div className="flex items-center justify-center gap-6">
        <a href="/" target="_blank">
          <img src={elisLogo} className="logo react" alt="Elis logo" />
        </a>
        <a href="/consumuri" target="_blank">
          <img src={elisLogo} className="logo react" alt="Elis logo" />
        </a>
        <a href="/procese" target="_blank">
          <img src={elisLogo} className="logo react" alt="Elis logo" />
        </a>
        <a href="/scanner" target="_blank">
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
              <th>Locație</th>
            </tr>
          </thead>

          <tbody>
            {/* ADD NEW PRODUCT */}
            <tr style={{ backgroundColor: "#1F2739" }}>
              <td>
                <input
                  placeholder="Categorie"
                  value={newItem.cat}
                  onChange={(e) =>
                    setNewItem({ ...newItem, cat: e.target.value })
                  }
                />
              </td>

              <td>
                <input
                  placeholder="Produs nou"
                  value={newItem.name}
                  onChange={(e) =>
                    setNewItem({ ...newItem, name: e.target.value })
                  }
                />
              </td>

              <td>
                <input
                  type="number"
                  value={newItem.stoc}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      stoc: Number(e.target.value),
                    })
                  }
                />
              </td>

              <td>
                <input
                  value={newItem.currentLocation}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      currentLocation: e.target.value,
                    })
                  }
                ></input>

                <button className="add-btn" onClick={handleAddProduct}>
                  +
                </button>
              </td>
            </tr>

            {/* EXISTING ITEMS */}
            {filteredInventory.map((item) => (
              <tr key={item._id}>
                <td>
                  <input
                    value={item.cat}
                    onChange={(e) =>
                      handleChange(item._id, "cat", e.target.value)
                    }
                    onBlur={(e) =>
                      handleChange(item._id, "cat", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    value={item.name}
                    onChange={(e) =>
                      handleChange(item._id, "name", e.target.value)
                    }
                    onBlur={(e) =>
                      handleChange(item._id, "name", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    type="number"
                    value={item.stoc}
                    onChange={(e) => {
                      let val = e.target.value;

                      // Remove leading zeros but keep single zero
                      val = val.replace(/^0+(?=\d)/, "");

                      // Convert to number
                      const num = val === "" ? 0 : Number(val);

                      handleChange(item._id, "stoc", num);
                    }}
                    onBlur={(e) => {
                      handleChange(item._id, "stoc", e.target.value);
                    }}
                  />
                </td>
                <td>{item.currentLocation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
