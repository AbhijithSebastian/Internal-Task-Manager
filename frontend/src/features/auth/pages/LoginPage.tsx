import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-app px-4">
      <div className="w-full max-w-sm">
        <div className="bg-surface border border-default shadow-card rounded-xl p-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-xxl font-bold text-primary">Welcome Back</h1>
            <p className="text-sm text-secondary">Sign in to your account to continue.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-semantic-danger-soft px-3 py-2 text-sm text-semantic-danger">
                {error}
              </div>
            )}
            <Input
              label="Email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-primary">Password</label>
                <Link to="/forgot-password" className="text-xs text-link hover:underline">Forgot?</Link>
              </div>
              <input
                id="password"
                type="password"
                required
                className="w-full h-9 px-3 rounded-md bg-surface border border-default text-sm text-primary placeholder:text-tertiary hover:border-hover focus:outline-none focus:ring-2 focus:ring-primary-ring focus:border-primary transition-colors duration-fast"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>
          <p className="text-center text-sm text-secondary">
            Don&apos;t have an account?{" "}
            <Link to="/register" className="font-medium text-link hover:underline">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
