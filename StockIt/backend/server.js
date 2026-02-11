import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
const mongoURI = "mongodb://localhost:27017/elis_inventory";

async function startServer() {
  try {
    await mongoose.connect(mongoURI);
    console.log("Connected to MongoDB");

    // Start the server
    app.listen(5000, "0.0.0.0", () =>
  console.log(`Server running on http://localhost:5000`)
);

  } catch (err) {
    console.error("Error connecting to MongoDB:", err);
  }
}

startServer();

// Schema
const inventorySchema = new mongoose.Schema({
  name: String,
  cat: String,
  stoc: Number
});

const consumSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", required: true },
  cant: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  user: { type: String },
  locm: { type: String }
});


// Explicit collection name
const Inventory = mongoose.model("Inventory", inventorySchema, "eli_stoc");
const Consum = mongoose.model("Consum", consumSchema, "eli_consum");
export default Consum

/* -------------------- ROUTES -------------------- */

// GET all inventory
app.get("/api/inventory", async (req, res) => {
  try {
    const items = await Inventory.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all Consum
app.get("/api/consum", async (req, res) => {
  try {
    const consum = await Consum.find();
    res.json(consum);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ ADD NEW PRODUCT
app.post("/api/inventory", async (req, res) => {
  try {
    const item = await Inventory.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ UPDATE PRODUCT (name, cat, stoc)
app.put("/api/inventory/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const updatedItem = await Inventory.findByIdAndUpdate(
      id,
      req.body,       // update ALL fields sent
      { new: true }
    );

    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST new consumption
app.post("/api/consum", async (req, res) => {
  try {
    const { productId, cant, user, locm } = req.body;

    // 1. Validate required fields
    if (!productId || cant === undefined) {
      return res.status(400).json({ error: "productId and cant are required" });
    }

    // 2. Create new consumption
    const newConsum = await Consum.create({
      productId,
      cant,
      user,
      locm,
      date: new Date() // default to now
    });

    // 3. Update stock in Inventory
    const inventoryItem = await Inventory.findById(productId);
    if (!inventoryItem) {
      return res.status(404).json({ error: "Inventory item not found" });
    }

    inventoryItem.stoc -= cant;
    if (inventoryItem.stoc < 0) inventoryItem.stoc = 0; // prevent negative stock
    await inventoryItem.save();

    res.status(201).json(newConsum);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

import path from "path";
import { fileURLToPath } from "url";



// ES module dirname fix
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files (PDFs)
app.use("/files", express.static(path.join(__dirname, "public")));


app.get("/download/proces-verbal", (req, res) => {
  res.download(path.join(__dirname, "public/proc_verbal.pdf"));
});
