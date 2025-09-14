"use client"

import { useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import axios from "axios"
import { Lock, Eye, EyeOff, CheckCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const { token, role } = useParams()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
    // Clear errors when user starts typing
    if (error) setError("")
  }

  const validateForm = () => {
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.")
      return false
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.")
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    setError("")

    try {
      const response = await axios.post("http://localhost:5000/api/auth/reset-password", {
        token,
        newPassword: form.password,
      })

      setMessage(
        response.data?.message ||
          "Your password has been reset successfully. You can now log in with your new password.",
      )
      setForm({ password: "", confirmPassword: "" })
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        (err.code === "NETWORK_ERROR"
          ? "An error occurred while connecting to the server."
          : "Failed to reset password. The token may be invalid or expired.")
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const loginPath = role ? `/login/${role}` : "/login/produsen"

  // Success state
  if (message) {
    return (
      <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white/20 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8 text-center">
            <div className="flex justify-center mb-6">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Password Reset Successful</h1>
            <div className="bg-green-100 text-green-800 rounded-md p-4 mb-6 text-sm" aria-live="polite">
              {message}
            </div>
            <Link
              to={loginPath}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors inline-block text-center"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/20 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Reset Password</h1>
            <p className="text-gray-600">Enter your new password below.</p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 rounded-md p-4 mb-6 text-sm" aria-live="polite">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={form.password}
                  onChange={handleInputChange}
                  placeholder="********"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
                  aria-label="Toggle password visibility"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="********"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white/50 backdrop-blur-sm"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? "Saving..." : "Reset Password"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link
              to={loginPath}
              className="text-sm text-green-600 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded"
            >
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
