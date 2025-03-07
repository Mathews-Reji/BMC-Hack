const express = require('express');
const { Gateway, Wallets } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

async function connectToFabric() {
    const ccpPath = path.resolve(__dirname, '..', 'fabric-samples', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    const wallet = await Wallets.newFileSystemWallet('./wallet');
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });

    return gateway.getNetwork('mychannel').getContract('medical');
}

app.post('/createMedicalID', async (req, res) => {
    const { id, user, allergies, conditions, emergencyContact } = req.body;
    try {
        const contract = await connectToFabric();
        await contract.submitTransaction('createMedicalID', id, user, allergies, conditions, emergencyContact);
        res.send({ message: 'Medical ID created' });
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.get('/getMedicalID/:id', async (req, res) => {
    try {
        const contract = await connectToFabric();
        const result = await contract.evaluateTransaction('getMedicalID', req.params.id);
        res.send(JSON.parse(result.toString()));
    } catch (error) {
        res.status(500).send(error.toString());
    }
});

app.listen(3000, () => console.log('API running on port 3000'));