"use client";

import { Link } from "react-router-dom";
import { Factory, Truck, Store, ArrowRight } from "lucide-react";

function PilihRole() {
  const roles = [
    {
      name: "Produsen",
      key: "produsen",
      to: "/login/produsen",
      icon: <Factory size={48} />,
      description: "Manufaktur dan produksi obat-obatan",
      color: "from-emerald-500 to-[#047857]",
    },
    {
      name: "PBF",
      key: "pbf",
      to: "/login/pbf",
      icon: <Truck size={48} />,
      description: "Distribusi dan penyaluran produk farmasi",
      color: "from-emerald-500 to-[#047857]",
    },
    {
      name: "Apotek",
      key: "apotek",
      to: "/login/apotek",
      icon: <Store size={48} />,
      description: "Pelayanan obat dan konsultasi farmasi",
      color: "from-emerald-500 to-[#047857]",
    },
  ];

  const handleRoleSelect = (roleKey) => {
    localStorage.setItem('lastRole', roleKey);
  };

  return (
    <div className="min-h-screen bg-gray-200 text-gray-800 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-500/10 to-emerald-700/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-emerald-600/10 to-emerald-500/10 animate-liquid blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-emerald-400/5 to-emerald-600/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
      <div className="absolute top-1 left-1/2 -translate-x-1/2 -translate-y-1/4 w-92 h-64 bg-gradient-to-br from-green-200 to-[#047857] rounded-full blur-3xl animate-bounce"></div>
      <div  
        className="absolute bottom-0 right-0 -translate-x-1 w-96 h-96 bg-[#047857]/40 rounded-full blur-3xl animate-ping"
        style={{ animationDelay: "3s" }}
      ></div>
      <div  
        className="absolute bottom-0 left-0 w-96 h-96 bg-green-200 rounded-full blur-3xl animate-ping"
        style={{ animationDelay: "3s" }}
      ></div>
      <div
        className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-1/2 right-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-1/4 left-1/2 w-48 h-48 bg-purple-200/20 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "3s" }}
      ></div>

      <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Pilih Peran{" "}
            <span className="bg-gradient-to-r from-emerald-500 to-emerald-700 text-transparent bg-clip-text">
              Anda
            </span>
          </h1>

          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Pilih peran Anda untuk masuk ke platform dan mulai mengelola rantai
            pasok farmasi dengan teknologi blockchain terpercaya.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          {roles.map((role, index) => (
            <Link
              to={role.to}
              key={role.name}
              onClick={() => handleRoleSelect(role.key)}
              className="group animate-slide-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="relative h-full">
                {/* Glass card main container */}
                <div className="bg-white/20 backdrop-blur-2xl p-8 h-full flex flex-col items-center justify-center text-center rounded-3xl border border-white/40 hover:border-emerald-400/60 shadow-xl shadow-black/5 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-700 hover:-translate-y-3 hover:bg-white/30 relative overflow-hidden group-hover:scale-[1.02] backdrop-saturate-150">
                  {/* Enhanced glass reflection layers */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent opacity-60 rounded-3xl"></div>
                  <div className="absolute inset-0 bg-gradient-to-tl from-emerald-500/10 via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl"></div>

                  {/* Animated shine effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1200 rounded-3xl"></div>

                  {/* Frosted glass border effect */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/50 via-transparent to-transparent opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>

                  {/* Enhanced icon container with glass effect */}
                  <div
                    className={`h-24 w-24 bg-gradient-to-br ${role.color} backdrop-blur-xl rounded-3xl flex items-center justify-center mb-6 group-hover:scale-125 transition-all duration-500 shadow-2xl border border-white/30 group-hover:border-white/50 group-hover:animate-glow relative z-10 backdrop-saturate-200`}
                  >
                    {/* Glass reflection on icon container */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent rounded-3xl opacity-60"></div>
                    <div className="text-white group-hover:scale-110 transition-transform duration-300 relative z-10 drop-shadow-lg">
                      {role.icon}
                    </div>
                  </div>

                  {/* Content with enhanced glass text effects */}
                  <h2
                    className="
    text-2xl font-bold text-gray-900 mb-4 
    transition-all duration-300 relative z-10 drop-shadow-sm 
    group-hover:bg-gradient-to-r group-hover:from-emerald-500 group-hover:to-emerald-700 
    group-hover:text-transparent group-hover:bg-clip-text
"
                  >
                    {role.name}
                  </h2>

                  <p className="text-gray-700 leading-relaxed group-hover:text-gray-800 transition-colors duration-300 mb-6 relative z-10 drop-shadow-sm">
                    {role.description}
                  </p>

                  {/* Call to action with glass button effect */}
                  <div className="inline-flex items-center text-emerald-600 font-semibold group-hover:text-emerald-700 transition-all duration-300 relative z-10 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 group-hover:bg-white/30 group-hover:border-emerald-400/40 group-hover:shadow-lg">
                    <span className="mr-2">Masuk Platform</span>
                    <ArrowRight
                      size={20}
                      className="group-hover:translate-x-1 transition-transform duration-300"
                    />
                  </div>

                  {/* Enhanced background gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/8 via-emerald-400/5 to-emerald-600/12 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-3xl backdrop-blur-sm"></div>

                  {/* Additional glass layer for depth */}
                  <div className="absolute inset-1 bg-gradient-to-b from-white/10 to-transparent rounded-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-500"></div>
                </div>

                {/* Outer glow effect for enhanced glass appearance */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-700 -z-10"></div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes float {
          0%,
          100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(180deg);
          }
        }

        @keyframes liquid {
          0%,
          100% {
            transform: translateY(0px) translateX(0px) rotate(0deg);
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          50% {
            transform: translateY(-15px) translateX(10px) rotate(180deg);
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes glow {
          0%,
          100% {
            box-shadow: 0 0 20px rgba(34, 197, 94, 0.4),
              0 0 40px rgba(34, 197, 94, 0.2);
            border-color: rgba(255, 255, 255, 0.5);
          }
          50% {
            box-shadow: 0 0 30px rgba(34, 197, 94, 0.7),
              0 0 60px rgba(34, 197, 94, 0.4);
            border-color: rgba(34, 197, 94, 0.6);
          }
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .animate-liquid {
          animation: liquid 8s ease-in-out infinite;
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-slide-up {
          animation: slideUp 0.6s ease-out;
        }

        .animate-glow {
          animation: glow 2s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
}

export default PilihRole;
