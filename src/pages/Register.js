import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { HiSun, HiMoon, HiArrowRight, HiCheck } from "react-icons/hi";
import {
  IoStorefrontOutline,
  IoEyeOutline,
  IoEyeOffOutline,
} from "react-icons/io5";
import API from "../api/axios";
import toast from "react-hot-toast";

const perks = [
  "Track unlimited orders daily",
  "Real-time revenue dashboard",
  "Customer management system",
  "WhatsApp-ready order notes",
];

const Register = () => {
  const { login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { strength: 0, label: "", color: "" };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 1) return { strength: score, label: "Weak", color: "#ef4444" };
    if (score <= 3) return { strength: score, label: "Fair", color: "#f59e0b" };
    return { strength: score, label: "Strong", color: "#22c55e" };
  };

  const passwordStrength = getPasswordStrength(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      toast.error("Please fill in all fields");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      const { data } = await API.post("/auth/register", {
        name: form.name,
        email: form.email,
        password: form.password,
      });
     login(
        { _id: data._id, name: data.name, email: data.email },
        data.token,
        data.refreshToken
      );
      toast.success('Check your email for a verification code!');
      navigate('/verify-email', { state: { email: form.email } });
    } catch (err) {
      toast.error(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`min-h-screen flex ${isDark ? "bg-gray-950" : "bg-gray-50"}`}
    >
      {/* Left Panel */}
      <div
        className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-12"
        style={{
          background:
            "linear-gradient(145deg, #15803d 0%, #166534 40%, #14532d 100%)",
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full border-2 border-white" />
          <div className="absolute top-32 left-32 w-64 h-64 rounded-full border-2 border-white" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full border-2 border-white" />
          <div className="absolute bottom-10 right-20 w-96 h-96 rounded-full border-2 border-white" />
        </div>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center">
            <IoStorefrontOutline className="w-6 h-6 text-white" />
          </div>
          <span className="text-white font-bold text-xl">OrderManager</span>
        </div>

        {/* Content */}
        <div className="relative space-y-6">
          <div>
            <h1 className="text-white font-bold text-4xl leading-tight">
              Start growing
              <br />
              <span className="text-primary-300">your business today.</span>
            </h1>
            <p className="text-white/60 text-base mt-4 leading-relaxed max-w-sm">
              Join thousands of vendors across Nigeria who track their orders
              and revenue daily with OrderManager.
            </p>
          </div>

          {/* Perks */}
          <div className="space-y-3">
            {perks.map((perk) => (
              <div key={perk} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary-400/30 flex items-center justify-center flex-shrink-0">
                  <HiCheck className="w-3.5 h-3.5 text-primary-300" />
                </div>
                <span className="text-white/80 text-sm">{perk}</span>
              </div>
            ))}
          </div>

          {/* Free Badge */}
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 rounded-2xl px-5 py-3">
            <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse" />
            <span className="text-white font-semibold text-sm">
              Free to get started — no credit card
            </span>
          </div>
        </div>

        <p className="relative text-white/40 text-xs">
          © {new Date().getFullYear()} OrderManager. Built for Nigerian vendors.
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="flex items-center justify-between p-6">
          <div className="flex items-center gap-2 lg:hidden">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #22c55e, #15803d)",
              }}
            >
              <IoStorefrontOutline className="w-4 h-4 text-white" />
            </div>
            <span
              className={`font-bold text-sm ${isDark ? "text-white" : "text-gray-900"}`}
            >
              OrderManager
            </span>
          </div>
          <div className="lg:ml-auto flex items-center gap-3">
            <span
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
            >
              Have an account?
            </span>
            <Link
              to="/login"
              className="text-sm font-semibold text-primary-500 hover:text-primary-600 transition-colors"
            >
              Sign in →
            </Link>
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition-all duration-200 ml-2 ${
                isDark
                  ? "bg-gray-800 text-yellow-400"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {isDark ? (
                <HiSun className="w-4 h-4" />
              ) : (
                <HiMoon className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-8">
          <div className="w-full max-w-[400px]">
            {/* Heading */}
            <div className="mb-8">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-4"
                style={{
                  backgroundColor: isDark
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(34,197,94,0.08)",
                  color: "#22c55e",
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
                Free Account
              </div>
              <h2
                className={`text-3xl font-bold leading-tight ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                Create your account
              </h2>
              <p
                className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
              >
                Set up your vendor dashboard in seconds
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="label">Full name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Anthony Daso"
                  className="input"
                  autoComplete="name"
                />
              </div>

              {/* Email */}
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="input"
                  autoComplete="email"
                />
              </div>

              {/* Password */}
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Min. 6 characters"
                    className="input pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                      isDark
                        ? "text-gray-500 hover:text-gray-300"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {showPassword ? (
                      <IoEyeOffOutline className="w-4 h-4" />
                    ) : (
                      <IoEyeOutline className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Password Strength */}
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className="h-1 flex-1 rounded-full transition-all duration-300"
                          style={{
                            backgroundColor:
                              i <= passwordStrength.strength
                                ? passwordStrength.color
                                : isDark
                                  ? "#374151"
                                  : "#e5e7eb",
                          }}
                        />
                      ))}
                    </div>
                    <p
                      className="text-xs font-medium"
                      style={{ color: passwordStrength.color }}
                    >
                      {passwordStrength.label} password
                    </p>
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="label">Confirm password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    name="confirmPassword"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat your password"
                    className="input pr-12"
                    style={{
                      borderColor:
                        form.confirmPassword &&
                        form.confirmPassword !== form.password
                          ? "#ef4444"
                          : form.confirmPassword &&
                              form.confirmPassword === form.password
                            ? "#22c55e"
                            : "",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${
                      isDark
                        ? "text-gray-500 hover:text-gray-300"
                        : "text-gray-400 hover:text-gray-600"
                    }`}
                  >
                    {showConfirm ? (
                      <IoEyeOffOutline className="w-4 h-4" />
                    ) : (
                      <IoEyeOutline className="w-4 h-4" />
                    )}
                  </button>
                  {form.confirmPassword &&
                    form.confirmPassword === form.password && (
                      <div className="absolute right-10 top-1/2 -translate-y-1/2">
                        <HiCheck className="w-4 h-4 text-primary-500" />
                      </div>
                    )}
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full mt-2 h-12 text-base"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    Create free account
                    <HiArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </form>

            <p
              className={`text-center text-xs mt-8 ${isDark ? "text-gray-600" : "text-gray-400"}`}
            >
              By creating an account, you agree to our{" "}
              <span className="text-primary-500 cursor-pointer">Terms</span> and{" "}
              <span className="text-primary-500 cursor-pointer">
                Privacy Policy
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
