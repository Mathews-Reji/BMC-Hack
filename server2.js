const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const crypto = require('crypto');

const QRCode = require('qrcode'); // Import QR code library
//const { nanoid } = require('nanoid'); // Optional for generating unique IDs

const app = express();
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/emergencyMedical', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.log("MongoDB connection error:", err));

// Define the User Schema for Login/Registration
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: true },
    accessId: { type: String, required: true, unique: true },
   
});


// Define UserProfile Schema
const userProfileSchema = new mongoose.Schema({
    dob: { type: Date, required: true },
    gender: { type: String, required: true },
    bloodGroup: { type: String, required: true },
    emergencyContact: {
        name: { type: String, required: true },
        relationship: { type: String, required: true },
        phoneNumber: { type: String, required: true },
        address: { type: String, required: true }
    }
});

const UserProfile = mongoose.model('UserProfile', userProfileSchema);


const medicalHistorySchema = new mongoose.Schema({
    chronicIllness: { type: String },
    pastSurgeries: { type: String },
    vaccinationHistory: { type: String },
    specialConditions: { type: String },
    lifestyleFactors: { type: String, enum: ['None', 'Smoking', 'Alcohol', 'Both'], default: 'None' }
});

const MedicalHistory = mongoose.model('MedicalHistory', medicalHistorySchema);


const User = mongoose.model('User', userSchema);

// Define the MedicalRecord schema for emergency medical details
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

const MedicalRecord = mongoose.model('MedicalRecord', medicalRecordSchema);
// Define Medication Schema
const medicationSchema = new mongoose.Schema({
    medicationName: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true }
});

const Medication = mongoose.model("Medication", medicationSchema);

// API Route to Save Medication
app.post("/save-medication", async (req, res) => {
    try {
        const newMedication = new Medication(req.body);
        await newMedication.save();
        res.status(201).json({ message: "Medication saved successfully!" });
    } catch (err) {
        console.error("Error saving medication:", err);
        res.status(500).json({ error: "Failed to save medication." });
    }
});

// API Route to Retrieve All Medications
app.get("/get-medications", async (req, res) => {
    try {
        const medications = await Medication.find();
        res.status(200).json(medications);
    } catch (err) {
        console.error("Error fetching medications:", err);
        res.status(500).json({ error: "Failed to retrieve medications." });
    }
});

// API Route to Delete a Medication
app.delete("/delete-medication/:id", async (req, res) => {
    try {
        await Medication.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Medication deleted successfully!" });
    } catch (err) {
        console.error("Error deleting medication:", err);
        res.status(500).json({ error: "Failed to delete medication." });
    }
});
// Define Allergy Schema
const allergySchema = new mongoose.Schema({
    drugAllergy: String,
    drugAllergyText: String,
    foodAllergy: String,
    foodAllergyText: String,
    envAllergy: String,
    envAllergyText: String
});

const Allergy = mongoose.model("Allergy", allergySchema);

// API Route to Save Allergy Data
app.post("/save-allergy", async (req, res) => {
    try {
        await Allergy.findOneAndUpdate({}, req.body, { upsert: true, new: true });
        res.status(201).json({ message: "Allergy data saved successfully!" });
    } catch (err) {
        console.error("Error saving allergy data:", err);
        res.status(500).json({ error: "Failed to save allergy data." });
    }
});

