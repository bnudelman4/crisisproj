"use client";

import { useState } from "react";
import { AppShell, type AppTab } from "./AppShell";
import { AppProvider, useApp } from "./AppContext";
import MapView from "./views/MapView";
import FeedView from "./views/FeedView";
import ComposeView from "./views/ComposeView";
import AlertsView from "./views/AlertsView";
import YouView from "./views/YouView";
import {
  MeetupSafetyModal,
  type ModalAction,
} from "@/components/primitives/MeetupSafetyModal";
import { meetupLocationOptions } from "@/lib/safety";

function Inner({
  initialTab = "feed",
}: {
  initialTab?: AppTab;
}) {
  const [tab, setTab] = useState<AppTab>(initialTab);
  const [openMatchId, setOpenMatchId] = useState<string | null>(null);
  const { matches, alerts, approveMatch, blockMatch, requestMoreInfo } = useApp();

  const openMatch = (id: string) => setOpenMatchId(id);
  const close = () => setOpenMatchId(null);

  const handleAction = (action: ModalAction, payload?: unknown) => {
    if (!openMatchId) return;
    if (action === "approve") {
      const locId = typeof payload === "string" ? payload : undefined;
      approveMatch(openMatchId, locId);
      setOpenMatchId(null);
      setTab("alerts");
    } else if (action === "request-info") {
      requestMoreInfo(openMatchId);
      setOpenMatchId(null);
    } else if (action === "block") {
      blockMatch(openMatchId);
      setOpenMatchId(null);
    } else if (action === "change-location") {
      const locId = typeof payload === "string" ? payload : undefined;
      const loc = meetupLocationOptions.find((m) => m.id === locId);
      if (loc) {
        // For demo, leave modal open and just acknowledge
      }
    } else {
      setOpenMatchId(null);
    }
  };

  const unread = alerts.filter((a) => a.tone !== "ok").length;

  return (
    <>
      <AppShell active={tab} onNavigate={setTab} alertsCount={unread}>
        {tab === "map" && <MapView onOpenMatch={openMatch} />}
        {tab === "feed" && <FeedView onOpenMatch={openMatch} />}
        {tab === "compose" && <ComposeView />}
        {tab === "alerts" && <AlertsView onOpenMatch={openMatch} />}
        {tab === "you" && <YouView />}
      </AppShell>

      <MeetupSafetyModal
        open={!!openMatchId}
        match={openMatchId ? matches[openMatchId] ?? null : null}
        onAction={handleAction}
      />
    </>
  );
}

export function ProductApp({ initialTab = "feed" }: { initialTab?: AppTab }) {
  return (
    <AppProvider>
      <Inner initialTab={initialTab} />
    </AppProvider>
  );
}
