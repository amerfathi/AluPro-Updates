import { pdf } from "@react-pdf/renderer";

import { ProposalDocument, type ProposalPdfPayload } from "@/lib/pdf/proposal-document";

export async function generateProposalPdfBuffer(payload: ProposalPdfPayload) {
  const instance = pdf(<ProposalDocument payload={payload} />);
  return instance.toBuffer();
}


