#!/bin/bash

set -e

export CHANNEL_NAME="medisyncchannel"
export CC_NAME="medisync"
export CC_VERSION="1.0"

echo "Mencari Package ID untuk ${CC_NAME} versi ${CC_VERSION}..."
docker exec \
  -e CORE_PEER_LOCALMSPID=ProdusenMSP \
  -e CORE_PEER_ADDRESS=peer0.org1.medisync.com:7051 \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/peers/peer0.org1.medisync.com/tls/ca.crt \
  cli peer lifecycle chaincode queryinstalled > package.txt

PACKAGE_ID=$(sed -n "s/Package ID: \(${CC_NAME}_${CC_VERSION}:[a-zA-Z0-9]*\),.*/\1/p" package.txt)
if [ -z "$PACKAGE_ID" ]; then
  echo "Gagal menemukan Package ID untuk ${CC_NAME}_${CC_VERSION}"
  exit 1
fi

echo "Package ID ditemukan: $PACKAGE_ID"
echo $PACKAGE_ID > scripts/package.id
echo "Package ID telah disimpan ke file scripts/package.id"
rm package.txt