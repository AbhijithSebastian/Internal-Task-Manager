import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authService } from "@/services/auth";

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
      await authService.register({ name, email, password, password_confirmation: passwordConfirm });
      navigate("/login");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-8 shadow-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Task Manager</h1>
          <p className="mt-1 text-sm text-muted-foreground">Create a new account</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="name" className="block text-sm font-medium">Name</label>
            <input id="name" type="text" required className="mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium">Email</label>
            <input id="email" type="email" required className="mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium">Password</label>
            <input id="password" type="password" required className="mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div>
            <label htmlFor="passwordConfirm" className="block text-sm font-medium">Confirm Password</label>
            <input id="passwordConfirm" type="password" required className="mt-1 block w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} />
          </div>
          <button type="submit" disabled={loading} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>
        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
