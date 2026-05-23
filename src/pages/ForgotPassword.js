import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { IoStorefrontOutline } from "react-icons/io5";
import { HiArrowRight, HiOutlineArrowLeft } from "react-icons/hi";
import API from "../api/axios";
import toast from "react-hot-toast";

const ForgotPassword = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email");
      return;
    }
    setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email });
      setSent(true);
      toast.success("Reset code sent if email exists");
    } catch (err) {
      toast.error(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-6 ${
      isDark ? "bg-gray-950" : "bg-gray-50"
    }`}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #22c55e, #15803d)" }}>
            <IoStorefrontOutline className="w-5 h-5 text-white" />
          </div>
          <span className={`font-bold text-lg ${isDark ? "text-white" : "text-gray-900"}`}>
            OrderManager
          </span>
        </div>

        <div className={`rounded-2xl border p-8 ${
          isDark ? "bg-gray-900 border-gray-800" : "bg-white border-gray-100"
        }`}>
          {!sent ? (
            <>
              <button
                onClick={() => navigate("/login")}
                className={`flex items-center gap-2 text-xs font-semibold mb-6 ${
                  isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <HiOutlineArrowLeft className="w-3.5 h-3.5" />
                Back to login
              </button>

              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">🔑</span>
              </div>

              <h1 className={`text-xl font-bold text-center ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                Forgot your password?
              </h1>
              <p className={`text-sm text-center mt-2 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}>
                Enter your email and we'll send you a reset code
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-4">
                <div>
                  <label className="label">Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input"
                    autoComplete="email"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full h-12 text-sm"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending code...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Send reset code
                      <HiArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">📧</span>
              </div>
              <h1 className={`text-xl font-bold text-center ${
                isDark ? "text-white" : "text-gray-900"
              }`}>
                Check your email
              </h1>
              <p className={`text-sm text-center mt-2 ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}>
                We sent a 6-digit reset code to
              </p>
              <p className="text-sm font-semibold text-center text-primary-500 mt-0.5">
                {email}
              </p>

              <button
                onClick={() => navigate("/reset-password", { state: { email } })}
                className="btn-primary w-full h-12 text-sm mt-8"
              >
                Enter reset code
                <HiArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setSent(false)}
                className={`w-full text-xs font-medium py-2 mt-2 transition-colors ${
                  isDark ? "text-gray-600 hover:text-gray-400" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Try a different email
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;