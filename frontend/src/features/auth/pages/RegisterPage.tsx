import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== passwordConfirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await authService.register({ name, email, password, password_confirmation: passwordConfirm });
      if (res.access_token) {
        localStorage.setItem("access_token", res.access_token);
        localStorage.setItem("refresh_token", res.refresh_token);
      }
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-4">
      <div className="w-full max-w-sm">
        <div className="bg-surface border border-default shadow-card rounded-xl p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-xxl font-bold text-primary">Create Account</h1>
            <p className="text-sm text-secondary">Register to get started.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-semantic-danger-soft px-3 py-2 text-sm text-semantic-danger">
                {error}
              </div>
            )}
            <Input label="Name" type="text" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" />
            <Input label="Email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
            <Input label="Password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" helperText="Minimum 8 characters" />
            <Input label="Confirm Password" type="password" required value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} placeholder="••••••••" />
            <Button type="submit" loading={loading} className="w-full">Register</Button>
          </form>
          <p className="text-center text-sm text-secondary">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-link hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
