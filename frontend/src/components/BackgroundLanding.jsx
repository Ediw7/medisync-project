export function AnimatedBackground() {
  return (
    <>
      {/* Background decorative elements with floating animations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#047857]/20 rounded-full blur-3xl animate-float-1"></div>

      {/* <div className="absolute bottom-1 left-1/2 -translate-x-1/2 -translate-y-1 w-96 h-96 bg-green-200/70 rounded-full blur-3xl animate-float-2"></div> */}

      {/* <div className="absolute top-1 left-1/2 -translate-x-1/2 -translate-y-1 w-48 h-64 bg-green-200/80 rounded-full blur-3xl animate-float-3"></div> */}

      <div
        className="absolute bottom-0 right-0 w-96 h-96 bg-[#047857]/20 rounded-full blur-3xl animate-float-4"
        style={{ animationDelay: "2s" }}
      ></div>

      <div
        className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-200/10 rounded-full blur-2xl animate-float-5"
        style={{ animationDelay: "1s" }}
      ></div>

      <div
        className="absolute bottom-1/4 left-1/2 w-48 h-48 bg-purple-200/10 rounded-full blur-2xl animate-float-6"
        style={{ animationDelay: "3s" }}
      ></div>

      <div
        className="absolute top-1/3 right-1/4 w-80 h-80 bg-pink-200/30 rounded-full blur-3xl animate-float-1"
        style={{ animationDelay: "0.5s" }}
      ></div>

      <div
        className="absolute bottom-1/3 left-1/3 w-56 h-56 bg-orange-200/40 rounded-full blur-2xl animate-float-2"
        style={{ animationDelay: "1.5s" }}
      ></div>

      <div
        className="absolute top-2/3 left-3/4 w-72 h-72 bg-yellow-200/20 rounded-full blur-3xl animate-float-3"
        style={{ animationDelay: "2.5s" }}
      ></div>

      <div
        className="absolute top-1/4 right-1/3 w-40 h-40 bg-red-200/35 rounded-full blur-2xl animate-float-4"
        style={{ animationDelay: "0.8s" }}
      ></div>

      <div
        className="absolute bottom-2/3 right-1/2 w-60 h-60 bg-indigo-200/25 rounded-full blur-3xl animate-float-5"
        style={{ animationDelay: "3.2s" }}
      ></div>

      <div
        className="absolute top-3/4 left-1/6 w-44 h-44 bg-teal-200/45 rounded-full blur-2xl animate-float-6"
        style={{ animationDelay: "1.8s" }}
      ></div>

      <div
        className="absolute bottom-1/6 right-1/6 w-52 h-52 bg-cyan-200/40 rounded-full blur-3xl animate-float-1"
        style={{ animationDelay: "2.8s" }}
      ></div>

      <div
        className="absolute top-1/6 left-2/3 w-36 h-36 bg-rose-200/50 rounded-full blur-2xl animate-float-2"
        style={{ animationDelay: "0.3s" }}
      ></div>
    </>
  )
}
