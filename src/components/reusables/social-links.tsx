import Link from "next/link";
import { BsGithub, BsTwitterX, BsMessenger, BsFileText } from "react-icons/bs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SocialLinks() {
  const links = [
    {
      name: "GitHub",
      href: "https://github.com/aibtc",
      icon: BsGithub,
    },
    {
      name: "AIBTC on X",
      href: "https://x.com/aibtc",
      icon: BsTwitterX,
    },
    {
      name: "Prompt2DAO on X",
      href: "https://x.com/prompt2dao",
      icon: BsTwitterX,
    },
    {
      name: "Discord",
      href: "https://discord.gg/aibtc",
      icon: BsMessenger,
    },
    {
      name: "Docs",
      href: "https://docs.aibtc.dev",
      icon: BsFileText,
    },
  ];

  return (
    <div className="flex items-center gap-2">
      {/* Desktop - Show all icons */}
      <div className="hidden md:flex items-center gap-2">
        {links.map((link) => (
          <Button
            key={link.href}
            variant="ghost"
            size="icon"
            asChild
            className="h-9 w-9 text-zinc-400 hover:text-white"
          >
            <Link href={link.href} target="_blank" rel="noopener noreferrer">
              <link.icon className="h-5 w-5" />
              <span className="sr-only">{link.name}</span>
            </Link>
          </Button>
        ))}
      </div>

      {/* Mobile - Show in dropdown */}
      <div className="md:hidden">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-zinc-400">
              <BsMessenger className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {links.map((link) => (
              <DropdownMenuItem key={link.href} asChild>
                <Link
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <link.icon className="mr-2 h-4 w-4" />
                  <span>{link.name}</span>
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
