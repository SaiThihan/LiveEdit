import React, { useEffect, useState } from 'react';
import ThemeToggle from './ThemeToggle';

interface LandingPageProps {
  onStart: () => void;
}

const slides = [
  {
    title: 'Live Edit',
    subtitle: 'CINEMATIC + AI',
    accent: 'Real-time storycraft',
  },
  {
    title: 'Precision Editing',
    subtitle: 'Cut, enhance, and mix',
    accent: 'Frame-perfect control',
  },
  {
    title: 'Reactive Audio',
    subtitle: 'Pulse, mix, and render',
    accent: 'Sound that follows intent',
  },
];

const gradients = [
  'radial-gradient(circle at 20% 20%, rgba(0,255,65,0.25), transparent 40%), radial-gradient(circle at 80% 30%, rgba(0,136,255,0.22), transparent 45%), radial-gradient(circle at 50% 80%, rgba(255,0,153,0.18), transparent 40%)',
  'radial-gradient(circle at 30% 30%, rgba(0,255,200,0.25), transparent 45%), radial-gradient(circle at 70% 70%, rgba(120,90,255,0.22), transparent 45%), radial-gradient(circle at 50% 50%, rgba(255,120,0,0.15), transparent 35%)',
  'radial-gradient(circle at 25% 60%, rgba(0,200,255,0.25), transparent 45%), radial-gradient(circle at 75% 40%, rgba(255,0,120,0.18), transparent 40%), radial-gradient(circle at 50% 50%, rgba(0,255,65,0.18), transparent 45%)',
];

const githubRepositoryUrl = 'https://github.com/clencyc/LiveEdit';
const githubRepositoryApiUrl = 'https://api.github.com/repos/clencyc/LiveEdit';
const githubContributorsApiUrl = `${githubRepositoryApiUrl}/contributors?per_page=100`;
const contributorCardsPerPage = 6;
const founderCardsOnFirstPage = 1;

interface GithubContributor {
  login: string;
  avatar_url: string;
  html_url: string;
  contributions: number;
}

