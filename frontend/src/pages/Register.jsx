import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import AccountRegistrationForm from "../components/AccountRegistrationForm.jsx";
import Button from "../components/Button.jsx";
import { Link } from "react-router-dom";

export default function Register() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar
        right={
          <Button as={Link} to="/login" className="bg-emerald-600 text-white hover:bg-emerald-700">
            Sign in
          </Button>
        }
      />

      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pb-24 lg:pt-12">
        <div className="w-full max-w-3xl">
          <div className="mb-6 text-sm text-slate-600 sm:text-base">
            <h1 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
              Create your MediConnect account
            </h1>
            <p className="mt-2">
              Patients can self-register here. Clinic staff will create doctor and receptionist accounts.
            </p>
          </div>

          {/* ⭐ Public registration must create ONLY patients */}
          <AccountRegistrationForm
            context="public"
            allowedRoles={["Patient"]}
          />
        </div>
      </main>

      <Footer className="mt-12" defaultOpen={false} />
    </div>
  );
}
