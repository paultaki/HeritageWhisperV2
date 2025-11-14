import { Providers } from "./providers";

export default function LandingV3Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Providers>{children}</Providers>;
}
