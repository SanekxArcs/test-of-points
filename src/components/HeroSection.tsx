import ScrollIcon from "./../assets/Scroll.svg";
import InteractivePoints from "./InteractivePoints";

function HeroSection() {
  return (
    <section className="min-h-screen font-neue-haas font-[400] relative overflow-hidden bg-gradient-to-br from-[#D3D3D3] to-[#FFDD66]">
      <div className="flex items-center min-h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full items-center">
          <div className=" pl-[140px] pt-[50px]">
            <h1 className="text-[4.25rem] text-black text-balance leading-[121%] mb-2 w-[99%]">
              Die Plattform für eine nachhaltige und vernetzte Energiezukunft
            </h1>
            <p className="text-[2rem] text-white">The transition starts now.</p>
          </div>

          <div className="relative h-screen">
            <InteractivePoints />
          </div>
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce">
        <img src={ScrollIcon} alt="Scroll Icon" />
      </div>
    </section>
  );
}

export default HeroSection;
