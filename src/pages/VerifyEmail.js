import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { IoStorefrontOutline } from "react-icons/io5";
import { HiArrowRight } from "react-icons/hi";
import API from "../api/axios";
import toast from "react-hot-toast";

const VerifyEmail = () => {
  const { isDark } = useTheme();
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Email passed from Register page via React Router state —
  // not a URL param (which would be visible in browser history)
  const email = location.state?.email || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const inputs = useRef([]);

  // Redirect if no email — someone navigated here directly
  useEffect(() => {
    if (!email) navigate("/register");
  }, [email, navigate]);

  // Focus first input on mount
  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    // Only accept single digits
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);

    // Auto-advance to next box after entering a digit
    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are filled —
    // vendor doesn't need to tap a button after entering last digit
    if (digit && index === 5 && newCode.every((d) => d !== "")) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (index, e) => {
    // Backspace on empty box — go to previous box
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, 6);

    if (pasted.length === 6) {
      setCode(pasted.split(""));
      // Small delay so state updates before submitting
      setTimeout(() => handleVerify(pasted), 100);
    }
  };

 const handleVerify = async (codeString) => {
    if (loading) return;
    setLoading(true);
    try {
      await API.post("/auth/verify-email", {
        email,
        code: codeString,
      });

      // Don't auto-login after verification —
      // vendor must login manually. This is intentional:
      // 1. More secure — vendor confirms their credentials
      // 2. Works across devices — vendor might verify on
      //    phone but want to login on laptop
      // 3. Clear separation between signup and login flows
      toast.success("Email verified! Please login to continue.");
      navigate("/login", {
        state: {
          verifiedEmail: email,
          message: "Email verified successfully! Please login."
        }
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Invalid code");
      setCode(["", "", "", "", "", ""]);
      setTimeout(() => inputs.current[0]?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    const codeString = code.join("");
    if (codeString.length !== 6) {
      toast.error("Please enter the complete 6-digit code");
      return;
    }
    handleVerify(codeString);
  };

  return (
    <div
      className={`min-h-screen flex items-center justify-center p-6 ${
        isDark ? "bg-gray-950" : "bg-gray-50"
      }`}
    >
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #22c55e, #15803d)" }}
          >
            <IoStorefrontOutline className="w-5 h-5 text-white" />
          </div>
          <span
            className={`font-bold text-lg ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            OrderManager
          </span>
        </div>

        {/* Card */}
        <div
          className={`rounded-2xl border p-8 ${
            isDark
              ? "bg-gray-900 border-gray-800"
              : "bg-white border-gray-100"
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-5">
            <span className="text-3xl">📧</span>
          </div>

          <h1
            className={`text-xl font-bold text-center ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Check your email
          </h1>
          <p
            className={`text-sm text-center mt-2 ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            We sent a 6-digit code to
          </p>
          <p className="text-sm font-semibold text-center text-primary-500 mt-0.5">
            {email}
          </p>

          {/* Code input boxes */}
          <div
            className="flex items-center gap-2 justify-center mt-8 mb-6"
            onPaste={handlePaste}
          >
            {code.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputs.current[index] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                className={`w-12 h-14 text-center font-bold rounded-xl border-2 transition-all duration-200 outline-none ${
                  digit
                    ? "border-primary-500 bg-primary-500/5 text-primary-600 dark:text-primary-400"
                    : isDark
                    ? "border-gray-700 bg-gray-800 text-white"
                    : "border-gray-200 bg-gray-50 text-gray-900"
                } focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20`}
                style={{ fontSize: "1.5rem" }} // always 16px+ — prevents iOS zoom
              />
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={loading || code.some((d) => !d)}
            className="btn-primary w-full h-12 text-sm"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Verifying...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                Verify Email
                <HiArrowRight className="w-4 h-4" />
              </div>
            )}
          </button>

          <p
            className={`text-xs text-center mt-4 ${
              isDark ? "text-gray-600" : "text-gray-400"
            }`}
          >
            Didn't receive the code?{" "}
            <button
              onClick={() => navigate("/register")}
              className="text-primary-500 font-semibold hover:text-primary-600 transition-colors"
            >
              Try again
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;