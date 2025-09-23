import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative">
      <div className="hex-zoomed" aria-hidden />

      {/* Header */}
      <header className="header-dark">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-5 py-4">
          {/* LOGO → lucai.bio */}
          <a
            href="https://lucai.bio/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3"
            aria-label="Ir a lucai.bio"
          >
            <Image
              src="/brand/logo.png"
              alt="LUCAI"
              width={140}
              height={32}
              className="brand-logo"
              priority
            />
          </a>

          <nav className="flex items-center gap-6">
            {/* LUCAI (link externo) */}
            <a
              href="https://lucai.bio/"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link"
            >
              LUCAI
            </a>

            {/* Contact (mailto) */}
            <a href="mailto:mateo@lucai.bio" className="nav-link">
              Contact
            </a>

            {/* AI Chat → /chat con estilo outline */}
            <Link href="/chat" className="btn-outline inline-flex items-center gap-2 h-10 px-4 rounded-md">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                   stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                   aria-hidden="true">
                <path d="M12 8v4l3 3"/>
                <rect x="3" y="3" width="18" height="14" rx="3"/>
                <path d="M7 21h10M9 17v4M15 17v4"/>
              </svg>
              <span>AI Chat</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-5 pt-20 pb-16 lg:pt-28 lg:pb-24">
        <div className="hero-grid">
          <div className="space-y-6">
            <h1 className="hero-title">Unlocking biology’s true power with AI</h1>
            <p className="hero-sub">
              We build data & AI workflows for biotech teams: from NGS pipelines
              and ML models to production-grade analytics.
            </p>

            <div className="flex items-center gap-3 flex-wrap">
              {/* CTA outline igual a Enter/Send */}
              <Link href="/chat" className="btn-outline h-11 px-5 rounded-md flex items-center">
                Open AI Chat
              </Link>
            </div>

            <div className="flex items-center gap-4 pt-4 text-[13px] text-[color:var(--lu-subtle)]">
              <span className="badge-dot">Bioinformatics</span>
              <span className="badge-dot">LLMs</span>
              <span className="badge-dot">Pipelines</span>
            </div>
          </div>

          <div className="relative">
            <Image
              src="/brand/pelota-luca.png"
              alt=""
              width={820}
              height={820}
              className="w-full h-auto brand-sphere-large select-none pointer-events-none"
              priority
            />
          </div>
        </div>
      </section>

      {/* Secciones mínimas pedidas */}
      <section id="about" className="section-soft">
        <h2 className="section-title">LUCAI</h2>
        <p className="section-p">We partner with labs & startups to ship real value—fast.</p>
      </section>

      <section id="contact" className="section-soft">
        <h2 className="section-title">Contact</h2>
        <p className="section-p">
          <a href="mailto:mateo@lucai.bio" className="nav-link">mateo@lucai.bio</a>
        </p>
      </section>
    </main>
  );
}
