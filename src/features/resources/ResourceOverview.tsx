import { Anchor, Badge, Card, Center, Group, Image, Stack, Text, Title } from '@mantine/core';
import { IconFileTypePdf } from '@tabler/icons-react';
import { useState } from 'react';

import type { ResourceDetail, ResourceFile } from '../../api/types';
import { formatFileSize } from './formatters';
import { InfoRow } from './InfoRow';

function PhotoPlaceholder(): React.JSX.Element {
  return (
    <Center h={240} bg="gray.1">
      <Text size="sm" c="dimmed">
        Fotografie resursă
      </Text>
    </Center>
  );
}

/** Poza resursei; dacă nu se poate încărca, rămâne locul gol din prototip. */
function Photo({ file }: { file: ResourceFile }): React.JSX.Element {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <PhotoPlaceholder />;
  }
  return (
    <Image
      src={file.url}
      alt={file.title}
      h={240}
      fit="cover"
      onError={() => {
        setFailed(true);
      }}
    />
  );
}

function Manuals({ files }: { files: ResourceFile[] }): React.JSX.Element {
  if (files.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Resursa nu are manuale încărcate.
      </Text>
    );
  }
  return (
    <Group gap="sm">
      {files.map((file) => (
        <Anchor
          key={file.id}
          href={file.url}
          target="_blank"
          rel="noreferrer"
          size="sm"
          px="sm"
          py={6}
          bd="1px solid var(--mantine-color-default-border)"
          style={{ borderRadius: 'var(--mantine-radius-md)' }}
        >
          <Group gap={6} wrap="nowrap">
            <IconFileTypePdf size={16} aria-hidden />
            <span>{file.title}</span>
            <Text span size="xs" c="dimmed">
              {formatFileSize(file.sizeBytes)}
            </Text>
          </Group>
        </Anchor>
      ))}
    </Group>
  );
}

/** Fișa propriu-zisă: poza, descrierea, specificațiile, tag-urile și manualele PDF. */
export function ResourceOverview({ resource }: { resource: ResourceDetail }): React.JSX.Element {
  const photo = resource.files.find((file) => file.type === 'PHOTO');
  const manuals = resource.files.filter((file) => file.type === 'MANUAL');

  return (
    <Card withBorder padding="lg">
      <Card.Section>{photo ? <Photo file={photo} /> : <PhotoPlaceholder />}</Card.Section>
      <Stack gap="lg" mt="lg">
        {resource.description && <Text>{resource.description}</Text>}
        <div>
          <Title order={4} mb="sm">
            Specificații
          </Title>
          <Stack gap={8}>
            <InfoRow label="Categorie" value={resource.category.name} />
            <InfoRow label="Locație" value={resource.location ?? '—'} />
            <InfoRow label="Responsabil" value={resource.administrator.name} />
            {Object.entries(resource.specifications).map(([name, value]) => (
              <InfoRow key={name} label={name} value={value} />
            ))}
          </Stack>
        </div>
        {resource.tags.length > 0 && (
          <Group gap={6}>
            {resource.tags.map((tag) => (
              <Badge key={tag} variant="outline" color="gray" tt="none" fw={400}>
                {tag}
              </Badge>
            ))}
          </Group>
        )}
        <div>
          <Title order={4} mb="sm">
            Manuale
          </Title>
          <Manuals files={manuals} />
        </div>
      </Stack>
    </Card>
  );
}
