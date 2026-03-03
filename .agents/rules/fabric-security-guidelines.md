---
trigger: always_on
---

Project ini menggunakan Hyperledger Fabric versi 2.5+. Berdasarkan package-lock.json, dependensi backend menggunakan @hyperledger/fabric-gateway versi ^1.7.1 (Fabric Gateway API terbaru) dan bukan fabric-network lawas. Agen WAJIB memeriksa package.json di dalam folder backend/ untuk memastikan SDK mana yang aktif digunakan sebelum mengedit controller.
- DILARANG menggunakan sintaks Fabric v1.4.
- Untuk implementasi ABAC pada chaincode (fabric-contract-api), WAJIB menggunakan ctx.clientIdentity.assertAttributeValue().
- Untuk fitur Private Data Collection (PDC) di backend, data rahasia WAJIB dikirim sebagai Transient Data dengan format Buffer. Jangan pernah mengirim data rahasia (seperti harga atau komposisi) sebagai argumen reguler pada fungsi submit/evaluate.