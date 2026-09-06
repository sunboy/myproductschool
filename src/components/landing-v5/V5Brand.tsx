import Image from "next/image";
import Link from "next/link";

export function V5Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="HackProduct home">
      {compact ? (
        <Image src="/landing-v5/hackproduct-logo-tight.png" alt="" width={57} height={41} priority />
      ) : (
        <Image className="brand-wordmark" src="/landing-v5/hackproduct-wordmark-tight.png" alt="HackProduct" width={244} height={22} priority />
      )}
    </Link>
  );
}
