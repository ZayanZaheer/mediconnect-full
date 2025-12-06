import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";
import AccountRegistrationForm from "../components/AccountRegistrationForm.jsx";

export default function ReceptionistRegisterPatient() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <Navbar />

      <main className="flex flex-1 items-center justify-center px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl">
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">
            Register a new patient
          </h1>
          <p className="text-slate-600 mb-6">
            Fill in the details to create a patient account.
          </p>

          <AccountRegistrationForm 
            context="receptionist"
            allowedRoles={["Patient"]}
            onSuccess={() => {
              // optional: navigate back or show success toast
            }}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}
