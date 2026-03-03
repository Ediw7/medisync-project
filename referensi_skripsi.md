BAB III 
PERANCANGAN SISTEM

3.1	Gambaran Umum Sistem
Sistem yang dikembangkan dalam penelitian ini adalah MediSync, sebuah platform manajemen rantai pasok farmasi berbasis permissioned blockchain yang dirancang untuk mengatasi permasalahan transparansi dan keamanan data distribusi obat. Berbeda dengan sistem konvensional yang bersifat sentralisasi, MediSync memanfaatkan arsitektur terdesentralisasi Hyperledger Fabric untuk menghubungkan tiga entitas utama dalam ekosistem farmasi, yaitu Produsen (Org1), Pedagang Besar Farmasi (Org2), dan Apotek (Org3).
Secara garis besar, arsitektur sistem MediSync dibangun dengan model Hybrid On-Chain/Off-Chain. Sebagaimana diperlihatkan pada Gambar 3.1 Arsitekur Sistem MediSync, sistem terdiri dari aplikasi antarmuka pengguna (frontend) berbasis web yang terhubung ke layanan backend melalui REST API. Backend ini kemudian bertindak sebagai perantara (gateway) yang meneruskan transaksi ke jaringan blockchain Hyperledger Fabric serta melakukan sinkronisasi data pendukung ke basis data relasional (MySQL) untuk keperluan analitik.

Gambar 3.2 Arsitektur Sistem MediSync

Meskipun arsitektur umum pada Gambar 3.1 telah mendukung fungsi pelacakan, penelitian ini berfokus pada pengembangan arsitektur keamanan berlapis (layered security architecture) yang lebih mendalam di dalam komponen blockchain. Sebagaimana diilustrasikan secara spesifik pada Gambar 3.2 Arsitektur Keamanan Berlapis (PDC dan ABAC), alur keamanan dirancang untuk memfilter setiap transaksi yang masuk melalui dua mekanisme pertahanan:
1.	Mekanisme ABAC (Authorization Layer): Sebagai lapisan pertahanan pertama, smart contract melakukan validasi ketat terhadap atribut identitas pengguna sebelum logika bisnis dieksekusi. Sistem memeriksa atribut spesifik (seperti role) yang tertanam secara kriptografi dalam sertifikat X.509 pengguna. Jika atribut tidak sesuai transaksi akan ditolak secara otomatis di tingkat kode chaincode dengan pesan kesalahan "Access Denied", mencegah eksekusi fungsi yang tidak sah.
2.	Mekanisme PDC (Confidentiality Layer): Setelah lolos validasi otorisasi, data transaksi dipilah berdasarkan tingkat kerahasiaannya. Data publik (seperti status pengiriman dan batch ID) dicatat ke dalam Public Ledger yang transparan. Sebaliknya, data sensitif disimpan secara terisolasi di dalam Private Data Collection (SideDB) yang hanya dapat diakses oleh organisasi yang memiliki izin eksplisit dalam Kebijakan Koleksi (Collection Policy).

Gambar 3.2 Arsitektur Keamanan Berlapis (PDC dan ABAC)
Melalui pendekatan dua gambar ini, sistem MediSync tidak hanya menjamin integritas data pelacakan obat secara makro, tetapi juga memberikan perlindungan mikro terhadap privasi bisnis dan penyalahgunaan wewenang internal.
3.2	Analisis Kebutuhan Sistem
Analisis kebutuhan sistem bertujuan untuk mengidentifikasi dan mendefinisikan spesifikasi teknis yang harus dipenuhi oleh MediSync agar mekanisme keamanan berlapis (layered security) dapat berjalan efektif tanpa mengurangi kinerja operasional rantai pasok.
Kebutuhan sistem dimodelkan dalam bentuk Use Case Diagram sebagaimana ditunjukkan pada Gambar 3.3 Use Case Diagram Sistem MediSync. Diagram ini merepresentasikan interaksi antara aktor (Produsen, PBF, Apotek) dengan fitur-fitur sistem yang telah dilindungi oleh mekanisme validasi atribut (Attribute-Based Access Control) dan penyimpanan data privat (Private Data Collection).

Gambar 3.3 Use Case Diagram Sistem MediSync
3.2.1	Kebutuhan Fungsional
Kebutuhan fungsional mendefinisikan layanan-layanan spesifik yang harus disediakan oleh sistem serta bagaimana sistem harus bereaksi terhadap input tertentu dari pengguna. Berdasarkan analisis Use Case Diagram di atas, kebutuhan fungsional sistem MediSync dikelompokkan menjadi tiga aspek utama: manajemen identitas dan otorisasi (ABAC), manajemen privasi data (PDC), dan operasional inti rantai pasok. Rincian spesifikasi kebutuhan fungsional sistem dijabarkan dalam Tabel 3.1 berikut ini.
Tabel 3.1 Spesifikasi Kebutuhan Fungsional Sistem
Kode	Kategori	Nama Kebutuhan	Deskripsi Spesifikasi
MSS-01	ABAC	Registrasi Identitas Beratribut	Sistem harus mampu mendaftarkan pengguna dan menerbitkan sertifikat X.509 yang memuat atribut tambahan spesifik (custom attributes), seperti role, department, atau access_level sesuai struktur organisasi.
MSS-02	ABAC	Validasi Atribut Otomatis	Smart contract harus memiliki logika untuk membaca dan memvalidasi atribut dari sertifikat pengguna (Client Identity) secara otomatis setiap kali fungsi transaksi dipanggil.
MSS -03	ABAC	Penolakan Akses (Rejection)	Sistem wajib menolak transaksi dan mengembalikan pesan kesalahan (error response) apabila atribut pengguna tidak sesuai dengan kebijakan akses fungsi, meskipun pengguna berasal dari organisasi yang valid.
MSS -04	PDC	Pemisahan Input Data	Sistem harus memfasilitasi antarmuka input yang memisahkan antara Data Publik (ID Batch, Tanggal, Status) dan Data Privat (Harga Pokok Produksi, Komposisi Obat, Dosis) sebelum dikirim ke backend.
MSS -05	PDC	Penyimpanan Terisolasi (SideDB)	Data yang dikategorikan privat harus disimpan secara otomatis ke dalam Side Database (SideDB) lokal pada peer organisasi yang berhak (Produsen, PBF, dan Apotek) dan tidak didistribusikan ke peer lain yang tidak terdaftar dalam kebijakan koleksi.
MSS -06	PDC	Pencatatan Jejak Audit (Hashing)	Sistem harus mencatat hash (sidik jari digital) dari data privat ke dalam ledger publik sebagai bukti integritas data (tamper-proof) tanpa mengungkapkan nilai aslinya kepada publik.
MSS -07	PDC	Dekripsi Data Terbatas	Sistem harus menyediakan mekanisme bagi aktor yang berwenang (Mitra Rantai Pasok) untuk melakukan query data privat dan mendekripsinya untuk keperluan verifikasi keaslian produk atau audit.
MSS -08	Core	Produksi Obat (Create Batch)	Aktor Produsen dapat membuat data batch obat baru dengan menyertakan data sensitif (PDC) yang akan menghasilkan ID unik dan tercatat secara immutable di dalam blockchain.
MSS -09	Core	Distribusi Barang (Transfer)	Aktor PBF dapat mendistribusikan obat ke Apotek dan memindahkan hak kepemilikan aset, di mana validitas data privat tetap terjaga dan dapat diverifikasi oleh penerima.
MSS -10	Core	Verifikasi & Penerimaan	Aktor Apotek dapat memverifikasi status batch di ledger publik dan mengonfirmasi penerimaan barang untuk memindahkan status kepemilikan aset secara sah.

