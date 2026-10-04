'use client';

import { useParams } from 'next/navigation';
import { Gate } from '../../../../components/auth/Gate';
import { PageHeader } from '../../../../components/ui/PageHeader';
import { JobWorkspace } from '../../../../components/work-orders/JobWorkspace';
import { useDemo } from '../../../../lib/demo-store';

export default function WorkOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const { orders } = useDemo();
  const order = orders.find((item) => item.id === params.id);

  return (
    <Gate permission="jobs.read" title="This job is limited" body="Your role does not open company work orders.">
      {order ? <JobWorkspace key={order.id} order={order} /> : <div className="mx-auto max-w-[1200px]"><PageHeader kicker="Work orders" title="Job not found" lede="That record is not in the current book of work." /></div>}
    </Gate>
  );
}
