import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative w-full h-[100vh]">
        {/* Background Pattern */}
        <div className="absolute inset-0 w-full h-full">
          <Image
            src="/logos/aibtcdev-pattern-1-1920px.png"
            alt="AIBTC Background Pattern"
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
        </div>

        {/* Content overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6">
          <div className="flex flex-col items-center space-y-8 sm:space-y-10 -mt-10 sm:-mt-20">
            {/* Logo */}
            <div className="w-full max-w-[280px] sm:max-w-[500px] md:max-w-[700px] lg:max-w-[800px] px-4">
              <Image
                src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
                alt="AIBTC Logo"
                width={1000}
                height={250}
                className="w-full h-auto"
                priority
              />
            </div>

            {/* Button */}
            <Link
              href="https://www.addevent.com/event/UM20108233"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full max-w-[200px] sm:max-w-[250px] md:max-w-[300px]"
            >
              <Button
                size="lg"
                className="sm:text-lg font-bold px-6 py-2 h-auto sm:px-8 sm:py-3 w-full"
                variant="primary"
              >
                RSVP THURSDAYS
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
