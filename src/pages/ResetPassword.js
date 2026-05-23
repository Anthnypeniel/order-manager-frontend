import { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import { IoStorefrontOutline, IoEyeOutline, IoEyeOffOutline } from "react-icons/io5";
import { HiArrowRight } from "react-icons/hi";
import API from "../api/axios";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || "";

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=code, 2=new password
  const inputs = useRef([]);

  useEffect(() => {
    if (!email) navigate("/forgot-password");
  }, [email, navigate]);

  useEffect(() => {
    if (step === 1) inputs.current[0]?.focus();
  }, [step]);

  const handleCodeChange = (index, value) => {
    const digit = value.replace(/\D/g, "").slice(-1);
    const newCode = [...code];
    newCode[index] = digit;
    setCode(newCode);
    if (digit && index < 5) inputs.current[index + 1]?.focus();
    if (digit && index === 5 && newCode.every(d => d !== "")) {
      setStep(2);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setCode(pasted.split(""));
      setStep(2);
    }
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

  const passwordStrength = getPasswordStrength(newPassword);

  const handleSubmit = async () => {
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await API.post("/auth/reset-password", {
        email,
        code: code.join(""),
        newPassword,
      });

      toast.success("Password reset successfully! Please login.");
      navigate("/login", {
        state: { message: "Password reset successfully! Please login with your new password." }
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reset password");
      if (err.response?.data?.message?.includes("code")) {
        setStep(1);
        setCode(["", "", "", "", "", ""]);
      }
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
          {/* Step indicator */}
          <div className="flex items-center gap-2 justify-center mb-6">
            {[1, 2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  step >= s
                    ? "bg-primary-500 text-white"
                    : isDark ? "bg-gray-800 text-gray-600" : "bg-gray-100 text-gray-400"
                }`}>
                  {s}
                </div>
                {s < 2 && (
                  <div className={`w-8 h-0.5 ${
                    step > s
                      ? "bg-primary-500"
                      : isDark ? "bg-gray-800" : "bg-gray-200"
                  }`} />
                )}
              </div>
            ))}
          </div>

          {step === 1 ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">🔑</span>
              </div>
              <h1 className={`text-xl font-bold text-center ${isDark ? "text-white" : "text-gray-900"}`}>
                Enter reset code
              </h1>
              <p className={`text-sm text-center mt-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                We sent a code to{" "}
                <span className="text-primary-500 font-semibold">{email}</span>
              </p>

              <div className="flex items-center gap-2 justify-center mt-8" onPaste={handlePaste}>
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => (inputs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleCodeChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    className={`w-12 h-14 text-center font-bold rounded-xl border-2 transition-all duration-200 outline-none ${
                      digit
                        ? "border-amber-500 bg-amber-500/5"
                        : isDark
                        ? "border-gray-700 bg-gray-800 text-white"
                        : "border-gray-200 bg-gray-50 text-gray-900"
                    } focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20`}
                    style={{ fontSize: "1.5rem" }}
                  />
                ))}
              </div>

              <button
                onClick={() => navigate("/forgot-password")}
                className={`w-full text-xs font-medium py-3 mt-4 transition-colors ${
                  isDark ? "text-gray-600 hover:text-gray-400" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                Didn't receive code? Try again
              </button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-5">
                <span className="text-3xl">🔒</span>
              </div>
              <h1 className={`text-xl font-bold text-center ${isDark ? "text-white" : "text-gray-900"}`}>
                Set new password
              </h1>
              <p className={`text-sm text-center mt-2 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                Choose a strong password for your account
              </p>

              <div className="space-y-4 mt-8">
                <div>
                  <label className="label">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      className="input pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg ${
                        isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                      }`}
                    >
                      {showPassword
                        ? <IoEyeOffOutline className="w-4 h-4" />
                        : <IoEyeOutline className="w-4 h-4" />
                      }
                    </button>
                  </div>

                  {/* Password strength */}
                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4, 5].map(i => (
                          <div
                            key={i}
                            className="h-1 flex-1 rounded-full transition-all duration-300"
                            style={{
                              backgroundColor: i <= passwordStrength.strength
                                ? passwordStrength.color
                                : isDark ? "#374151" : "#e5e7eb"
                            }}
                          />
                        ))}
                      </div>
                      <p className="text-xs font-medium" style={{ color: passwordStrength.color }}>
                        {passwordStrength.label} password
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="label">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="input"
                    style={{
                      borderColor: confirmPassword && confirmPassword !== newPassword
                        ? "#ef4444"
                        : confirmPassword && confirmPassword === newPassword
                          ? "#22c55e"
                          : ""
                    }}
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !newPassword || !confirmPassword}
                  className="btn-primary w-full h-12 text-sm"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting password...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      Reset Password
                      <HiArrowRight className="w-4 h-4" />
                    </div>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;