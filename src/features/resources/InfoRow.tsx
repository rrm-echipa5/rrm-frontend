import { Group, Text } from '@mantine/core';

/** Un rând etichetă - valoare, ca în listele din fișa resursei. */
export function InfoRow({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <Group justify="space-between" wrap="nowrap" gap="md">
      <Text size="sm" c="dimmed">
        {label}
      </Text>
      <Text size="sm" ta="right">
        {value}
      </Text>
    </Group>
  );
}
