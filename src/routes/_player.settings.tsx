import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Headphones, Wifi, Download, Bell, Lock, Music2 } from "lucide-react";
import { usePlayer } from "@/store/player";

export const Route = createFileRoute("/_player/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MUTUNES" },
      {
        name: "description",
        content: "Manage your MUTUNES audio quality, downloads, notifications and account.",
      },
    ],
  }),
  component: Settings,
});

type Quality = {
  id: string;
  label: string;
  bitrate: string;
  description: string;
  badge?: string;
};

const STREAM_QUALITIES: Quality[] = [
  {
    id: "auto",
    label: "Automatic",
    bitrate: "Adaptive",
    description: "Adjusts to your network for uninterrupted playback.",
  },
  {
    id: "low",
    label: "Low",
    bitrate: "96 kbps",
    description: "Saves data. Best for cellular connections.",
  },
  {
    id: "normal",
    label: "Normal",
    bitrate: "160 kbps",
    description: "Balanced quality for everyday listening.",
  },
  {
    id: "high",
    label: "High",
    bitrate: "320 kbps",
    description: "Crisp audio for headphones and speakers.",
  },
  {
    id: "lossless",
    label: "Lossless",
    bitrate: "FLAC · 24-bit/48kHz",
    description: "Studio-quality CD-equivalent audio.",
    badge: "Premium",
  },
  {
    id: "hires",
    label: "Hi-Res Lossless",
    bitrate: "FLAC · 24-bit/192kHz",
    description: "Master-grade fidelity. Requires compatible DAC.",
    badge: "Premium",
  },
];

const DOWNLOAD_QUALITIES: Quality[] = [
  { id: "normal", label: "Normal", bitrate: "160 kbps", description: "Smallest file size." },
  {
    id: "high",
    label: "High",
    bitrate: "320 kbps",
    description: "Recommended for offline listening.",
  },
  {
    id: "lossless",
    label: "Lossless",
    bitrate: "FLAC · 24-bit/48kHz",
    description: "Largest files. Use Wi-Fi.",
    badge: "Premium",
  },
];

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-card p-6 paper-shadow relative wobbly-border">
      {/* Paper texture visual cue */}
      <div className="absolute top-3 right-4 h-1.5 w-6 bg-muted/40 rounded border border-foreground/5" />

      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-sm">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{title}</h2>
          {description && (
            <p className="mt-0.5 text-xs text-muted-foreground/90 font-serif">{description}</p>
          )}
        </div>
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function QualityList({
  options,
  value,
  onChange,
}: {
  options: Quality[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      {options.map((q) => {
        const active = value === q.id;
        return (
          <button
            key={q.id}
            onClick={() => onChange(q.id)}
            className={`flex w-full items-center gap-4 p-4 text-left transition-all wobbly-border ${
              active
                ? "border-primary bg-[oklch(0.95_0.05_90)] shadow-sm font-semibold"
                : "bg-card hover:border-foreground/30"
            }`}
          >
            <div
              className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}
            >
              {active && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-foreground">{q.label}</span>
                {q.badge && (
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                    {q.badge}
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-xs text-muted-foreground/80">{q.description}</div>
            </div>
            <div className="shrink-0 text-right text-xs font-serif text-muted-foreground">
              {q.bitrate}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full border transition-all ${
        checked ? "bg-primary border-primary" : "bg-surface-elevated border-border"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 h-4.5 w-4.5 rounded-full bg-card shadow-sm transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-border/50 py-4 first:border-t-0 first:pt-0">
      <div>
        <div className="font-serif font-bold text-sm text-foreground">{title}</div>
        {description && (
          <div className="mt-0.5 text-xs text-muted-foreground/85">{description}</div>
        )}
      </div>
      {children}
    </div>
  );
}

function Settings() {
  const [streamQ, setStreamQ] = useState("high");
  const [downloadQ, setDownloadQ] = useState("high");
  const [wifiOnly, setWifiOnly] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [crossfade, setCrossfade] = useState(false);
  const [normalize, setNormalize] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [privateSession, setPrivateSession] = useState(false);

  const downloadedTracks = usePlayer((s) => s.downloadedTracksList);
  const clearCache = usePlayer((s) => s.clearCache);
  const cacheBytes = downloadedTracks.reduce((a, t) => a + (t.duration || 200) * 40_000, 0);
  const cacheMB = (cacheBytes / 1_000_000).toFixed(0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl font-bold text-foreground">Make it yours</h1>
        <p className="font-handwritten text-lg text-primary/80 -mt-1">
          A few small knobs so MUTUNES sounds and feels just right.
        </p>
      </div>

      <Section
        icon={Headphones}
        title="Audio Quality"
        description="Higher quality uses more data and storage."
      >
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Streaming fidelity
        </div>
        <div className="mt-3">
          <QualityList options={STREAM_QUALITIES} value={streamQ} onChange={setStreamQ} />
        </div>
        <div className="mt-8 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Offline mixtape downloads
        </div>
        <div className="mt-3">
          <QualityList options={DOWNLOAD_QUALITIES} value={downloadQ} onChange={setDownloadQ} />
        </div>
      </Section>

      <Section icon={Wifi} title="Data Saver">
        <Row
          title="Download over Wi-Fi only"
          description="Pause downloads when you're on cellular data."
        >
          <Toggle checked={wifiOnly} onChange={setWifiOnly} />
        </Row>
        <Row
          title="Normalize volume level"
          description="Set the same volume level for all mixtape tracks."
        >
          <Toggle checked={normalize} onChange={setNormalize} />
        </Row>
      </Section>

      <Section icon={Music2} title="Playback Deck">
        <Row
          title="Autoplay similar songs"
          description="When your queue ends, keep the record spinning."
        >
          <Toggle checked={autoplay} onChange={setAutoplay} />
        </Row>
        <Row
          title="Crossfade tracks"
          description="Smoothly blend the end of one record into the next."
        >
          <Toggle checked={crossfade} onChange={setCrossfade} />
        </Row>
      </Section>

      <Section icon={Bell} title="Notifications">
        <Row
          title="New releases & updates"
          description="Get notified when artists you follow drop new logs."
        >
          <Toggle checked={notifications} onChange={setNotifications} />
        </Row>
      </Section>

      <Section icon={Lock} title="Privacy Mode">
        <Row title="Private session" description="Hide your active music log from friends.">
          <Toggle checked={privateSession} onChange={setPrivateSession} />
        </Row>
      </Section>

      <Section icon={Download} title="Storage Drawer">
        <Row
          title="Cache size"
          description={`Currently using ${cacheMB} MB on your device for offline mixtape files.`}
        >
          <button
            onClick={clearCache}
            className="rounded-full border border-border/80 bg-card px-4 py-1.5 text-xs font-semibold text-foreground/80 hover:border-foreground/80 hover:bg-surface shadow-sm transition-all active:scale-95"
          >
            Clear cache logs
          </button>
        </Row>
      </Section>
    </div>
  );
}
