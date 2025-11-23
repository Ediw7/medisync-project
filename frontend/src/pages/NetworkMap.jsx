import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Factory, Truck, Store, Cuboid, Database, Activity, Zap, ArrowRight, Link as LinkIcon } from 'lucide-react';
import { io } from 'socket.io-client';

// URL Backend
const SOCKET_URL = 'http://localhost:5000';

const NetworkMap = () => {
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Ledger Awal: Genesis Block
  const [blocks, setBlocks] = useState([
    {
      type: 'GENESIS_BLOCK',
      hash: '00000000000000000000000000000000',
      prevHash: '0',
      timestamp: new Date().toLocaleTimeString(),
      org: 'SYSTEM',
      details: 'Initial Ledger State'
    }
  ]);
  
  const [activeNode, setActiveNode] = useState(null);
  const [statusText, setStatusText] = useState('MENUNGGU TRANSAKSI...');
  const [originNode, setOriginNode] = useState('produsen');
  const queueRef = useRef([]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);

    newSocket.on('connect', () => {
      console.log('Connected to Real-time Network');
      setStatusText('Jaringan Terhubung. Siap.');
    });

    newSocket.on('block_mined', (data) => {
      queueRef.current.push(data);
      processQueue();
    });

    return () => newSocket.disconnect();
  }, []);

  const processQueue = async () => {
    if (isAnimating || queueRef.current.length === 0) return;
    const data = queueRef.current.shift();
    await runAnimationSequence(data);
    processQueue();
  };

  const runAnimationSequence = (data) => {
    return new Promise((resolve) => {
      setIsAnimating(true);
      setTransactionType(data.type);

      let starter = 'produsen';
      let text = 'Memulai Transaksi...';

      // --- LOGIKA PENENTUAN PENGIRIM (DIPERBAIKI) ---
      
      // 1. KELOMPOK PRODUSEN (Membuat Obat / Kirim ke PBF)
      if (['PRODUKSI_BARU', 'DISTRIBUSI_PBF', 'DISTRIBUSI_PBF_MASSAL'].includes(data.type)) {
        starter = 'produsen';
        text = data.type === 'PRODUKSI_BARU' ? 'Produsen: Mencetak Batch Baru...' : 'Produsen: Mengirim ke PBF...';
      } 
      
      // 2. KELOMPOK PBF (Terima Barang / Kirim ke Apotek / Buat Pesanan)
      else if (['PENERIMAAN_PBF', 'DISTRIBUSI_APOTEK', 'PESANAN_BARU'].includes(data.type)) {
        starter = 'pbf';
        if (data.type === 'PENERIMAAN_PBF') text = 'PBF: Memverifikasi Penerimaan Barang...';
        else if (data.type === 'DISTRIBUSI_APOTEK') text = 'PBF: Mengirim ke Apotek...';
        else text = 'PBF: Membuat Pesanan...';
      } 
      
      // 3. KELOMPOK APOTEK (Terima Barang / Jual / Pesan)
      else if (['PENERIMAAN_APOTEK', 'PESANAN_APOTEK', 'PENJUALAN'].includes(data.type)) {
        starter = 'apotek';
        if (data.type === 'PENJUALAN') text = 'Apotek: Menjual ke Konsumen...';
        else if (data.type === 'PENERIMAAN_APOTEK') text = 'Apotek: Memverifikasi Penerimaan...';
        else text = 'Apotek: Membuat Pesanan...';
      }
      // -----------------------------------------------

      setOriginNode(starter);
      setStatusText(text);
      setActiveNode(starter);
      
      // SOUND 1: PING
      playSound('ping'); 

      // Timeline Animasi
      setTimeout(() => {
        setActiveNode('orderer');
        setStatusText('Orderer: Memvalidasi & Menyusun Blok...');
        
        // SOUND 2: SCI-FI
        playSound('sci-fi'); 
      }, 1000);

      setTimeout(() => {
        setActiveNode('all');
        setStatusText('Konsensus: Menyebar Blok ke Seluruh Peer...');
        
        // SOUND 3: PING
        playSound('ping'); 
      }, 2500);

      setTimeout(() => {
        // HITUNG PREV HASH
        setBlocks(prev => {
           const lastBlock = prev[0] || { hash: '00000000000000000000' }; 
           const newBlock = {
               ...data,
               prevHash: lastBlock.hash ? lastBlock.hash.substring(0, 20) + '...' : '0000...'
           };
           return [newBlock, ...prev];
        });

        setActiveNode(null);
        setIsAnimating(false);
        setStatusText('Transaksi Selesai. Blok Tercatat.');
        
        // SOUND 4: SUCCESS
        playSound('success'); 
        
        resolve();
      }, 4000);
    });
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white p-4 md:p-6 font-sans overflow-hidden flex flex-col">
      
      {/* HEADER */}
      <div className="flex justify-between items-end border-b border-slate-800 pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-black bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent flex items-center gap-3 tracking-tight">
            <Activity className="text-emerald-400 animate-pulse" /> MEDISYNC NETWORK
          </h1>
        </div>
        <div className="text-right">
             <div className={`text-sm font-bold transition-colors duration-300 ${isAnimating ? 'text-yellow-400' : 'text-emerald-500'}`}>
                {statusText}
             </div>
             <div className="text-[10px] text-slate-600 font-mono">Live Socket Connection</div>
        </div>
      </div>

      {/* --- AREA PETA JARINGAN --- */}
      <div className="flex-1 relative bg-slate-900/30 rounded-3xl border border-slate-800/50 backdrop-blur-sm flex items-center justify-center overflow-hidden min-h-[400px]">
        
        {/* Background Grid */}
        <div className="absolute inset-0 opacity-20" 
             style={{ backgroundImage: 'radial-gradient(#1e293b 1px, transparent 1px)', backgroundSize: '30px 30px' }}>
        </div>

        {/* KONEKTOR (GARIS SVG) - DIPERBAIKI */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
            <defs>
                <linearGradient id="gradLine" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#059669" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0.4" />
                </linearGradient>
            </defs>
            
            {/* 1. Garis Kiri (Produsen) ke Tengah (Orderer) -> FIXED: Koordinat disesuaikan dengan NodeIcon */}
            <line x1="15%" y1="45%" x2="50%" y2="50%" stroke="url(#gradLine)" strokeWidth="2" strokeDasharray="5,5" />
            
            {/* 2. Garis Kanan Atas (PBF) ke Tengah */}
            <line x1="80%" y1="25%" x2="50%" y2="50%" stroke="url(#gradLine)" strokeWidth="2" strokeDasharray="5,5" />
            
            {/* 3. Garis Kanan Bawah (Apotek) ke Tengah */}
            <line x1="80%" y1="75%" x2="50%" y2="50%" stroke="url(#gradLine)" strokeWidth="2" strokeDasharray="5,5" />
        </svg>

        {/* --- NODES --- */}

        {/* NODE 1: PRODUSEN */}
        <NodeIcon 
          icon={<Factory size={32} />} 
          label="PRODUSEN (Org1)" 
          isActive={activeNode === 'produsen' || activeNode === 'all'}
          isOrigin={originNode === 'produsen'}
          position={{ left: '15%', top: '45%' }} 
          color="emerald"
        />

        {/* NODE 2: ORDERER (Tengah) */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
            <motion.div 
              animate={activeNode === 'orderer' ? { scale: 1.2, boxShadow: "0px 0px 60px rgba(6, 182, 212, 0.6)" } : { scale: 1 }}
              className="w-24 h-24 bg-slate-950 rounded-full border-2 border-cyan-500/30 flex items-center justify-center relative shadow-2xl z-20"
            >
               <Database size={40} className={`text-cyan-400 ${activeNode === 'orderer' ? 'animate-pulse' : ''}`} />
               {activeNode === 'orderer' && (
                   <motion.div 
                     className="absolute inset-0 rounded-full border-t-2 border-cyan-400"
                     animate={{ rotate: 360 }}
                     transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                   />
               )}
            </motion.div>
            <p className="mt-4 font-mono text-xs text-cyan-400 bg-cyan-950/80 px-3 py-1 rounded border border-cyan-800">ORDERING SERVICE</p>
        </div>

        {/* NODE 3: PBF */}
        <NodeIcon 
          icon={<Truck size={28} />} 
          label="PBF (Org2)" 
          isActive={activeNode === 'pbf' || activeNode === 'all'}
          isOrigin={originNode === 'pbf'}
          position={{ left: '80%', top: '25%' }}
          color="blue"
        />

        {/* NODE 4: APOTEK */}
        <NodeIcon 
          icon={<Store size={28} />} 
          label="APOTEK (Org3)" 
          isActive={activeNode === 'apotek' || activeNode === 'all'}
          isOrigin={originNode === 'apotek'}
          position={{ left: '80%', top: '75%' }}
          color="purple"
        />

        {/* --- ANIMASI PAKET --- */}
        <AnimatePresence>
          {isAnimating && activeNode === originNode && (
            <Packet 
                start={getNodePosition(originNode)} 
                end={{ left: '50%', top: '50%' }} 
                color="bg-yellow-400"
            />
          )}
          {activeNode === 'all' && (
            <>
              <Packet start={{ left: '50%', top: '50%' }} end={{ left: '15%', top: '45%' }} color="bg-cyan-400" delay={0} />
              <Packet start={{ left: '50%', top: '50%' }} end={{ left: '80%', top: '25%' }} color="bg-cyan-400" delay={0} />
              <Packet start={{ left: '50%', top: '50%' }} end={{ left: '80%', top: '75%' }} color="bg-cyan-400" delay={0} />
            </>
          )}
        </AnimatePresence>
      </div>

      {/* --- AREA BLOCKCHAIN (LEDGER YANG DIPERBAIKI) --- */}
      <div className="mt-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h2 className="text-sm font-bold flex items-center gap-2 text-slate-400 tracking-wider">
              <Cuboid className="text-emerald-500" size={18} /> IMMUTABLE LEDGER
            </h2>
            <span className="text-[10px] font-mono text-slate-600">CHANNEL: medisyncchannel</span>
        </div>
        
        {/* Container Scroll Horizontal */}
        <div className="flex gap-0 overflow-x-auto pb-4 px-4 items-center">
            
            <AnimatePresence mode='popLayout'>
                {blocks.map((block, idx) => (
                    <motion.div
                        key={block.hash || idx}
                        layout
                        initial={{ x: -100, opacity: 0, scale: 0.8 }}
                        animate={{ x: 0, opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 100 }}
                        className="flex items-center"
                    >
                        {/* 1. BLOCK CARD */}
                        <div className="min-w-[280px] w-[280px] bg-slate-900 rounded-xl border border-slate-700 p-0 shadow-xl relative overflow-hidden">
                            {/* Header Blok */}
                            <div className="bg-slate-800 p-3 flex justify-between items-center border-b border-slate-700">
                                <span className="text-[10px] font-mono text-slate-400">
                                    BLOCK #{blocks.length - 1 - idx}
                                </span>
                                <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">
                                    {block.type.replace('_', ' ')}
                                </span>
                            </div>

                            {/* Isi Blok */}
                            <div className="p-4 space-y-3">
                                {/* Prev Hash */}
                                <div className="bg-red-950/30 p-2 rounded border border-red-900/50">
                                    <div className="text-[8px] text-red-400 font-bold mb-1 flex items-center gap-1">
                                        <LinkIcon size={8} /> PREV HASH
                                    </div>
                                    <div className="text-[8px] font-mono text-red-200 break-all opacity-70">
                                        {block.prevHash || '00000000000000000000'}...
                                    </div>
                                </div>

                                {/* Data Transaksi */}
                                <div className="text-[10px] text-white">
                                    <div className="font-bold text-slate-400 text-[9px] mb-1">DATA</div>
                                    {block.details}
                                </div>

                                {/* Current Hash */}
                                <div className="bg-emerald-950/30 p-2 rounded border border-emerald-900/50">
                                    <div className="text-[8px] text-emerald-400 font-bold mb-1 flex items-center gap-1">
                                        <Zap size={8} /> CURRENT HASH
                                    </div>
                                    <div className="text-[8px] font-mono text-emerald-200 break-all">
                                        {block.hash.substring(0, 30)}...
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. RANTAI PENGHUBUNG (CHAIN) */}
                        <div className="w-12 h-1 bg-slate-700 mx-2 relative">
                           {/* Icon Rantai di tengah garis */}
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-950 p-1 rounded-full border border-slate-700">
                             <LinkIcon size={12} className="text-slate-500" />
                           </div>
                        </div>

                    </motion.div>
                ))}
            </AnimatePresence>
            
            {/* End of Chain Indicator */}
            <div className="opacity-30 text-slate-600 text-xs italic whitespace-nowrap px-4">
               End of Chain
            </div>
        </div>
      </div>

    </div>
  );
};

