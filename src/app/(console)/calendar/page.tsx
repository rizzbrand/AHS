'use client';

import { Gate } from '../../../components/auth/Gate';
import { OpsCalendar } from '../../../components/calendar/OpsCalendar';

export default function CalendarPage() {
  return (
    <Gate permission="calendar.read" title="Calendar is limited" body="The schedule is for dispatch, estimating, and operations.">
      <OpsCalendar />
    </Gate>
  );
}
