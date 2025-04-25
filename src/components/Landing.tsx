import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative w-full">
        <div className="relative h-screen w-full">
          <Image
            src="/images/aibtcdev-pattern-1-with-text-social-new.png"
            alt="AIBTC"
            fill
            priority
            className="object-cover"
          />

          {/* Content overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6">
            <div className="text-center">
              <h2 className="mb-8 text-4xl font-bold text-white md:text-6xl lg:text-7xl">
                RSVP Thursdays
              </h2>
              <Link
                href="https://www.addevent.com/event/UM20108233"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  size="lg"
                  className="bg-white text-black hover:bg-white/90 text-lg px-8 py-6 h-auto"
                >
                  RSVP Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
