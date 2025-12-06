export default function Unauthorized() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
      <h1 className="text-3xl font-bold text-rose-600 mb-4">Access Denied</h1>
      <p className="text-slate-600 mb-6">
        You do not have permission to access this page.
      </p>
      <a
        href="/"
        className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
      >
        Go Home
      </a>
    </div>
  );
}
