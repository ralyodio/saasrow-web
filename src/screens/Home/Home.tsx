import { SearchIcon } from "lucide-react";
import React from "react";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Input } from "../../components/ui/input";

const navigationItems = [
  { label: "Tags", href: "#" },
  { label: "Apps", href: "#", isActive: true },
  { label: "Community", href: "#" },
  { label: "Get Featured", href: "#" },
];

const filterButtons = [
  { label: "All", isActive: true },
  { label: "Featured", isActive: false },
  { label: "Premium", isActive: false },
];

const activeFilters = [
  { label: "Software", value: "software" },
  { label: "Security", value: "security" },
];

const appCards = [
  {
    id: 1,
    name: "Briefy",
    logo: "/image-3.png",
    description:
      "Briefy turns all kinds of lengthy content into concise, structured summaries and saves them in your knowledge base for later review.",
    rating: 4.7,
    reviews: 10,
    tags: ["Software", "Artificial Intelligence"],
    votes: 165,
    isFeatured: false,
  },
  {
    id: 2,
    name: "Zoom",
    logo: "/image-3-7.png",
    description:
      "Share, connect, and engage with teammates no matter where you're located with the tools you need like docs, notes, whiteboards, and video clips.",
    rating: 5.0,
    reviews: 24,
    tags: ["Software", "Online"],
    votes: 144,
    isFeatured: true,
  },
  {
    id: 3,
    name: "cPanel",
    logo: "/cpanel-logo-1.svg",
    description:
      "With its first-class support and rich feature set, cPanel & WHM has been the web hosting industry's most reliable, intuitive control panel",
    rating: 4.3,
    reviews: 15,
    tags: ["Hosting", "Server Management"],
    votes: 44,
    isFeatured: true,
  },
  {
    id: 4,
    name: "Zoom",
    logo: "/image-3-7.png",
    description:
      "Share, connect, and engage with teammates no matter where you're located with the tools you need like docs, notes, whiteboards, and video clips.",
    rating: 5.0,
    reviews: 24,
    tags: ["Software", "Online"],
    votes: 124,
    isFeatured: false,
  },
  {
    id: 5,
    name: "cPanel",
    logo: "/cpanel-logo-1.svg",
    description:
      "With its first-class support and rich feature set, cPanel & WHM has been the web hosting industry's most reliable, intuitive control panel",
    rating: 4.3,
    reviews: 15,
    tags: ["Hosting", "Server Management"],
    votes: 115,
    isFeatured: false,
  },
  {
    id: 6,
    name: "Briefy",
    logo: "/image-3-2.png",
    description:
      "Briefy turns all kinds of lengthy content into concise, structured summaries and saves them in your knowledge base for later review.",
    rating: 4.7,
    reviews: 10,
    tags: ["Software", "Artificial Intelligence"],
    votes: 105,
    isFeatured: false,
  },
  {
    id: 7,
    name: "cPanel",
    logo: "/cpanel-logo-1.svg",
    description:
      "With its first-class support and rich feature set, cPanel & WHM has been the web hosting industry's most reliable, intuitive control panel",
    rating: 4.3,
    reviews: 15,
    tags: ["Hosting", "Server Management"],
    votes: 135,
    isFeatured: false,
  },
  {
    id: 8,
    name: "Briefy",
    logo: "/image-3-4.png",
    description:
      "Briefy turns all kinds of lengthy content into concise, structured summaries and saves them in your knowledge base for later review.",
    rating: 4.7,
    reviews: 10,
    tags: ["Software", "Artificial Intelligence"],
    votes: 165,
    isFeatured: false,
  },
  {
    id: 9,
    name: "Zoom",
    logo: "/image-3-7.png",
    description:
      "Share, connect, and engage with teammates no matter where you're located with the tools you need like docs, notes, whiteboards, and video clips.",
    rating: 5.0,
    reviews: 24,
    tags: ["Software", "Online"],
    votes: 144,
    isFeatured: false,
  },
];

const paginationItems = [
  { label: "1", isActive: true },
  { label: "2", isActive: false },
  { label: "...", isActive: false },
  { label: "15", isActive: false },
];

const footerLinks = [
  { label: "About us", href: "#" },
  { label: "Discover", href: "#" },
  { label: "Explore", href: "#" },
  { label: "News", href: "#" },
];

