import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./index.css";

import AdaugareProd from "./AdaugareProd.tsx";
import Consumuri from "./Consumuri.tsx";
import Procese from "./Procese.tsx";
import GenConsum from "./GenConsum.tsx";
import IstoricConsum from "./IstoricConsum.tsx";
import ProcesVerbal from "./ProcesVerbal.tsx";
import Scanner from "./BARCODE.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      {" "}
      {/* This wraps everything and enables routing */}
      <Routes>
        {/* Define your routes here */}
        <Route path="/" element={<AdaugareProd />} /> {/* Default route */}
        <Route path="/consumuri" element={<Consumuri />} />
        <Route path="/procese" element={<Procese />} />
        <Route path="/genconsum" element={<GenConsum />} />
        <Route path="/istoricconsum" element={<IstoricConsum />} />
        <Route path="/procesverbal" element={<ProcesVerbal />} />
        <Route path="/scanner" element={<Scanner />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
