import ScrollIcon from "./../assets/Scroll.svg";
import InteractivePoints from "./InteractivePoints";

function HeroSection() {
  return (
    <section className="lg:h-screen h-fit max-h-270 font-neue-haas font-normal relative overflow-hidden bg-linear-to-b from-[#D3D3D3] to-[#FFDD66]">
      <div className="flex h-full items-center max-w-480 mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:gap-12 w-full items-center">
          <div className="pl-5.5 md:pl-12.5 xl:pl-35 pt-12.5 w-full md:max-w-2/3 lg:max-w-full">
            <h1 className="text-[clamp(1.6875rem,4vw,4rem)] text-black text-balance leading-[121%] mb-2">
              Deine Plattform für eine nachhaltige und digital vernetzte Energiezukunft
            </h1>
            <p className="text-[clamp(18px,4vw,1.85rem)] text-white">The transition starts now.</p>
          </div>

          <div className="relative h-full w-full min-h-137.5 pl-5 md:pl-0 md:min-h-200 ml-auto xl:w-full md:w-2/3 lg:min-h-138.5 pb-25 lg:pb-0 xl:min-h-210 2xl:min-h-238.5 mask-r-from-90% 2xl:pb-4">
            <InteractivePoints />
          </div>
        </div>
      </div>
      <div className="hidden bottom-4 left-1/2 transform -translate-x-1/2 animate-bounce lg:block absolute">
        <img src={ScrollIcon} alt="Scroll Icon" />
      </div>
    </section>
  );
}

export default HeroSection;
