import { createSlice } from '@reduxjs/toolkit';

import { selectAccessToken } from './authentication';
import { fetchCalendarEvents } from './api';

export const calendarEvents = createSlice({
  name: 'calendarEvents',
  initialState: {
    loading: {},
    map: {},
  },
  reducers: {
    setCalendarEvents: (state, { payload }) => {
      state.map[payload.calendarId] = payload.events;
    },
    setLoading: (state, { payload }) => {
      state.loading[payload.calendarId] = payload.loading;
    },
  },
});

const { setCalendarEvents, setLoading } = calendarEvents.actions;

export const selectIsEventsLoading = (state) =>
  Object.values(state.calendarEvents?.loading).some((i) => i);

export const selectCalendarEvents = (state, calendarId) => {
  if (selectIsEventsLoading(state) || !calendarId) return null;
  const calendarIds = calendarId.split(',');
  const events = calendarIds
    .map((id) => state.calendarEvents?.map[id] || [])
    .flat();
  return events.length > 0 ? events : null;
};

const loadCalendarEvents = ({ calendarId }) => async (dispatch, getState) => {
  if (selectCalendarEvents(getState(), calendarId)) return;
  const accessToken = selectAccessToken(getState());
  try {
    dispatch(setLoading({ calendarId, loading: true }));
    const items = await fetchCalendarEvents({ accessToken, calendarId });
    dispatch(
      setCalendarEvents({
        calendarId,
        events: items
          .map(({ id, summary, start, end }) => {
            // Filter out events that have no `dateTime`. Those are full day
            // events, they only have the field `date`.
            if (!start.dateTime) {
              return null;
            }

            // only return the fields we need
            return {
              id,
              summary,
              start: start.dateTime,
              end: end.dateTime,
            };
          })
          .filter(Boolean),
      })
    );
  } catch (e) {
    // do nothing
  } finally {
    dispatch(setLoading({ calendarId, loading: false }));
  }
};

export const loadCalendarsEvents = ({ calendarIdsString }) => async (
  dispatch
) => {
  if (!calendarIdsString) return;
  const calendarIds = calendarIdsString.split(',');
  calendarIds.forEach((calendarId) =>
    dispatch(loadCalendarEvents({ calendarId }))
  );
};

export default calendarEvents.reducer;
