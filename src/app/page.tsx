export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 px-6 py-24 text-white">
      <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl shadow-emerald-950/30 backdrop-blur md:p-12">
        <p className="mb-4 text-sm font-semibold uppercase tracking-[0.35em] text-emerald-300">
          Lingua
        </p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
          Your next language experience starts here.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Lingua is your fresh Next.js foundation for building a polished app,
          connected to Vercel and ready for your next idea.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href="https://nextjs.org/docs"
            className="rounded-full bg-emerald-500 px-5 py-3 font-medium text-slate-950 transition hover:bg-emerald-400"
          >
            Read the docs
          </a>
          <a
            href="https://vercel.com"
            className="rounded-full border border-white/20 px-5 py-3 font-medium text-white transition hover:bg-white/10"
          >
            Open Vercel
          </a>
        </div>
      </div>
    </main>
  );
}
