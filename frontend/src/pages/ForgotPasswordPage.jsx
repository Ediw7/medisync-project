"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Mail,
  ShieldCheck,
  GitBranch,
  PackageSearch,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";

export default function ForgotPasswordPage() {
  const { role } = useParams();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const lastRole = localStorage.getItem("lastRole") || "produsen";

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side validation
    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post("http://localhost:5000/api/auth/forgot-password", {
        email: email.trim(),
      });

      setSuccess(
        "If an account with that email exists, a reset link has been sent."
      );
      setEmail(""); // Clear form on success
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        "An error occurred while attempting to send the reset link.";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-200 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 -translate-y-1 w-96 h-96 bg-green-200/70 rounded-full blur-3xl animate-spin"></div>
      <div className="absolute top-1 left-1/2 -translate-x-1/2 -translate-y-1 w-48 h-64 bg-green-200/80 rounded-full blur-3xl animate-spin"></div>
      <div
        className="absolute bottom-0 right-0 w-96 h-96 bg-green-200 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>
      <div
        className="absolute top-1/2 left-1/4 w-64 h-64 bg-blue-200/20 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute bottom-1/4 left-1/2 w-48 h-48 bg-purple-200/20 rounded-full blur-2xl animate-pulse"
        style={{ animationDelay: "3s" }}
      ></div>

      {/* Main card */}
      <div className="relative z-10 w-full max-w-4xl rounded-3xl shadow-2xl grid md:grid-cols-2 overflow-hidden border border-gray-200">
        {/* Left branding column */}
        <div className="hidden md:block p-10 bg-gradient-to-br from-emerald-600/90 to-[#047857] text-white">
          <div className="h-full flex flex-col justify-center">
            <h2 className="text-3xl font-bold mb-4">Welcome Back</h2>
            <p className="text-[#F9FDFE] mb-8">
              Access your secure dashboard with enterprise-grade features
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-white/20 rounded-xl flex items-center justify-center">
                  <ShieldCheck className="h-8 w-8 text-white flex-shrink-0" />
                </div>
                <div>
                  <h3 className="font-semibold">Enterprise Security</h3>
                  <p className="text-sm text-[#F9FDFE]">
                    Advanced encryption and compliance
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl flex items-center justify-center">
                  <GitBranch className="h-8 w-8 text-white flex-shrink-" />
                </div>
                <div>
                  <h3 className="font-semibold">Version Control</h3>
                  <p className="text-sm text-[#F9FDFE]">
                    Track changes and collaborate
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl flex items-center justify-center">
                  <PackageSearch className="h-8 w-8 text-white flex-shrink-" />
                </div>
                <div>
                  <h3 className="font-semibold">Smart Search</h3>
                  <p className="text-sm text-[#F9FDFE]">
                    Find anything instantly
                  </p>
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
              <div className="w-16 h-16 bg-[#047857]/90 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-8 h-8 text-gray-100/90" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Reset Password
              </h1>
              <p className="text-gray-600">
                Enter your account email and we'll send a reset link.
              </p>
            </div>

            {/* Alert messages */}
            <div aria-live="polite">
              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm mb-6 border border-red-200">
                  {error}
                </div>
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
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
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
                    className="w-full pl-10 pr-4 py-3 bg-white/40 backdrop-blur-xl rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-gray-200/80 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                <Link
                  to={`/login/${lastRole}`}
                  className="text-emerald-600 hover:text-emerald-700 hover:underline font-medium transition-colors duration-200"
                >
                  Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
