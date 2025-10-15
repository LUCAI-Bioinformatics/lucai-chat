"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type Step = 1 | 2 | 3 | 4;

type Symptom = {
  description: string;
  code: string;
};

const stepsMeta: Array<{ id: Step; title: string }> = [
  { id: 1, title: "Datos básicos" },
  { id: 2, title: "Historia clínica" },
  { id: 3, title: "Síntomas" },
  { id: 4, title: "Diagnóstico Final" },
];

const defaultSymptoms: Symptom[] = [
  { description: "Fatiga persistente", code: "HP:0012378" },
  { description: "Dolor abdominal", code: "HP:0002027" },
  { description: "Cambios en peso", code: "HP:0004324" },
];

const countries = [
  "Afganistán",
  "Albania",
  "Alemania",
  "Andorra",
  "Angola",
  "Antigua y Barbuda",
  "Arabia Saudita",
  "Argelia",
  "Argentina",
  "Armenia",
  "Australia",
  "Austria",
  "Azerbaiyán",
  "Bahamas",
  "Bangladés",
  "Barbados",
  "Baréin",
  "Bélgica",
  "Belice",
  "Benín",
  "Bielorrusia",
  "Birmania",
  "Bolivia",
  "Bosnia y Herzegovina",
  "Botsuana",
  "Brasil",
  "Brunéi",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Bután",
  "Cabo Verde",
  "Camboya",
  "Camerún",
  "Canadá",
  "Catar",
  "Chad",
  "Chile",
  "China",
  "Chipre",
  "Colombia",
  "Comoras",
  "Corea del Norte",
  "Corea del Sur",
  "Costa de Marfil",
  "Costa Rica",
  "Croacia",
  "Cuba",
  "Dinamarca",
  "Dominica",
  "Ecuador",
  "Egipto",
  "El Salvador",
  "Emiratos Árabes Unidos",
  "Eritrea",
  "Eslovaquia",
  "Eslovenia",
  "España",
  "Estados Unidos",
  "Estonia",
  "Etiopía",
  "Filipinas",
  "Finlandia",
  "Fiyi",
  "Francia",
  "Gabón",
  "Gambia",
  "Georgia",
  "Ghana",
  "Granada",
  "Grecia",
  "Guatemala",
  "Guinea",
  "Guinea-Bisáu",
  "Guinea Ecuatorial",
  "Guyana",
  "Haití",
  "Honduras",
  "Hungría",
  "India",
  "Indonesia",
  "Irak",
  "Irán",
  "Irlanda",
  "Islandia",
  "Islas Marshall",
  "Islas Salomón",
  "Israel",
  "Italia",
  "Jamaica",
  "Japón",
  "Jordania",
  "Kazajistán",
  "Kenia",
  "Kirguistán",
  "Kiribati",
  "Kuwait",
  "Laos",
  "Lesoto",
  "Letonia",
  "Líbano",
  "Liberia",
  "Libia",
  "Liechtenstein",
  "Lituania",
  "Luxemburgo",
  "Macedonia del Norte",
  "Madagascar",
  "Malasia",
  "Malaui",
  "Maldivas",
  "Malí",
  "Malta",
  "Marruecos",
  "Mauricio",
  "Mauritania",
  "México",
  "Micronesia",
  "Moldavia",
  "Mónaco",
  "Mongolia",
  "Montenegro",
  "Mozambique",
  "Namibia",
  "Nauru",
  "Nepal",
  "Nicaragua",
  "Níger",
  "Nigeria",
  "Noruega",
  "Nueva Zelanda",
  "Omán",
  "Países Bajos",
  "Pakistán",
  "Palaos",
  "Panamá",
  "Papúa Nueva Guinea",
  "Paraguay",
  "Perú",
  "Polonia",
  "Portugal",
  "Reino Unido",
  "República Centroafricana",
  "República Checa",
  "República del Congo",
  "República Democrática del Congo",
  "República Dominicana",
  "Ruanda",
  "Rumania",
  "Rusia",
  "Samoa",
  "San Cristóbal y Nieves",
  "San Marino",
  "San Vicente y las Granadinas",
  "Santa Lucía",
  "Santo Tomé y Príncipe",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leona",
  "Singapur",
  "Siria",
  "Somalia",
  "Sri Lanka",
  "Suazilandia",
  "Sudáfrica",
  "Sudán",
  "Sudán del Sur",
  "Suecia",
  "Suiza",
  "Surinam",
  "Tailandia",
  "Tanzania",
  "Tayikistán",
  "Timor Oriental",
  "Togo",
  "Tonga",
  "Trinidad y Tobago",
  "Túnez",
  "Turkmenistán",
  "Turquía",
  "Tuvalu",
  "Ucrania",
  "Uganda",
  "Uruguay",
  "Uzbekistán",
  "Vanuatu",
  "Vaticano",
  "Venezuela",
  "Vietnam",
  "Yemen",
  "Yibuti",
  "Zambia",
  "Zimbabue",
];

