#!/bin/bash

set -e

export CHANNEL_NAME="medisyncchannel"
export CC_NAME="medisync"
export CC_VERSION="1.0"
export CC_SEQUENCE="1"

PACKAGE_ID=$(cat scripts/package.id)
if [ -z "$PACKAGE_ID" ]; then
  echo "Package ID tidak ditemukan di scripts/package.id"
  exit 1
fi

echo "Menyetujui chaincode sebagai APOTEK (Org3)..."
docker exec \
  -e CORE_PEER_LOCALMSPID=ApotekMSP \
  -e CORE_PEER_ADDRESS=peer0.org3.medisync.com:11051 \
  -e CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.medisync.com/users/Admin@org3.medisync.com/msp \
  -e CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.medisync.com/peers/peer0.org3.medisync.com/tls/ca.crt \
  cli peer lifecycle chaincode approveformyorg \
  -o orderer.medisync.com:7050 \
  --ordererTLSHostnameOverride orderer.medisync.com \
  --channelID $CHANNEL_NAME \
  --name $CC_NAME \
  --version $CC_VERSION \
  --package-id $PACKAGE_ID \
  --sequence $CC_SEQUENCE \
  --collections-config /opt/gopath/src/github.com/chaincode/medisync/javascript/collections_config.json \
  --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
echo "Chaincode disetujui oleh Apotek."