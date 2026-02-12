import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import multer from "multer";


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
  stoc: Number,
  barcode: String,
  currentLocation: {
    type: String,
    default: "warehouse"
  }
});

const consumSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Inventory", required: true },
  cant: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  user: { type: String },
  locm: { type: String }
});

const inventoryDocumentSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
    required: true,
    index: true
  },

  fileName: {
    type: String,
    required: true
  },

  fileData: {
    type: Buffer,
    required: true
  },

  documentType: {
    type: String,
    enum: ["invoice", "warranty", "manual", "transfer", "other"],
    default: "other"
  },

  uploadedAt: {
    type: Date,
    default: Date.now
  }
});


const inventoryLocationHistorySchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
    required: true,
    index: true
  },

  fromLocation: String,

  toLocation: {
    type: String,
    required: true
  },

  movedAt: {
    type: Date,
    default: Date.now
  }
});







// Explicit collection name
const Inventory = mongoose.model("Inventory", inventorySchema, "eli_stoc");
const Consum = mongoose.model("Consum", consumSchema, "eli_consum");
export default Consum
const InventoryDocument = mongoose.model(
  "InventoryDocument",
  inventoryDocumentSchema,
  "eli_inventory_documents"
);

const InventoryLocationHistory = mongoose.model(
  "InventoryLocationHistory",
  inventoryLocationHistorySchema,
  "eli_inventory_location_history"
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB limit
});


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
    const { currentLocation = "warehouse", ...rest } = req.body;

    // 1️⃣ Create inventory item
    const item = await Inventory.create({
      ...rest,
      currentLocation
    });

    // 2️⃣ Create initial history record
    await InventoryLocationHistory.create({
      productId: item._id,
      fromLocation: null,
      toLocation: currentLocation
    });

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


//barcode
app.post("/api/inventory/scan", async (req, res) => {
  const { barcode } = req.body;

  if (!barcode) return res.status(400).json({ error: "Barcode is required" });

  try {
    const product = await Inventory.findOne({ barcode });
    if (!product) return res.status(404).json({ error: "Product not found" });

    res.json(product); // <-- must return the product document
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.post("/api/inventory/:id/documents", upload.single("file"), async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const document = await InventoryDocument.create({
      productId: id,
      fileName: req.file.originalname,
      fileData: req.file.buffer,
      documentType: req.body.documentType || "other"
    });

    res.status(201).json(document);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/inventory/:id/documents", async (req, res) => {
  try {
    const docs = await InventoryDocument.find({ productId: req.params.id })
      .select("-fileData"); // don’t send binary in list view

    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/documents/:docId", async (req, res) => {
  try {
    const doc = await InventoryDocument.findById(req.params.docId);

    if (!doc) return res.status(404).json({ error: "Document not found" });

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${doc.fileName}"`
    });

    res.send(doc.fileData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/inventory/:id/move", async (req, res) => {
  try {
    const { toLocation } = req.body;
    const { id } = req.params;

    const item = await Inventory.findById(id);
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Save history
    await InventoryLocationHistory.create({
      productId: id,
      fromLocation: item.currentLocation,
      toLocation
    });

    // Update current location
    item.currentLocation = toLocation;
    await item.save();

    res.json({ message: "Location updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/inventory/:id/history", async (req, res) => {
  try {
    const history = await InventoryLocationHistory
      .find({ productId: req.params.id })
      .sort({ movedAt: -1 });

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/documents/:docId", async (req, res) => {
  try {
    const { docId } = req.params;

    const deleted = await InventoryDocument.findByIdAndDelete(docId);

    if (!deleted) {
      return res.status(404).json({ error: "Document not found" });
    }

    res.json({ message: "Document deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


//Create Manual Location
const items = await Inventory.find();

for (const item of items) {
  const exists = await InventoryLocationHistory.findOne({
    productId: item._id
  });

  if (!exists) {
    await InventoryLocationHistory.create({
      productId: item._id,
      fromLocation: null,
      toLocation: item.currentLocation
    });
  }
}

