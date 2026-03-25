import { useState } from "react";
import { Play, Monitor, Film, Smartphone, ExternalLink, Phone, Globe, Shield, Clock, Leaf } from "lucide-react";

const CDN = "https://d2xsxph8kpxj0f.cloudfront.net/310519663159292899/kHAXDDN9mqMmBLtorFtFyT";

const videos = [
  {
    id: "v1",
    title: "Motion Design Tech",
    subtitle: "Site web & LinkedIn",
    description:
      "Style cybersécurité sombre avec animations dynamiques. Idéale pour votre site intemporelle.eu et les emails de prospection B2B.",
    duration: "38 sec",
    format: "16:9 Paysage",
    icon: Monitor,
    color: "#00d4ff",
    badge: "Recommandée",
    badgeColor: "#00d4ff",
    src: `${CDN}/v1_motion_design_FINAL_a55fdca8.mp4`,
    thumbnail: `${CDN}/ref_main_tech_054c3a6b.png`,
    usages: ["Site web", "LinkedIn", "Email de relance"],
  },
  {
    id: "v2",
    title: "Cinématique Réaliste",
    subtitle: "Rendez-vous terrain",
    description:
      "Plans d'un studio de piercing professionnel avec tablette en situation réelle. Parfaite pour les démonstrations en face à face.",
    duration: "22 sec",
    format: "16:9 Paysage",
    icon: Film,
    color: "#ff3d8b",
    badge: "Terrain",
    badgeColor: "#ff3d8b",
    src: `${CDN}/v2_cinematique_FINAL_68742900.mp4`,
    thumbnail: `${CDN}/ref_studio_tablet_2f3f1a1f.png`,
    usages: ["Visite client", "Salon professionnel", "Tablette en RDV"],
  },
  {
    id: "v3",
    title: "Reel Vertical 60s",
    subtitle: "Instagram & TikTok",
    description:
      "Format vertical 9:16 ultra-dynamique pour les réseaux sociaux. Rythme rapide, messages percutants, musique énergique.",
    duration: "8 sec",
    format: "9:16 Portrait",
    icon: Smartphone,
    color: "#a855f7",
    badge: "Réseaux sociaux",
    badgeColor: "#a855f7",
    src: `${CDN}/v3_reel_FINAL_fee962a3.mp4`,
    thumbnail: `${CDN}/ref_reel_main_99337f87.png`,
    usages: ["Instagram Reels", "TikTok", "WhatsApp"],
  },
];

const stats = [
  { icon: Clock, label: "10 min économisées", sublabel: "par client", color: "#00d4ff" },
  { icon: Leaf, label: "Zéro papier", sublabel: "zéro encre", color: "#22c55e" },
  { icon: Shield, label: "100% RGPD", sublabel: "conforme", color: "#ff3d8b" },
];

