import { useEffect, useState, useMemo } from "react";
import { useLocation } from "react-router-dom";
import elisLogo from "./assets/ELIS.png";
import BarcodeScannerComponent from "react-qr-barcode-scanner";
import toast, { Toaster } from "react-hot-toast";
import "./CSS/Form.css";

//Get Current Date Function
function getDate() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();
  const date = today.getDate();
  return `${year}/${month}/${date}`;
}

export default function App() {
  const location = useLocation();
  const item = location.state?.item;

  if (!item) return <div>No item data passed!</div>;

  const [currentDate, setCurrentDate] = useState(getDate());

  const [currentData, setCurrentData] = useState("No result");

  // State to store an array of scanned results for history tracking
  const [scanHistory, setScanHistory] = useState([]);

  // Initialize audio for the beep sound effect
  const beepSound = new Audio("/beep.mp3");

  return (
    <>
      <div>
        <h1>Bon de consum</h1>
        <h2>Data: {currentDate}</h2>
      </div>
      <div className="anexa">
        <img src={elisLogo} className="logo react" alt="Elis logo" />
        <h2>ELIS PAVAJE SRL</h2>
        <p>Unitate: </p>
        <p>Loc de munca: {item.name} </p>
      </div>
    </>
  );
}
