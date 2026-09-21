import Image from "next/image";
import { Card } from "@/components/Card";
import { Text } from "@/components/Text";
import { Button } from "@/components/Button";
import WaitlistForm from "@/components/WaitlistForm";

const FAQS = [
  {
    q: "Who is this for?",
    a: "Creators managing brand deals, content, and payments.",
  },
  {
    q: "When does it launch?",
    a: "Early access opens to the waitlist first, in waves.",
  },
];

export default function WaitlistPage() {
  return (
    <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col justify-center px-6 py-12 min-[900px]:px-8 pb-[calc(3rem+env(safe-area-inset-bottom))] pt-[calc(3rem+env(safe-area-inset-top))]">
      <div className="grid items-start gap-10 min-[900px]:grid-cols-[1.15fr_1fr] min-[900px]:gap-16">
        <div className="text-center min-[900px]:text-left">
          <div className="flex items-center justify-center gap-3 min-[900px]:justify-start">
            <Image
              src="/icons/icon-192.png"
              alt=""
              width={96}
              height={96}
              className="size-14 rounded-[18px] min-[900px]:size-16 min-[900px]:rounded-[20px]"
              priority
            />
            <Text variant="wordmark">Creator Assist</Text>
          </div>

          <Text variant="hero" className="mt-7 min-[900px]:mt-9">
            For creators running a business, not just a page.
          </Text>

          <Text variant="subtitle" className="mt-5 min-[900px]:mt-6">
            deals · payments · content — all in one place
          </Text>

          <Text variant="description" className="mt-3">
            Early access opening soon.
          </Text>
        </div>

        <div className="relative mx-auto w-full max-w-md min-[900px]:mx-0 min-[900px]:max-w-none">
          <Card>
            <WaitlistForm />
          </Card>

          <div className="absolute top-full left-0 right-0 mt-6 space-y-2 px-1 text-left">
            {FAQS.map(({ q, a }) => (
              <details key={q} className="group block">
                <summary className="cursor-pointer list-none marker:content-none">
                  <Text variant="nav" className="transition-colors group-hover:text-primary-hover">
                    {q}
                  </Text>
                  <Text as="span" variant="description" aria-hidden className="ml-1.5 group-open:hidden">
                    +
                  </Text>
                  <Text
                    as="span"
                    variant="description"
                    aria-hidden
                    className="ml-1.5 hidden group-open:inline"
                  >
                    −
                  </Text>
                </summary>
                <Text variant="description" className="mt-1.5">
                  {a}
                </Text>
              </details>
            ))}
            <div className="mt-6">
              <Text variant="description">
                Already have an account? <Button href="/login">Sign in</Button>
              </Text>
              <Text variant="description" className="mt-2">
                New here? <Button href="/signup/talent">Sign up</Button>
              </Text>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
