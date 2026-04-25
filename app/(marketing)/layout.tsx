import ScrollProgress from "@/components/motion/ScrollProgress";
import Nav from "@/components/sections/Nav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ScrollProgress />
      <Nav />
      {children}
    </>
  );
}
