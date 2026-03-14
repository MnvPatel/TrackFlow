import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { api } from "../lib/axios";
import { useAuth } from "../context/AuthContext";
import Card from "../components/Card";
import Button from "../components/Button";

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  marginBottom: 16,
  border: "1px solid var(--border)",
  borderRadius: 6,
  background: "var(--bg-secondary)",
  color: "var(--text-primary)",
};

export default function SetPassword() {
  const [searchParams] = useSearchParams();
  const emailFromUrl = searchParams.get("email") ?? "";

  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { setAuth } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl]);

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      await api.post("/api/auth/password/setup/request", { email });
      setSuccess("OTP sent to your email. Enter it below to set your password.");
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/password/setup/verify", {
        email,
        otp,
        newPassword,
      });
      const { data } = await api.post<{ accessToken: string; role: string }>(
        "/api/auth/login",
        { email, password: newPassword }
      );
      setAuth(data.accessToken, data.role as "ADMIN" | "EMPLOYEE" | "CLIENT");
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <Card style={{ width: "100%", maxWidth: 400 }}>
        <h1 style={{ margin: "0 0 24px", fontSize: "1.5rem" }}>
          Set your password
        </h1>

        {step === 1 ? (
          <form onSubmit={handleRequestOTP}>
            {error && (
              <div
                style={{
                  padding: 12,
                  marginBottom: 16,
                  background: "var(--danger-bg)",
                  color: "var(--danger)",
                  borderRadius: 6,
                }}
              >
                {error}
              </div>
            )}
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={inputStyle}
              placeholder="your@email.com"
            />
            <Button type="submit" disabled={loading} style={{ width: "100%" }}>
              {loading ? "Sending OTP…" : "Send OTP"}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSetPassword}>
            {success && (
              <div
                style={{
                  padding: 12,
                  marginBottom: 16,
                  background: "var(--success-bg, #e8f5e9)",
                  color: "var(--success, #2e7d32)",
                  borderRadius: 6,
                }}
              >
                {success}
              </div>
            )}
            {error && (
              <div
                style={{
                  padding: 12,
                  marginBottom: 16,
                  background: "var(--danger-bg)",
                  color: "var(--danger)",
                  borderRadius: 6,
                }}
              >
                {error}
              </div>
            )}
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              readOnly
              style={{ ...inputStyle, opacity: 0.9, cursor: "not-allowed" }}
            />
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              OTP
            </label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              style={inputStyle}
              placeholder="6-digit code"
              maxLength={6}
              autoComplete="one-time-code"
            />
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              New password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              style={inputStyle}
              placeholder="At least 6 characters"
            />
            <label style={{ display: "block", marginBottom: 8, fontWeight: 500 }}>
              Confirm password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              style={inputStyle}
              placeholder="Same as above"
            />
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setStep(1)}
                style={{ flex: 1 }}
              >
                Back
              </Button>
              <Button type="submit" disabled={loading} style={{ flex: 1 }}>
                {loading ? "Setting password…" : "Set password"}
              </Button>
            </div>
          </form>
        )}

        <p style={{ marginTop: 16, color: "var(--text-muted)", fontSize: 14 }}>
          <Link to="/login" style={{ color: "var(--accent)" }}>
            Back to sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