const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  const [index, setIndex] = useState(0);
  const [githubStars, setGithubStars] = useState<number | null>(null);
  const [contributors, setContributors] = useState<GithubContributor[] | null>(null);
  const [contributorPage, setContributorPage] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, 3200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadGithubStars = async () => {
      try {
        const response = await fetch(githubRepositoryApiUrl, {
          headers: { Accept: 'application/vnd.github+json' },
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`GitHub returned ${response.status}`);
        }
        const repository = (await response.json()) as { stargazers_count?: number };
        if (typeof repository.stargazers_count === 'number') {
          setGithubStars(repository.stargazers_count);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Unable to load GitHub star count:', error);
        }
      }
    };

    void loadGithubStars();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadGithubContributors = async () => {
      try {
        const response = await fetch(githubContributorsApiUrl, {
          headers: { Accept: 'application/vnd.github+json' },
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error(`GitHub returned ${response.status}`);
        }

        const data: unknown = await response.json();
        if (!Array.isArray(data)) {
          throw new Error('GitHub returned an invalid contributors list');
        }

        const validContributors = data.filter((contributor): contributor is GithubContributor => (
          typeof contributor?.login === 'string' &&
          typeof contributor?.avatar_url === 'string' &&
          typeof contributor?.html_url === 'string' &&
          typeof contributor?.contributions === 'number'
        ));
        setContributors(validContributors);
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error('Unable to load GitHub contributors:', error);
          setContributors([]);
        }
      }
    };

    void loadGithubContributors();
    return () => controller.abort();
  }, []);

  const slide = slides[index];
  const gradient = gradients[index];
  const formattedGithubStars = githubStars === null
    ? '—'
    : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(githubStars);
  const communityContributors = contributors?.filter(
    (contributor) => contributor.login.toLowerCase() !== 'clencyc'
  ).sort((first, second) => (
    second.contributions - first.contributions ||
    first.login.localeCompare(second.login)
  )) ?? [];
  const contributorPageCount = contributors === null
    ? 1
    : Math.ceil((founderCardsOnFirstPage + communityContributors.length) / contributorCardsPerPage);
  const firstContributorIndex = contributorPage === 0
    ? 0
    : contributorCardsPerPage - founderCardsOnFirstPage +
      (contributorPage - 1) * contributorCardsPerPage;
  const visibleContributors = communityContributors.slice(
    firstContributorIndex,
    firstContributorIndex + contributorCardsPerPage - (contributorPage === 0 ? founderCardsOnFirstPage : 0)
  );

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative pb-24">
      <div
        className="absolute inset-0 transition-all duration-700"
        style={{ backgroundImage: gradient, filter: 'blur(18px)', opacity: 0.9 }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />

      <header className="relative z-10 pt-6 px-4">
        <div className="mx-auto max-w-6xl rounded-2xl border border-[#3b2d44] bg-[#201b2d]/90 shadow-[0_8px_30px_rgba(14,10,22,0.7)] backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-3 py-3 sm:px-5 sm:py-4">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#00ff41] flex items-center justify-center shadow-[0_0_40px_rgba(0,255,65,0.35)] shrink-0">
                <i className="fas fa-play text-black text-xs" />
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-[0.3em] text-neutral-400">Live Edit</div>
                <div className="text-lg font-bold text-white tracking-tight truncate">AI Video Editor</div>
              </div>
            </div>

            <nav className="order-3 flex w-full items-center gap-5 overflow-x-auto pb-1 text-xs font-medium text-neutral-200 md:order-none md:w-auto md:gap-8 md:pb-0 md:text-sm">
              {[
                { label: 'Home', href: '#top' },
                { label: 'Hall of Fame', href: '#hall-of-fame' },
                { label: 'Blog', href: '#blog' },
                { label: 'Demo', href: '#demo' },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="shrink-0 whitespace-nowrap transition-colors hover:text-[#00ff41]"
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <div className="ml-auto flex max-w-full flex-wrap items-center justify-end gap-2 sm:gap-3">
              <button
                onClick={onStart}
                className="hidden bg-[#00ff41] px-3 py-2 text-[9px] font-bold uppercase tracking-[0.18em] text-black shadow-[0_10px_40px_rgba(0,255,65,0.45)] transition-all hover:bg-[#00e03a] sm:inline-flex sm:px-4 sm:text-[10px] sm:tracking-[0.25em]"
              >
                Get Started
              </button>
              <a
                href="https://github.com/sponsors/clencyc"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-[#00ff41] bg-[#00ff41]/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#00ff41] transition-all hover:bg-[#00ff41]/20 sm:px-4 sm:text-[11px] sm:tracking-[0.25em]"
              >
                <span aria-hidden="true">♥</span>
                <span className="hidden sm:inline">Sponsor</span>
              </a>
              <a
                href={githubRepositoryUrl}
                target="_blank"
                rel="noreferrer"
                aria-label={`Star Live Edit on GitHub${githubStars === null ? '' : ` (${githubStars} stars)`}`}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-700 bg-[#0d0d0d] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white transition-all hover:border-[#00ff41] hover:text-[#00ff41] sm:px-4 sm:text-[11px] sm:tracking-[0.25em]"
              >
                <i className="fab fa-github" />
                <span className="inline-flex items-center gap-1.5">
                  <span className="hidden sm:inline">Star</span>
                  <span aria-hidden="true">★</span>
                  <span className="text-neutral-400">{formattedGithubStars}</span>
                </span>
              </a>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main id="top" className="relative z-20 flex flex-col items-center text-center px-6 mt-16 pb-20">
        <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#00ff41] bg-white/5 text-[11px] uppercase tracking-[0.35em] text-[#00ff41]">
          AI VIDEO EDITING
        </div>

        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white drop-shadow-[0_8px_30px_rgba(0,0,0,0.45)]">
          {slide.title}
        </h1>
        <p className="mt-4 text-neutral-400 text-sm sm:text-base uppercase tracking-[0.28em]">{slide.subtitle}</p>
        <p className="mt-2 text-neutral-200 text-base sm:text-lg font-medium">{slide.accent}</p>

        <div className="relative mt-10 w-full max-w-5xl">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00ff4133] via-transparent to-[#00b3ff33] blur-3xl" />
          <div className="relative grid md:grid-cols-3 gap-4 p-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`border border-neutral-800 bg-black/70 p-4 h-40 flex flex-col justify-between overflow-hidden transition-all duration-500 ${
                  i === index ? 'shadow-[0_10px_60px_rgba(0,255,65,0.18)] border-[#00ff41]' : ''
                }`}
              >
                <div className="text-neutral-500 text-[10px] uppercase tracking-[0.25em]">Module {i + 1}</div>
                <div className="text-lg font-semibold text-white">{slides[i].title}</div>
                <div className="text-[11px] text-neutral-400">{slides[i].accent}</div>
                <div className="text-[10px] text-neutral-600">{slides[i].subtitle}</div>
              </div>
            ))}
          </div>
        </div>

      </main>

      <section id="hall-of-fame" className="relative z-20 px-6 py-20 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#00ff41] bg-white/5 text-[11px] uppercase tracking-[0.35em] text-[#00ff41] mb-6">
              👥 Community
            </div>
            <h2 className="text-4xl font-bold text-white mb-3">Contributors Hall of Fame</h2>
            <p className="text-neutral-400 text-sm uppercase tracking-[0.25em]">People shaping the next iteration of Live Edit</p>
            <p className="mt-3 text-xs text-neutral-500">
              Community contributors are listed automatically from commits on the default branch.
            </p>
          </div>

          <div
            data-testid="contributors-grid"
            className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {contributorPage === 0 && (
              <div className="rounded-xl border border-neutral-800 bg-white/[0.03] p-5 transition-all hover:border-[#00ff41]">
                <img
                  src="https://github.com/clencyc.png"
                  alt=""
                  className="mb-4 h-12 w-12 rounded-full border border-[#00ff41] object-cover shadow-[0_0_30px_rgba(0,255,65,0.25)]"
                />
                <div className="text-lg font-semibold text-white">C.Christine</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#00ff41]">Founder &amp; creative technologist</div>
                <p className="mt-4 text-sm leading-relaxed text-neutral-400">
                  Built the initial prototype, creative direction, and product vision.
                </p>
              </div>
            )}

            {visibleContributors.map((contributor) => (
              <a
                key={contributor.login}
                href={contributor.html_url}
                target="_blank"
                rel="noreferrer"
                className="rounded-xl border border-neutral-800 bg-white/[0.03] p-5 transition-all hover:border-[#00ff41]"
                aria-label={`${contributor.login}, ${contributor.contributions} commits to LiveEdit`}
              >
                <img
                  src={contributor.avatar_url}
                  alt=""
                  className="mb-4 h-12 w-12 rounded-full border border-neutral-700 object-cover"
                  loading="lazy"
                />
                <div className="text-lg font-semibold text-white">{contributor.login}</div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.2em] text-[#00ff41]">GitHub contributor</div>
                <p className="mt-4 text-sm leading-relaxed text-neutral-400">
                  {contributor.contributions} {contributor.contributions === 1 ? 'commit' : 'commits'} on the default branch.
                </p>
              </a>
            ))}

            {contributors === null && (
              <p role="status" className="text-sm text-neutral-400">Loading GitHub contributors…</p>
            )}
            {contributors !== null && communityContributors.length === 0 && (
              <p className="text-sm text-neutral-400">
                No additional GitHub contributors are listed yet.
              </p>
            )}
          </div>
          {contributorPageCount > 1 && (
            <nav className="mt-8 flex items-center justify-center gap-4" aria-label="Contributor pages">
              <button
                type="button"
                onClick={() => setContributorPage((page) => Math.max(0, page - 1))}
                disabled={contributorPage === 0}
                className="rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-[#00ff41] hover:text-[#00ff41] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span aria-live="polite" className="text-sm text-neutral-400">
                Page {contributorPage + 1} of {contributorPageCount}
              </span>
              <button
                type="button"
                onClick={() => setContributorPage((page) => Math.min(contributorPageCount - 1, page + 1))}
                disabled={contributorPage === contributorPageCount - 1}
                className="rounded border border-neutral-700 px-4 py-2 text-sm text-neutral-300 transition-colors hover:border-[#00ff41] hover:text-[#00ff41] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </nav>
          )}
        </div>
      </section>

      <section id="blog" className="relative z-20 px-6 py-20 border-t border-neutral-800 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#00ff41] bg-white/5 text-[11px] uppercase tracking-[0.35em] text-[#00ff41] mb-6">
              ✍️ Writing
            </div>
            <h2 className="text-4xl font-bold text-white mb-3">Blog & Notes</h2>
            <p className="text-neutral-400 text-sm uppercase tracking-[0.25em]">Thoughts on AI, creative tooling, and the product journey</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { title: 'Building with AI as a creative partner', date: 'Coming soon', summary: 'A look at designing workflows that keep human taste in the loop.' },
              { title: 'Why editing is still storytelling', date: 'Coming soon', summary: 'Notes on craft, pacing, and how AI can accelerate the process without flattening voice.' },
              { title: 'Inside the Live Edit workflow', date: 'Coming soon', summary: 'A practical breakdown of the systems behind prompt-driven video production.' },
            ].map((post, i) => (
              <article key={i} className="rounded-xl border border-neutral-800 bg-black/40 p-5 hover:border-[#00ff41] transition-all group">
                <div className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 mb-3">{post.date}</div>
                <h3 className="text-xl font-semibold text-white group-hover:text-[#00ff41] transition-colors">{post.title}</h3>
                <p className="mt-4 text-sm text-neutral-400 leading-relaxed">{post.summary}</p>
                <div className="mt-6 text-[11px] uppercase tracking-[0.2em] text-[#00ff41]">Read article →</div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Video Section */}
      <section id="demo" className="relative z-20 px-6 py-20 border-t border-neutral-800">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 border border-[#00ff41] bg-white/5 text-[11px] uppercase tracking-[0.35em] text-[#00ff41] mb-6">
              🎬 Live Demo
            </div>
            <h2 className="text-4xl font-bold text-white mb-3">See It In Action</h2>
            <p className="text-neutral-400 text-sm uppercase tracking-[0.25em]">Watch how AI transforms your video workflow</p>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-[#00ff41] via-[#00b3ff] to-[#ff0080] rounded-lg opacity-0 group-hover:opacity-20 blur transition duration-500" />
            <div className="relative bg-black rounded-lg overflow-hidden border border-neutral-800 group-hover:border-[#00ff41] transition-all">
              <iframe
                width="100%"
                height="450"
                src="https://www.youtube.com/embed/jP0_gqnZ0sw?rel=0&modestbranding=1"
                title="LiveEdit Creative Panel Demo"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full aspect-video"
              />
            </div>
          </div>

          <div className="mt-8 grid md:grid-cols-3 gap-4">
            {[
              { icon: '⚡', title: 'Gemini 3 Powered', desc: 'AI understands your editing intent' },
              { icon: '🎞️', title: 'Multi-Clip Magic', desc: 'Upload 3+ videos, get one masterpiece' },
              { icon: '🚀', title: 'Instant Render', desc: 'Async processing means zero wait' },
            ].map((feature, i) => (
              <div key={i} className="p-4 border border-neutral-800 bg-white/[0.02] hover:bg-white/[0.05] transition-all rounded-lg">
                <div className="text-2xl mb-2">{feature.icon}</div>
                <div className="text-sm font-semibold text-white">{feature.title}</div>
                <div className="text-xs text-neutral-500 mt-1">{feature.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Authors Section */}
      <section className="relative z-20 px-6 py-20 bg-gradient-to-b from-transparent via-[#0a0a0a] to-black border-t border-neutral-800">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-white mb-2">Built With Vision</h2>
            <p className="text-neutral-500 text-sm uppercase tracking-[0.25em]">Crafted for creators, by creators</p>
          </div>

          <div className="relative">
            {/* Animated background orb */}
            <div className="absolute inset-0 bg-gradient-radial from-[#00ff4120] via-transparent to-transparent blur-3xl pointer-events-none" />
            
            <div className="relative p-8 border border-neutral-700 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] hover:border-[#00ff41] transition-all duration-300">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Avatar placeholder */}
                <div className="flex-shrink-0">
                  <img 
                    src="/christine.jpeg"
                    alt="C.Christine"
                    className="w-32 h-32 rounded-full object-cover border-2 border-[#00ff41] shadow-[0_0_30px_rgba(0,255,65,0.3)]"
                  />
                </div>

                {/* Author info */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    Built by the incredible <span className="text-[#00ff41]">C.Christine</span>
                  </h3>
                  <p className="text-neutral-400 text-sm mb-4 leading-relaxed">
                    Creative technologist passionate about AI-powered workflows. LiveEdit was built during the <span className="text-[#00ff41] font-semibold">Gemini 3 Hackathon</span> to prove that natural language can orchestrate complex video production pipelines.
                  </p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-3">
                    {[
                      { icon: 'fa-github', href: 'https://github.com/clencyc/LiveEdit', label: 'GitHub' },
                      { icon: 'fa-twitter', href: '#', label: 'Twitter' },
                      { icon: 'fa-linkedin', href: '#', label: 'LinkedIn' },
                    ].map((link, i) => (
                      <a
                        key={i}
                        href={link.href}
                        className="w-10 h-10 rounded-lg border border-neutral-700 bg-white/5 hover:bg-white/10 hover:border-[#00ff41] flex items-center justify-center transition-all text-neutral-400 hover:text-[#00ff41]"
                        title={link.label}
                      >
                        <i className={`fas ${link.icon}`} />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tech stack badge */}
              <div className="mt-8 pt-8 border-t border-neutral-700">
                <p className="text-xs uppercase tracking-[0.3em] text-neutral-600 mb-4">Powered by</p>
                <div className="flex flex-wrap gap-2">
                  {['Gemini 3 Flash', 'React', 'Flask', 'ffmpeg', 'Celery', 'PostgreSQL'].map((tech, i) => (
                    <span key={i} className="px-3 py-1 rounded-full bg-white/5 border border-neutral-700 text-[11px] text-neutral-400 font-mono">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <footer className="relative z-0 mt-24">
        <div className="fixed bottom-0 left-0 right-0 h-16 w-full bg-neutral-900 border-t border-neutral-800 pointer-events-none" />
      </footer>
    </div>
  );
};

export default LandingPage;
