import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";
import { Button, Input } from "@/design-system";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") || "";
  const emailParam = searchParams.get("email") || "";

  const [email] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.resetPassword(email, token, password, confirmPassword);
      setMessage(res.message || "Password reset successful.");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-4">
      <div className="w-full max-w-sm">
        <div className="border-default space-y-6 rounded-xl border bg-surface p-8 shadow-card">
          <div className="space-y-1 text-center">
            <h1 className="text-xxl font-bold text-primary">Set New Password</h1>
            <p className="text-sm text-secondary">Enter your new password below.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-semantic-danger-soft px-3 py-2 text-sm text-semantic-danger">
                {error}
              </div>
            )}
            {message && (
              <div className="rounded-md bg-semantic-success-soft px-3 py-2 text-sm text-semantic-success">
                {message}
              </div>
            )}
            <Input
              label="New Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Input
              label="Confirm Password"
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
            />
            <Button type="submit" loading={loading} className="w-full">
              Reset Password
            </Button>
          </form>
          <p className="text-center text-sm text-secondary">
            <Link to="/login" className="font-medium text-link hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
