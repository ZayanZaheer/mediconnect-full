import { useState } from "react";
import Button from "../components/Button.jsx";
import Footer from "../components/Footer.jsx";
import { Menu, Stethoscope, X } from "lucide-react";

export default function AppShell({
  navbar,
  sidebar,
  children,
  sidebarLabel = "Navigation",
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const hasSidebar = !!sidebar;

  const handleSidebarNavigate = (event) => {
    const anchor = event.target.closest?.("a[href]");
    if (anchor) {
      setSidebarOpen(false);
    }
  };
  return (
    <div className="flex h-screen flex-col bg-slate-50">
      {navbar}
      <div className="flex flex-1 overflow-hidden">
        {hasSidebar && (
          <>
            {sidebarOpen && (
              <div className="fixed inset-0 z-50 lg:hidden">
                <div
                  className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
                  onClick={() => setSidebarOpen(false)}
                />
                <div className="absolute left-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-2xl">
                  <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                    <a href="/" className="flex items-center gap-2">
                      <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary-600 text-white">
                        <Stethoscope className="h-5 w-5" />
                      </span>
                      <p className="text-sm font-semibold text-slate-800">
                        MediConnect
                      </p>
                    </a>
                    <button
                      type="button"
                      onClick={() => setSidebarOpen(false)}
                      className="rounded-full p-2 text-slate-500 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 focus-visible:ring-offset-2"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <div
                    className="flex-1 overflow-y-auto px-4 py-4"
                    onClick={handleSidebarNavigate}
                  >
                    {sidebar}
                  </div>
                </div>
              </div>
            )}

            <div className="hidden lg:flex lg:w-[300px] lg:flex-shrink-0 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
              {sidebar}
            </div>
          </>
        )}

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex h-full w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-10">
            {hasSidebar && (
              <div className="mb-4 flex items-center lg:hidden">
                <Button
                  type="button"
                  className="inline-flex items-center gap-2 border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
                  onClick={() => setSidebarOpen(true)}
                  aria-label={`Open ${sidebarLabel.toLowerCase?.() || "navigation"}`}
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </div>
            )}

            <main className="flex-1 space-y-6 pb-24">{children}</main>
          </div>
        </div>
      </div>
      <Footer className="mt-0" defaultOpen={false} />
    </div>
  );
}