export default function VideosDemoPage() {
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const [playing, setPlaying] = useState<string | null>(null);

  const handlePlay = (id: string) => {
    setActiveVideo(id);
    setPlaying(id);
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "linear-gradient(135deg, #0a0f1e 0%, #0d1529 50%, #0a0f1e 100%)" }}
    >
      {/* Hero */}
      <div className="relative overflow-hidden pt-12 pb-8 px-6">
        {/* Background glow effects */}
        <div
          className="absolute top-0 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #00d4ff, transparent)" }}
        />
        <div
          className="absolute top-0 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
          style={{ background: "radial-gradient(circle, #ff3d8b, transparent)" }}
        />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-6 border" style={{ borderColor: "rgba(0,212,255,0.3)", background: "rgba(0,212,255,0.08)" }}>
            <Play size={14} style={{ color: "#00d4ff" }} />
            <span className="text-xs font-semibold tracking-widest uppercase" style={{ color: "#00d4ff" }}>
              Vidéos de démonstration
            </span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Studio Manager
            <span style={{ color: "#00d4ff" }}> en action</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-8" style={{ color: "rgba(255,255,255,0.6)" }}>
            3 versions adaptées à chaque canal de vente — du site web aux réseaux sociaux, en passant par les rendez-vous terrain.
          </p>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-6 mb-2">
            {stats.map((s) => (
              <div key={s.label} className="flex items-center gap-3 px-5 py-3 rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
                <s.icon size={20} style={{ color: s.color }} />
                <div className="text-left">
                  <div className="text-sm font-bold text-white">{s.label}</div>
                  <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{s.sublabel}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {videos.map((video) => {
            const Icon = video.icon;
            const isActive = activeVideo === video.id;
            const isPlaying = playing === video.id;

            return (
              <div
                key={video.id}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${isActive ? video.color + "60" : "rgba(255,255,255,0.08)"}`,
                  boxShadow: isActive ? `0 0 30px ${video.color}20` : "none",
                  transition: "all 0.3s ease",
                }}
              >
                {/* Video Player */}
                <div className="relative" style={{ aspectRatio: video.id === "v3" ? "9/16" : "16/9", maxHeight: video.id === "v3" ? "420px" : "auto" }}>
                  {isPlaying ? (
                    <video
                      src={video.src}
                      autoPlay
                      controls
                      className="w-full h-full object-cover"
                      style={{ background: "#000" }}
                      onEnded={() => setPlaying(null)}
                    />
                  ) : (
                    <>
                      <img
                        src={video.thumbnail}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        style={{ filter: "brightness(0.7)" }}
                      />
                      {/* Play overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <button
                          onClick={() => handlePlay(video.id)}
                          className="flex items-center justify-center w-16 h-16 rounded-full transition-transform hover:scale-110 active:scale-95"
                          style={{
                            background: `linear-gradient(135deg, ${video.color}, ${video.color}99)`,
                            boxShadow: `0 0 30px ${video.color}80`,
                          }}
                        >
                          <Play size={24} className="text-white ml-1" />
                        </button>
                      </div>
                      {/* Badge */}
                      <div
                        className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold"
                        style={{ background: video.badgeColor + "22", color: video.badgeColor, border: `1px solid ${video.badgeColor}44` }}
                      >
                        {video.badge}
                      </div>
                      {/* Duration */}
                      <div
                        className="absolute bottom-3 right-3 px-2 py-1 rounded text-xs font-mono"
                        style={{ background: "rgba(0,0,0,0.7)", color: "rgba(255,255,255,0.8)" }}
                      >
                        {video.duration}
                      </div>
                    </>
                  )}
                </div>

                {/* Card Content */}
                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: video.color + "18", border: `1px solid ${video.color}33` }}
                    >
                      <Icon size={18} style={{ color: video.color }} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-base leading-tight">{video.title}</h3>
                      <p className="text-xs" style={{ color: video.color }}>{video.subtitle}</p>
                    </div>
                  </div>

                  <p className="text-sm mb-4 leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
                    {video.description}
                  </p>

                  {/* Format info */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                      {video.format}
                    </span>
                    <span className="text-xs px-2 py-1 rounded" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.5)" }}>
                      {video.duration}
                    </span>
                  </div>

                  {/* Usage tags */}
                  <div className="flex flex-wrap gap-2 mt-auto">
                    {video.usages.map((u) => (
                      <span
                        key={u}
                        className="text-xs px-2 py-1 rounded-full"
                        style={{ background: video.color + "12", color: video.color, border: `1px solid ${video.color}25` }}
                      >
                        {u}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ROI Banner */}
        <div
          className="mt-10 rounded-2xl p-8 relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, rgba(0,212,255,0.08) 0%, rgba(255,61,139,0.08) 100%)",
            border: "1px solid rgba(0,212,255,0.2)",
          }}
        >
          <div
            className="absolute inset-0 opacity-5 pointer-events-none"
            style={{ backgroundImage: "radial-gradient(circle at 20% 50%, #00d4ff, transparent 60%), radial-gradient(circle at 80% 50%, #ff3d8b, transparent 60%)" }}
          />
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 className="text-2xl font-black text-white mb-2">
                Prêt à vendre Studio Manager ?
              </h2>
              <p style={{ color: "rgba(255,255,255,0.6)" }} className="text-sm max-w-xl">
                Utilisez ces vidéos dans vos emails de prospection, sur votre site web et lors de vos rendez-vous terrain. Chaque vidéo est optimisée pour son canal de diffusion.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <a
                href="tel:0617074169"
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #00d4ff, #0099bb)", color: "#0a0f1e" }}
              >
                <Phone size={16} />
                06.17.07.41.69
              </a>
              <a
                href="https://app.intemporelle.eu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90"
                style={{ background: "rgba(255,255,255,0.08)", color: "white", border: "1px solid rgba(255,255,255,0.15)" }}
              >
                <Globe size={16} />
                app.intemporelle.eu
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* Price highlight */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: "950 € TTC", sub: "Tablette Android incluse", color: "#00d4ff" },
            { label: "1 100 € TTC", sub: "Tablette iPad incluse", color: "#ff3d8b" },
            { label: "690 € TTC", sub: "Logiciel seul (tablette existante)", color: "#a855f7" },
          ].map((p) => (
            <div
              key={p.label}
              className="rounded-xl p-5 text-center"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${p.color}30` }}
            >
              <div className="text-2xl font-black mb-1" style={{ color: p.color }}>{p.label}</div>
              <div className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{p.sub}</div>
            </div>
          ))}
        </div>

        {/* Footer note */}
        <p className="text-center text-xs mt-8" style={{ color: "rgba(255,255,255,0.3)" }}>
          Studio Manager by Intemporelle — Licence perpétuelle sans abonnement — Données hébergées en Europe 🇪🇺 — Conformité RGPD incluse
        </p>
      </div>
    </div>
  );
}
