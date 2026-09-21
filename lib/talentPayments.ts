import { paymentStatusTone } from "@/lib/payments";
import { PAYMENT_TERM_OPTIONS } from "@/lib/tracker";
import {
  TALENT_PAYMENTS,
  type TalentPaymentAction,
  type TalentPaymentItem,
} from "@/lib/talentMock";

export type { TalentPaymentAction, TalentPaymentItem };
export { paymentStatusTone, PAYMENT_TERM_OPTIONS, TALENT_PAYMENTS };
