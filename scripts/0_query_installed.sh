# =================================================================
# File: scripts/0_query_installed.sh
# (PERBAIKAN: Logika grep/sed lebih andal)
# =================================================================
#!/bin/bash
set -e
export CC_NAME="medisync"
export CC_VERSION="1.0"
export CC_SEQUENCE="1" # <-- DIBENERIN: Kembali ke 1 karena ini deploy baru setelah restart
LOG_FILE="log.txt"
echo "Mencari Package ID untuk ${CC_NAME} versi ${CC_VERSION}..."
docker exec -e CORE_PEER_ADDRESS=peer0.org1.medisync.com:7051 -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp cli peer lifecycle chaincode queryinstalled > "${LOG_FILE}" 2>&1

# Menggunakan grep untuk memastikan hanya versi yang tepat yang diambil
PACKAGE_ID=$(grep "Package ID: ${CC_NAME}_${CC_VERSION}" ${LOG_FILE} | sed -n 's/Package ID: //; s/, Label:.*//p')

if [ -z "$PACKAGE_ID" ]; then echo "FATAL: Package ID untuk versi ${CC_VERSION} tidak ditemukan."; exit 1; fi
echo "Package ID ditemukan: ${PACKAGE_ID}"
echo ${PACKAGE_ID} > scripts/package.id
echo "Package ID telah disimpan ke file scripts/package.id"