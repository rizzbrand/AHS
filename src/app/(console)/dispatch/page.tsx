'use client';

import { Gate } from '../../../components/auth/Gate';
import { DispatchBoard } from '../../../components/dispatch/DispatchBoard';

export default function DispatchPage() {
  return (
    <Gate permission="dispatch.read" title="Dispatch is limited" body="Scheduling and assignment are for the dispatcher, operations, and the owner.">
      <DispatchBoard />
    </Gate>
  );
}
