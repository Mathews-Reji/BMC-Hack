from flask import Flask, request, jsonify
import requests

app = Flask(__name__)

# Hyperledger Fabric REST API URL (change this to your actual Fabric CA URL)
FABRIC_CA_URL = "http://localhost:7054"

# Function to enroll a user with Fabric CA
def enroll_user(user_id, password):
    url = f"{FABRIC_CA_URL}/enroll"
    payload = {
        "enrollmentID": user_id,
        "enrollmentSecret": password
    }
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()  # Raise an exception for HTTP errors
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

# Function to get a medical ID record (this assumes you have the fabric ledger configured for medical records)
def get_medical_record(id, access_key):
    # URL to your Hyperledger Fabric peer node's state query API
    url = f"http://localhost:7051/chaincode"
    
    # Set your query for medical record retrieval (this is an example)
    payload = {
        "fcn": "getMedicalID",
        "args": [id, access_key]
    }

    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()  # Raise an exception for HTTP errors
        return response.json()
    except requests.exceptions.RequestException as e:
        return {"error": str(e)}

# API endpoint for enrolling a new user
@app.route("/enroll_user", methods=["POST"])
def enroll_user_route():
    data = request.json
    user_id = data.get("user_id")
    password = data.get("password")
    
    if not user_id or not password:
        return jsonify({"error": "user_id and password are required"}), 400
    
    result = enroll_user(user_id, password)
    
    if "error" in result:
        return jsonify(result), 500
    
    return jsonify(result), 200

# API endpoint for getting a medical record
@app.route("/get_medical_record", methods=["GET"])
def get_medical_record_route():
    record_id = request.args.get("record_id")
    access_key = request.args.get("access_key")
    
    if not record_id or not access_key:
        return jsonify({"error": "record_id and access_key are required"}), 400
    
    result = get_medical_record(record_id, access_key)
    
    if "error" in result:
        return jsonify(result), 500
    
    return jsonify(result), 200

if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)