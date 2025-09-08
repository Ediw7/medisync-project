import { Link } from 'react-router-dom';
import { Factory, Truck, Store, ArrowRight, Shield } from 'lucide-react';

function PilihRole() {
  const roles = [
    { 
      name: 'Produsen', 
      to: '/login/produsen', 
      icon: <Factory size={48} />, 
      description: 'Manufaktur dan produksi obat-obatan',
      color: 'from-emerald-500 to-emerald-600'
    },
    { 
      name: 'PBF', 
      to: '/login/pbf', 
      icon: <Truck size={48} />, 
      description: 'Distribusi dan penyaluran produk farmasi',
      color: 'from-emerald-600 to-emerald-700'
    },
    { 
      name: 'Apotek', 
      to: '/login/apotek', 
      icon: <Store size={48} />, 
      description: 'Pelayanan obat dan konsultasi farmasi',
      color: 'from-emerald-700 to-green-800'
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-800 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-br from-emerald-500/10 to-emerald-700/5 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-br from-emerald-600/10 to-emerald-500/10 animate-liquid blur-2xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-emerald-400/5 to-emerald-600/10 rounded-full blur-3xl animate-pulse"></div>
      </div>

      <div className="flex flex-col items-center justify-center min-h-screen p-4 relative z-10">
        {/* Header Section */}
        <div className="text-center mb-16 animate-fade-in">
         
          
          <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Pilih Peran <span className="text-emerald-600">Anda</span>
          </h1>
          
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Pilih peran Anda untuk masuk ke platform dan mulai mengelola rantai pasok farmasi dengan teknologi blockchain terpercaya.
          </p>
        </div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          {roles.map((role, index) => (
            <Link to={role.to} key={role.name} className="group animate-slide-up" style={{ animationDelay: `${index * 0.1}s` }}>
              <div className="bg-white/40 backdrop-blur-xl p-8 h-full flex flex-col items-center justify-center text-center rounded-3xl border border-white/30 hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500 hover:-translate-y-2 hover:bg-white/60 relative overflow-hidden group-hover:scale-105">
                
                {/* Card shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {/* Icon container */}
                <div className={`h-24 w-24 bg-gradient-to-br ${role.color} backdrop-blur-sm rounded-3xl flex items-center justify-center mb-6 group-hover:scale-125 transition-all duration-500 shadow-2xl border border-white/20 group-hover:animate-glow relative z-10`}>
                  <div className="text-white group-hover:scale-110 transition-transform duration-300">
                    {role.icon}
                  </div>
                </div>
                
                {/* Content */}
                <h2 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-emerald-600 transition-all duration-300 relative z-10">
                  {role.name}
                </h2>
                
                <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300 mb-6 relative z-10">
                  {role.description}
                </p>

                {/* Call to action */}
                <div className="inline-flex items-center text-emerald-600 font-semibold group-hover:text-emerald-700 transition-all duration-300 relative z-10">
                  <span className="mr-2">Masuk Platform</span>
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform duration-300" />
                </div>
                
                {/* Background gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
              </div>
            </Link>
          ))}
        </div>

        
      </div>

      {/* Custom animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        @keyframes liquid {
          0%, 100% { 
            transform: translateY(0px) translateX(0px) rotate(0deg);
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
          }
          50% { 
            transform: translateY(-15px) translateX(10px) rotate(180deg);
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
          }
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(50px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(34, 197, 94, 0.3); }
          50% { box-shadow: 0 0 30px rgba(34, 197, 94, 0.6), 0 0 40px rgba(34, 197, 94, 0.3); }
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