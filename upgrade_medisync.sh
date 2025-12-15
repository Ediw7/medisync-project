#!/bin/bash
# Script Upgrade Chaincode Medisync ke v2.0 dengan PDC (Private Data)
# REVISI FINAL: Memperbaiki path ORDERER_CA

set -e

export CHANNEL_NAME="medisyncchannel"
export CC_NAME="medisync"
export CC_VERSION="2.0"
export CC_SEQUENCE="2"

# --- PERBAIKAN PATH DI SINI ---
# Path sebelumnya salah (terlalu dalam), ini path yang benar sesuai network.sh Anda:
export ORDERER_CA="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem"
# ------------------------------

# Lokasi file di Host (Laptop Anda)
HOST_COLLECTION_CONFIG="./chaincode/collections_config.json"

# Lokasi tujuan di dalam Container CLI
CONTAINER_COLLECTION_CONFIG="/opt/gopath/src/github.com/hyperledger/fabric/peer/collections_config.json"

echo "========== MULAI UPGRADE CHAINCODE KE VERSI ${CC_VERSION} (SEQ ${CC_SEQUENCE}) DENGAN PDC =========="

# 0. COPY FILE CONFIG KE CONTAINER CLI
echo "📂 Mengkopi file collections_config.json ke dalam container CLI..."
if [ ! -f "$HOST_COLLECTION_CONFIG" ]; then
    echo "❌ ERROR: File $HOST_COLLECTION_CONFIG tidak ditemukan!"
    echo "👉 Pastikan file 'collections_config.json' ada di dalam folder 'chaincode'."
    exit 1
fi
docker cp $HOST_COLLECTION_CONFIG cli:$CONTAINER_COLLECTION_CONFIG
echo "✅ File config berhasil dikopi ke container."

# 1. QUERY INSTALLED & DAPATKAN PACKAGE ID
echo "🔍 Mengambil Package ID dari Peer0 Org1..."
docker exec \
  -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp" \
  -e CORE_PEER_ADDRESS="peer0.org1.medisync.com:7051" \
  -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/peers/peer0.org1.medisync.com/tls/ca.crt" \
  cli peer lifecycle chaincode queryinstalled >&log.txt

PACKAGE_ID=$(sed -n "/Package ID: ${CC_NAME}_${CC_VERSION}:/,/Label: /p" log.txt | sed -n 's/Package ID: //; s/, Label:.*//p')

if [ -z "$PACKAGE_ID" ]; then
  echo "❌ ERROR: Chaincode v${CC_VERSION} belum terinstall. Jalankan './network.sh upgrade' terlebih dahulu!"
  exit 1
fi
echo "✅ Package ID Ditemukan: ${PACKAGE_ID}"

# 2. APPROVE FOR MY ORG (ORG1 - PRODUSEN)
echo "✍️  Menyetujui (Approve) untuk Org1 Produsen..."
docker exec \
  -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp" \
  -e CORE_PEER_ADDRESS="peer0.org1.medisync.com:7051" \
  -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/peers/peer0.org1.medisync.com/tls/ca.crt" \
  cli peer lifecycle chaincode approveformyorg -o orderer.medisync.com:7050 \
  --ordererTLSHostnameOverride orderer.medisync.com --channelID $CHANNEL_NAME \
  --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} \
  --sequence ${CC_SEQUENCE} --tls --cafile $ORDERER_CA \
  --collections-config $CONTAINER_COLLECTION_CONFIG

# 3. APPROVE FOR MY ORG (ORG2 - PBF)
echo "✍️  Menyetujui (Approve) untuk Org2 PBF..."
docker exec \
  -e CORE_PEER_LOCALMSPID="PBFMSP" \
  -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.medisync.com/users/Admin@org2.medisync.com/msp" \
  -e CORE_PEER_ADDRESS="peer0.org2.medisync.com:9051" \
  -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.medisync.com/peers/peer0.org2.medisync.com/tls/ca.crt" \
  cli peer lifecycle chaincode approveformyorg -o orderer.medisync.com:7050 \
  --ordererTLSHostnameOverride orderer.medisync.com --channelID $CHANNEL_NAME \
  --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} \
  --sequence ${CC_SEQUENCE} --tls --cafile $ORDERER_CA \
  --collections-config $CONTAINER_COLLECTION_CONFIG

# 4. APPROVE FOR MY ORG (ORG3 - APOTEK)
echo "✍️  Menyetujui (Approve) untuk Org3 Apotek..."
docker exec \
  -e CORE_PEER_LOCALMSPID="ApotekMSP" \
  -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.medisync.com/users/Admin@org3.medisync.com/msp" \
  -e CORE_PEER_ADDRESS="peer0.org3.medisync.com:11051" \
  -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.medisync.com/peers/peer0.org3.medisync.com/tls/ca.crt" \
  cli peer lifecycle chaincode approveformyorg -o orderer.medisync.com:7050 \
  --ordererTLSHostnameOverride orderer.medisync.com --channelID $CHANNEL_NAME \
  --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} \
  --sequence ${CC_SEQUENCE} --tls --cafile $ORDERER_CA \
  --collections-config $CONTAINER_COLLECTION_CONFIG

# 5. COMMIT CHAINCODE DEFINITION
echo "🚀 Melakukan COMMIT Definisi Chaincode Baru..."
docker exec \
  -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp" \
  -e CORE_PEER_ADDRESS="peer0.org1.medisync.com:7051" \
  -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/peers/peer0.org1.medisync.com/tls/ca.crt" \
  cli peer lifecycle chaincode commit -o orderer.medisync.com:7050 \
  --ordererTLSHostnameOverride orderer.medisync.com --channelID $CHANNEL_NAME \
  --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} \
  --tls --cafile $ORDERER_CA \
  --collections-config $CONTAINER_COLLECTION_CONFIG \
  --peerAddresses peer0.org1.medisync.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/peers/peer0.org1.medisync.com/tls/ca.crt \
  --peerAddresses peer0.org2.medisync.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.medisync.com/peers/peer0.org2.medisync.com/tls/ca.crt \
  --peerAddresses peer0.org3.medisync.com:11051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.medisync.com/peers/peer0.org3.medisync.com/tls/ca.crt

echo "========== ✅ UPGRADE BERHASIL SEPENUHNYA! PDC AKTIF. =========="