#!/bin/bash

# Pastikan eksekusi berhenti jika ada error
set -e

# Nama file konfigurasi
export COMPOSE_FILE=./docker-compose.yaml
export COMPOSE_PROJECT_NAME=medisync-project
export FABRIC_CFG_PATH=${PWD}

export CHANNEL_NAME="medisyncchannel"
export CC_NAME="medisync"
export CC_SRC_PATH_IN_CONTAINER="/opt/gopath/src/github.com/chaincode/medisync/javascript/"

# Variabel untuk chaincode
export CC_VERSION="1.0"
export CC_SEQUENCE="1"

# Fungsi untuk membersihkan lingkungan
function clearContainers() {
  echo "========== Menghapus kontainer-kontainer lama... =========="
  docker compose -f $COMPOSE_FILE -p $COMPOSE_PROJECT_NAME down --volumes --remove-orphans

  LINGERING_CONTAINERS=$(docker ps -aq --filter "name=${COMPOSE_PROJECT_NAME}")
  if [ -n "$LINGERING_CONTAINERS" ]; then
    echo "Membersihkan sisa kontainer yang mungkin masih ada..."
    docker rm -f $LINGERING_CONTAINERS >/dev/null 2>&1
  fi

  docker rm -f $(docker ps -a | grep "dev-peer" | awk '{print $1}') >/dev/null 2>&1 || true
  echo "========== Kontainer lama berhasil dihapus =========="
}

function removeOldArtifacts() {
  echo "========== Menghapus artefak lama... =========="
  rm -rf ./organizations ./system-genesis-block ./channel-artifacts ./bin ./config ./install-fabric.sh ./scripts/package.id ./log.txt
  docker volume rm $(docker volume ls -q | grep medisync-project) >/dev/null 2>&1 || true
  # PERBAIKAN: Hapus path './backend/' agar semua konsisten di './organizations'
  mkdir -p ./system-genesis-block ./channel-artifacts ./scripts ./organizations/peerOrganizations ./organizations/ordererOrganizations/medisync.com
  chmod -R 777 ./organizations
  chown -R $(whoami):$(whoami) ./organizations
  echo "========== Artefak lama berhasil dihapus =========="
}

# Fungsi untuk mengunduh binary Fabric
function downloadFabricBinaries() {
  if [ ! -d "bin" ]; then
    echo "FABRIC BINARIES NOT FOUND"
    echo "====== Mengunduh Hyperledger Fabric Binaries v2.5.13 dan Fabric CA v1.5.15 ======"
    curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh
    ./install-fabric.sh binary --fabric-version 2.5.13 --ca-version 1.5.15
    echo "====== Unduhan Selesai ======"
  fi
}

# Fungsi untuk memeriksa container CA
function checkCAContainers() {
  echo "========== Memeriksa container CA... =========="
  local all_running=true
  for ca in ca.orderer.medisync.com ca.org1.medisync.com ca.org2.medisync.com ca.org3.medisync.com; do
    if docker ps -q --filter "name=${ca}" | grep -q .; then
      echo "Container ${ca} berjalan."
    else
      echo "Warning: Container ${ca} tidak berjalan."
      echo "Memeriksa log untuk ${ca}..."
      docker compose -f $COMPOSE_FILE logs ${ca}
      all_running=false
    fi
  done
  if [ "$all_running" = false ]; then
    echo "Warning: Beberapa container CA tidak berjalan. Melanjutkan dengan pemeriksaan sertifikat TLS..."
  fi
}

