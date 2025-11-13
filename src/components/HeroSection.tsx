import InteractivePoints from "./InteractivePoints";

function HeroSection() {
  return (
    <section className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#D3D3D3] to-[#FFDD66]">
      <div className="flex items-center min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full items-center">
          <div className="space-y-6 z-10 pl-[140px]">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-black leading-tight">
              Deine Plattform für eine nachhaltige und digital vernetzte
              Energiezukunft
            </h1>
            <p className="text-2xl md:text-3xl text-white font-medium">
              The transition starts now.
            </p>
          </div>

          <div className="relative h-[1080px]">
            <InteractivePoints />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
