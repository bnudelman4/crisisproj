"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, CheckCircle2, Loader2, MapPin, Save } from "lucide-react";

interface MeUser {
  id: number;
  name: string;
  phone: string;
  lat: number;
  lng: number;
}

export default function ProfilePage() {
  const router = useRouter();
  const [me, setMe] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" });
        const data = await res.json();
        if (!data.user) {
          router.push("/login");
          return;
        }
        setMe(data.user);
        setName(data.user.name);
        setLat(String(data.user.lat));
        setLng(String(data.user.lng));
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  function detectLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(String(pos.coords.latitude));
        setLng(String(pos.coords.longitude));
        setLocating(false);
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setLocating(false);
      }
    );
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOkMsg(null);
    if (newPw && newPw !== confirmPw) {
      setError("New passwords do not match.");
      return;
    }
    if (newPw && newPw.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        currentPassword: currentPw,
      };
      if (me && name !== me.name) body.name = name;
      if (me && Number(lat) !== me.lat) body.lat = Number(lat);
      if (me && Number(lng) !== me.lng) body.lng = Number(lng);
      if (newPw) body.newPassword = newPw;

      const res = await fetch("/api/users/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || `HTTP ${res.status}`);
        return;
      }
      setMe(data.user);
      setName(data.user.name);
      setLat(String(data.user.lat));
      setLng(String(data.user.lng));
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
      setOkMsg("Saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading...
      </main>
    );
  }
  if (!me) return null;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] font-semibold text-primary mb-1">
                CrisisMesh
              </div>
              <h1 className="text-2xl font-bold">Profile</h1>
              <p className="text-sm text-muted-foreground mt-1">{me.phone}</p>
            </div>
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="gap-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            </Link>
          </div>

          <form onSubmit={save} className="space-y-3">
            <div>
              <label className="text-xs uppercase tracking-wider text-muted-foreground">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full h-10 rounded-md border border-input bg-card px-3 text-sm"
                disabled={saving}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs uppercase tracking-wider text-muted-foreground">Location</label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                  onClick={detectLocation}
                  disabled={saving || locating}
                >
                  <MapPin className="h-3 w-3" />
                  {locating ? "Locating..." : "Use my location"}
                </Button>
              </div>
              <div className="mt-1 grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={lat}
                  onChange={(e) => setLat(e.target.value)}
                  placeholder="Latitude"
                  className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                  disabled={saving}
                  required
                />
                <input
                  type="text"
                  value={lng}
                  onChange={(e) => setLng(e.target.value)}
                  placeholder="Longitude"
                  className="h-9 rounded-md border border-input bg-card px-3 text-sm"
                  disabled={saving}
                  required
                />
              </div>
            </div>

            <div className="border-t border-border pt-3 space-y-2">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Change password</div>
              <input
                type="password"
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                placeholder="Current password (required to save)"
                className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm"
                disabled={saving}
              />
              <input
                type="password"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                placeholder="New password (leave blank to keep current)"
                className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm"
                disabled={saving}
              />
              <input
                type="password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                placeholder="Confirm new password"
                className="w-full h-10 rounded-md border border-input bg-card px-3 text-sm"
                disabled={saving}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            {okMsg && (
              <div className="flex items-start gap-2 rounded-md border border-emerald-500/50 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                <span>{okMsg}</span>
              </div>
            )}
            <Button type="submit" className="w-full gap-2" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