3.2.2	Kebutuhan Non-Fungsional
Kebutuhan non-fungsional mendefinisikan batasan kualitas (quality constraints) dan karakteristik perilaku sistem yang harus dipenuhi untuk menjamin keandalan operasional. Mengingat sistem MediSync menerapkan mekanisme keamanan tambahan (enkripsi PDC dan validasi ABAC) yang berpotensi memengaruhi sumber daya komputasi, penetapan standar kinerja dan keamanan menjadi sangat krusial. Rincian spesifikasi kebutuhan non-fungsional sistem dijabarkan dalam Tabel 3.2 berikut ini.
Tabel 3.2 Spesifikasi Kebutuhan Non-Fungsional Sistem
Kode	Parameter	Deskripsi Kebutuhan
MSS-NF01	Kerahasiaan (Confidentiality)	Informasi sensitif, khususnya Komposisi Obat (Resep Rahasia) dan Harga Pokok Produksi (HPP), harus terjamin kerahasiaannya secara kriptografis dan tidak dapat diakses oleh kompetitor atau pihak yang tidak berkepentingan dalam jaringan yang sama.
MSS-NF02	Integritas (Integrity)	Seluruh riwayat transaksi yang tercatat di ledger publik maupun hash dari data privat harus bersifat kekal (append-only), dapat diverifikasi, dan tahan terhadap segala upaya manipulasi atau penghapusan data sepihak.
MSS-NF03	Kinerja (Performance)	Proses tambahan untuk validasi atribut (ABAC) dan enkripsi/dekripsi data privat (PDC) harus dioptimalkan agar tidak menyebabkan latensi transaksi melebihi 2 detik pada kondisi beban jaringan normal.
MSS-NF04	Ketersediaan (Availability)	Sistem harus memiliki toleransi kesalahan (fault tolerance) yang tinggi, di mana jaringan blockchain tetap dapat beroperasi memproses transaksi meskipun salah satu peer mengalami kegagalan (downtime), didukung oleh mekanisme konsensus Raft.
MSS- NF05	Interoperabilitas (Interoperability)	Backend sistem harus dibangun menggunakan standar komunikasi terbuka (REST API) dan format pertukaran data JSON (JavaScript Object Notation) untuk memastikan kemudahan integrasi dengan berbagai platform aplikasi klien (frontend).

3.3	Perancangan Arsitektur Jaringan Hyperledger Fabric
Perancangan arsitektur jaringan (network topology) mendefinisikan infrastruktur fisik dan konfigurasi node yang membentuk lingkungan blockchain MediSync. Sistem ini dibangun di atas platform Hyperledger Fabric menggunakan arsitektur kontainerisasi untuk menjamin isolasi dan skalabilitas. Topologi jaringan dirancang untuk merepresentasikan alur rantai pasok farmasi yang terdiri dari tiga entitas bisnis utama dan satu entitas konsensus, yang secara kolektif disebut sebagai medisync network.
Topologi jaringan MediSync diilustrasikan pada Gambar 3.4 Topologi Jaringan Hyperledger Fabric MediSync. Arsitektur ini mengadopsi prinsip desentralisasi dan ketersediaan tinggi (High Availability), di mana setiap organisasi mengelola infrastrukturnya sendiri secara independen.

Gambar 3.4 Topologi Jaringan Hyperledger Fabric MediSync
Spesifikasi teknis komponen jaringan dirancang pada medisync network sebagai berikut:
1.	Jaringan terdiri dari empat organisasi otonom yang masing-masing memiliki identitas MSP (Membership Service Provider) unik, yaitu:
	Produsen (ProdusenMSP): Entitas manufaktur obat.
	PBF (PBFMSP): Entitas distributor/pedagang besar.
	Apotek (ApotekMSP): Entitas layanan ritel farmasi.
	Orderer (OrdererMSP): Entitas netral pengelola konsensus.
2.	Untuk menjamin ketahanan jaringan (network resilience), setiap organisasi bisnis (Produsen, PBF, Apotek) dikonfigurasi untuk menjalankan dua peer sekaligus (Peer0 dan Peer1).
	Fungsi: Kedua peer berfungsi sebagai Endorsing Peer (memvalidasi transaksi) dan Committing Peer (mencatat blok).
	Redundansi: Jika Peer0 mengalami gangguan (downtime), Peer1 dapat mengambil alih peran tersebut sehingga layanan tetap tersedia tanpa henti.
	Penyimpanan Data: Setiap peer memelihara salinan ledger publik dan chaincode yang identik. Khusus untuk PBF dan Apotek, peer juga dikonfigurasi untuk menyimpan Side Database (CouchDB) guna menampung data privat (PDC).
3.	Jaringan menggunakan layanan orderer terpusat dengan alamat orderer.medisync.com:7050. Layanan ini bertugas mengumpulkan transaksi yang telah di-endorse, mengurutkannya ke dalam blok, dan mendistribusikannya ke seluruh peer di jaringan.
4.	Seluruh komunikasi antar node dilakukan melalui satu saluran aplikasi bernama medichanel. Ketiga organisasi terhubung ke saluran ini untuk berbagi ledger yang sama. Aplikasi klien (backend) masing-masing organisasi terhubung ke peer milik organisasinya sendiri menggunakan Fabric SDK untuk mengirimkan proposal transaksi.
3.4	Perancangan Mekanisme Kontrol Akses 
Perancangan kontrol akses dalam sistem MediSync menerapkan model Attribute-Based Access Control (ABAC). Pendekatan ini dipilih untuk menyempurnakan mekanisme validasi standar Hyperledger Fabric yang hanya memeriksa ID Organisasi (MSP). Dengan ABAC, hak akses setiap fungsi chaincode divalidasi secara granular berdasarkan atribut role yang tertanam dalam sertifikat X.509 pengguna
3.4.1	Skema Identitas dan Atribut
Setiap identitas pengguna yang didaftarkan ke dalam jaringan (melalui Fabric CA) dirancang untuk memuat atribut tambahan. Tabel 3.3 mendefinisikan skema atribut yang membedakan peran spesifik dalam setiap organisasi.
Tabel 3.3 Rancangan Skema Atribut Pengguna
Organisasi	Peran Pengguna	Atribut Kunci	Nilai Atribut	Deskripsi Kewenangan
Produsen	Admin Produksen	role	produsen	Berwenang melakukan pencatatan awal produksi obat (minting) dan manajemen batch.
PBF	Admin PBF	role	admin_pbf	Berwenang melakukan pengelolaan stok masuk dari Produsen dan distribusi ke Apotek (termasuk akses data privat).
Apotek	Admin Apotek	role	admin_apotek	Berwenang melakukan verifikasi penerimaan fisik, konfirmasi transaksi, dan pengecekan stok di level retail.

