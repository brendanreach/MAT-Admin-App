export function getCurrentAge(birthdate) {
  if (!birthdate) {
    return '—'
  }

  const birth = new Date(`${birthdate}T00:00:00`)

  if (Number.isNaN(birth.getTime())) {
    return '—'
  }

  const today = new Date()

  let age =
    today.getFullYear() -
    birth.getFullYear()

  const birthdayPassed =
    today.getMonth() >
      birth.getMonth() ||
    (today.getMonth() ===
      birth.getMonth() &&
      today.getDate() >=
        birth.getDate())

  if (!birthdayPassed) {
    age--
  }

  return age
}

export function getCompetitionAge(birthdate) {
  if (!birthdate) {
    return '—'
  }

  const birthYear =
    Number(
      String(birthdate).slice(0, 4)
    )

  if (
    Number.isNaN(birthYear) ||
    birthYear <= 0
  ) {
    return '—'
  }

  const currentYear =
    new Date().getFullYear()

  return currentYear - birthYear
}
