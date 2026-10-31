import './AthleteCalendarPage.css'
import CalendarPage from './CalendarPage.jsx'

/*
  The athlete calendar mirrors the coach
  calendar exactly, minus editing and
  private lessons.
*/

function AthleteCalendarPage({
  calendarEvents = [],
  tournaments = [],
}) {
  return (
    <CalendarPage
      calendarEvents={
        calendarEvents
      }
      tournaments={
        tournaments
      }
      readOnly
    />
  )
}

export default AthleteCalendarPage