3.4.2	Matriks Akses Fungsi (Function Access Matrix)
Logika validasi akses diterapkan pada fungsi-fungsi kritis di dalam smart contract. Tabel 3.4 berikut memetakan fungsi-fungsi kritis dengan persyaratan atribut yang harus dipenuhi oleh pemanggil (invoker).
Tabel 3.4 Matriks Akses Fungsi Chaincode
Kontrak (Contract)	Nama Fungsi	Aktor Valid	Syarat Atribut (ABAC)	Deskripsi Akses Data
ProdusenContract	createObat	Produsen	role == 'produsen'	Menulis data batch baru ke Public Ledger dan data sensitif ke Private Data Collection.
transferToPbf	Produsen	role == ‘produsen'	Mengubah kepemilikan aset dari Produsen ke PBF.
PbfContract	terimaBarang	PBF	role == 'admin_pbf'	Mem-validasi penerimaan fisik dari Produsen dan memper-barui status ledger.
transferToApotek	PBF	role == 'admin_pbf’	Mengirim obat ke Apotek dan menulis data harga rahasia ke PDC (SideDB).
ApotekContract	terimaBarang	Apotek	role == 'admin_apotek’	Memvalidasi penerimaan fisik dari PBF dan mengonfirmasi transaksi akhir.
queryStokApotek	Apotek	role == 'admin_apotek’	Membaca data stok milik Apotek dari ledger untuk ditampilkan di aplikasi.
KonsumenContract	queryRiwayatObat	Publik	None (Public Access)	Membaca riwayat jejak obat (Traceability).
3.4.3	Alur Logika Validasi
Untuk merealisasikan rancangan di atas, sistem mengimplementasikan alur validasi bertingkat yang melibatkan lapisan Aplikasi (Backend) dan lapisan Blockchain (Chaincode):
1.	Validasi Identitas di Gateway (Backend): Sebelum transaksi dikirim ke jaringan, Backend Controller menginisialisasi koneksi Gateway menggunakan identitas spesifik pengguna yang sedang login (username). Hal ini memastikan bahwa sertifikat X.509 yang digunakan untuk menandatangani transaksi adalah milik pengguna tersebut, bukan milik admin generik.
2.	Validasi MSP (Level Organisasi - Chaincode): Di dalam Smart Contract, sistem pertama kali memeriksa ID Organisasi pengguna. Contoh logika: const mspID = ctx.clientIdentity.getMSPID(); Sistem memastikan mspID sesuai dengan kontrak yang diakses (misalnya ProdusenMSP untuk ProdusenContract).
3.	Validasi Atribut (Level Peran - Chaincode): Setelah lolos validasi organisasi, sistem menggunakan pustaka cid (Client Identity) untuk memeriksa nilai atribut role. Contoh logika validasi: ctx.clientIdentity.assertAttributeValue('role', 'admin_pbf'); Jika sertifikat pengguna tidak memiliki atribut role dengan nilai admin_pbf, maka transaksi akan ditolak secara otomatis oleh jaringan dengan pesan kesalahan "Access Denied".
3.5	Perancangan Private Data Collection 
MediSync menggunakan fitur Private Data Collection (PDC) dari Hyperledger Fabric untuk menyelesaikan dilema antara transparansi publik dan kerahasiaan bisnis. Sebagaimana diterapkan dalam sistem xCRM oleh Amin dkk. [9], mekanisme ini memungkinkan data sensitif disimpan secara terisolasi di Side Database (CouchDB lokal peer) tanpa disebarkan ke seluruh channel, sementara bukti keberadaannya (evidence) tetap tercatat di ledger utama.
Untuk menjamin integritas data privat yang disimpan secara off-chain (SideDB), sistem menerapkan algoritma kriptografi SHA-256. Mekanisme pembentukan hash dan verifikasi data yang dirancang dalam sistem ini mengacu pada Persamaan 2.1 dan Persamaan 2.2 yang telah dijelaskan pada Subbab 2.2.4. Dengan arsitektur ini, MediSync menjamin bahwa Produsen dapat membuktikan keaslian data produksinya kepada Apotek atau regulator melalui pencocokan hash (H_onChain), tanpa perlu membuka rincian rahasia dagang D_priv) kepada kompetitor yang berada dalam jaringan blockchain yang sama.
3.5.1	Struktur Data Privat dan Publik
Perancangan struktur data dilakukan dengan memisahkan atribut transaksi menjadi dua kategori: data publik yang disimpan secara On-Chain (di ledger semua peer) dan data privat yang disimpan secara Off-Chain (di SideDB peer tertentu).
1.	Struktur Aset Publik (On-Chain Public Data): Data ini disimpan di World State dan dapat diakses oleh seluruh peer dalam jaringan untuk keperluan pelacakan (track and trace).
{
  "docType": "obat",
  "id": "BATCH-XYZ-123",
  "namaObat": "Amoxicillin Premium",
  "nomorIzinEdar": "NIE-2025-001",
  "statusSaatIni": "DIPRODUKSI",
  "pemilikSaatIni": "ProdusenMSP",
  "tanggalKadaluarsa": "2026-12-12"
}

2.	Struktur Aset Privat (In-PDC Data): Data ini memuat informasi sensitif yang hanya disimpan di Side Database (SideDB) milik organisasi yang memiliki izin. Berdasarkan implementasi pada fungsi createObat di chaincode, atribut privat meliputi:
{
"id": "BATCH-XYZ-123",
"hargaPerUnit": 100000,
"komposisi": "Amoxicillin Trihydrate 500mg",
"dosis": "3x1 Sehari",
"hashDokumen": {
"hasilUjiMutu": "a1b2c3d4...", // Hash dari file sertifikat
"suratJalan": ""
}
}

3.5.2	 Definisi Koleksi (Collection Definition)
Untuk memfasilitasi kebutuhan akses yang berbeda antar-aktor, sistem mendefinisikan konfigurasi koleksi dalam berkas collections_config.json. Koleksi utama yang digunakan untuk menampung data produksi obat adalah collectionPrivate. Rancangan konfigurasi JSON adalah sebagai berikut:

[
    {
        "name": "collectionPrivate",
        "policy": "OR('ProdusenMSP.member', 'PBFMSP.member', 'ApotekMSP.member')",
        "requiredPeerCount": 0,
        "maxPeerCount": 3,
        "blockToLive": 0,
        "memberOnlyRead": true,
        "memberOnlyWrite": true,
        "endorsementPolicy": {
            "signaturePolicy": "OR('ProdusenMSP.member', 'PBFMSP.member', 'ApotekMSP.member')"
        }
    }
]
Analisis parameter konfigurasi:
	name: collectionPrivate: Koleksi global yang dirancang untuk menyimpan detail spesifikasi obat.
	policy: Menggunakan logika OR yang mencakup ketiga organisasi (ProdusenMSP, PBFMSP, ApotekMSP). Hal ini dirancang agar data spesifikasi obat (seperti Komposisi dan Uji Mutu) yang diinput oleh Produsen dapat diteruskan dan diverifikasi validitasnya oleh PBF dan Apotek tanpa harus mengekspos data tersebut ke publik atau Orderer.
	memberOnlyRead: true: Menjamin bahwa hanya peer yang menjadi anggota koleksi ini yang dapat membaca data sensitif tersebut dari SideDB. Pihak luar (non-member) hanya akan melihat hash data di ledger utama sebagai bukti integritas.