// --- HELPER: Posisi Node ---
const getNodePosition = (nodeName) => {
    switch(nodeName) {
        case 'produsen': return { left: '15%', top: '45%' }; // Samakan dengan style NodeIcon
        case 'pbf': return { left: '80%', top: '25%' };
        case 'apotek': return { left: '80%', top: '75%' };
        default: return { left: '50%', top: '50%' };
    }
}

// --- SUB COMPONENT ---
const NodeIcon = ({ icon, label, isActive, isOrigin, position, color }) => {
  const glowColor = color === 'emerald' ? '#10B981' : color === 'blue' ? '#3B82F6' : '#A855F7';
  
  return (
    <div 
        className={`absolute flex flex-col items-center gap-3 z-10 transition-all duration-500`}
        style={{ 
            left: position.left, 
            top: position.top, 
            transform: `translate(-50%, -50%) scale(${isActive ? 1.15 : 1})` 
        }}
    >
      <div 
        className={`w-16 h-16 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 shadow-xl bg-slate-900`}
        style={{
            borderColor: isActive ? glowColor : '#1e293b',
            boxShadow: isActive ? `0 0 30px ${glowColor}66` : 'none'
        }}
      >
        <div className={isActive ? 'text-white' : 'text-slate-600'}>
          {icon}
        </div>
        {isOrigin && (
            <span className="absolute -top-2 -right-2 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-yellow-500"></span>
            </span>
        )}
      </div>
      <span className={`text-xs font-bold px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur border border-slate-800 text-slate-400 ${isActive ? 'text-white border-white/20' : ''}`}>
        {label}
      </span>
    </div>
  );
};

const Packet = ({ start, end, color }) => (
  <motion.div
    initial={{ left: start.left, top: start.top, opacity: 1, scale: 0.5 }}
    animate={{ left: end.left, top: end.top, scale: 1 }}
    exit={{ scale: 0, opacity: 0 }}
    transition={{ duration: 1.2, ease: "easeInOut" }}
    style={{ transform: 'translate(-50%, -50%)' }}
    className={`absolute w-4 h-4 ${color} rounded-full shadow-[0_0_15px_currentColor] z-30 border-2 border-white`}
  />
);

export default NetworkMap;