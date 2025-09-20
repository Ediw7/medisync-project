FROM hyperledger/fabric-ca:1.5.7
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*