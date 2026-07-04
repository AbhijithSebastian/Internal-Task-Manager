import { useState } from "react";
import { Link } from "react-router-dom";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const res = await authService.forgotPassword(email);
      setMessage(res.message || "Check your email for a reset link.");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-4">
      <div className="w-full max-w-sm">
        <div className="bg-surface border border-default shadow-card rounded-xl p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-xxl font-bold text-primary">Reset Password</h1>
            <p className="text-sm text-secondary">Enter your email to receive a reset link.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-semantic-danger-soft px-3 py-2 text-sm text-semantic-danger">{error}</div>
            )}
            {message && (
              <div className="rounded-md bg-semantic-success-soft px-3 py-2 text-sm text-semantic-success">{message}</div>
            )}
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Button type="submit" loading={loading} className="w-full">Send Reset Link</Button>
          </form>
          <p className="text-center text-sm text-secondary">
            <Link to="/login" className="font-medium text-link hover:underline">Back to login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
