export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
	  <header className="flex items-center justify-between p-6 max-w-6xl mx-auto">
  <div className="flex items-center gap-3">
    <img src="/confluxa-logo.png" className="h-16 w-auto" />
    <span className="text-xl font-semibold tracking-tight">Confluxa</span>
  </div>

  <button className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-medium">
    Book a Call
  </button>
</header>

      <section className="max-w-6xl mx-auto px-6 py-20">

        <h1 className="text-5xl font-bold mb-6">
          Stabilize Your Operations in 14 Days
        </h1>

        <p className="text-lg text-gray-600 mb-8 max-w-xl">
          Confluxa installs automation systems that stop missed calls,
          reduce admin work, and keep your business running smoothly.
        </p>

        <button className="bg-orange-500 text-white px-6 py-3 rounded-lg text-lg">
          Book a Call
        </button>

      </section>

      <section className="bg-white py-20">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-10">

          <div className="p-6 border rounded-xl">
            <h3 className="font-bold mb-2">Stop Missed Calls</h3>
            <p className="text-gray-600">
              AI agents answer instantly so every customer gets help.
            </p>
          </div>

          <div className="p-6 border rounded-xl">
            <h3 className="font-bold mb-2">Reduce Admin</h3>
            <p className="text-gray-600">
              Automate booking, follow-ups and lead capture.
            </p>
          </div>

          <div className="p-6 border rounded-xl">
            <h3 className="font-bold mb-2">Stabilize Operations</h3>
            <p className="text-gray-600">
              Systems that keep your business running without chaos.
            </p>
          </div>

        </div>
      </section>

    </main>
  );
}