function generateCryptoCA() {
  echo "========== Menghasilkan kredensial menggunakan Fabric CA... =========="
  
  if ! command -v fabric-ca-client &> /dev/null; then
    echo "fabric-ca-client tidak ditemukan, mungkin perlu diinstall."
  fi

  echo "========== Menjalankan container CA... =========="
  docker compose -f $COMPOSE_FILE -p $COMPOSE_PROJECT_NAME up -d ca.orderer.medisync.com ca.org1.medisync.com ca.org2.medisync.com ca.org3.medisync.com
  sleep 20
  checkCAContainers

  for ca in ca.orderer.medisync.com ca.org1.medisync.com ca.org2.medisync.com ca.org3.medisync.com; do
    if docker ps -q --filter "name=${ca}" | grep -q .; then
      echo "Menghapus database CA untuk ${ca}..." && docker exec ${ca} rm -f /etc/hyperledger/fabric-ca-server/fabric-ca-server.db || true
      echo "Merestart ${ca} untuk recreate database..." && docker restart ${ca}
    else
      echo "Container ${ca} tidak ditemukan, melewati pembersihan database..."
    fi
  done
  sleep 10

  # === Generasi Kredensial untuk OrdererOrg ===
  echo "Menghasilkan kredensial untuk OrdererMSP..."
  docker exec -e FABRIC_CA_CLIENT_HOME=/etc/hyperledger/fabric-ca-server ca.orderer.medisync.com fabric-ca-client enroll -u https://admin:adminpw@localhost:6054 --caname ca-orderer --tls.certfiles /etc/hyperledger/fabric-ca-server/tls/tls-cert.pem
  docker exec -e FABRIC_CA_CLIENT_HOME=/etc/hyperledger/fabric-ca-server ca.orderer.medisync.com fabric-ca-client register --id.name OrdererAdmin --id.secret adminpw --id.type admin --caname ca-orderer --tls.certfiles /etc/hyperledger/fabric-ca-server/tls/tls-cert.pem
  docker exec -e FABRIC_CA_CLIENT_HOME=/etc/hyperledger/fabric-ca-server ca.orderer.medisync.com fabric-ca-client register --id.name orderer --id.secret ordererpwd --id.type orderer --caname ca-orderer --tls.certfiles /etc/hyperledger/fabric-ca-server/tls/tls-cert.pem
  
  # Enroll Admin
  mkdir -p organizations/ordererOrganizations/medisync.com/users/Admin@medisync.com/msp
  docker exec -e FABRIC_CA_CLIENT_HOME=/etc/hyperledger/fabric-ca-server ca.orderer.medisync.com fabric-ca-client enroll -u https://OrdererAdmin:adminpw@localhost:6054 --caname ca-orderer --mspdir /etc/hyperledger/fabric-ca-server/users/Admin@medisync.com/msp --tls.certfiles /etc/hyperledger/fabric-ca-server/tls/tls-cert.pem
  docker cp ca.orderer.medisync.com:/etc/hyperledger/fabric-ca-server/users/Admin@medisync.com/msp ./organizations/ordererOrganizations/medisync.com/users/Admin@medisync.com/
  cp ./config.yaml ./organizations/ordererOrganizations/medisync.com/users/Admin@medisync.com/msp/

  # Enroll Orderer
  mkdir -p organizations/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp
  docker exec -e FABRIC_CA_CLIENT_HOME=/etc/hyperledger/fabric-ca-server ca.orderer.medisync.com fabric-ca-client enroll -u https://orderer:ordererpwd@localhost:6054 --caname ca-orderer --mspdir /etc/hyperledger/fabric-ca-server/orderers/orderer.medisync.com/msp --tls.certfiles /etc/hyperledger/fabric-ca-server/tls/tls-cert.pem
  docker cp ca.orderer.medisync.com:/etc/hyperledger/fabric-ca-server/orderers/orderer.medisync.com/msp ./organizations/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/
  cp ./config.yaml ./organizations/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/
  
  # Enroll TLS untuk orderer
  mkdir -p organizations/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/tls
  docker exec -e FABRIC_CA_CLIENT_HOME=/etc/hyperledger/fabric-ca-server ca.orderer.medisync.com fabric-ca-client enroll -u https://orderer:ordererpwd@localhost:6054 --caname ca-orderer --enrollment.profile tls --csr.hosts 'orderer.medisync.com,localhost' --mspdir /etc/hyperledger/fabric-ca-server/orderers/orderer.medisync.com/tls --tls.certfiles /etc/hyperledger/fabric-ca-server/tls/tls-cert.pem
  docker cp ca.orderer.medisync.com:/etc/hyperledger/fabric-ca-server/orderers/orderer.medisync.com/tls ./organizations/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/
  mv ./organizations/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/tls/signcerts/cert.pem ./organizations/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/tls/server.crt
  mv ./organizations/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/tls/keystore/*_sk ./organizations/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/tls/server.key
  mv ./organizations/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/tls/tlscacerts/* ./organizations/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/tls/ca.crt
  
  # Buat MSP dir level atas
  mkdir -p organizations/ordererOrganizations/medisync.com/msp/cacerts && mkdir -p organizations/ordererOrganizations/medisync.com/msp/admincerts && mkdir -p organizations/ordererOrganizations/medisync.com/msp/tlscacerts
  cp ./organizations/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/cacerts/* ./organizations/ordererOrganizations/medisync.com/msp/cacerts/
  cp ./organizations/ordererOrganizations/medisync.com/users/Admin@medisync.com/msp/signcerts/cert.pem ./organizations/ordererOrganizations/medisync.com/msp/admincerts/
  cp ./organizations/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/tls/ca.crt ./organizations/ordererOrganizations/medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
  # PERBAIKAN FINAL: Salin config.yaml ke MSP utama OrdererOrg
  cp ./config.yaml organizations/ordererOrganizations/medisync.com/msp/

  # === Generasi Kredensial untuk Peer Orgs ===
  for org in 1 2 3; do
    if [ $org -eq 1 ]; then
      MSP="ProdusenMSP" && CA_NAME="ca-org1" && CA_PORT="7054" && ORG_NAME="org1.medisync.com"
      ROLE_ATTR='"role=produsen:ecert"'
    elif [ $org -eq 2 ]; then
      MSP="PBFMSP" && CA_NAME="ca-org2" && CA_PORT="8054" && ORG_NAME="org2.medisync.com"
      ROLE_ATTR='"role=admin_pbf:ecert"'
    elif [ $org -eq 3 ]; then
      MSP="ApotekMSP" && CA_NAME="ca-org3" && CA_PORT="9054" && ORG_NAME="org3.medisync.com"
      ROLE_ATTR='"role=admin_apotek:ecert"'
    fi

    echo "Menghasilkan kredensial untuk $MSP (dengan atribut ABAC: $ROLE_ATTR)..."
    docker exec -e FABRIC_CA_CLIENT_HOME=/etc/hyperledger/fabric-ca-server ca.org${org}.medisync.com fabric-ca-client enroll -u https://admin:adminpw@localhost:${CA_PORT} --caname ${CA_NAME} --tls.certfiles /etc/hyperledger/fabric-ca-server/tls/tls-cert.pem
    docker exec -e FABRIC_CA_CLIENT_HOME=/etc/hyperledger/fabric-ca-server ca.org${org}.medisync.com fabric-ca-client register --id.name Org${org}Admin --id.secret adminpw --id.type admin --id.attrs "$ROLE_ATTR" --caname ${CA_NAME} --tls.certfiles /etc/hyperledger/fabric-ca-server/tls/tls-cert.pem

    mkdir -p organizations/peerOrganizations/${ORG_NAME}/users/Admin@${ORG_NAME}/msp
    docker exec -e FABRIC_CA_CLIENT_HOME=/etc/hyperledger/fabric-ca-server ca.org${org}.medisync.com fabric-ca-client enroll -u https://Org${org}Admin:adminpw@localhost:${CA_PORT} --caname ${CA_NAME} --mspdir /etc/hyperledger/fabric-ca-server/users/Admin@${ORG_NAME}/msp --tls.certfiles /etc/hyperledger/fabric-ca-server/tls/tls-cert.pem
    docker cp ca.org${org}.medisync.com:/etc/hyperledger/fabric-ca-server/users/Admin@${ORG_NAME}/msp ./organizations/peerOrganizations/${ORG_NAME}/users/Admin@${ORG_NAME}/
    cp ./config.yaml ./organizations/peerOrganizations/${ORG_NAME}/users/Admin@${ORG_NAME}/msp/

    for peer in 0 1; do
      docker exec -e FABRIC_CA_CLIENT_HOME=/etc/hyperledger/fabric-ca-server ca.org${org}.medisync.com fabric-ca-client register --id.name peer${peer} --id.secret peer${peer}pw --id.type peer --caname ${CA_NAME} --tls.certfiles /etc/hyperledger/fabric-ca-server/tls/tls-cert.pem
      mkdir -p organizations/peerOrganizations/${ORG_NAME}/peers/peer${peer}.${ORG_NAME}/msp
      docker exec -e FABRIC_CA_CLIENT_HOME=/etc/hyperledger/fabric-ca-server ca.org${org}.medisync.com fabric-ca-client enroll -u https://peer${peer}:peer${peer}pw@localhost:${CA_PORT} --caname ${CA_NAME} --mspdir /etc/hyperledger/fabric-ca-server/peers/peer${peer}.${ORG_NAME}/msp --tls.certfiles /etc/hyperledger/fabric-ca-server/tls/tls-cert.pem
      docker cp ca.org${org}.medisync.com:/etc/hyperledger/fabric-ca-server/peers/peer${peer}.${ORG_NAME}/msp ./organizations/peerOrganizations/${ORG_NAME}/peers/peer${peer}.${ORG_NAME}/
      cp ./config.yaml ./organizations/peerOrganizations/${ORG_NAME}/peers/peer${peer}.${ORG_NAME}/msp/
      
      mkdir -p organizations/peerOrganizations/${ORG_NAME}/peers/peer${peer}.${ORG_NAME}/tls
      docker exec -e FABRIC_CA_CLIENT_HOME=/etc/hyperledger/fabric-ca-server ca.org${org}.medisync.com fabric-ca-client enroll -u https://peer${peer}:peer${peer}pw@localhost:${CA_PORT} --caname ${CA_NAME} --enrollment.profile tls --csr.hosts "peer${peer}.${ORG_NAME},localhost" --mspdir /etc/hyperledger/fabric-ca-server/peers/peer${peer}.${ORG_NAME}/tls --tls.certfiles /etc/hyperledger/fabric-ca-server/tls/tls-cert.pem
      docker cp ca.org${org}.medisync.com:/etc/hyperledger/fabric-ca-server/peers/peer${peer}.${ORG_NAME}/tls ./organizations/peerOrganizations/${ORG_NAME}/peers/peer${peer}.${ORG_NAME}/
      mv ./organizations/peerOrganizations/${ORG_NAME}/peers/peer${peer}.${ORG_NAME}/tls/signcerts/cert.pem ./organizations/peerOrganizations/${ORG_NAME}/peers/peer${peer}.${ORG_NAME}/tls/server.crt
      mv ./organizations/peerOrganizations/${ORG_NAME}/peers/peer${peer}.${ORG_NAME}/tls/keystore/*_sk ./organizations/peerOrganizations/${ORG_NAME}/peers/peer${peer}.${ORG_NAME}/tls/server.key
      mv ./organizations/peerOrganizations/${ORG_NAME}/peers/peer${peer}.${ORG_NAME}/tls/tlscacerts/* ./organizations/peerOrganizations/${ORG_NAME}/peers/peer${peer}.${ORG_NAME}/tls/ca.crt
    done

    # Buat MSP dir level atas
    mkdir -p organizations/peerOrganizations/${ORG_NAME}/msp/cacerts && mkdir -p organizations/peerOrganizations/${ORG_NAME}/msp/admincerts && mkdir -p organizations/peerOrganizations/${ORG_NAME}/msp/tlscacerts
    cp ./organizations/peerOrganizations/${ORG_NAME}/peers/peer0.${ORG_NAME}/msp/cacerts/* ./organizations/peerOrganizations/${ORG_NAME}/msp/cacerts/
    cp ./organizations/peerOrganizations/${ORG_NAME}/users/Admin@${ORG_NAME}/msp/signcerts/cert.pem ./organizations/peerOrganizations/${ORG_NAME}/msp/admincerts/
    cp ./organizations/peerOrganizations/${ORG_NAME}/peers/peer0.${ORG_NAME}/tls/ca.crt ./organizations/peerOrganizations/${ORG_NAME}/msp/tlscacerts/tlsca.${ORG_NAME}-cert.pem
    # PERBAIKAN FINAL: Salin config.yaml ke MSP utama Peer Org
    cp ./config.yaml organizations/peerOrganizations/${ORG_NAME}/msp/
  done
  echo "========== Kredensial Fabric CA berhasil dibuat =========="
}
# FUNGSI BARU (YANG SUDAH DIPERBAIKI)
function createGenesisBlock() {
  echo "========== Membuat Genesis Block... =========="
  # Tambahkan baris ini untuk memastikan target file bukan sebuah direktori
  rm -rf ./system-genesis-block/genesis.block
  ./bin/configtxgen -profile MediSyncOrdererGenesis -channelID system-channel -outputBlock ./system-genesis-block/genesis.block -configPath .
  echo "========== Genesis Block berhasil dibuat =========="
}
# Fungsi untuk menjalankan jaringan
function networkUp() {
  downloadFabricBinaries
  generateCryptoCA
  createGenesisBlock
  echo "========== Menjalankan Jaringan Docker... =========="
  docker compose -f $COMPOSE_FILE -p $COMPOSE_PROJECT_NAME up -d
  docker ps -a
  echo "========== Jaringan Docker berhasil berjalan =========="
}


# Fungsi untuk membuat channel
function createChannel() {
    echo "========== Membuat Channel... =========="
    ./bin/configtxgen -profile MediSyncChannel -outputCreateChannelTx ./channel-artifacts/${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME -configPath .
    
    # PERBAIKAN: Path --cafile disesuaikan dengan lokasi sertifikat yang benar
    docker exec cli peer channel create -o orderer.medisync.com:7050 -c $CHANNEL_NAME --ordererTLSHostnameOverride orderer.medisync.com -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/${CHANNEL_NAME}.tx --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/${CHANNEL_NAME}.block --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem

    echo "========== Channel berhasil dibuat =========="
    joinChannel
}


# Fungsi untuk join peer ke channel
function joinChannel() {
    echo "========== Bergabung ke Channel... =========="
    for org in 1 2 3; do
        for peer in 0 1; do
            if [ $org -eq 1 ]; then MSP="ProdusenMSP"; if [ $peer -eq 0 ]; then PORT=7051; else PORT=8051; fi
            elif [ $org -eq 2 ]; then MSP="PBFMSP"; if [ $peer -eq 0 ]; then PORT=9051; else PORT=10051; fi
            elif [ $org -eq 3 ]; then MSP="ApotekMSP"; if [ $peer -eq 0 ]; then PORT=11051; else PORT=12051; fi
            fi
            echo "Bergabung ke channel untuk peer${peer}.org${org}.medisync.com..."
            docker exec -e CORE_PEER_LOCALMSPID=$MSP -e CORE_PEER_ADDRESS="peer${peer}.org${org}.medisync.com:${PORT}" -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/users/Admin@org${org}.medisync.com/msp" -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/peers/peer${peer}.org${org}.medisync.com/tls/ca.crt" cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/${CHANNEL_NAME}.block
        done
    done
    echo "========== Semua 6 peer berhasil join channel =========="
    updateAnchorPeers
}

function updateAnchorPeers() {
    echo "========== Update Anchor Peers... =========="
    for org in 1 2 3; do
      if [ $org -eq 1 ]; then MSP="ProdusenMSP"; PORT=7051; elif [ $org -eq 2 ]; then MSP="PBFMSP"; PORT=9051; elif [ $org -eq 3 ]; then MSP="ApotekMSP"; PORT=11051; fi
      echo "Update Anchor Peer untuk ${MSP}..."
      ./bin/configtxgen -profile MediSyncChannel -outputAnchorPeersUpdate ./channel-artifacts/${MSP}anchors.tx -channelID $CHANNEL_NAME -asOrg $MSP -configPath .
      
      # PERBAIKAN: Path --cafile disesuaikan dengan lokasi sertifikat yang benar
      docker exec -e CORE_PEER_LOCALMSPID=$MSP -e CORE_PEER_ADDRESS="peer0.org${org}.medisync.com:${PORT}" -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/users/Admin@org${org}.medisync.com/msp" cli peer channel update -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com -c $CHANNEL_NAME -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/${MSP}anchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem

    done
    echo "========== Semua Anchor Peer berhasil diupdate =========="
}

# Fungsi ini sekarang hanya melakukan package dan install
function deployCC() {
    echo "========== Deploy Chaincode Awal (v${CC_VERSION}, seq${CC_SEQUENCE}): Packaging & Installing... =========="
    packageAndInstall
    echo "========== Chaincode Awal berhasil di-install. =========="
    echo "Selanjutnya, jalankan skrip persetujuan manual dari folder 'scripts'."
}

# Fungsi baru untuk upgrade
function upgradeCC() {
    echo "========== Upgrade Chaincode ke (v${CC_VERSION}, seq${CC_SEQUENCE}): Packaging & Installing... =========="
    packageAndInstall
    echo "========== Chaincode v${CC_VERSION} berhasil di-install. =========="
    echo "Selanjutnya, jalankan skrip persetujuan manual untuk mengaktifkan versi baru."
}

# Fungsi helper untuk package & install
function packageAndInstall() {
    docker exec cli peer lifecycle chaincode package ${CC_NAME}_${CC_VERSION}.tar.gz --path ${CC_SRC_PATH_IN_CONTAINER} --lang node --label ${CC_NAME}_${CC_VERSION}
    echo "Chaincode berhasil di-package."
    
    for org in 1 2 3; do
        if [ $org -eq 1 ]; then MSP="ProdusenMSP"; elif [ $org -eq 2 ]; then MSP="PBFMSP"; elif [ $org -eq 3 ]; then MSP="ApotekMSP"; fi
        for peer in 0 1; do
            if [ $org -eq 1 ]; then if [ $peer -eq 0 ]; then PORT=7051; else PORT=8051; fi
            elif [ $org -eq 2 ]; then if [ $peer -eq 0 ]; then PORT=9051; else PORT=10051; fi
            elif [ $org -eq 3 ]; then if [ $peer -eq 0 ]; then PORT=11051; else PORT=12051; fi
            fi
            echo "--- Menginstall di peer${peer}.org${org}.medisync.com (sebagai admin Org${org}) ---"
            docker exec \
              -e CORE_PEER_LOCALMSPID=$MSP \
              -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/peers/peer${peer}.org${org}.medisync.com/tls/ca.crt" \
              -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/users/Admin@org${org}.medisync.com/msp" \
              -e CORE_PEER_ADDRESS="peer${peer}.org${org}.medisync.com:${PORT}" \
              cli peer lifecycle chaincode install ${CC_NAME}_${CC_VERSION}.tar.gz
        done
    done
}
# ... (Fungsi lain seperti createChannel, joinChannel, dll. tetap sama, tidak perlu ubah)

# Parsing argumen dari command line
if [ "$1" == "restart" ]; then
  clearContainers
  removeOldArtifacts
  networkUp
  echo "Menunggu 10 detik agar orderer dan peer siap..."
  sleep 10
  createChannel
  deployCC
elif [ "$1" == "down" ]; then
  clearContainers
elif [ "$1" == "upgrade" ]; then
  upgradeCC
else
  echo "Penggunaan: ./network.sh [restart|down|upgrade]"
  exit 1
fi

# #!/bin/bash

# # Pastikan eksekusi berhenti jika ada error
# set -e

# # Nama file konfigurasi
# export COMPOSE_FILE_BASE=docker-compose.yaml
# export FABRIC_CFG_PATH=${PWD}
# export CHANNEL_NAME="medisyncchannel"
# export CC_NAME="medisync"
# export CC_SRC_PATH="./chaincode/medisync/javascript/"
# # Ubah baris ini
# export CC_VERSION="1.0"
# export CC_SEQUENCE="1"


# # Fungsi untuk membersihkan lingkungan
# function clearContainers() {
#   echo "========== Menghapus kontainer-kontainer lama... =========="
#   docker compose -f $COMPOSE_FILE_BASE down --volumes --remove-orphans

  
#   LINGERING_CONTAINERS=$(docker ps -aq --filter "name=medisync")
#   if [ -n "$LINGERING_CONTAINERS" ]; then
#     echo "Membersihkan sisa kontainer medisync yang mungkin masih ada..."
#     docker rm -f $LINGERING_CONTAINERS >/dev/null 2>&1
#   fi

  
#   docker rm -f $(docker ps -a | grep "dev-peer" | awk '{print $1}') >/dev/null 2>&1 || true
#   echo "========== Kontainer lama berhasil dihapus =========="
# }

# # Fungsi untuk menghapus artefak lama
# function removeOldArtifacts() {
#     echo "========== Menghapus artefak lama... =========="
#     rm -rf ./organizations
#     rm -rf ./system-genesis-block/*
#     rm -rf ./channel-artifacts/*
#     rm -rf ./bin ./config ./install-fabric.sh
#     echo "========== Artefak lama berhasil dihapus =========="
# }

# # Fungsi untuk mengunduh binary Fabric SESUAI DOKUMENTASI RESMI
# function downloadFabricBinaries() {
#     if [ ! -d "bin" ]; then
#         echo "FABRIC BINARIES NOT FOUND"
#         echo "====== Mengunduh Hyperledger Fabric Binaries v2.5.13 dan Fabric CA v1.5.15 ======"
#         # Mengunduh skrip install
#         curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh
#         # Menjalankan skrip dengan versi yang benar
#         ./install-fabric.sh binary --fabric-version 2.5.13 --ca-version 1.5.15
#         echo "====== Unduhan Selesai ======"
#     fi
# }

# # Fungsi untuk membangkitkan materi kripto
# function generateCrypto() {
#     echo "========== Membangkitkan materi kripto (untuk 2 peer per org)... =========="
#     ./bin/cryptogen generate --config=./crypto-config.yaml --output="organizations"
#     echo "========== Materi kripto berhasil dibuat =========="
# }

# # Fungsi untuk membangkitkan genesis block
# function createGenesisBlock() {
#     echo "========== Membuat Genesis Block... =========="
#     ./bin/configtxgen -profile MediSyncOrdererGenesis -channelID system-channel -outputBlock ./system-genesis-block/genesis.block
#     echo "========== Genesis Block berhasil dibuat =========="
# }

# # Fungsi untuk menjalankan jaringan
# function networkUp() {
    
#     downloadFabricBinaries
#     generateCrypto
#     createGenesisBlock
    
#     echo "========== Menjalankan Jaringan Docker (6 peer)... =========="
#     docker compose -f $COMPOSE_FILE_BASE up -d
#     docker ps -a
#     echo "========== Jaringan Docker berhasil berjalan =========="
# }

# # Fungsi untuk membuat channel
# function createChannel() {
#     echo "========== Membuat Channel... =========="
#     # Buat channel transaction
#     ./bin/configtxgen -profile MediSyncChannel -outputCreateChannelTx ./channel-artifacts/${CHANNEL_NAME}.tx -channelID $CHANNEL_NAME

#     # Jalankan perintah create channel dari dalam CLI container
#     docker exec cli peer channel create -o orderer.medisync.com:7050 -c $CHANNEL_NAME --ordererTLSHostnameOverride orderer.medisync.com -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/${CHANNEL_NAME}.tx --outputBlock /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/${CHANNEL_NAME}.block --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem

#     echo "========== Channel berhasil dibuat =========="
#     joinChannel
# }

# # Fungsi untuk join peer ke channel
# function joinChannel() {
#     echo "========== Bergabung ke Channel... =========="
#     # Loop untuk setiap org dan setiap peer
#     for org in 1 2 3; do
#         for peer in 0 1; do
#             if [ $org -eq 1 ]; then
#                 MSP="ProdusenMSP"
#                 if [ $peer -eq 0 ]; then PORT=7051; else PORT=8051; fi
#             elif [ $org -eq 2 ]; then
#                 MSP="PBFMSP"
#                 if [ $peer -eq 0 ]; then PORT=9051; else PORT=10051; fi
#             elif [ $org -eq 3 ]; then
#                 MSP="ApotekMSP"
#                 if [ $peer -eq 0 ]; then PORT=11051; else PORT=12051; fi
#             fi
#             echo "Bergabung ke channel untuk peer${peer}.org${org}.medisync.com..."
#             docker exec -e CORE_PEER_LOCALMSPID=$MSP \
#                 -e CORE_PEER_ADDRESS="peer${peer}.org${org}.medisync.com:${PORT}" \
#                 -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/users/Admin@org${org}.medisync.com/msp" \
#                 -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/peers/peer${peer}.org${org}.medisync.com/tls/ca.crt" \
#                 cli peer channel join -b /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/${CHANNEL_NAME}.block
#         done
#     done
#     echo "========== Semua 6 peer berhasil join channel =========="
    
#     updateAnchorPeers
# }

# function updateAnchorPeers() {
#     echo "========== Update Anchor Peers (hanya peer0)... =========="
#     # Produsen
#     ./bin/configtxgen -profile MediSyncChannel -outputAnchorPeersUpdate ./channel-artifacts/ProdusenMSPanchors.tx -channelID $CHANNEL_NAME -asOrg ProdusenMSP
#     docker exec cli peer channel update -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com -c $CHANNEL_NAME -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/ProdusenMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
#     echo "Anchor Peer Produsen (org1) berhasil diupdate."

#     # PBF
#     ./bin/configtxgen -profile MediSyncChannel -outputAnchorPeersUpdate ./channel-artifacts/PBFMSPanchors.tx -channelID $CHANNEL_NAME -asOrg PBFMSP
#     docker exec -e CORE_PEER_LOCALMSPID="PBFMSP" -e CORE_PEER_ADDRESS="peer0.org2.medisync.com:9051" -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.medisync.com/users/Admin@org2.medisync.com/msp" -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.medisync.com/peers/peer0.org2.medisync.com/tls/ca.crt" cli peer channel update -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com -c $CHANNEL_NAME -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/PBFMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
#     echo "Anchor Peer PBF (org2) berhasil diupdate."

#     # Apotek
#     ./bin/configtxgen -profile MediSyncChannel -outputAnchorPeersUpdate ./channel-artifacts/ApotekMSPanchors.tx -channelID $CHANNEL_NAME -asOrg ApotekMSP
#     docker exec -e CORE_PEER_LOCALMSPID="ApotekMSP" -e CORE_PEER_ADDRESS="peer0.org3.medisync.com:11051" -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.medisync.com/users/Admin@org3.medisync.com/msp" -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.medisync.com/peers/peer0.org3.medisync.com/tls/ca.crt" cli peer channel update -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com -c $CHANNEL_NAME -f /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/channel-artifacts/ApotekMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
#     echo "Anchor Peer Apotek (org3) berhasil diupdate."
#     echo "========== Semua Anchor Peer berhasil diupdate =========="
# }

# # Fungsi untuk deploy chaincode
# function deployCC() {
#     echo "========== Deploy Chaincode... =========="
#     # Package
#     docker exec cli peer lifecycle chaincode package ${CC_NAME}.tar.gz --path /opt/gopath/src/github.com/chaincode/${CC_NAME}/javascript --lang node --label ${CC_NAME}_${CC_VERSION}
#     echo "Chaincode berhasil di-package."
    
#     # Install di semua 6 peer DENGAN IDENTITAS YANG BENAR
#     echo "Install chaincode di semua 6 peer..."
#     for org in 1 2 3; do
#         if [ $org -eq 1 ]; then
#             MSP="ProdusenMSP"
#         elif [ $org -eq 2 ]; then
#             MSP="PBFMSP"
#         elif [ $org -eq 3 ]; then
#             MSP="ApotekMSP"
#         fi
        
#         for peer in 0 1; do
#             if [ $org -eq 1 ]; then
#                 if [ $peer -eq 0 ]; then PORT=7051; else PORT=8051; fi
#             elif [ $org -eq 2 ]; then
#                 if [ $peer -eq 0 ]; then PORT=9051; else PORT=10051; fi
#             elif [ $org -eq 3 ]; then
#                 if [ $peer -eq 0 ]; then PORT=11051; else PORT=12051; fi
#             fi

#             echo "--- Menginstall di peer${peer}.org${org}.medisync.com (sebagai admin Org${org}) ---"
        
#             docker exec \
#               -e CORE_PEER_LOCALMSPID=$MSP \
#               -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/peers/peer${peer}.org${org}.medisync.com/tls/ca.crt" \
#               -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org${org}.medisync.com/users/Admin@org${org}.medisync.com/msp" \
#               -e CORE_PEER_ADDRESS="peer${peer}.org${org}.medisync.com:${PORT}" \
#               cli peer lifecycle chaincode install ${CC_NAME}.tar.gz
#         done
#     done
#     echo "Chaincode diinstall di semua 6 peer."

#     # Query installed dan set package ID (sebagai Admin Org1)
#     docker exec -e CORE_PEER_ADDRESS="peer0.org1.medisync.com:7051" \
#         -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp" \
#         cli peer lifecycle chaincode queryinstalled >&log.txt
    
#     PACKAGE_ID=$(sed -n "/Package ID: ${CC_NAME}_${CC_VERSION}:/,/Label: /p" log.txt | sed -n 's/Package ID: //; s/, Label:.*//p')
#     echo "Package ID adalah: ${PACKAGE_ID}"
    
#     # Approve oleh setiap org (cukup sekali per org, gunakan peer0)
#     echo "--- Menyetujui chaincode untuk setiap organisasi ---"
#     docker exec -e CORE_PEER_ADDRESS="peer0.org1.medisync.com:7051" \
#         -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp" \
#         cli peer lifecycle chaincode approveformyorg -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE} --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
#     echo "Chaincode disetujui oleh Produsen."
    
#     docker exec -e CORE_PEER_LOCALMSPID="PBFMSP" -e CORE_PEER_ADDRESS="peer0.org2.medisync.com:9051" \
#         -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.medisync.com/users/Admin@org2.medisync.com/msp" \
#         -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.medisync.com/peers/peer0.org2.medisync.com/tls/ca.crt" \
#         cli peer lifecycle chaincode approveformyorg -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE} --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
#     echo "Chaincode disetujui oleh PBF."
    
#     docker exec -e CORE_PEER_LOCALMSPID="ApotekMSP" -e CORE_PEER_ADDRESS="peer0.org3.medisync.com:11051" \
#         -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.medisync.com/users/Admin@org3.medisync.com/msp" \
#         -e CORE_PEER_TLS_ROOTCERT_FILE="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.medisync.com/peers/peer0.org3.medisync.com/tls/ca.crt" \
#         cli peer lifecycle chaincode approveformyorg -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --package-id ${PACKAGE_ID} --sequence ${CC_SEQUENCE} --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem
#     echo "Chaincode disetujui oleh Apotek."
    
#     # Commit (sebagai Admin Org1)
#     echo "--- Melakukan commit chaincode ke channel ---"
#     docker exec -e CORE_PEER_ADDRESS="peer0.org1.medisync.com:7051" \
#         -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp" \
#         cli peer lifecycle chaincode commit -o orderer.medisync.com:7050 --ordererTLSHostnameOverride orderer.medisync.com --channelID $CHANNEL_NAME --name ${CC_NAME} --version ${CC_VERSION} --sequence ${CC_SEQUENCE} --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/medisync.com/orderers/orderer.medisync.com/msp/tlscacerts/tlsca.medisync.com-cert.pem \
#         --peerAddresses peer0.org1.medisync.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/peers/peer0.org1.medisync.com/tls/ca.crt \
#         --peerAddresses peer0.org2.medisync.com:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org2.medisync.com/peers/peer0.org2.medisync.com/tls/ca.crt \
#         --peerAddresses peer0.org3.medisync.com:11051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org3.medisync.com/peers/peer0.org3.medisync.com/tls/ca.crt
#     echo "========== Chaincode berhasil di-commit ke channel =========="
    
#     # Query committed (sebagai Admin Org1)
#     docker exec -e CORE_PEER_ADDRESS="peer0.org1.medisync.com:7051" \
#         -e CORE_PEER_MSPCONFIGPATH="/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/org1.medisync.com/users/Admin@org1.medisync.com/msp" \
#         cli peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name ${CC_NAME}
# }
# # Parsing argumen dari command line
# if [ "$1" == "up" ]; then
#   networkUp
# elif [ "$1" == "down" ]; then
#   clearContainers
# elif [ "$1" == "restart" ]; then
#   clearContainers
#   removeOldArtifacts
#   networkUp
#   echo "Menunggu 10 detik agar orderer siap..."
#   sleep 10 
#   createChannel
#   deployCC
# elif [ "$1" == "createChannel" ]; then
#   createChannel
# elif [ "$1" == "deployCC" ]; then
#   deployCC
# else
#   echo "Penggunaan: ./network.sh [up|down|restart|createChannel|deployCC]"
#   exit 1
# fi