export default function NuevoDiagnosticoPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [datosBasicos, setDatosBasicos] = useState({
    edad: "",
    sexo: "",
    localidad: "",
    pais: "",
    datosRelevantes: "",
  });

  const [historiaClinica, setHistoriaClinica] = useState("");
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [newSymptom, setNewSymptom] = useState({ description: "", code: "" });

  const canGoStep1 = useMemo(() => {
    return (
      datosBasicos.edad.trim() !== "" &&
      datosBasicos.sexo.trim() !== "" &&
      datosBasicos.localidad.trim() !== "" &&
      datosBasicos.pais.trim() !== ""
    );
  }, [datosBasicos]);

  const canGoStep2 = historiaClinica.trim().length > 12;
  const canGoStep3 = symptoms.length > 0;

  useEffect(() => {
    const targetStep = searchParams.get("step");
    if (targetStep === "3") {
      setStep(3);
      if (typeof window !== "undefined") {
        const stored = window.sessionStorage.getItem("medphenai:newDiagDraft");
        if (stored) {
          try {
            const parsed = JSON.parse(stored) as { sintomas?: Array<{ description: string; code?: string }> };
            if (parsed?.sintomas?.length) {
              setSymptoms(parsed.sintomas.map((item) => ({ description: item.description, code: item.code ?? "" })));
            } else {
              setSymptoms(defaultSymptoms.map((symptom) => ({ ...symptom })));
            }
          } catch {
            setSymptoms(defaultSymptoms.map((symptom) => ({ ...symptom })));
          }
          window.sessionStorage.removeItem("medphenai:newDiagDraft");
        } else {
          setSymptoms(defaultSymptoms.map((symptom) => ({ ...symptom })));
        }
      }
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleContinue = () => {
    if (step === 1) {
      setStep(2);
      return;
    }

    if (step === 2) {
      setIsLoading(true);
      setLoadingMessage("Realizando lectura MedPhenAI...");
      timeoutRef.current = setTimeout(() => {
        setSymptoms(defaultSymptoms);
        setIsLoading(false);
        setLoadingMessage("");
        setStep(3);
      }, 3000);
      return;
    }

    if (step === 3) {
      setIsLoading(true);
      setLoadingMessage("Consultando a GenPhenAI...");
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false);
        setLoadingMessage("");
        setStep(4);
      }, 2000);
      return;
    }
  };

  const handleCancelFlow = () => {
    setShowCancelModal(false);
    router.push("/medphenai");
  };

  const handleAddSymptom = () => {
    if (!newSymptom.description.trim() || !newSymptom.code.trim()) return;
    setSymptoms((prev) => [
      ...prev,
      {
        description: newSymptom.description.trim(),
        code: newSymptom.code.trim().toUpperCase(),
      },
    ]);
    setNewSymptom({ description: "", code: "" });
  };

  const handleRemoveSymptom = (code: string) => {
    setSymptoms((prev) => prev.filter((symptom) => symptom.code !== code));
  };

  const stepTitle = stepsMeta.find((meta) => meta.id === step)?.title ?? "";

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
            <button
              type="button"
              className="btn-danger-outline inline-flex items-center gap-2 px-5"
              onClick={() => setShowCancelModal(true)}
            >
              Cancelar
            </button>
          </nav>
        </div>
      </header>

      <div className="content-wrap">
        <section className="mx-auto max-w-5xl w-full px-5 pt-16 pb-24 flex-1">
          <div className="rounded-[32px] border border-[var(--lu-border)] bg-[color-mix(in_oklab,var(--lu-bg)_84%,#161616)] px-6 py-8 shadow-[0_40px_120px_rgba(0,0,0,0.35)] relative overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--lu-border)] pb-6">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-[var(--lu-subtle)]">
                  <span className="inline-flex h-2 w-2 rounded-full bg-[var(--lu-accent)]" aria-hidden />
                  Nuevo diagnóstico
                </span>
                <h1 className="text-3xl font-semibold text-white leading-tight">{stepTitle}</h1>
              </div>

              <div className="flex items-center gap-2">
                {stepsMeta.map((meta) => {
                  const isActive = step === meta.id;
                  const isCompleted = step > meta.id;
                  return (
                    <span
                      key={meta.id}
                      className={[
                        "flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-150",
                        isActive
                          ? "border-[color-mix(in_oklab,var(--lu-accent)_60%,#8c3d00)] bg-[rgba(31,20,10,0.88)] text-[var(--lu-accent)]"
                          : isCompleted
                            ? "border-[var(--lu-border)] bg-[rgba(24,24,24,0.9)] text-[var(--lu-text)]"
                            : "border-[var(--lu-border)] text-[var(--lu-subtle)]",
                      ].join(" ")}
                    >
                      {meta.id}
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="relative pt-8">
              {isLoading && (
                <div className="absolute inset-0 z-10 grid place-items-center rounded-[24px] bg-[rgba(11,11,11,0.85)] backdrop-blur">
                  <div className="flex flex-col items-center gap-4 text-center">
                    <div className="h-12 w-12 animate-spin rounded-full border-2 border-[var(--lu-accent)] border-t-transparent" aria-hidden />
                    <p className="text-sm font-semibold text-[var(--lu-subtle)]">{loadingMessage}</p>
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-5">
                    <label className="block text-sm font-semibold text-white">
                      Edad
                      <input
                        type="number"
                        min={0}
                        value={datosBasicos.edad}
                        onChange={(event) => setDatosBasicos((prev) => ({ ...prev, edad: event.target.value }))}
                        className="mt-2 w-full rounded-xl border border-[var(--lu-border)] bg-[rgba(18,18,18,0.9)] px-4 py-3 text-[var(--lu-text)] focus:border-[var(--lu-accent)] focus:outline-none"
                      />
                    </label>
                    <label className="block text-sm font-semibold text-white">
                      País
                      <select
                        value={datosBasicos.pais}
                        onChange={(event) => setDatosBasicos((prev) => ({ ...prev, pais: event.target.value }))}
                        className="mt-2 select-lucai"
                      >
                        <option value="">Seleccioná</option>
                        {countries.map((country) => (
                          <option key={country} value={country}>
                            {country}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="space-y-5">
                    <label className="block text-sm font-semibold text-white">
                      Sexo
                      <select
                        value={datosBasicos.sexo}
                        onChange={(event) => setDatosBasicos((prev) => ({ ...prev, sexo: event.target.value }))}
                        className="mt-2 select-lucai"
                      >
                        <option value="">Seleccioná</option>
                        <option value="femenino">Femenino</option>
                        <option value="masculino">Masculino</option>
                        <option value="no_binario">No binario</option>
                        <option value="prefiero_no_decir">Prefiero no decirlo</option>
                      </select>
                    </label>
                    <label className="block text-sm font-semibold text-white">
                      Localidad
                      <input
                        type="text"
                        value={datosBasicos.localidad}
                        onChange={(event) =>
                          setDatosBasicos((prev) => ({ ...prev, localidad: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-[var(--lu-border)] bg-[rgba(18,18,18,0.9)] px-4 py-3 text-[var(--lu-text)] focus:border-[var(--lu-accent)] focus:outline-none"
                      />
                    </label>
                  </div>

                  <div className="lg:col-span-2">
                    <label className="block text-sm font-semibold text-white">
                      Datos médicos relevantes (opcional)
                      <textarea
                        value={datosBasicos.datosRelevantes}
                        onChange={(event) =>
                          setDatosBasicos((prev) => ({ ...prev, datosRelevantes: event.target.value }))
                        }
                        rows={4}
                        className="mt-2 w-full rounded-xl border border-[var(--lu-border)] bg-[rgba(18,18,18,0.9)] px-4 py-3 text-[var(--lu-text)] focus:border-[var(--lu-accent)] focus:outline-none resize-none"
                      />
                    </label>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <p className="text-sm text-[var(--lu-subtle)]">
                    Pegá o escribí la historia clínica relevante. MedPhenAI analizará el texto y extraerá los síntomas
                    clave antes de consultar a GenPhenIA.
                  </p>
                  <textarea
                    value={historiaClinica}
                    onChange={(event) => setHistoriaClinica(event.target.value)}
                    rows={12}
                    placeholder="Ej. Paciente con historial de dolor abdominal intermitente..."
                    className="w-full rounded-2xl border border-[var(--lu-border)] bg-[rgba(18,18,18,0.92)] px-4 py-3 text-[var(--lu-text)] focus:border-[var(--lu-accent)] focus:outline-none"
                  />
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <p className="text-sm text-[var(--lu-subtle)]">
                      Editá los síntomas detectados por MedPhenAI antes de enviar la consulta a GenPhenIA.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      {symptoms.map((symptom) => (
                        <span
                          key={symptom.code}
                          className="inline-flex items-center gap-3 rounded-full border border-[var(--lu-border)] bg-[rgba(22,22,22,0.92)] px-4 py-1.5 text-sm text-[var(--lu-text)]"
                        >
                          <span className="font-semibold text-white">{symptom.description}</span>
                          {symptom.code && (
                            <span className="text-xs text-[var(--lu-subtle)]">{symptom.code}</span>
                          )}
                          <button
                            type="button"
                            className="ml-1 inline-flex h-6 w-6 items-center justify-center rounded-full border border-[var(--lu-border)] text-xs text-[var(--lu-subtle)] hover:text-white"
                            onClick={() => handleRemoveSymptom(symptom.code)}
                            aria-label={`Eliminar ${symptom.description}`}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-[var(--lu-border)] bg-[rgba(18,18,18,0.92)] p-5">
                    <h2 className="text-sm font-semibold text-white">Agregar síntoma manualmente</h2>
                    <div className="mt-4 grid gap-4 md:grid-cols-[2fr_1fr_auto]">
                      <input
                        type="text"
                        placeholder="Descripción"
                        value={newSymptom.description}
                        onChange={(event) =>
                          setNewSymptom((prev) => ({ ...prev, description: event.target.value }))
                        }
                        className="rounded-xl border border-[var(--lu-border)] bg-[rgba(24,24,24,0.92)] px-4 py-3 text-[var(--lu-text)] focus:border-[var(--lu-accent)] focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Código HPO (HP:0001027)"
                        value={newSymptom.code}
                        onChange={(event) => setNewSymptom((prev) => ({ ...prev, code: event.target.value }))}
                        className="rounded-xl border border-[var(--lu-border)] bg-[rgba(24,24,24,0.92)] px-4 py-3 text-[var(--lu-text)] focus:border-[var(--lu-accent)] focus:outline-none"
                      />
                      <button
                        type="button"
                        className="btn-outline h-11 px-5 rounded-md flex items-center justify-center"
                        onClick={handleAddSymptom}
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-6">
                  <div className="rounded-3xl border border-[var(--lu-border)] bg-[rgba(19,19,19,0.9)] p-7 backdrop-blur">
                    <p className="text-xs uppercase tracking-[0.32em] text-[var(--lu-subtle)]">Diagnóstico Final</p>
                    <h2 className="mt-3 text-2xl font-semibold text-white">
                      Sospecha de síndrome metabólico en evolución
                    </h2>
                    <p className="mt-4 text-sm text-[var(--lu-subtle)] leading-relaxed">
                      Se recomienda solicitar panel metabólico completo, perfil lipídico y derivación a especialista en
                      endocrinología para seguimiento detallado.
                    </p>
                    <div className="mt-6 rounded-2xl border border-[var(--lu-border)] bg-[rgba(18,18,18,0.92)] p-5">
                      <p className="text-xs uppercase tracking-[0.28em] text-[var(--lu-subtle)]">Especialista sugerido</p>
                      <p className="mt-2 text-lg font-semibold text-white">Endocrinología / Nutrición clínica</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="btn-outline h-11 px-5 rounded-md"
                      onClick={() => router.push("/medphenai")}
                    >
                      Volver a MedPhenAI
                    </button>
                    <button
                      type="button"
                      className="btn-success h-11 px-5 rounded-md"
                      onClick={() => setShowCancelModal(true)}
                    >
                      Comenzar otro diagnóstico
                    </button>
                  </div>
                </div>
              )}
            </div>

            {step < 4 && (
              <div className="mt-10 flex justify-end">
                <button
                  type="button"
                  className="btn-success h-11 px-6 rounded-md flex items-center gap-2 disabled:opacity-50"
                  onClick={handleContinue}
                  disabled={
                    (step === 1 && !canGoStep1) ||
                    (step === 2 && !canGoStep2) ||
                    (step === 3 && !canGoStep3) ||
                    isLoading
                  }
                >
                  Continuar
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
                    <path d="M5 3l6 5-6 5" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </section>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[rgba(11,11,11,0.78)] backdrop-blur-sm px-5">
          <div className="max-w-md w-full rounded-[28px] border border-[var(--lu-border)] bg-[rgba(19,19,19,0.96)] p-8 shadow-[0_30px_90px_rgba(0,0,0,0.45)]">
            <h2 className="text-xl font-semibold text-white">¿Seguro que querés cancelar?</h2>
            <p className="mt-3 text-sm text-[var(--lu-subtle)]">
              Vas a borrar lo que ingresaste. Confirmá si deseás salir de este diagnóstico asistido.
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-end">
              <button
                type="button"
                className="btn-outline h-10 px-4 rounded-md"
                onClick={() => setShowCancelModal(false)}
              >
                Seguir editando
              </button>
              <button
                type="button"
                className="btn-danger-outline"
                onClick={handleCancelFlow}
              >
                Sí, cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
