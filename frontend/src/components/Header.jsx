import logo from "../assets/logo/logo.png";

function Header() {
  return (
    <header className="bg-teal-700 shadow-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

        {/* Left Side */}
        <div className="flex items-center gap-4">

          <img
            src={logo}
            alt="RxVision Logo"
            className="h-12 w-12 rounded-xl"
          />

          <div>
            <h1 className="text-2xl font-bold text-white">
              RxVision
            </h1>

            <p className="text-sm text-teal-100">
              Medical Prescription Scanner & Transcriber
            </p>
          </div>

        </div>

        {/* Right Side */}
        <span className="rounded-full bg-teal-600 px-4 py-2 text-sm font-semibold text-white">
          Beta
        </span>

      </div>
    </header>
  );
}

export default Header;