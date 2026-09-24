import {
  useMemo,
  useState,
} from 'react'

import {
  Award,
  Ban,
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  Search,
  Users,
} from 'lucide-react'

import AthleteForm from './AthleteForm.jsx'
import AthleteProfileModal from './AthleteProfileModal.jsx'

import {
  getCompetitionAge,
} from '../lib/age.js'

function RosterPage({
  members,
  tournaments,
  allTournamentEntries,
  tournamentResults,
  onMembersChanged,
}) {
  const [searchTerm, setSearchTerm] =
    useState('')

  const [statusFilter, setStatusFilter] =
    useState('all')

  const [showForm, setShowForm] =
    useState(false)

  const [editingMember, setEditingMember] =
    useState(null)

  const [
    profileMember,
    setProfileMember,
  ] = useState(null)

  const activeMembers =
    members.filter(
      (member) =>
        member.is_active
    )

  const inactiveMembers =
    members.filter(
      (member) =>
        !member.is_active
    )

  const blackBelts =
    members.filter(
      (member) =>
        member.belt_rank
          ?.toLowerCase() ===
        'black'
    )

  const filteredMembers =
    useMemo(() => {
      const search =
        searchTerm
          .trim()
          .toLowerCase()

      return members.filter(
        (member) => {
          const fullName =
            `${member.first_name} ${member.last_name}`.toLowerCase()

          const belt =
            (
              member.belt_rank ||
              ''
            ).toLowerCase()

          const disciplines =
            [
              member.poomsae
                ? 'poomsae'
                : '',
              member.sparring
                ? 'sparring'
                : '',
              member.breaking
                ? 'breaking'
                : '',
            ].join(' ')

          const matchesSearch =
            !search ||
            fullName.includes(
              search
            ) ||
            belt.includes(
              search
            ) ||
            disciplines.includes(
              search
            )

          const matchesStatus =
            statusFilter ===
              'all' ||
            (statusFilter ===
              'active' &&
              member.is_active) ||
            (statusFilter ===
              'inactive' &&
              !member.is_active)

          return (
            matchesSearch &&
            matchesStatus
          )
        }
      )
    }, [
      members,
      searchTerm,
      statusFilter,
    ])

  function openAdd() {
    setEditingMember(null)
    setShowForm(true)
  }

  function openEdit(member) {
    setEditingMember(member)
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingMember(null)
  }

  function openProfile(member) {
    setProfileMember(member)
  }

  function closeProfile() {
    setProfileMember(null)
  }

  function getBeltClass(
    beltRank
  ) {
    const belt =
      beltRank?.toLowerCase()

    switch (belt) {
      case 'yellow':
        return 'mat-belt-yellow'

      case 'green':
        return 'mat-belt-green'

      case 'blue':
        return 'mat-belt-blue'

      case 'red':
        return 'mat-belt-red'

      case 'black':
        return 'mat-belt-black'

      default:
        return 'mat-belt-white'
    }
  }

  function renderDisciplines(
    member
  ) {
    const hasDisciplines =
      member.poomsae ||
      member.sparring ||
      member.breaking

    if (!hasDisciplines) {
      return (
        <span className="mat-muted">
          No disciplines selected
        </span>
      )
    }

    return (
      <>
        {member.poomsae && (
          <span className="mat-pill mat-poomsae">
            Poomsae
          </span>
        )}

        {member.sparring && (
          <span className="mat-pill mat-sparring">
            Sparring
          </span>
        )}

        {member.breaking && (
          <span className="mat-pill mat-breaking">
            Breaking
          </span>
        )}
      </>
    )
  }

  return (
    <div className="mat-page">

      <section className="mat-hero">

        <div>
          <div className="mat-eyebrow">
            Michigan Academy of Taekwondo
          </div>

          <h1 className="mat-page-title">
            Team Roster
          </h1>

          <p className="mat-page-description">
            Manage athletes and quickly
            access detailed profiles.
          </p>
        </div>

        <div className="mat-stats-card">

          <div className="mat-stat">
            <Users className="mat-stat-icon" />

            <div className="mat-stat-number">
              {members.length}
            </div>

            <div className="mat-stat-label">
              Total Athletes
            </div>
          </div>

          <div className="mat-stat">
            <CheckCircle2
              className="mat-stat-icon active"
            />

            <div className="mat-stat-number">
              {activeMembers.length}
            </div>

            <div className="mat-stat-label">
              Active
            </div>
          </div>

          <div className="mat-stat">
            <Ban
              className="mat-stat-icon inactive"
            />

            <div className="mat-stat-number">
              {inactiveMembers.length}
            </div>

            <div className="mat-stat-label">
              Inactive
            </div>
          </div>

          <div className="mat-stat">
            <Award
              className="mat-stat-icon black-belt"
            />

            <div className="mat-stat-number">
              {blackBelts.length}
            </div>

            <div className="mat-stat-label">
              Black Belts
            </div>
          </div>

        </div>

      </section>

      <section className="mat-panel">

        <div className="mat-toolbar">

          <div className="mat-search">

            <Search size={21} />

            <input
              type="search"
              placeholder="Search athlete, belt, or discipline..."
              value={searchTerm}
              onChange={(event) =>
                setSearchTerm(
                  event.target.value
                )
              }
            />

          </div>

          <div className="mat-toolbar-actions">

            <select
              className="mat-select"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <option value="all">
                All Athletes
              </option>

              <option value="active">
                Active
              </option>

              <option value="inactive">
                Inactive
              </option>
            </select>

            <button
              type="button"
              className="mat-primary-button"
              onClick={openAdd}
            >
              <Plus size={20} />
              Add Athlete
            </button>

          </div>

        </div>

        <div className="mat-roster-desktop">

          <div className="mat-table-container">

            <table className="mat-table">

              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>
                    Competition Age
                  </th>
                  <th>Belt</th>
                  <th>
                    Disciplines
                  </th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {filteredMembers.map(
                  (member) => (
                    <tr key={member.id}>

                      <td>
                        <button
                          type="button"
                          className="mat-athlete-profile-link"
                          onClick={() =>
                            openProfile(
                              member
                            )
                          }
                        >
                          {
                            member.first_name
                          }{' '}
                          {
                            member.last_name
                          }
                        </button>

                        <div className="mat-athlete-profile-hint">
                          View athlete profile
                        </div>
                      </td>

                      <td>
                        {getCompetitionAge(
                          member.birthdate
                        )}
                      </td>

                      <td>
                        <span
                          className={`mat-pill mat-belt ${getBeltClass(
                            member.belt_rank
                          )}`}
                        >
                          {member.belt_rank ||
                            'White'}
                        </span>
                      </td>

                      <td>
                        <div className="mat-discipline-list">
                          {renderDisciplines(
                            member
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`mat-pill ${
                            member.is_active
                              ? 'mat-active-pill'
                              : 'mat-inactive-pill'
                          }`}
                        >
                          {member.is_active
                            ? 'Active'
                            : 'Inactive'}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="mat-edit-button"
                          onClick={() =>
                            openEdit(
                              member
                            )
                          }
                        >
                          <Pencil
                            size={15}
                          />
                          Edit
                        </button>
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

        </div>

        <div className="mat-roster-mobile">

          <div className="mat-roster-mobile-list">

            {filteredMembers.map(
              (member) => (
                <article
                  key={member.id}
                  className={`mat-roster-mobile-card${
                    member.is_active
                      ? ''
                      : ' inactive'
                  }`}
                >

                  <div className="mat-roster-mobile-card-header">

                    <div className="mat-roster-mobile-name-area">

                      <button
                        type="button"
                        className="mat-roster-mobile-name"
                        onClick={() =>
                          openProfile(
                            member
                          )
                        }
                      >
                        {
                          member.first_name
                        }{' '}
                        {
                          member.last_name
                        }
                      </button>

                      <div className="mat-roster-mobile-meta">
                        <span>
                          Competition Age{' '}
                          <strong>
                            {getCompetitionAge(
                              member.birthdate
                            )}
                          </strong>
                        </span>
                      </div>

                    </div>

                    <span
                      className={`mat-pill ${
                        member.is_active
                          ? 'mat-active-pill'
                          : 'mat-inactive-pill'
                      }`}
                    >
                      {member.is_active
                        ? 'Active'
                        : 'Inactive'}
                    </span>

                  </div>

                  <div className="mat-roster-mobile-details">

                    <div className="mat-roster-mobile-detail-group">

                      <span className="mat-roster-mobile-label">
                        Belt
                      </span>

                      <div>
                        <span
                          className={`mat-pill mat-belt ${getBeltClass(
                            member.belt_rank
                          )}`}
                        >
                          {member.belt_rank ||
                            'White'}
                        </span>
                      </div>

                    </div>

                    <div className="mat-roster-mobile-detail-group">

                      <span className="mat-roster-mobile-label">
                        Disciplines
                      </span>

                      <div className="mat-discipline-list">
                        {renderDisciplines(
                          member
                        )}
                      </div>

                    </div>

                  </div>

                  <div className="mat-roster-mobile-actions">

                    <button
                      type="button"
                      className="mat-roster-mobile-profile-button"
                      onClick={() =>
                        openProfile(
                          member
                        )
                      }
                    >
                      <Eye size={18} />
                      View Profile
                    </button>

                    <button
                      type="button"
                      className="mat-roster-mobile-edit-button"
                      onClick={() =>
                        openEdit(
                          member
                        )
                      }
                    >
                      <Pencil size={17} />
                      Edit
                    </button>

                  </div>

                </article>
              )
            )}

          </div>

        </div>

        {filteredMembers.length ===
          0 && (
          <div className="mat-roster-empty">
            No athletes match your
            current search.
          </div>
        )}

      </section>

      {showForm && (
        <AthleteForm
          editingMember={
            editingMember
          }
          onClose={closeForm}
          onSaved={
            onMembersChanged
          }
        />
      )}

      {profileMember && (
        <AthleteProfileModal
          member={
            profileMember
          }
          tournaments={
            tournaments || []
          }
          allTournamentEntries={
            allTournamentEntries || []
          }
          tournamentResults={
            tournamentResults || []
          }
          onMembersChanged={
            onMembersChanged
          }
          onClose={
            closeProfile
          }
        />
      )}

    </div>
  )
}

export default RosterPage