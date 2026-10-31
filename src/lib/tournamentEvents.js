// Every event MAT athletes can compete in, grouped the way coaches see them.
export const EVENT_GROUPS = [
  {
    label: 'Sparring',
    events: [
      'Sparring',
    ],
  },
  {
    label: 'Recognized Poomsae',
    events: [
      'Recognized Poomsae - Individual',
    ],
  },
  {
    label: 'World Class Poomsae',
    events: [
      'World Class Poomsae - Individual',
      'World Class Poomsae - Mixed Pairs',
      'World Class Poomsae - Team',
    ],
  },
  {
    label: 'Traditional Poomsae',
    events: [
      'Traditional Poomsae',
    ],
  },
  {
    label: 'Board Breaking',
    events: [
      'Board Breaking',
    ],
  },
  {
    label: 'Weapons',
    events: [
      'Weapons',
    ],
  },
]

export const ALL_TOURNAMENT_EVENTS = EVENT_GROUPS.flatMap((group) => group.events)

// Tournaments saved before events could be chosen have no list, so they offer everything.
export function getTournamentEvents(tournament) {
  const offered = tournament?.available_events

  if (!Array.isArray(offered) || offered.length === 0) {
    return ALL_TOURNAMENT_EVENTS
  }

  return ALL_TOURNAMENT_EVENTS.filter((eventName) => offered.includes(eventName))
}

export function getTournamentEventGroups(tournament) {
  const offered = getTournamentEvents(tournament)

  return EVENT_GROUPS
    .map((group) => ({
      ...group,
      events: group.events.filter((eventName) => offered.includes(eventName)),
    }))
    .filter((group) => group.events.length > 0)
}

// Short label for a single event inside its group, e.g. "Mixed Pairs".
export function getEventOptionLabel(group, eventName) {
  const fullGroup = EVENT_GROUPS.find((item) => item.label === group.label) || group

  if (fullGroup.events.length === 1) {
    return group.label
  }

  return eventName.replace(`${group.label} - `, '')
}
