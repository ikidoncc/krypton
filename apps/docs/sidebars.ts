import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  kryptonSidebar: [
    {
      type: 'doc',
      id: 'intro',
      label: 'Introdução',
    },
    {
      type: 'category',
      label: 'Começando',
      items: [
        'getting-started/installation',
        'getting-started/running-locally',
        'getting-started/structure',
      ],
    },
    {
      type: 'category',
      label: 'Arquitetura',
      items: ['architecture/overview', 'architecture/data-flow', 'architecture/communication'],
    },
    {
      type: 'category',
      label: 'Engine',
      items: ['engine/gamestate', 'engine/board', 'engine/turns', 'engine/teams', 'engine/victory'],
    },
    {
      type: 'category',
      label: 'Network',
      items: ['network/webrtc', 'network/signaling', 'network/messages'],
    },
    {
      type: 'category',
      label: 'UI',
      items: ['ui/components', 'ui/hooks'],
    },
    {
      type: 'doc',
      id: 'packages',
      label: 'Packages',
    },
    {
      type: 'doc',
      id: 'deploy',
      label: 'Deploy',
    },
    {
      type: 'doc',
      id: 'contribution',
      label: 'Contribuição',
    },
    {
      type: 'category',
      label: 'ADR',
      items: [
        'adr/0001-project-structure',
        'adr/0002-webrtc',
        'adr/0003-engine',
        'adr/0004-state-management',
      ],
    },
    {
      type: 'doc',
      id: 'roadmap',
      label: 'Roadmap',
    },
  ],
};

export default sidebars;
