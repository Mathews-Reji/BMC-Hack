const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/emergencyMedical', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Define the MedicalRecord schema
const medicalRecordSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    user: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    allergies: { type: String },
    conditions: { type: String },
    priorSurgeries: { type: String },
    medications: { type: String },
    emergencyContact: { type: String },
});

// Create the MedicalRecord model
const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);

// ✅ Create Medical ID
app.post('/create', async (req, res) => {
    const { id, user, bloodGroup, allergies, conditions, priorSurgeries, medications, emergencyContact } = req.body;

    try {
        const existingRecord = await MedicalRecord.findOne({ id });
        if (existingRecord) {
            return res.status(400).json({ error: "Medical ID already exists!" });
        }

        const newRecord = new MedicalRecord({ id, user, bloodGroup, allergies, conditions, priorSurgeries, medications, emergencyContact });
        await newRecord.save();
        res.json({ message: `Medical ID ${id} created successfully!` });
    } catch (err) {
        res.status(500).json({ error: "Error creating medical ID!" });
    }
});

// 🔎 Get Medical ID (Only hospitals with access key)
app.get('/get/:id/:accessKey', async (req, res) => {
    const { id, accessKey } = req.params;

    if (accessKey !== "hospital123") {
        return res.status(403).json({ error: "Unauthorized access!" });
    }

    try {
        const record = await MedicalRecord.findOne({ id });
        if (!record) {
            return res.status(404).json({ error: "Medical ID not found!" });
        }
        res.json(record);
    } catch (err) {
        res.status(500).json({ error: "Error fetching medical ID!" });
    }
});

// 🔄 Update Medical ID
app.put('/update', async (req, res) => {
    const { id, user, bloodGroup, allergies, conditions, priorSurgeries, medications, emergencyContact } = req.body;

    try {
        const record = await MedicalRecord.findOne({ id });
        if (!record) {
            return res.status(404).json({ error: "Medical ID does not exist!" });
        }

        record.user = user;
        record.bloodGroup = bloodGroup;
        record.allergies = allergies;
        record.conditions = conditions;
        record.priorSurgeries = priorSurgeries;
        record.medications = medications;
        record.emergencyContact = emergencyContact;

        await record.save();
        res.json({ message: `Medical ID ${id} updated successfully!` });
    } catch (err) {
        res.status(500).json({ error: "Error updating medical ID!" });
    }
});

// ✅ List All Medical IDs (For hospitals)
app.get('/list/:accessKey', async (req, res) => {
    if (req.params.accessKey !== "hospital123") {
        return res.status(403).json({ error: "Unauthorized access!" });
    }

    try {
        const records = await MedicalRecord.find();
        const ids = records.map(record => record.id);
        res.json(ids);
    } catch (err) {
        res.status(500).json({ error: "Error fetching medical IDs!" });
    }
});

// Start Server
app.listen(3000, () => console.log("Server running on port 3000 🚀"));
