import { useState, useRef } from "react";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import toast, { Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import elisLogo from "./assets/ELIS.png";

interface Product {
  _id?: string;
  name: string;
  cat?: string;
  stoc?: number;
  barcode: string;
  notFound?: boolean;
}

export default function BarcodeScanner() {
  const [currentData, setCurrentData] = useState("No result");
  const [scanHistory, setScanHistory] = useState<Product[]>([]);
  const beepSound = useRef(new Audio("/assets/beep.mp3"));
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch product from server
  const fetchProduct = async (barcode: string): Promise<Product> => {
    try {
      const res = await fetch(`http://localhost:5000/api/inventory/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ barcode }),
      });

      if (!res.ok) {
        // Dummy product with ALL keys
        return {
          _id: "notfound",
          name: "Not attached to any product",
          cat: "-", // include category
          stoc: 0, // include stock
          barcode,
          notFound: true,
        };
      }

      const data = await res.json();

      // Ensure all keys exist
      return {
        _id: data._id ?? "unknown",
        name: data.name ?? "Unknown",
        cat: data.cat ?? "-",
        stoc: data.stoc ?? 0,
        barcode: data.barcode ?? barcode,
        notFound: false,
      };
    } catch (err) {
      console.error(err);
      return {
        _id: "error",
        name: "Error fetching product",
        cat: "-",
        stoc: 0,
        barcode,
        notFound: true,
      };
    }
  };

  const handleScan = async (err: unknown, result?: any) => {
    if (!result) return;

    const scannedText = result.getText();
    setCurrentData(scannedText);

    // Prevent duplicate scans
    if (scanHistory.some((p) => p.barcode === scannedText)) {
      toast(`Barcode ${scannedText} already scanned`);
      return;
    }

    setLoading(true);
    const product = await fetchProduct(scannedText);
    setScanHistory((prev) => [...prev, product]);

    if (product.notFound)
      toast.error(`Barcode ${scannedText} not attached to any product`);
    else {
      toast.success(`Product scanned: ${product.name}`);
      beepSound.current.play();
    }
    setLoading(false);
  };

  // Fake scan from console
  (window as any).fakeScan = async (code: string) => {
    await handleScan(null, { getText: () => code });
  };

  return (
    <div className="box">
      <Toaster position="top-right" reverseOrder={false} />

      <div className="title">Scanner</div>

      <div className="scan">
        <BarcodeScannerComponent
          width={500}
          height={500}
          onUpdate={handleScan}
          delay={1500}
        />
      </div>

      <p>Scanned Barcode: {currentData}</p>
      {loading && <p>Checking product...</p>}

      <h2>Scan History</h2>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Category</th>
            <th>Stock</th>
            <th>Barcode</th>
            <th>Consum</th>
          </tr>
        </thead>
        <tbody>
          {scanHistory.map((product, i) => (
            <tr key={i} style={{ color: product.notFound ? "red" : "inherit" }}>
              <td>{i + 1}</td>
              <td>{product.name}</td>
              <td>{product.cat || "-"}</td>
              <td>{product.stoc ?? "-"}</td>
              <td>{product.barcode}</td>
              <td>
                <img
                  src={elisLogo}
                  className="logoElis"
                  alt="Elis logo"
                  style={{ cursor: "pointer" }}
                  onClick={() =>
                    navigate("/istoricconsum", { state: { item: product } })
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
