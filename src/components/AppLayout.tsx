import { AppShell, Container, Group, Text, Title } from '@mantine/core';
import { NavLink, Outlet } from 'react-router';

const NAV_LINKS = [{ to: '/', label: 'Acasă' }];

/** Cadrul comun al paginilor: antetul cu numele aplicației și meniul. */
export function AppLayout(): React.JSX.Element {
  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between">
            <Title order={3}>Research Resource Manager</Title>
            <Group gap="lg" component="nav">
              {NAV_LINKS.map((link) => (
                <Text key={link.to} component={NavLink} to={link.to} fw={500}>
                  {link.label}
                </Text>
              ))}
            </Group>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="lg">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
