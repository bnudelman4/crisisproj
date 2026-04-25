"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Loader2, MapPin, UserPlus } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [lat, setLat] = useState<string>("");
  const [lng, setLng] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationStatus, setLocationStatus] = useState<string>("Click \"Use my location\" or enter manually.");

  useEffect(() => {
    detectLocation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function detectLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocationStatus("Geolocation not supported. Enter manually.");
      return;
    }
    setLocating(true);
    setLocationStatus("Requesting location...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        setLocationStatus(`Location captured (±${Math.round(pos.coords.accuracy)}m).`);
        setLocating(false);
      },
      (err) => {
        setLocationStatus(`${err.message}. Enter manually.`);
        setLocating(false);
      }
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPw) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (!lat || !lng) {
      setError("Location required. Click \"Use my location\" or enter coordinates.");
      return;
    }
    setLoading(true);
    try {
      const regRes = await fetch("/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password, lat: Number(lat), lng: Number(lng) }),
      });
      const regData = await regRes.json();
      if (!regRes.ok && regRes.status !== 409) {
        setError(regData?.error || `HTTP ${regRes.status}`);
        return;
      }
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      if (!loginRes.ok) {
        const data = await loginRes.json();
        setError(data?.error || "Login after register failed.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] font-semibold text-primary mb-1">
              CrisisMesh
            </div>
            <h1 className="text-2xl font-bold">Create your profile</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Set up your account to receive alerts and accept matches.
            </p>
          </div>
          <form onSubmit={submit} className="space-y-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={loading}
              required
            />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Phone (e.g. 6464771086)"
              className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={loading}
              required
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={loading}
              required
              minLength={6}
            />
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              placeholder="Confirm password"
              className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={loading}
              required
              minLength={6}
            />
            <div className="rounded-md border border-border bg-card/40 px-3 py-2 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Location</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={detectLocation}
                  disabled={loading || locating}
                >
                  <MapPin className="h-3 w-3" />
                  {locating ? "Locating..." : "Use my location"}
                </Button>
              </div>
              <div className="text-[11px] text-muted-foreground">{locationStatus}</div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="Latitude"
                  className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                  disabled={loading}
                  required
                />
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="Longitude"
                  className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                  disabled={loading}
                  required
                />
              </div>
            </div>
            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {loading ? "Creating profile..." : "Create profile & continue"}
            </Button>
          </form>
          <div className="text-xs text-muted-foreground text-center">
            Already registered? <Link href="/login" className="underline">Log in</Link>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
