import ScrollIcon from "./../assets/Scroll.svg";
import InteractivePoints from "./InteractivePoints";

function HeroSection() {
  return (
    <section className="lg:h-screen h-fit max-h-270 font-neue-haas font-normal relative overflow-hidden bg-linear-to-b from-[#D3D3D3] to-[#FFDD66]">
      <div className="flex h-full items-center max-w-480 mx-auto">
        <div className="grid grid-cols-1 gap-6 md:gap-0 lg:grid-cols-2 xl:gap-12 w-full items-center">
          <div className="px-5.5 md:pl-12.5 lg:pl-14.5 xl:pl-35 pt-12.5 w-full md:max-w-2/3 lg:max-w-full">
            <h1 className="text-[1.6875rem] md:text-[2.5625rem] text-black text-balance leading-[121%] tracking-[-0.05em] mb-2 lg:mb-10">
              Deine Plattform für eine nachhaltige und digital vernetzte Energiezukunft
            </h1>
            <p className="text-[1.125rem] md:text-[1.375rem] text-white">The transition starts now.</p>
          </div>

          <div className="relative h-full w-full min-h-137.5 md:pl-0 md:min-h-220 ml-auto xl:w-full lg:min-h-138.5 pb-8 lg:pb-0 xl:min-h-210 2xl:min-h-238.5 2xl:mask-r-from-95% 2xl:pb-4">
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
