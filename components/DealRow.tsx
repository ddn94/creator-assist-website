import { StatusTag } from "@/components/StatusTag";
import { Text } from "@/components/Text";
import { dealPaymentTone, type TalentDeal } from "@/lib/talent";

type DealRowProps = {
  deal: TalentDeal;
};

function dash(value: string | null) {
  return value ?? "—";
}

export function DealRow({ deal }: DealRowProps) {
  const payment =
    deal.payment && deal.paymentLabel ? (
      <StatusTag
        label={deal.paymentLabel}
        tone={dealPaymentTone[deal.payment]}
      />
    ) : (
      <Text variant="caption" className="text-ink">
        —
      </Text>
    );

  return (
    <div className="border-b border-card-border last:border-b-0">
      {/* Mobile */}
      <div className="space-y-2 px-4 py-3.5 md:hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Text variant="cardTitle" className="truncate">
              {deal.content}
            </Text>
            <Text variant="caption" className="mt-0.5">
              {dash(deal.brand)} · {deal.platform}
            </Text>
          </div>
          {payment}
        </div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Text variant="caption" className="text-ink">
            {dash(deal.fee)}
          </Text>
          <Text variant="caption" className="text-ink">
            {deal.stage}
          </Text>
        </div>
      </div>

      {/* Desktop */}
      <div className="hidden grid-cols-[minmax(10rem,1.6fr)_minmax(6rem,1fr)_6.5rem_4.5rem_5.5rem_5.5rem] items-center gap-3 px-4 py-3.5 md:grid">
        <Text variant="cardTitle" className="truncate">
          {deal.content}
        </Text>
        <Text variant="caption" className="truncate text-ink">
          {dash(deal.brand)}
        </Text>
        <Text variant="caption" className="truncate text-ink">
          {deal.platform}
        </Text>
        <Text variant="caption" className="text-ink">
          {dash(deal.fee)}
        </Text>
        <Text variant="caption" className="text-ink">
          {deal.stage}
        </Text>
        <div className="justify-self-start">{payment}</div>
      </div>
    </div>
  );
}
