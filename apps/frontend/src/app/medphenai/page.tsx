"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type TabId = "overview" | "integrantes";

type Symptom = {
  id: string;
  label: string;
  codigo?: string;
};

type Member = {
  id: string;
  nombre: string;
  historiaClinica: string;
  sintomas: Symptom[];
  diagnostico: string;
};

const tabs: Array<{ id: TabId; label: string }> = [
  { id: "overview", label: "Resumen" },
  { id: "integrantes", label: "Integrantes" },
];

const quickLinks = [{ label: "Nuevo Diagnóstico +", href: "/medphenai/nuevo" }];

const createSymptomId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sym-${Math.random().toString(16).slice(2)}-${Date.now()}`;
};

const baseSymptoms: Record<string, Symptom[]> = {
  marcelo: [
    { id: "sym-mar-1", label: "Dolor torácico leve", codigo: "HP:0001681" },
    { id: "sym-mar-2", label: "Cansancio", codigo: "HP:0012378" },
    { id: "sym-mar-3", label: "Antecedente familiar", codigo: "HP:0001433" },
  ],
  franco: [
    { id: "sym-fra-1", label: "Molestias hepáticas", codigo: "HP:0001399" },
    { id: "sym-fra-2", label: "Sueño irregular", codigo: "HP:0002360" },
  ],
  mate: [
    { id: "sym-mat-1", label: "Migrañas tensionales", codigo: "HP:0002077" },
    { id: "sym-mat-2", label: "Déficit de concentración", codigo: "HP:0001343" },
  ],
};

const initialSymptomDrafts: Record<string, Symptom[]> = Object.fromEntries(
  Object.entries(baseSymptoms).map(([key, list]) => [key, list.map((symptom) => ({ ...symptom }))])
);

const integrantes: Member[] = [
  {
    id: "marcelo",
    nombre: "Marcelo Martí",
    historiaClinica: "HC_Cardiometabolica_MMarcí.pdf",
    sintomas: baseSymptoms.marcelo,
    diagnostico:
      "Probable síndrome metabólico en observación. Recomendar seguimiento quincenal y control glucémico.",
  },
  {
    id: "franco",
    nombre: "Franco Brunello",
    historiaClinica: "HC_Hepatica_FBrunello.pdf",
    sintomas: baseSymptoms.franco,
    diagnostico:
      "Indicadores iniciales de esteatosis hepática. Sugerido plan de nutrición ampliado + perfil lipidémico.",
  },
  {
    id: "mate",
    nombre: "Mate Alvarez",
    historiaClinica: "HC_Neuro_MAlvarez.pdf",
    sintomas: baseSymptoms.mate,
    diagnostico:
      "Compatibilidad con migraña con aura. Revisar historial farmacológico y ajustar plan preventivo mensual.",
  },
];

export default function MedPhenAIPage() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [selectedMember, setSelectedMember] = useState<Member>(integrantes[0]);
  const [symptomDrafts, setSymptomDrafts] = useState<Record<string, Symptom[]>>(initialSymptomDrafts);
  const [newSymptom, setNewSymptom] = useState<Record<string, { label: string; code: string }>>(() =>
    Object.fromEntries(
      Object.keys(initialSymptomDrafts).map((key) => [
        key,
        { label: "", code: "" },
      ])
    )
  );
  const router = useRouter();

  const activeMember = useMemo(() => {
    if (activeTab !== "integrantes") return null;
    return {
      ...selectedMember,
      sintomas: symptomDrafts[selectedMember.id] ?? [],
    };
  }, [activeTab, selectedMember, symptomDrafts]);

  const handleSelectMember = (member: Member) => {
    setSelectedMember(member);
  };

  const handleDraftChange = (memberId: string, field: "label" | "code", value: string) => {
    setNewSymptom((prev) => ({
      ...prev,
      [memberId]: {
        ...prev[memberId],
        [field]: value,
      },
    }));
  };

  const handleAddSymptom = (memberId: string) => {
    const draft = newSymptom[memberId];
    if (!draft?.label.trim() || !draft.code.trim()) return;

    setSymptomDrafts((prev) => {
      const nextList = [...(prev[memberId] ?? [])];
      nextList.push({
        id: createSymptomId(),
        label: draft.label.trim(),
        codigo: draft.code.trim().toUpperCase(),
      });
      return { ...prev, [memberId]: nextList };
    });

    setNewSymptom((prev) => ({
      ...prev,
      [memberId]: { label: "", code: "" },
    }));
  };

  const handleRemoveSymptom = (memberId: string, symptomId: string) => {
    setSymptomDrafts((prev) => ({
      ...prev,
      [memberId]: (prev[memberId] ?? []).filter((symptom) => symptom.id !== symptomId),
    }));
  };

  const jumpToSymptomStep = () => {
    if (!activeMember) {
      router.push("/medphenai/nuevo");
      return;
    }

    if (typeof window !== "undefined") {
      const payload = {
        nombre: activeMember.nombre,
        sintomas: (symptomDrafts[activeMember.id] ?? []).map((symptom) => ({
          description: symptom.label,
          code: symptom.codigo ?? "",
        })),
      };
      window.sessionStorage.setItem("medphenai:newDiagDraft", JSON.stringify(payload));
    }

    router.push("/medphenai/nuevo?step=3");
  };

  return (
    <main className="page-root relative">
      <div className="hex-zoomed" aria-hidden />

      <header className="header-dark">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-5 py-4">
          <Link href="/home" className="flex items-center gap-3" aria-label="Regresar al home de LUCAI">
            <Image src="/brand/logo.png" alt="LUCAI" width={140} height={32} className="brand-logo" priority />
          </Link>

          <nav className="flex items-center gap-5">
            <Link href="/home" className="nav-link">
              Home
            </Link>
            <Link href="/chat" className="btn-outline inline-flex items-center gap-2 h-10 px-4 rounded-md">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 8v4l3 3" />
                <rect x="3" y="3" width="18" height="14" rx="3" />
                <path d="M7 21h10M9 17v4M15 17v4" />
              </svg>
              <span>AI Chat</span>
            </Link>
          </nav>
        </div>
      </header>

      <div className="content-wrap">
        <section className="mx-auto max-w-7xl w-full px-5 pt-16 pb-24 flex-1">
          <div className="rounded-[32px] border border-[var(--lu-border)] bg-[color-mix(in_oklab,var(--lu-bg)_82%,#161616)] px-6 py-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)]">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-6 border-b border-[var(--lu-border)]">
              <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[var(--lu-subtle)]">
                <span className="inline-flex h-2 w-2 rounded-full bg-[var(--lu-accent)]" aria-hidden />
                MedPhenAI Suite
              </span>
            </div>

            <div className="flex flex-wrap gap-3 border-b border-[var(--lu-border)] pb-5 pt-6">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={[
                      "relative rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-150",
                      isActive
                        ? "bg-[var(--lu-surface)] text-white shadow-[0_10px_40px_rgba(255,105,0,0.18)] border border-[color-mix(in_oklab,var(--lu-accent)_65%,#8c3d00)]"
                        : "text-[var(--lu-subtle)] border border-transparent hover:border-[var(--lu-border)] hover:text-[var(--lu-text)]",
                    ].join(" ")}
                  >
                    {tab.label}
                    {isActive && (
                      <span
                        className="absolute -bottom-[13px] left-1/2 h-[3px] w-12 -translate-x-1/2 rounded-full bg-[var(--lu-accent)]"
                        aria-hidden
                      />
                    )}
                  </button>
                );
              })}

              {quickLinks.map((quick) => (
                <button
                  key={quick.href}
                  type="button"
                  onClick={() => router.push(quick.href)}
                  className="relative rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-150 text-[var(--lu-accent)] border border-[color-mix(in_oklab,var(--lu-accent)_55%,#8c3d00)] bg-[rgba(31,20,10,0.65)] hover:bg-[rgba(31,20,10,0.9)]"
                >
                  {quick.label}
                </button>
              ))}
            </div>

            <div className="pt-8">
              {activeTab === "overview" && (
                <div className="grid gap-6 lg:grid-cols-[0.55fr_0.45fr]">
                  <div className="rounded-3xl border border-[var(--lu-border)] bg-[rgba(19,19,19,0.9)] p-7 backdrop-blur">
                    <div className="space-y-4">
                      <h2 className="text-3xl font-semibold text-white leading-tight">
                        Phenotyping inteligente para tus equipos clínicos
                      </h2>
                      <p className="text-[var(--lu-subtle)] text-sm leading-relaxed">
                        MedPhenAI se potencia con{" "}
                        <a
                          href="https://genphenai.pages.dev/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline decoration-[color:var(--lu-accent)] underline-offset-4 hover:text-[var(--lu-text)] transition-colors"
                        >
                          GenPhenIA
                        </a>{" "}
                        para que cualquier persona pueda autenticarse, subir su historia clínica y responder preguntas de
                        seguimiento hasta obtener una devolución diagnóstica asistida.
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <a
                          href="https://genphenai.pages.dev/"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-outline h-11 px-5 rounded-md flex items-center gap-2"
                        >
                          Abrir GenPhenIA
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 16 16"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M4 12L12 4" />
                            <path d="M6 4h6v6" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-3xl border border-[var(--lu-border)] bg-[rgba(19,19,19,0.88)] p-6 backdrop-blur">
                      <h3 className="text-lg font-semibold mb-2 text-white">Onboarding guiado</h3>
                      <p className="text-[var(--lu-subtle)] text-sm leading-relaxed">
                        Registro y autenticación simple para usuarios no técnicos, con recordatorios de secciones
                        incompletas y carga segura de historias clínicas.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-[var(--lu-border)] bg-[rgba(19,19,19,0.88)] p-6 backdrop-blur">
                      <h3 className="text-lg font-semibold mb-2 text-white">Follow-up inteligente</h3>
                      <p className="text-[var(--lu-subtle)] text-sm leading-relaxed">
                        GenPhenIA guía preguntas de seguimiento para capturar síntomas clave y enriquecer el fenotipado en
                        tiempo real.
                      </p>
                    </div>
                    <div className="rounded-3xl border border-[var(--lu-border)] bg-[rgba(19,19,19,0.88)] p-6 backdrop-blur">
                      <h3 className="text-lg font-semibold mb-2 text-white">Diagnóstico asistido</h3>
                      <p className="text-[var(--lu-subtle)] text-sm leading-relaxed">
                        Entregamos devoluciones accionables: diagnósticos sugeridos, recomendaciones y próximos pasos listos
                        para compartir con clínicos y pacientes.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "integrantes" && activeMember && (
                <div className="grid gap-6 lg:grid-cols-[0.42fr_0.58fr]">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs uppercase tracking-[0.32em] text-[var(--lu-subtle)]">
                        Selecciona un integrante
                      </p>
                      <button
                        type="button"
                        className="flex items-center gap-2 rounded-full border border-[color-mix(in_oklab,var(--lu-accent)_55%,#8c3d00)] px-3 py-1.5 text-xs font-semibold text-[var(--lu-accent)] hover:bg-[rgba(31,20,10,0.65)] transition-colors"
                        onClick={() => router.push("/medphenai/nuevo")}
                      >
                        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[var(--lu-accent)] text-[var(--lu-bg)] text-[11px] font-bold">
                          +
                        </span>
                        Nuevo
                      </button>
                    </div>
                    <div className="flex flex-col gap-3">
                      {integrantes.map((member) => {
                        const isSelected = member.id === activeMember.id;
                        return (
                          <button
                            key={member.id}
                            type="button"
                            onClick={() => handleSelectMember(member)}
                            className={[
                              "flex items-center justify-between rounded-3xl border px-4 py-3 text-left transition-all duration-150",
                              isSelected
                                ? "border-[color-mix(in_oklab,var(--lu-accent)_70%,#8c3d00)] bg-[rgba(26,18,12,0.85)] text-white shadow-[0_18px_40px_rgba(255,105,0,0.2)]"
                                : "border-[var(--lu-border)] bg-[rgba(15,15,15,0.75)] text-[var(--lu-subtle)] hover:text-[var(--lu-text)] hover:border-[color-mix(in_oklab,var(--lu-border)_80%,#474747)]",
                            ].join(" ")}
                          >
                            <div>
                              <p className="text-base font-semibold">{member.nombre}</p>
                              <p className="text-xs text-[var(--lu-subtle)]">Último update · 48h</p>
                            </div>
                            <span
                              className={[
                                "inline-flex h-2.5 w-2.5 rounded-full",
                                isSelected ? "bg-[var(--lu-accent)]" : "bg-[var(--lu-border)]",
                              ].join(" ")}
                              aria-hidden
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="rounded-[28px] border border-[var(--lu-border)] bg-[rgba(16,16,16,0.92)] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.34em] text-[var(--lu-subtle)]">Integrante</p>
                        <h2 className="mt-2 text-2xl font-semibold text-white">{activeMember.nombre}</h2>
                      </div>
                      <div className="rounded-full border border-[var(--lu-border)] px-4 py-2 text-xs text-[var(--lu-subtle)]">
                        Diagnóstico automático
                      </div>
                    </div>

                    <div className="mt-6 space-y-6 text-sm text-[var(--lu-subtle)]">
                      <div>
                        <p className="mb-1 text-xs uppercase tracking-[0.28em] text-[var(--lu-subtle)]">Historia clínica</p>
                        <div className="flex items-center gap-2 rounded-2xl border border-[var(--lu-border)] bg-[rgba(21,21,21,0.9)] px-4 py-3">
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            aria-hidden="true"
                          >
                            <path d="M14 2H6a2 2 0 0 0-2 2v16l4-2 4 2 4-2 4 2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                          <span className="truncate">{activeMember.historiaClinica}</span>
                          <button
                            type="button"
                            className="ml-auto inline-flex items-center rounded-full border border-[var(--lu-border)] px-3 py-1 text-xs text-[var(--lu-subtle)] hover:text-white"
                          >
                            Ver
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs uppercase tracking-[0.28em] text-[var(--lu-subtle)]">Síntomas reportados</p>
                        <div className="space-y-3">
                          <ul className="flex flex-wrap gap-2">
                            {activeMember.sintomas.map((symptom) => (
                              <li
                                key={symptom.id}
                                className="flex items-center gap-2 rounded-full border border-[var(--lu-border)] bg-[rgba(21,21,21,0.9)] px-3 py-1 text-xs text-[var(--lu-text)]"
                              >
                                <span className="font-semibold text-white">{symptom.label}</span>
                                {symptom.codigo && (
                                  <span className="text-[10px] text-[var(--lu-subtle)]">{symptom.codigo}</span>
                                )}
                                <button
                                  type="button"
                                  className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-[var(--lu-border)] text-[10px] text-[var(--lu-subtle)] hover:text-white"
                                  onClick={() => handleRemoveSymptom(activeMember.id, symptom.id)}
                                  aria-label={`Eliminar ${symptom.label}`}
                                >
                                  ×
                                </button>
                              </li>
                            ))}
                          </ul>

                          <div className="grid gap-3 md:grid-cols-[2fr_1fr_auto]">
                            <input
                              type="text"
                              placeholder="Descripción"
                              value={newSymptom[activeMember.id]?.label ?? ""}
                              onChange={(event) => handleDraftChange(activeMember.id, "label", event.target.value)}
                              className="rounded-xl border border-[var(--lu-border)] bg-[rgba(24,24,24,0.9)] px-4 py-2 text-[var(--lu-text)] focus:border-[var(--lu-accent)] focus:outline-none"
                            />
                            <input
                              type="text"
                              placeholder="Código HPO"
                              value={newSymptom[activeMember.id]?.code ?? ""}
                              onChange={(event) => handleDraftChange(activeMember.id, "code", event.target.value)}
                              className="rounded-xl border border-[var(--lu-border)] bg-[rgba(24,24,24,0.9)] px-4 py-2 text-[var(--lu-text)] focus:border-[var(--lu-accent)] focus:outline-none"
                            />
                            <button
                              type="button"
                              className="btn-outline h-10 px-4 rounded-md disabled:opacity-50"
                              onClick={() => handleAddSymptom(activeMember.id)}
                              disabled={
                                !newSymptom[activeMember.id]?.label.trim() ||
                                !newSymptom[activeMember.id]?.code.trim()
                              }
                            >
                              Agregar síntoma
                            </button>
                          </div>
                        </div>
                      </div>

                      <div>
                        <p className="mb-2 text-xs uppercase tracking-[0.28em] text-[var(--lu-subtle)]">Diagnóstico MedPhenAI</p>
                        <p className="rounded-2xl border border-[color-mix(in_oklab,var(--lu-border)_90%,#2b2b2b)] bg-[rgba(21,21,21,0.92)] p-4 text-sm leading-relaxed text-[var(--lu-text)]">
                          {activeMember.diagnostico}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-3">
                          <button type="button" className="btn-outline h-10 px-4 rounded-md" onClick={jumpToSymptomStep}>
                            Regenerar diagnóstico
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        <div className="grow" />
      </div>

      <footer className="footer-soft">
        <div className="px-5 flex flex-col gap-10 items-start">
          <div>
            <h2 className="section-title">MedPhenAI</h2>
            <p className="section-p">
              Potenciamos tu práctica clínica y pipelines de fenotipado con el lenguaje y diseño de LUCAI.
            </p>
          </div>
          <div>
            <h2 className="section-title">Contactanos</h2>
            <p className="section-p">
              <a href="mailto:mateo@lucai.bio" className="nav-link">
                mateo@lucai.bio
              </a>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
