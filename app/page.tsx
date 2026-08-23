import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Camera,
  CheckCircle2,
  Code2,
  LockKeyhole,
  Mic,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  TerminalSquare,
  Video,
  Waves
} from "lucide-react";

const stats = [
  { label: "Practice languages", value: "4" },
  { label: "Role tracks", value: "5" },
  { label: "Score categories", value: "3" },
  { label: "Start cost", value: "$0" }
];

const featureCards = [
  {
    title: "Interviewer that pushes back",
    copy: "Umao asks approach, edge-case, runtime, and follow-up questions based on your code and test results.",
    icon: Bot
  },
  {
    title: "Real coding workspace",
    copy: "Practice with the same flow you expect in technical screens: prompt, editor, tests, run, submit.",
    icon: Code2
  },
  {
    title: "Voice-first practice",
    copy: "Speak responses, review transcripts, and keep typed answers available when you need a fallback.",
    icon: Mic
  },
  {
    title: "Camera-aware feedback",
    copy: "Track face presence, looking away, pauses, and speaking duration without saving raw media.",
    icon: Camera
  }
];

const motionItems = [
  "Python tests running",
  "AI follow-up ready",
  "Complexity checked",
  "Transcript saved",
  "Communication scored",
  "Next topic recommended"
];

const steps = [
  "Pick a role and interview topic",
  "Code while explaining your approach",
  "Run tests and answer follow-ups",
  "Submit and review your score report"
];

export default function HomePage() {
  return (
    <main className="marketing-page">
      <header className="marketing-header">
        <Link className="marketing-brand" href="/">
          umao
        </Link>
        <nav className="marketing-nav" aria-label="Landing page navigation">
          <a href="#features">Features</a>
          <a href="#workflow">How it works</a>
          <Link href="/resources">Resources</Link>
        </nav>
        <div className="marketing-auth">
          <Link className="marketing-login" href="/login">
            Login
          </Link>
          <Link className="marketing-signup" href="/signup">
            Sign up free
          </Link>
        </div>
      </header>

      <section className="marketing-hero">
        <div className="hero-scene" aria-hidden>
          <div className="hero-grid" />
          <div className="hero-code-window hero-window">
            <div className="hero-window-top">
              <span />
              <span />
              <span />
              <strong>two_sum.py</strong>
            </div>
            <pre>{`def two_sum(nums, target):
    seen = {}
    for index, value in enumerate(nums):
        complement = target - value
        if complement in seen:
            return [seen[complement], index]
        seen[value] = index`}</pre>
          </div>
          <div className="hero-interviewer-card hero-window">
            <Image
              alt=""
              height={180}
              priority
              src="/avatar/interviewer.png"
              width={180}
            />
            <div>
              <span>AI Interviewer</span>
              <strong>Explain why this is O(n).</strong>
            </div>
            <div className="voice-wave">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="hero-score-card hero-window">
            <span>Live signal</span>
            <strong>87</strong>
            <small>Great structure. Add one edge case.</small>
          </div>
          <div className="hero-test-card hero-window">
            <CheckCircle2 size={17} />
            <span>3 / 3 test cases passed</span>
          </div>
        </div>

        <div className="hero-content">
          <span className="hero-kicker">
            <Sparkles aria-hidden size={16} />
            AI technical interview simulator
          </span>
          <h1>Practice like the interview is already live.</h1>
          <p>
            Umao is a mock technical interview room with coding tests, voice responses, a talking
            interviewer, webcam-aware communication signals, and final feedback.
          </p>
          <div className="hero-actions">
            <Link className="marketing-primary-button" href="/practice">
              Try Umao for free
              <ArrowRight aria-hidden size={18} />
            </Link>
            <Link className="marketing-secondary-button" href="/login">
              Login
            </Link>
          </div>
          <div className="hero-proof">
            <span>No credit card</span>
            <span>Browser-based practice</span>
            <span>No raw media saved</span>
          </div>
        </div>
      </section>

      <section className="stats-strip" aria-label="Umao platform stats">
        {stats.map((stat) => (
          <article key={stat.label}>
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </article>
        ))}
      </section>

      <section className="motion-rail" aria-label="Live Umao feature states">
        <div>
          {[...motionItems, ...motionItems].map((item, index) => (
            <span key={`${item}-${index}`}>
              <Waves aria-hidden size={15} />
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="feature-section" id="features">
        <div className="section-copy">
          <span className="hero-kicker">Built for technical screens</span>
          <h2>Not a flashcard app. A full interview rehearsal.</h2>
          <p>
            Umao combines the parts that make technical interviews hard: coding under pressure,
            explaining decisions, handling follow-ups, and staying composed on camera.
          </p>
        </div>

        <div className="feature-card-grid">
          {featureCards.map((feature) => {
            const Icon = feature.icon;

            return (
              <article className="feature-card" key={feature.title}>
                <Icon aria-hidden size={24} />
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="workflow-section" id="workflow">
        <div className="workflow-panel">
          <span className="hero-kicker">
            <Brain aria-hidden size={16} />
            Practice loop
          </span>
          <h2>Choose. Interview. Submit. Improve.</h2>
          <p>
            Start with a target role and topic, then let Umao guide you through a complete mock
            coding interview with results you can use for the next round.
          </p>
          <Link className="marketing-primary-button" href="/practice">
            Start free practice
            <PlayCircle aria-hidden size={18} />
          </Link>
        </div>

        <ol className="workflow-steps">
          {steps.map((step, index) => (
            <li key={step}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{step}</strong>
            </li>
          ))}
        </ol>
      </section>

      <section className="security-band">
        <div>
          <ShieldCheck aria-hidden size={23} />
          <strong>Private by design</strong>
          <span>No webcam video or microphone audio is stored.</span>
        </div>
        <div>
          <TerminalSquare aria-hidden size={23} />
          <strong>Multi-language runner</strong>
          <span>Python, JavaScript, Java, and C++ architecture.</span>
        </div>
        <div>
          <Video aria-hidden size={23} />
          <strong>Avatar fallback</strong>
          <span>Tavus can speak responses, local avatar stays ready.</span>
        </div>
        <div>
          <LockKeyhole aria-hidden size={23} />
          <strong>Server-side secrets</strong>
          <span>Provider keys stay out of client code.</span>
        </div>
      </section>

      <section className="final-marketing-cta">
        <BarChart3 aria-hidden size={28} />
        <h2>Run one mock interview and see what to fix next.</h2>
        <p>Try Umao for free, then use your score report to plan the next practice session.</p>
        <Link className="marketing-primary-button" href="/practice">
          Try Umao for free
          <ArrowRight aria-hidden size={18} />
        </Link>
      </section>
    </main>
  );
}
