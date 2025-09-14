"use client"

import { useState } from "react"
import { ArrowLeft, Mail, ShieldCheck, GitBranch, PackageSearch } from "lucide-react"
import { useParams } from "react-router-dom"
import axios from "axios"

export default function ForgotPasswordPage() {
  const { role } = useParams()
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Client-side validation
    if (!email.trim()) {
      setError("Email is required.")
      return
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.")
      return
    }

    setIsSubmitting(true)

    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email: email.trim(),
      })

      setSuccess("If an account with that email exists, a reset link has been sent.")
      setEmail("") // Clear form on success
    } catch (err) {
      const errorMessage = err.response?.data?.message || "An error occurred while attempting to send the reset link."
      setError(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background circles */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-4xl rounded-2xl shadow-2xl grid md:grid-cols-2 overflow-hidden border border-gray-200">
        {/* Left branding column */}
        <div className="hidden md:block p-10 bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
          <div className="h-full flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-2">Welcome Back</h2>
            <p className="text-emerald-100 mb-8">Access your secure dashboard with enterprise-grade features</p>

            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Enterprise Security</h3>
                  <p className="text-sm text-emerald-100">Advanced encryption and compliance</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <GitBranch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Version Control</h3>
                  <p className="text-sm text-emerald-100">Track changes and collaborate</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <PackageSearch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Smart Search</h3>
                  <p className="text-sm text-emerald-100">Find anything instantly</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form column with glassmorphism */}
        <div className="p-8 bg-gradient-to-br from-white/20 to-white/10 bg-white/20 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg">
          <div className="h-full flex flex-col justify-center">
            {/* Back link */}
            <div className="mb-6">
              <a
                href="/roles"
                className="inline-flex items-center text-emerald-600 hover:text-emerald-700 hover:underline transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Choose Role
              </a>
            </div>

            {/* Icon and heading */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
              <p className="text-gray-600">Enter your account email and we'll send a reset link.</p>
            </div>

            {/* Alert messages */}
            <div aria-live="polite">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-6 border border-red-200">{error}</div>
              )}

              {success && (
                <div className="p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm mb-6 border border-emerald-200">
                  {success}
                </div>
              )}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    disabled={isSubmitting}
                    className="w-full pl-10 pr-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-300 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-emerald-600 text-white py-3 rounded-lg hover:bg-emerald-700 font-semibold transition-colors duration-200 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            {/* Login link */}
            <div className="text-center mt-6">
              <p className="text-gray-600">
                Remembered your password?{" "}
                <a
                  href={role ? `/login/${role}` : "/login"}
                  className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium transition-colors duration-200"
                >
                  Log in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
