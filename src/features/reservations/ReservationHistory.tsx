import { Text, Timeline } from '@mantine/core';
import { IconCheck, IconClock, IconSend, IconX } from '@tabler/icons-react';

import type { Reservation } from '../../api/types';
import { formatDateTime } from '../resources/formatters';
import { APPROVAL_STAGE_LABELS } from './reservationLabels';

interface HistoryItem {
  key: string;
  title: string;
  when?: string;
  note?: string | null;
  icon: React.ReactNode;
  color: string;
}

function waitingStep(reservation: Reservation): HistoryItem[] {
  if (reservation.status === 'PENDING') {
    const title = 'Așteaptă decizia coordonatorului echipei';
    return [{ key: 'waiting', title, icon: <IconClock size={14} />, color: 'yellow' }];
  }
  if (reservation.status === 'PENDING_ADMIN') {
    const title = 'Așteaptă avizul administratorului resursei';
    return [{ key: 'waiting', title, icon: <IconClock size={14} />, color: 'yellow' }];
  }
  return [];
}

function cancellationStep(reservation: Reservation): HistoryItem[] {
  const cancellation = reservation.cancellation;
  if (!cancellation) {
    return [];
  }
  const by = cancellation.cancelledBy;
  return [
    {
      key: 'cancelled',
      title: by ? `Anulată de ${by.name}` : 'Anulată automat',
      when: cancellation.cancelledAt,
      note: cancellation.reason,
      icon: <IconX size={14} />,
      color: 'red',
    },
  ];
}

/** Pașii cererii, în ordine: trimiterea, deciziile de aprobare, așteptarea sau anularea. */
function historyItems(reservation: Reservation): HistoryItem[] {
  const sent: HistoryItem = {
    key: 'sent',
    title: `Cerere trimisă de ${reservation.requester.name}`,
    when: reservation.createdAt,
    icon: <IconSend size={14} />,
    color: 'blue',
  };
  const decisions = reservation.approvals.map((approval): HistoryItem => {
    const approved = approval.decision === 'APPROVED';
    return {
      key: `approval-${String(approval.id)}`,
      title: `${approved ? 'Aprobată' : 'Respinsă'} de ${approval.approver.name} (${APPROVAL_STAGE_LABELS[approval.stage]})`,
      when: approval.decidedAt,
      note: approval.comment ?? null,
      icon: approved ? <IconCheck size={14} /> : <IconX size={14} />,
      color: approved ? 'green' : 'red',
    };
  });
  const auto: HistoryItem[] =
    reservation.approvalFlow === 'AUTO' && reservation.approvals.length === 0
      ? [
          {
            key: 'auto',
            title: 'Confirmată automat (resursă cu auto-aprobare)',
            icon: <IconCheck size={14} />,
            color: 'green',
          },
        ]
      : [];
  return [
    sent,
    ...auto,
    ...decisions,
    ...waitingStep(reservation),
    ...cancellationStep(reservation),
  ];
}

/** Istoricul cererii: cine a decis, când și cu ce motiv (cazul de utilizare 2.2). */
export function ReservationHistory({
  reservation,
}: {
  reservation: Reservation;
}): React.JSX.Element {
  const items = historyItems(reservation);
  return (
    <Timeline bulletSize={22} lineWidth={2} active={items.length - 1}>
      {items.map((item) => (
        <Timeline.Item key={item.key} title={item.title} bullet={item.icon} color={item.color}>
          {item.when && (
            <Text size="xs" c="dimmed">
              {formatDateTime(item.when)}
            </Text>
          )}
          {item.note && <Text size="sm">Motiv: {item.note}</Text>}
        </Timeline.Item>
      ))}
    </Timeline>
  );
}