export const Home = (): JSX.Element => {
  return (
    <div className="bg-neutral-800 min-h-screen w-full">
      <div className="relative">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#4fffe34c] rotate-[37.69deg] blur-[150px]" />
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#e0ff044c] rotate-[37.69deg] blur-[150px]" />
        </div>

        <div className="relative max-w-[1440px] mx-auto px-8">
          <header className="flex items-center justify-between py-8">
            <img
              src="/wiresniff-logo-1-1.png"
              alt="Wiresniff logo"
              className="h-[73px] w-[362px] object-cover"
            />

            <nav className="flex items-center gap-12">
              {navigationItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className={`text-3xl [font-family:'Roboto',Helvetica] font-normal ${
                    item.isActive
                      ? "bg-[linear-gradient(180deg,rgba(224,255,4,1)_0%,rgba(79,255,227,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]"
                      : "text-white"
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>

            <Button className="h-auto rounded-[500px] bg-[linear-gradient(180deg,rgba(224,255,4,1)_0%,rgba(79,255,227,1)_100%)] text-neutral-800 text-[26px] [font-family:'Roboto',Helvetica] font-normal px-12 py-3 hover:opacity-90">
              Sign in
            </Button>
          </header>

          <main className="mt-16">
            <section className="text-center mb-16">
              <h1 className="text-white text-6xl [font-family:'Roboto',Helvetica] font-normal mb-4">
                The world&apos;s best place to find
              </h1>
              <h2 className="text-6xl [font-family:'Roboto',Helvetica] font-normal bg-[linear-gradient(180deg,rgba(224,255,4,1)_0%,rgba(79,255,227,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] mb-6">
                Softwares, Accelerators & Startups
              </h2>
              <p className="text-white text-2xl [font-family:'Roboto',Helvetica] font-normal">
                Save hours finding the perfect productivity software with
                <br />
                our 500+ in-depth reviews & ranked lists
              </p>
            </section>

            <section className="mb-12">
              <div className="relative mb-8">
                <div className="flex items-center gap-4 bg-[#4a4a4a] rounded-[100px] px-8 py-6">
                  <SearchIcon className="w-8 h-8 text-white" />
                  <Input
                    placeholder="SearchIcon keywords..."
                    className="flex-1 bg-transparent border-none text-white text-3xl [font-family:'Inter',Helvetica] font-normal placeholder:text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <div className="flex items-center gap-4">
                    {filterButtons.map((button, index) => (
                      <Button
                        key={index}
                        className={`h-auto rounded-[100px] px-8 py-3 text-[25px] [font-family:'Roboto',Helvetica] font-normal ${
                          button.isActive
                            ? "bg-[linear-gradient(180deg,rgba(224,255,4,1)_0%,rgba(79,255,227,1)_100%)] text-neutral-800"
                            : "bg-transparent border-2 border-[linear-gradient(180deg,rgba(224,255,4,1)_0%,rgba(79,255,227,1)_100%)] bg-[linear-gradient(180deg,rgba(224,255,4,1)_0%,rgba(79,255,227,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent]"
                        }`}
                      >
                        {button.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 mb-8">
                {activeFilters.map((filter, index) => (
                  <Badge
                    key={index}
                    className="h-auto bg-[#4a4a4a] text-white text-[25px] [font-family:'Roboto',Helvetica] font-normal rounded-[100px] px-6 py-3 hover:bg-[#4a4a4a]"
                  >
                    {filter.label}
                    <img
                      src="/vector.svg"
                      alt="Remove"
                      className="w-5 h-5 ml-3"
                    />
                  </Badge>
                ))}
                <button className="text-3xl [font-family:'Roboto',Helvetica] font-normal bg-[linear-gradient(180deg,rgba(224,255,4,1)_0%,rgba(79,255,227,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] ml-4">
                  Clear All
                </button>
              </div>
            </section>

            <section className="mb-16">
              <div className="grid grid-cols-3 gap-8">
                {appCards.map((app) => (
                  <Card
                    key={app.id}
                    className="bg-[#4a4a4a] border-none rounded-[19.65px] relative overflow-visible"
                  >
                    <CardContent className="p-8">
                      {app.isFeatured && (
                        <div className="absolute -top-4 left-8">
                          <Badge className="h-auto bg-[#fbbc04] text-[#4a4a4a] text-[11.9px] [font-family:'Ubuntu',Helvetica] font-bold rounded-[23.75px] px-4 py-2 hover:bg-[#fbbc04]">
                            Featured
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-start gap-6 mb-6">
                        <img
                          src={app.logo}
                          alt={app.name}
                          className="w-[82px] h-[82px] object-cover"
                        />
                        <h3 className="text-white text-[34.4px] [font-family:'Ubuntu',Helvetica] font-bold">
                          {app.name}
                        </h3>
                      </div>

                      <p className="text-white text-[14.7px] [font-family:'Ubuntu',Helvetica] font-normal mb-6 leading-relaxed">
                        {app.description}
                      </p>

                      <div className="flex items-center gap-2 mb-6">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, index) => (
                            <img
                              key={index}
                              src="/star-active-google.svg"
                              alt="Star"
                              className="w-3.5 h-3.5"
                            />
                          ))}
                        </div>
                        <span className="text-white text-[14.7px] [font-family:'Ubuntu',Helvetica] font-bold">
                          {app.rating}
                        </span>
                        <span className="text-white text-[14.7px] [font-family:'Ubuntu',Helvetica] font-normal">
                          ({app.reviews} Reviews)
                        </span>
                        <button className="text-[9.8px] [font-family:'Ubuntu',Helvetica] font-normal bg-[linear-gradient(180deg,rgba(224,255,4,1)_0%,rgba(79,255,227,1)_100%)] [-webkit-background-clip:text] bg-clip-text [-webkit-text-fill-color:transparent] [text-fill-color:transparent] ml-2">
                          Post a review
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mb-6">
                        {app.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            className="h-auto bg-[linear-gradient(180deg,rgba(224,255,4,1)_0%,rgba(79,255,227,1)_100%)] text-neutral-800 text-[10.4px] [font-family:'Roboto',Helvetica] font-normal rounded-[41.53px] px-4 py-2 hover:bg-[linear-gradient(180deg,rgba(224,255,4,1)_0%,rgba(79,255,227,1)_100%)]"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex flex-col items-center gap-2">
                        <img
                          src="/vector-6.svg"
                          alt="Upvote"
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="text-white text-[33px] [font-family:'Ubuntu',Helvetica] font-bold">
                          {app.votes}
                        </span>
                        <img
                          src="/vector-2.svg"
                          alt="Downvote"
                          className="w-4 h-4 cursor-pointer"
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            <section className="flex items-center justify-center gap-4 mb-16">
              {paginationItems.map((item, index) => (
                <Button
                  key={index}
                  className={`h-auto rounded-md px-6 py-3 text-[26.6px] [font-family:'Roboto',Helvetica] font-extrabold ${
                    item.isActive
                      ? "bg-[linear-gradient(180deg,rgba(224,255,4,1)_0%,rgba(79,255,227,1)_100%)] text-neutral-800"
                      : "bg-transparent text-white hover:bg-transparent"
                  }`}
                >
                  {item.label}
                </Button>
              ))}
            </section>

            <section className="mb-16">
              <div className="bg-[linear-gradient(180deg,rgba(224,255,4,1)_0%,rgba(79,255,227,1)_100%)] rounded-[20.61px] p-16">
                <h2 className="text-black text-[51.5px] [font-family:'Ubuntu',Helvetica] font-bold mb-4">
                  Subscribe Newsletter
                </h2>
                <p className="text-black text-[20.6px] [font-family:'Ubuntu',Helvetica] font-normal mb-8">
                  For the latest in self-hosted news, software, and content
                  delivered straight to your inbox every Friday
                </p>
                <div className="flex items-center gap-4">
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Enter your email"
                      className="bg-neutral-800 border-none text-white text-lg [font-family:'Ubuntu',Helvetica] font-normal rounded-[89.93px] px-8 py-6 placeholder:text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                  </div>
                  <Button className="h-auto bg-[linear-gradient(180deg,rgba(224,255,4,1)_0%,rgba(79,255,227,1)_100%)] text-neutral-800 text-lg [font-family:'Ubuntu',Helvetica] font-medium rounded-[89.93px] px-12 py-6 hover:opacity-90">
                    Subcribe Now
                  </Button>
                </div>
              </div>
            </section>
          </main>

          <footer className="py-16 border-t border-white/20">
            <div className="flex items-start justify-between mb-12">
              <img
                src="/wiresniff-logo-1-1.png"
                alt="Wiresniff logo"
                className="h-[47px] w-[228px] object-cover"
              />

              <nav className="flex items-center gap-12">
                {footerLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.href}
                    className="text-white text-[19.1px] [font-family:'Ubuntu',Helvetica] font-normal"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>

              <div className="flex items-center gap-6">
                <img
                  src="/social.png"
                  alt="Social media"
                  className="h-[29px]"
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-white text-[16.7px] [font-family:'Ubuntu',Helvetica] font-normal opacity-75">
                © 2019 SaaSRow. All rights reserved.
              </p>
              <div className="flex items-center gap-12">
                <a
                  href="#"
                  className="text-white text-[16.7px] [font-family:'Ubuntu',Helvetica] font-normal"
                >
                  Terms of Service
                </a>
                <a
                  href="#"
                  className="text-white text-[16.7px] [font-family:'Ubuntu',Helvetica] font-normal"
                >
                  Privacy Policy
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
};
