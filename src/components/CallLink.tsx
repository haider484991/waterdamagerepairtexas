"use client";

import type { ReactNode, AnchorHTMLAttributes } from "react";
import {
  HELPLINE_HREF,
  trackCall,
  type CallPlacement,
  type CallContext,
} from "@/lib/call-tracking";

interface CallLinkProps
  extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "onClick"> {
  placement: CallPlacement;
  context?: CallContext;
  children: ReactNode;
}

/**
 * The only way to render a helpline link. Fires the call event, then lets the
 * browser follow the tel: href normally — we never preventDefault, so a
 * tracking failure can't swallow the call.
 */
export function CallLink({
  placement,
  context,
  children,
  ...rest
}: CallLinkProps) {
  return (
    <a
      href={HELPLINE_HREF}
      onClick={() => trackCall(placement, context)}
      {...rest}
    >
      {children}
    </a>
  );
}