// API Route to Retrieve Allergy Data
app.get("/get-allergies", async (req, res) => {
    try {
        const allergies = await Allergy.findOne();
        res.status(200).json(allergies || {});
    } catch (err) {
        console.error("Error fetching allergies:", err);
        res.status(500).json({ error: "Failed to retrieve allergy data." });
    }
});
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
// Route to handle saving medical history
app.post('/save-medical-history', async (req, res) => {
    console.log("Received medical history data:", req.body); // Debugging

    const { chronicIllness, pastSurgeries, vaccinationHistory, specialConditions, lifestyleFactors } = req.body;

    if (!chronicIllness && !pastSurgeries && !vaccinationHistory && !specialConditions && !lifestyleFactors) {
        return res.status(400).json({ error: "At least one field must be filled!" });
    }

    try {
        const newMedicalHistory = new MedicalHistory({
            chronicIllness,
            pastSurgeries,
            vaccinationHistory,
            specialConditions,
            lifestyleFactors
        });

        await newMedicalHistory.save();
        console.log("Medical history saved successfully:", newMedicalHistory);
        res.status(200).json({ message: "Medical history saved successfully!" });
    } catch (err) {
        console.error("Error saving medical history:", err);
        res.status(500).json({ error: "An error occurred while saving your information." });
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

// ** User Authentication Routes **

app.post('/register', async (req, res) => {
    const { username, password, confirmPassword, phone } = req.body;

    // Validate input fields
    if (!username || !password || !confirmPassword || !phone) {
        return res.status(400).json({ error: "Please fill in all fields!" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ error: "Passwords do not match!" });
    }

    if (phone.length !== 10) {
        return res.status(400).json({ error: "Enter a valid 10-digit phone number!" });
    }

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: "Username already exists!" });
        }

        // Generate a unique access ID
        const accessId = crypto.randomUUID();

        // Hash password before saving
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create and save new user (WITHOUT OTP in the database)
        const newUser = new User({
            username,
            password: hashedPassword,
            phone,
            accessId
        });

        await newUser.save();

        // Generate OTP (NOT STORED IN DATABASE)
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        console.log(`OTP for ${username}: ${otp}`);
        console.log(`Access ID for ${username}: ${accessId}`);

        // Send OTP and accessId back to the frontend (without storing OTP)
        res.status(200).json({ 
            message: "OTP sent to phone number!", 
            otp,  // Send OTP for immediate verification
            accessId // Send unique access ID
        });

    } catch (err) {
        console.error("Error registering user:", err);
        res.status(500).json({ error: "Error registering user!" });
    }
});


// Route to handle saving personal info
app.post('/save-personal-info', async (req, res) => {
    const { dob, gender, bloodGroup, emergencyName, relationship, phoneNumber, address } = req.body;

    // Log the received data for debugging
    console.log("Received data:", req.body);

    // Check if all required fields are present
    if (!dob || !gender || !bloodGroup || !emergencyName || !relationship || !phoneNumber || !address) {
        console.log("Error: Missing required fields");
        return res.status(400).json({ error: "All fields are required!" });
    }

    // Validate the phone number format (e.g., 10 digits)
    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phoneNumber)) {
        console.log("Error: Invalid phone number format");
        return res.status(400).json({ error: "Please enter a valid 10-digit phone number!" });
    }

    // Validate the date of birth to ensure it's a reasonable age (e.g., at least 18 years old)
    const age = new Date().getFullYear() - new Date(dob).getFullYear();
    console.log("Calculated age:", age);
    if (age < 18) {
        console.log("Error: User is under 18 years old");
        return res.status(400).json({ error: "You must be at least 18 years old." });
    }

    try {
        // Create a new UserProfile document and save to the database
        const newUserProfile = new UserProfile({
            dob,
            gender,
            bloodGroup,
            emergencyContact: {
                name: emergencyName,
                relationship,
                phoneNumber,
                address
            }
        });

        console.log("Saving new user profile:", newUserProfile);

        // Save the document to MongoDB
        await newUserProfile.save();
        
        // Log successful saving
        console.log("User profile saved successfully");

        // Return a success message to the client
        res.status(200).json({ message: "Personal information saved successfully!" });
    } catch (err) {
        // Log the error for debugging
        console.error("Error occurred while saving the user profile:", err);
        res.status(500).json({ error: "An error occurred while saving your information." });
    }
});



app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Please fill in all fields!" });
    }

    try {
        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: "User not found!" });
        }

        // Compare passwords
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(400).json({ error: "Invalid credentials!" });
        }

        // Generate QR Code for Access ID
        const qrCodeData = await QRCode.toDataURL(user.accessId);

        res.status(200).json({ 
            message: "Login successful!", 
            accessId: user.accessId,
            qrCode: qrCodeData // Send QR code as Base64 image
        });

    } catch (err) {
        console.error("Error logging in:", err);
        res.status(500).json({ error: "Error logging in!" });
    }
});


// Start Server
app.listen(3000, () => console.log("Server running on port 3000 🚀"));
