export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-primary">
          Bienvenue sur Hoostn
        </h1>
        <p className="mb-8 text-xl text-gray-anthracite">
          Gérez vos locations, pas vos complications.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/login"
            className="rounded-2xl bg-primary px-6 py-3 text-white hover:bg-primary-dark transition-colors"
          >
            Connexion
          </a>
          <a
            href="/signup"
            className="rounded-2xl bg-accent px-6 py-3 text-white hover:bg-accent-dark transition-colors"
          >
            Commencer gratuitement
          </a>
        </div>
      </div>
    </main>
  );
}