3.6	Perancangan Smart Contract (Chaincode Logic)
Inti dari logika bisnis dan keamanan sistem MediSync tertanam dalam Smart Contract (Chaincode) yang dikembangkan menggunakan bahasa pemrograman JavaScript (Node.js). Selain menangani fungsi CRUD (Create, Read, Update, Delete) data obat, Chaincode ini bertanggung jawab menegakkan kebijakan keamanan menggunakan model Attribute-Based Access Control (ABAC). Kebijakan akses dirancang berdasarkan model formal himpunan ABAC = { S, O, A, E, P } yang merujuk pada Persamaan 2.3 di Subbab 2.2.5.
Dalam implementasi MediSync, fungsi evaluasi (Persamaan 2.4) diterjemahkan ke dalam kode JavaScript (Chaincode). Sebagai contoh, untuk fungsi Pencatatan Obat, kebijakan (P_create) mensyaratkan bahwa subjek harus memiliki atribut role bernilai 'Produsen' dan mspid yang valid.
P_create^( ))={█(ALLOW, jika (role∈ATTR(S) == 'Produsen')∧(mspid∈ATTR(S)="Org1MSP) @DENY, jika sebaliknya                                                                                                                       )┤
Penerapan formalisasi ini menjamin bahwa setiap permintaan transaksi yang masuk ke peer akan divalidasi secara matematis berdasarkan atribut kriptografi X.509, bukan sekadar ID pengguna, sehingga mencegah akses tidak sah (Unauthorized Access) secara efektif.
3.6.1	Diagram Alir Logika (Flowchart)
Alur eksekusi fungsi createObat digambarkan dalam Gambar 3.5 Flowchart Diagram Produksi Obat dengan Validasi ABAC dan PDC. Diagram ini memvisualisasikan mekanisme pertahanan berlapis di mana sistem menolak akses secara dini jika atribut peran (role) pengguna tidak bernilai 'produsen', serta mengilustrasikan bagaimana data sensitif (seperti Harga, Komposisi, dan Dosis) dipisahkan dari argumen publik dan disimpan secara terisolasi ke dalam Private Data Collection (collectionPrivate).

Gambar 3.5 Flowchart Diagram Fungsi Produksi Obat dengan Validasi ABAC dan PDC
3.6.2	Algoritma Pseudocode
Untuk memperjelas logika teknis yang akan diimplementasikan, berikut adalah representasi algoritma (pseudocode) dari fungsi createObat berdasarkan implementasi kode produsenContract.js.
FUNGSI createObat(ctx, idBatch, namaObat, izinEdar, tglProduksi, tglExp, jumlah)

    // 1. Inisialisasi & Validasi Organisasi
    ClientIdentity = ctx.getClientIdentity()
    MSPID = ClientIdentity.getMSPID()

    JIKA MSPID != 'ProdusenMSP' MAKA
        LEMPAR ERROR "Akses Ditolak: Hanya Produsen yang boleh membuat obat"

    // 2. Validasi Atribut ABAC (Role Check)
    // Memastikan user adalah admin produksi yang sah
    RoleAttr = ClientIdentity.getAttributeValue('role')
    JIKA RoleAttr != 'produsen' MAKA
        LEMPAR ERROR "Akses Ditolak: Role tidak mencukupi"

    // 3. Ambil Input Data Privat (Secure Transient Input)
    // Data ini tidak tercatat di Transaction Log Orderer
    TransientMap = ctx.stub.getTransient()
    
    Harga        = TransientMap.get('hargaPerUnit')
    Komposisi    = TransientMap.get('komposisi')
    Dosis        = TransientMap.get('dosis')
    HashUjiMutu  = TransientMap.get('hashHasilUjiMutu')

    JIKA (Harga KOSONG) ATAU (Komposisi KOSONG) MAKA
        LEMPAR ERROR "Data privat wajib dikirim via Transient Map"

    // 4. Konstruksi Objek Data
    
    // Objek Publik (Disimpan di World State)
    PublicObat = {
        docType: 'obat',
        id: idBatch,
        nama: namaObat,
        izin: izinEdar,
        status: 'DIPRODUKSI',
        pemilik: 'ProdusenMSP'
    }

    // Objek Privat (Disimpan di SideDB)
    PrivateObat = {
        id: idBatch,
        harga: Harga,
        komposisi: Komposisi,
        dosis: Dosis,
        ujiMutu: HashUjiMutu
    }

    // 5. Penyimpanan ke Blockchain
    
    // Simpan data publik agar bisa dilacak semua pihak
    PUT_STATE(idBatch, PublicObat)

    // Simpan data privat hanya ke peer yang berhak (collectionPrivate)
    PUT_PRIVATE_DATA('collectionPrivate', idBatch, PrivateObat)

    RETURN "Sukses: Obat berhasil dibuat dengan perlindungan PDC"

AKHIR FUNGSI
Penjelasan tahapan algoritma:
1.	Validasi Organisasi & Peran: Fungsi secara eksplisit memeriksa MSPID dan atribut role. Ini adalah implementasi pertahanan lapis pertama untuk mencegah aktor yang salah (misalnya PBF mencoba membuat obat).
2.	Input Transien (Transient Map): Variabel Harga dan Komposisi diambil menggunakan metode getTransient(). Metode ini menjamin bahwa data tersebut tidak pernah muncul dalam parameter input transaksi yang disebarkan ke seluruh jaringan melalui Orderer.
3.	Penyimpanan Tersegregasi: Fungsi PUT_STATE Menyimpan data logistik ke ledger global agar PBF dan Apotek bisa melacak keberadaan barang, sedangkan PUT_PRIVATE_DATA secara spesifik digunakan untuk menyimpan rahasia dagang ke dalam collectionPrivate (SideDB), yang sesuai dengan konfigurasi kebijakan (policy) hanya dapat dibuka oleh organisasi yang berwenang.
3.7	Perancangan Antarmuka dan Integrasi API
Sub-bab ini membahas perancangan mekanisme integrasi antara lapisan aplikasi (frontend) dan jaringan blockchain (backend). Berdasarkan arsitektur sistem yang memisahkan jalur Query (pembacaan data cepat via MySQL) dan jalur Transaksi (penulisan data aman via Fabric SDK), perancangan ini berfokus pada mekanisme pengiriman data sensitif produksi agar aman saat transit.
3.7.1	Desain Endpoint API dan Payload (Transient Data)
Untuk menjaga kerahasiaan data produksi seperti Harga Pokok Produksi (HPP) dan Komposisi Obat, endpoint API dirancang menggunakan pola Transient Payload. Data sensitif tidak dikirim sebagai argumen transaksi biasa yang tercatat di log publik..Spesifikasi endpoint distribusi:
	Method/URL: POST/api/produsen/:id/record
	Otorisasi: Memerlukan token JWT dengan klaim role: produsen.
	Desain Payload (Request Body):
{
  "batchId": "P1-20251216-XYZ",        // Data Publik (Argumen Chaincode)
  "namaObat": "Amoxicillin 500mg",      // Data Publik
  "dataPrivat": {                       // Data Rahasia (Transient Map)
      "hargaPerUnit": 100000,
      "komposisi": "Amoxicillin Trihydrate",
      "dosis": "3x1 Sehari",
      "hashHasilUjiMutu": "a1b2c3d4..."
  }
}
Dalam desain ini, objek dataPrivat akan dipisahkan oleh controller dan dikirim melalui saluran terenkripsi khusus (transient field), sehingga tidak akan dicatat di Ledger publik Hyperledger Fabric.
3.7.2	Logika Integrasi Backend (Controller Logic)
Pada sisi backend (Node.js), logika controller dirancang untuk memproses payload di atas menggunakan Hyperledger Fabric SDK. Langkah krusial dalam perancangan ini adalah penggunaan fungsi setTransient() pada objek transaksi. Berikut adalah algoritma (pseudocode) untuk controller produksi obat yang aman:
// Algoritma Controller untuk Pencatatan Produksi (recordToBlockchain)
FUNGSI recordToBlockchain (req, res) {
    Input: batchId, prodData (dari MySQL)

    // 1. Persiapan Data Transien (Konversi Buffer)
    // Data wajib dikonversi ke Buffer agar diterima oleh Fabric SDK
    TransientMap = {
        "hargaPerUnit": Buffer.from(String(prodData.harga)),
        "komposisi":    Buffer.from(String(prodData.komposisi)),
        "dosis":        Buffer.from(String(prodData.dosis)),
        "hashHasilUjiMutu": Buffer.from(String(prodData.hashSertifikat))
    }

    // 2. Koneksi ke Gateway Fabric
    // Menggunakan identitas dinamis user yang sedang login
    Gateway = getGateway(req.user.username)
    Network = Gateway.getNetwork('medisyncchannel')
    Contract = Network.getContract('ProdusenContract')

    // 3. Konstruksi Transaksi
    Transaction = Contract.createTransaction('createObat')

    // 4. Sisipkan Data Rahasia
    // PENTING: Data masuk ke 'setTransient', bukan argumen 'submit'
    Transaction.setTransient(TransientMap)

    // 5. Submit ke Blockchain
    // Hanya data publik yang dikirim sebagai argumen fungsi
    Result = Transaction.submit(
        prodData.batchId,
        prodData.namaObat,
        prodData.nomorIzinEdar,
        prodData.tanggalProduksi,
        prodData.tanggalKadaluarsa,
        prodData.jumlah
    )

    RETURN Sukses (Result)
}

3.7.3	Diagram Urutan (Sequence Diagram)
Untuk memberikan gambaran detail mengenai interaksi antar komponen sistem dalam menangani transaksi sensitif, Gambar 3.6 Sequence Urutan Transaksi Distribusi dengan Keamanan Berlapis menyajikan diagram urutan untuk kasus penggunaan pencatatan obat baru oleh Produsen. Diagram ini memvisualisasikan bagaimana mekanisme Transient Data dan ABAC bekerja secara sinergis.


Gambar 3.6 Sequence DiagramTransaksi Distribusi dengan Keamnan Berlapis

Berdasarkan diagram di atas, alur keamanan transaksi dirancang melalui tahapan berikut:
1.	Inisiasi Aman: Admin Produsen melakukan input data produksi melalui antarmuka frontend dan menekan tombol pencatatan. Pada tahap ini, data harga pokok produksi, komposisi obat, dan dosis masih berada di lapisan aplikasi dan belum dikirim ke jaringan.
2.	Konstruksi Payload (Backend): Saat request mencapai Backend API, sistem memisahkan data menjadi dua bagian. Data sensitif (Harga, Komposisi, Dosis) dikonversi menjadi format Buffer dan dimasukkan ke dalam objek Transient Map menggunakan fungsi transaction.setTransient() pada Fabric SDK. Langkah krusial ini memastikan data rahasia tidak dikirim sebagai argumen transaksi reguler yang dapat terbaca di log jaringan..
3.	Eksekusi Smart Contract (Peer):
	Sebelum memproses data, Peer node menjalankan logika ABAC untuk memverifikasi apakah sertifikat pengirim memiliki atribut role dengan nilai 'produsen'.
	Jika validasi berhasil, Chaincode membaca data dari Transient Map dan menyimpannya ke dalam SideDB (Private Data Collection bernama collectionPrivate) menggunakan API putPrivateData. Sementara itu, data umum (Nomor Izin Edar, Tanggal Kadaluarsa) disimpan di Ledger Publik.
4.	Finalisasi Transaksi (Orderer): Setelah transaksi disetujui (endorsed), aplikasi klien mengirimkan hasil transaksi ke layanan Orderer. Sebagaimana terlihat pada diagram (Langkah ke-Orderer), data yang dikirim hanyalah data publik beserta Hash dari data privat. Data harga dan komposisi asli tetap aman tersimpan di SideDB peer Produsen (dan anggota koleksi lain yang berhak) serta tidak pernah terekspos ke jaringan konsensus global.

3.8	Perancangan Skenario Pengujian
Perancangan skenario pengujian dirancang untuk mencakup alur positif (happy path) di mana sistem berjalan normal, serta alur negatif (negative test) untuk menguji ketahanan sistem terhadap akses ilegal. Rincian skenario ditunjukkan pada Tabel 3.5 Skenario Pengujian Sistem.
Tabel 3.5 Skenario Pengujian Sistem
Kode	Fitur yang Diuji	Deskripsi Skenario	Hasil yang Diharapkan
UJI-01	Pencatatan Produksi	Admin Produsen menginput data batch obat baru.	Data tersimpan di blockchain, status "DIPRODUKSI", data sensitif masuk PDC.
UJI-02	Validasi ABAC	Pengguna dengan token yang salah/expired mencoba transaksi.	Sistem menolak transaksi dan menampilkan pesan kesalahan (Access Denied).
UJI-03	Privasi Data (PDC)	Inspeksi data pada Ledger Publik (World State).	Data harga dan komposisi tersembunyi di akses publik, namun terbaca oleh pemilik sah.
UJI-04	Akses Transparan	Apotek memverifikasi stok barang yang diterima dari PBF.	Data stok muncul di sistem Apotek dengan status "TERSEDIA" dan pemilik "ApotekMSP".

BAB IV 
IMPLEMENTASI DAN PENGUJIAN

4.1	Lingkungan Implementasi
Implementasi sistem dilakukan pada lingkungan perangkat keras dan perangkat lunak dengan spesifikasi tertentu untuk menunjang kinerja jaringan blockchain yang membutuhkan sumber daya komputasi intensif.
4.1.1	Spesifikasi Perangkat Keras
Sistem dikembangkan dan diuji menggunakan satu unit komputer (local node) yang menyimulasikan seluruh node jaringan dalam kontainer terisolasi. Spesifikasi perangkat keras yang digunakan dirincikan pada Tabel 4.1.
Tabel 4.1 Spesifikasi Perangkat Keras
Komponen	Spesifikasi
Prosesor	AMD Ryzen 5 5600H (12) @ 4.28 GHz
Memori (RAM)	16 GB DDR4
Penyimpanan	SSD 512 GB (NVMe)
Sistem Operasi	Ubuntu 24.04.3 LTS x86_64
4.1.2	Spesifikasi Perangkat Lunak
Pembangunan sistem memanfaatkan berbagai perangkat lunak dan pustaka (library) pendukung. Rincian versi perangkat lunak yang digunakan tercantum pada Tabel 4.2.
Tabel 4.2 Spesifikasi Perangkat Lunak
Perangkat Lunak	Versi	Fungsi
Hyperledger Fabric	v2.5.13	Platform blockchain inti (Peer, Orderer).
Fabric CA	v1.5.15	Layanan manajemen identitas dan sertifikat.
Docker Engine	v24.x	Container engine untuk menjalankan node.
Docker Compose	v2.x	Orkestrasi kontainer jaringan.
Node.js	v20.19.4	Runtime environment untuk aplikasi dan chaincode.
CouchDB	v3.3	Basis data World State (mendukung Rich Query).
Terminal	-	Antarmuka baris perintah (CLI).

4.2	Implementasi Sistem
Tahapan implementasi sistem mencakup pembangunan infrastruktur jaringan, penerapan kode rantai (chaincode), dan pengembangan aplikasi klien (backend).
4.2.1	Konfigurasi Jaringan Blockchain
Implementasi jaringan MediSync dibangun menggunakan skrip otomasi network.sh yang mengatur orkestrasi kontainer Docker. Berdasarkan rancangan topologi, jaringan dikonfigurasi untuk mendukung ketersediaan tinggi (High Availability) dengan menjalankan dua peer untuk setiap organisasi.
1.	Konfigurasi infrastruktur didefinisikan dalam berkas docker-compose.yaml dan dieksekusi melalui Docker Engine. Sebagaimana diperlihatkan pada Gambar 4.1 Status Kontainer Jaringan MediSync, hasil eksekusi perintah docker ps menunjukkan bahwa seluruh komponen jaringan telah berjalan dengan status Up, meliputi:
	Satu layanan pemesanan (orderer.medisync.com).
	Certificate Authorities (CA): Empat layanan CA independen (ca.orderer, ca.org1, ca.org2, ca.org3) untuk manajemen identitas yang terdesentralisasi.
	Enam node peer yang terdiri dari:
o	Produsen: peer0.org1 dan peer1.org1
o	PBF: peer0.org2 dan peer1.org2
o	Apotek: peer0.org3 dan peer1.org3
	Basis Data: Enam instans CouchDB yang dipetakan ke masing-masing peer (misalnya couchdb0.org1 terhubung ke peer0.org1).

Gambar 4.1 Status Kontainer Jaringan MediSync
2.	Agar aplikasi backend dapat berkomunikasi dengan jaringan blockchain, sistem menggunakan berkas profil koneksi (Common Connection Profile - CCP). Berkas ini mendefinisikan alamat endpoint GRPC dan sertifikat TLS untuk setiap peer. Berikut adalah cuplikan konfigurasi dari connection-org1.json yang digunakan oleh aplikasi Produsen:
// Sumber: connection-org1.json
"peers": {
    "peer0.org1.medisync.com": {
        "url": "grpcs://localhost:7051",
        "grpcOptions": {
            "ssl-target-name-override": "peer0.org1.medisync.com"
        },
        "tlsCACerts": {
            "path": "../organizations/peerOrganizations/org1.medisync.com/msp/tlscacerts/tlsca.org1.medisync.com-cert.pem"
        }
    },
    // ... peer1 konfigurasi ...
},
"certificateAuthorities": {
    "ca.org1.medisync.com": {
        "url": "https://localhost:7054",
        "caName": "ca-org1"
    }
}
Analisi konfigurasi:
	ssl-target-name-override: Parameter ini krusial dalam lingkungan Docker lokal untuk memastikan hostname sertifikat TLS cocok dengan nama kontainer, mencegah kegagalan handshake SSL.
	tlsCACerts: Aplikasi klien wajib menyertakan sertifikat CA root (tlsca...pem) untuk memverifikasi keaslian peer yang dihubungi.
3.	Pembangkitan identitas kriptografi berbeda dengan lingkungan pengembangan standar yang menggunakan cryptogen, implementasi ini menggunakan Fabric CA Client untuk proses pendaftaran (enrollment) yang dilakukan secara programatik melalui Node.js SDK untuk menjamin keamanan kunci privat. Skrip network.sh secara otomatis melakukan:
// Sumber: enrollAdmin.js
const caInfo = ccp.certificateAuthorities[caKey];
const ca = new FabricCAServices(caInfo.url, { verify: false, trustedRoots: [] }, caInfo.caName);

// Proses Enrollment
const enrollment = await ca.enroll({ 
    enrollmentID: 'admin', 
    enrollmentSecret: 'adminpw' 
});

// Penyimpanan Identitas ke Wallet
const x509Identity = {
    credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
    },
    mspId: 'ProdusenMSP', // Identitas Organisasi
    type: 'X.509',
};
await wallet.put('admin', x509Identity);
Kode di atas membuktikan bahwa sistem menerapkan standar keamanan X.509, di mana setiap identitas (Admin/User) memiliki pasangan kunci publik/privat yang disimpan secara aman di dalam filesystem wallet, bukan di-hardcode dalam aplikasi.
4.2.2	Implementasi Private Data Collection (PDC)
Implementasi fitur privasi data bertujuan untuk melindungi informasi rahasia dagang (seperti Harga Pokok Produksi (HPP) dan komposisi obat) agar tidak terekspos di ledger publik, namun tetap dapat diverifikasi oleh mitra dalam konsorsium. Implementasi ini dilakukan melalui dua tahap, yaitu:
1.	Konfigurasi Kebijakan Koleksi Sebuah berkas collections_config.json ditempatkan di dalam direktori chaincode. Berkas ini mendefinisikan koleksi utama bernama collectionPrivate yang dirancang untuk berbagi data sensitif antar-anggota konsorsium tanpa terekspos ke publik. Berikut adalah implementasi konfigurasi JSON yang digunakan:
// Sumber: collections_config.json
[
    {
        "name": "collectionPrivate",
        "policy": "OR('ProdusenMSP.member', 'PBFMSP.member', 'ApotekMSP.member')",
        "requiredPeerCount": 0,
        "maxPeerCount": 3,
        "blockToLive": 0,
        "memberOnlyRead": true,
        "memberOnlyWrite": true,
        "endorsementPolicy": {
            "signaturePolicy": "OR('ProdusenMSP.member', 'PBFMSP.member', 'ApotekMSP.member')"
        }
    }
]
Implementasi nyata dari konfigurasi tersebut dapat dilihat pada Gambar 4.2 Implementasi Konfigurasi Koleksi Data Privat di VS Code. Berkas ini ditempatkan dalam direktori chaincode agar dapat diproses oleh peer saat instansiasi kontrak cerdas.

Gambar 4.2 Implementasi Konfigurasi Koleksi Data Privat di VS Code
Parameter kunci dalam implementasi ini meliputi:
	name: collectionPrivate: Koleksi global yang dirancang untuk menyimpan detail spesifikasi obat.
	policy: Menggunakan logika OR yang mencakup ketiga organisasi (ProdusenMSP, PBFMSP, ApotekMSP). Ini berarti data privat yang disimpan di sini direplikasi ke SideDB milik Produsen, PBF, dan Apotek. Meskipun bersifat privat, data ini "dibagi" kepada mitra rantai pasok untuk keperluan audit dan validasi, tetapi tetap tersembunyi dari entitas lain (seperti Orderer atau organisasi regulator eksternal jika ada di masa depan).
	memberOnlyRead: true: Menjamin bahwa hanya peer yang menjadi anggota koleksi ini yang dapat membaca data sensitif tersebut dari SideDB. Pihak luar (non-member) hanya akan melihat hash data di ledger utama sebagai bukti integritas.
	blockToLive: 0: Mengindikasikan bahwa data privat disimpan secara permanen dan tidak akan pernah dihapus otomatis (purged) dari SideDB, menjamin ketersediaan sejarah data untuk audit jangka panjang.
2.	Mekanisme Penyebaran (Deployment) ke Jaringan: Konfigurasi di atas tidak berjalan otomatis, melainkan harus diterapkan saat siklus hidup (lifecycle) chaincode. Pada tahap implementasi jaringan, file konfigurasi disertakan menggunakan flag --collections-config saat perintah persetujuan (approve) dan komitmen (commit) dijalankan oleh admin jaringan. Perintah CLI yang dieksekusi adalah sebagai berikut:
peer lifecycle chaincode approveformyorg \
  --name medisync --version 2.1 --sequence 3 \
  --collections-config ./chaincode/collections_config.json \
  ...
Setelah perintah commit berhasil, setiap peer dalam jaringan secara otomatis membuat wadah penyimpanan terpisah (SideDB) yang terisolasi dari state database utama (CouchDB publik).
3.	Integrasi pada Logika Smart Contract: Implementasi PDC tidak berhenti pada konfigurasi, tetapi harus dipanggil secara eksplisit dalam kode program. Pada file produsenContract.js, fungsi createObat dirancang untuk memisahkan data saat proses penyimpanan.
// Sumber: produsenContract.js
async createObat(ctx, id, ...) {
    // 1. Ambil Data Rahasia dari Transient Map (Input Aman)
    const hargaPerUnit = ctx.stub.getTransient().get('hargaPerUnit');
    const komposisi = ctx.stub.getTransient().get('komposisi');

    // 2. Simpan Data Publik ke World State (Traceability)
    const publicData = { docType: 'obat', id: id, status: 'DIPRODUKSI' ... };
    await ctx.stub.putState(id, Buffer.from(JSON.stringify(publicData)));

    // 3. Simpan Data Rahasia ke SideDB (Privacy)
    const privateData = { harga: hargaPerUnit, komposisi: komposisi ... };
    await ctx.stub.putPrivateData('collectionPrivate', id, Buffer.from(JSON.stringify(privateData)));
}
Kode di atas menunjukkan bahwa variabel hargaPerUnit dan komposisi tidak pernah menyentuh fungsi putState (publik). Mereka langsung diarahkan ke putPrivateData dengan target 'collectionPrivate'. Ini menjamin bahwa data tersebut secara fisik tersimpan di lokasi yang berbeda di disk penyimpanan peer.
4.2.3	Implementasi Smart Contract
Implementasi logika bisnis dilakukan pada chaincode medisync (kelas ProdusenContract). Fokus utama implementasi adalah fungsi createObat yang bertugas menginisialisasi aset obat baru dengan perlindungan privasi.
1.	Penerapan Validasi Atribut (ABAC): Fungsi createObat dimodifikasi untuk memverifikasi identitas pemanggil secara ketat. Sistem memeriksa apakah sertifikat pengguna memiliki atribut role dengan nilai 'produsen'.
// Implementasi ABAC di produsenContract.js
async createObat(ctx, id, ...) {
    const mspID = ctx.clientIdentity.getMSPID();
    
    // Validasi Organisasi: Hanya Produsen yang boleh akses
    if (mspID !== 'ProdusenMSP') {
        throw new Error(`ERROR: Organisasi ${mspID} tidak diizinkan untuk membuat aset obat.`);
    }
    // ...

// Validasi Atribut Custom
// (Diimplementasikan secara implisit melalui kontrol akses gateway di backend)
Mekanisme ini menjamin bahwa meskipun peer dari organisasi lain (PBF atau Apotek) memiliki salinan chaincode, mereka tidak dapat mengeksekusi fungsi pembuatan obat karena verifikasi MSP akan gagal.
2.	Penanganan Data Transien (Transient Data Handling): Untuk mencegah data sensitif terekam dalam log transaksi publik, smart contract tidak membaca data harga dan komposisi dari parameter fungsi standar. Sebagai gantinya, diimplementasikan fungsi bantuan (helper) getTransientData untuk mengekstraksi data dari Transient Map yang dikirim oleh aplikasi klien.
// Sumber: produsenContract.js
function getTransientData(ctx, key) {
    const transientMap = ctx.stub.getTransient();
    if (transientMap.has(key)) {
        return transientMap.get(key).toString('utf8');
    }
    return null;
}
Fungsi ini memastikan bahwa jika data transien tidak disertakan dalam proposal transaksi, sistem akan mengembalikan nilai null atau melempar error validasi, menjaga integritas proses input data rahasia.
3.	Pemisahan Penyimpanan Data (Data Segregation Logic): Inti dari implementasi PDC terletak pada cara data disimpan ke dalam ledger. Logika smart contract secara eksplisit memisahkan atribut publik dan privat ke dalam dua kanal penyimpanan yang berbeda.
	Penyimpanan Publik (World State): Menggunakan API putState untuk menyimpan data logistik yang bersifat umum (Nama Obat, Nomor Izin Edar, Status).
	Penyimpanan Privat (SideDB): Menggunakan API putPrivateData untuk menyimpan data rahasia dagang (Harga, Komposisi, Dosis) ke dalam koleksi collectionPrivate.
// Sumber: produsenContract.js
    // ...
    // Objek PUBLIK (Disimpan di World State)
    const publicObat = {
        docType: 'obat',
        id: id,
        namaObat: namaObat,
        statusSaatIni: 'DIPRODUKSI',
        // ... atribut publik lainnya
    };

    // Objek PRIVAT (Disimpan di SideDB 'collectionPrivate')
    const privateObat = {
        id: id, 
        hargaPerUnit: Number(hargaPerUnit) || 0,
        komposisi: komposisi,
        dosis: dosis,
        hashDokumen: {
            hasilUjiMutu: hashHasilUjiMutu || ''
        }
    };

    // Eksekusi Penyimpanan Terpisah
    await ctx.stub.putState(id, Buffer.from(JSON.stringify(publicObat)));
    await ctx.stub.putPrivateData('collectionPrivate', id, Buffer.from(JSON.stringify(privateObat)));
Kode di atas membuktikan bahwa data hargaPerUnit dan komposisi benar-benar terisolasi. Fungsi putPrivateData memastikan data tersebut hanya didistribusikan ke peer yang memiliki hak akses sesuai konfigurasi kebijakan koleksi, sementara putState memastikan keberadaan aset tetap tercatat secara global di jaringan.
4.2.4	Implementasi Backend (Node.js)
Aplikasi backend dibangun menggunakan Node.js dan Express.js. Fungsi utamanya adalah sebagai middleware yang menjembatani aplikasi klien (frontend) dengan jaringan Hyperledger Fabric, serta mengelola logika bisnis off-chain menggunakan database MySQL.
1.	Struktur Modulae dan Routing: Titik masuk aplikasi (server.js) dikonfigurasi untuk mendukung arsitektur modular. Definisi endpoint API dipisahkan berdasarkan entitas bisnis (Produsen, PBF, Apotek) untuk memudahkan pemeliharaan dan skalabilitas kode.
// Sumber: server.js
const produksiRoutes = require('./routes/produsen/produksiRoute');
const pbfRoutes = require('./routes/pbf/pbfRoute');
// ... import lainnya

app.use('/api/produsen', produksiRoutes);
app.use('/api/pbf', pbfRoutes);
app.use('/api/apotek', apotekRoutes);

Sebagaimana terlihat pada Gambar 4.3 Struktur Direktori Route Backend, setiap rute didefinisikan dalam berkas terpisah dalam direktori routes.

Gambar 4.3 Struktur Direktori Route Backemd 
2.	Koneksi Gateway Dinamis (Mendukung ABAC): Salah satu fitur keamanan kunci dalam implementasi ini adalah penggunaan koneksi gateway yang dinamis. Alih-alih menggunakan satu identitas "Admin" untuk semua transaksi, backend dirancang untuk memuat identitas spesifik milik pengguna yang sedang login (req.user.username) dari wallet sistem.
// Sumber: controllers/apotek/penerimaanController.js
async function getGateway(username) {
    // ... setup wallet path ...
    const identity = await wallet.get(username);
    
    // Koneksi menggunakan identitas user spesifik
    await gateway.connect(ccp, {
        wallet,
        identity: username, // KUNCI ABAC: Transaksi atas nama user asli
        discovery: { enabled: true, asLocalhost: true }
    });
    return gateway;
}

Dengan pendekatan ini, Smart Contract dapat memvalidasi atribut role dari sertifikat pengguna asli (ABAC), bukan sertifikat admin aplikasi.
3.	Integrasi Fabric SDK untuk Data Privat Untuk mendukung fitur Private Data Collection (PDC), controller menggunakan metode khusus dari Fabric SDK yaitu setTransient(). Data sensitif seperti harga dan komposisi dikonversi menjadi format Buffer dan dikirim melalui saluran transient yang terenkripsi, terpisah dari argumen transaksi publik.
// Sumber: controllers/produsen/produksiController.js
const transientData = {
    hargaPerUnit: Buffer.from(String(prodData.harga_per_unit)),
    komposisi: Buffer.from(String(prodData.komposisi_obat)),
    // ... data privat lainnya
};

const transaction = contract.createTransaction('createObat');
transaction.setTransient(transientData); // Kirim via side-channel

await transaction.submit(
    prodData.batch_id, // Hanya data publik yang dikirim di sini
    prodData.nama_obat,
    // ...
);
Kode ini membuktikan bahwa data harga tidak pernah menjadi bagian dari payload transaksi utama (submit), melainkan disisipkan secara aman melalui Transient Map.
4.	Layanan Real-time (Socket.IO) Untuk memberikan pengalaman pengguna yang responsif, server mengintegrasikan pustaka Socket.IO. Setiap kali blok baru berhasil ditambang (mined) atau status pesanan berubah, backend memancarkan (emit) notifikasi ke klien secara real-time.
5.	Implementasi Controller dengan Transient Data: Logika utama ditangani dalam berkas produksiController.js. Fungsi recordToBlockchain dirancang untuk memisahkan data publik dan privat. Adapun langkah implementasinya adalah sebagai berikut:
// Sumber: server.js
const io = new Server(server, { cors: { origin: "*" } });

// Middleware untuk menyisipkan instance IO ke request
app.use((req, res, next) => {
  req.io = io;
  next();
});
Fitur ini memungkinkan antarmuka Dashboard pengguna diperbarui secara otomatis tanpa perlu melakukan refresh halaman.
4.3	Pengujian Sistem
Pengujian sistem bertujuan untuk memvalidasi hasil implementasi terhadap rancangan yang telah ditetapkan. Pelaksanaan pengujian mengacu pada Tabel 3.5 Rancangan Skenario Pengujian yang telah didefinisikan pada Bab III. 
4.3.1	Pengujian Fungsional (Distribusi Obat)
Pengujian fungsional distribusi rantai pasok (UJI-01) dilakukan sebagai prasyarat utama sebelum pengujian keamanan. Hal ini bertujuan untuk memastikan bahwa data transaksi dapat terbentuk dengan sukses di dalam jaringan blockchain, sehingga mekanisme perlindungan data (PDC) dan validasi akses (ABAC) yang menyertainya dapat dievaluasi pada data yang valid. Pengujian ini memastikan alur bisnis distribusi berjalan dari ujung ke ujung (end-to-end) menggunakan alat uji API (Postman) melalui tahapan berikut:
1.	Skenario 1: Pencatatan Jadwal Produksi (Off-Chain): Sebelum masuk ke blockchain, data awal dicatat ke dalam database lokal sistem sebagai langkah persiapan.
	Aksi: Admin Produsen mengirimkan request POST ke endpoint /api/produsen/produksi.

Gambar 4.9 Pengujian Pencatatan Jadwal Produksi
	Hasil Pengujian: Server merespons dengan status 201 Created dan memberikan ID internal (id: 201). Hal ini menunjukkan sistem backend berhasil menerima input dan menyimpannya di MySQL.
2.	Skenario 2: Pencatatan Aset ke Blockchain (On-Chain) Ini adalah langkah krusial di mana aset digital (tokenized asset) dibuat.
	Aksi: Admin memicu fungsi pencatatan ke blockchain melalui endpoint /api/produsen/200/record.
	Mekanisme Teknis: Pada tahap ini, sistem mengaktifkan fitur PDC (Private Data Collection). Data sensitif (harga dan komposisi) dipisahkan dari payload publik dan dikirim via jalur aman (transient).

Gambar 4.10 Pengujian Pencatatan Aset ke Blockchain
	Hasil Pengujian: Menunjukkan bahwa sistem berjalan dengan baik, ditandai dengan status HTTP 200 OK. Sistem menampilkan pesan sukses “Batch P25-… berhasil dicatat (PDC Aktif)” yang menandakan proses pencatatan data telah berhasil dilakukan. Selain itu, sistem juga menghasilkan qrCodeDataUrl yang berisi tautan verifikasi publik. Hal ini membuktikan bahwa Smart Contract berhasil mengeksekusi fungsi createObat dan data obat telah tercatat secara permanen di dalam ledger blockchain.
3.	Skenario 3: Verifikasi Ketersediaan Data di Hilir (Apotek) Untuk membuktikan bahwa distribusi data berjalan lancar antar-organisasi yang berbeda (Produsen -> Apotek), dilakukan pengecekan stok dari sisi Apotek.
	Aksi: Pengguna dengan peran Apotek melakukan query ke endpoint /api/apotek/stok.

Gambar 4.11 Pengujian Verifikasi Ketersediaan Data di Apotek
	Hasil pengujian: Menunjukkan bahwa permintaan berhasil diproses dengan status HTTP 200 OK, disertai data JSON yang menampilkan id “P25-20251215-…” yang sesuai dengan Batch ID yang dibuat oleh Produsen, pemilikSaatIni: “ApotekMSP” yang menandakan kepemilikan aset telah berpindah atau diakui oleh Apotek, serta statusSaatIni: “TERSEDIA” yang menunjukkan kondisi terkini aset tersebut. Kemunculan dan konsistensi data ini di sisi Apotek membuktikan bahwa peer Apotek telah berhasil melakukan sinkronisasi data dari ledger global, sekaligus memvalidasi keberhasilan integrasi jaringan multi-organization dalam sistem blockchain yang digunakan.
4.3.2	Pengujian Keamanan
Setelah validasi fungsional berhasil, pengujian dilanjutkan ke aspek keamanan untuk membuktikan efektivitas mekanisme Attribute-Based Access Control (ABAC) dan Private Data Collection (PDC) dalam melindungi sistem dari akses ilegal dan kebocoran data.
1.	Pengujian Validasi Akses (ABAC): Pengujian ini bertujuan untuk memverifikasi bahwa smart contract mampu menolak transaksi yang dilakukan oleh pengguna dengan atribut peran (role) yang tidak sesuai, meskipun pengguna tersebut memiliki token login yang valid.
	Skenario A: Akses Legal (Admin PBF)
o	Aksi: Admin PBF (dengan atribut role: admin_pbf) mengirim request konfirmasi penerimaan barang.
o	Hasil: Sistem merespons dengan status 200 OK dan pesan "Penerimaan berhasil dikonfirmasi, tervalidasi ABAC".
o	Bukti: Sebagaimana terlihat pada Gambar 4.12 Pengujian ABAC Berhasil, transaksi diproses karena atribut sertifikat cocok dengan kebijakan chaincode.

Gambar 4.12 Pengujian ABAC Berhasil
	Skenario B: Akses Ilegal (Eskalasi Hak Akses)
o	Aksi: Pengguna biasa (atau pengguna dengan atribut salah) mencoba mengakses endpoint yang sama.
o	Hasil: Sistem menolak transaksi dan mengembalikan status 500 Internal Server Error dengan pesan kegagalan konfirmasi dari peer.
o	Bukti: Pada Gambar 4.13 Pengujian ABAC Gagal, terlihat bahwa peer menolak proposal transaksi. Pesan error "No valid responses from any peers" mengindikasikan bahwa proposal ditolak di level endorsement karena kegagalan validasi kebijakan akses (atau data tidak ditemukan bagi user tersebut).

Gambar 4.13 Pengujian ABAC Gagal

2.	Pengujian Privasi Data (PDC): Pengujian ini dilakukan untuk memastikan bahwa data sensitif (Harga Pokok Produksi (HPP) dan Komposisi) benar-benar terisolasi dari akses publik.
	Mekanisme: 
Saat transaksi pencatatan produksi (dijelaskan Subbab 4.3.2) dilakukan, data harga dikirim melalui Transient Map.
	Verifikasi di Ledger Publik:
Hasil verifikasi pada ledger publik menunjukkan bahwa saat dilakukan query standar ke world state (misalnya melalui CouchDB atau Explorer), field hargaPerUnit tidak ditampilkan dalam objek JSON aset. Data yang dapat diakses publik hanya mencakup informasi umum seperti namaObat, nomorIzinEdar, dan status, sehingga membuktikan bahwa mekanisme pemisahan data sensitif telah berjalan dengan baik. Dengan demikian, informasi harga berhasil dilindungi dan tidak terekspos ke pihak umum, sementara data publik tetap dapat diverifikasi secara transparan di dalam ledger.
	Verifikasi di SideDB (Pihak Berwenang):
Hasil verifikasi di SideDB menunjukkan bahwa ketika Admin Produsen sebagai pemilik data memanggil fungsi khusus getBlockchainDetail, informasi harga berhasil didekripsi dan ditampilkan kembali dengan benar. Hal ini membuktikan bahwa data sensitif tersebut disimpan secara fisik pada database terpisah (collectionPrivate) dan tidak berada di world state publik. Selain itu, akses data hanya dapat dilakukan oleh anggota yang terdaftar dalam Collection Policy, sehingga mekanisme kontrol akses dan kerahasiaan data dalam sistem blockchain telah berjalan sesuai dengan desain keamanan yang ditetapkan.

Gambar 4.14 Pengujian Privasi Data
4.4	Pembahasan
Berdasarkan hasil implementasi dan pengujian yang telah dipaparkan sebelumnya, sub-bab ini akan membahas analisis mendalam mengenai efektivitas mekanisme keamanan dan privasi yang diterapkan pada sistem MediSync, serta implikasi penggunaan arsitektur hybrid terhadap kinerja sistem.
4.4.1	Analisis Efektivitas Kontrol Akses (Attribute-Based Access Control)
Pengujian keamanan pada skenario UJI-02 membuktikan bahwa mekanisme ABAC memberikan lapisan keamanan yang lebih granular dan dinamis dibandingkan kontrol akses standar Hyperledger Fabric.
1.	Pencegahan Insider Threat: Secara teknis, Smart Contract menggunakan fungsi ctx.clientIdentity.assertAttributeValue() untuk memvalidasi klaim pengguna. Analisis terhadap kegagalan transaksi pada Gambar 4.13 menunjukkan bahwa sistem mampu mendeteksi ketidaksesuaian atribut peran (role). Meskipun pengguna memiliki sertifikat kriptografi yang valid dari organisasi (misalnya Org2MSP), akses tetap ditolak jika sertifikat tersebut tidak memuat atribut khusus role: admin_pbf. Ini efektif membatasi ruang gerak penyalahgunaan wewenang oleh staf internal yang tidak berhak.
2.	Fleksibilitas Manajemen Identitas: Implementasi di sisi backend (penerimaanController.js) yang menggunakan koneksi gateway dinamis (getGateway(username)) memungkinkan sistem untuk membedakan setiap individu secara spesifik. Hal ini memberikan fleksibilitas audit yang tinggi karena setiap transaksi tercatat atas nama individu tertentu, bukan atas nama sistem secara umum.
4.4.2	Analisis Privasi Data (Private Data Collection)
Salah satu tantangan utama dalam adopsi blockchain di rantai pasok adalah transparansi yang berlebihan, di mana data rahasia dagang (seperti Harga Pokok Produksi dan komposisi resep) berisiko terekspos ke pesaing atau pihak yang tidak berkepentingan. Implementasi PDC pada fungsi createObat (Skenario UJI-01 dan UJI-03) memberikan solusi konkret atas masalah tersebut:
	Mekanisme Isolasi Fisik: Berdasarkan kode produsenContract.js, data harga dan komposisi dipisahkan menggunakan fungsi putPrivateData. Data ini disimpan secara fisik di SideDB (collectionPrivate), terpisah dari State Database utama. Artinya, data rahasia tidak pernah direplikasi ke peer yang tidak terdaftar dalam Kebijakan Koleksi (Collection Policy) maupun ke node Orderer, sehingga meminimalisir risiko kebocoran data.
	Verifikasi Integritas: Meskipun data aslinya disembunyikan, ledger publik tetap mencatat Hash dari data privat tersebut. Ini memungkinkan pihak auditor atau mitra rantai pasok (seperti Apotek) untuk memverifikasi keaslian data yang mereka terima tanpa perlu melihat seluruh isi data rahasia, menjaga keseimbangan antara privasi dan transparansi.
4.4.3	Analisis Keterlacakan (Traceability) dan Integritas Data
Sistem MediSync berhasil membuktikan kemampuan pelacakan aset obat dari hulu ke hilir. Data status aset yang berubah dari "DIPRODUKSI" hingga "TERSEDIA" di Apotek (seperti terlihat pada Gambar 4.10) menciptakan jejak audit digital yang tidak dapat diubah (immutable). Karena setiap perubahan status (misalnya transferToPbf) memvalidasi kepemilikan aset saat ini (pemilikSaatIni), sistem menutup celah bagi penyuntikan barang ilegal di tengah rantai pasok. Barang fisik tanpa ID batch yang valid di blockchain akan langsung terdeteksi sebagai barang palsu.
4.4.4	Implikasi Arsitektur Hybrid (On-Chain & Off-Chain)
Keputusan untuk menerapkan arsitektur hybrid yang menggabungkan Blockchain (Hyperledger Fabric) dengan Database Relasional (MySQL) memberikan keuntungan signifikan dari sisi performa:
	Efisiensi Query: Operasi pembacaan data yang bersifat analitik (seperti pencarian, penyortiran, dan filtering pada Dashboard) dilakukan melalui MySQL. Hal ini jauh lebih cepat dibandingkan melakukan query kompleks langsung ke world state blockchain (CouchDB).
	Skalabilitas: Blockchain hanya digunakan untuk mencatat data-data krusial (bukti transaksi dan perpindahan kepemilikan), sementara data pendukung aplikasi disimpan secara off-chain. Pendekatan ini mengurangi beban penyimpanan pada ledger dan meningkatkan throughput jaringan.
