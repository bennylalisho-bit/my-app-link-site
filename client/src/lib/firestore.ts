import { db } from "./firebase";
import {
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  Unsubscribe,
} from "firebase/firestore";
import {
  DailyArrangement,
  HolidayArrangement,
  WeekendArrangement,
  createEmptyDailyArrangement,
  createEmptyHolidayArrangement,
  createEmptyWeekendArrangement,
  formatDateToId,
  formatWeekendId,
} from "./types";

const DEBOUNCE_DELAY = 800;

let debounceTimers: Map<string, NodeJS.Timeout> = new Map();

function debounce(key: string, fn: () => void): void {
  const existingTimer = debounceTimers.get(key);
  if (existingTimer) {
    clearTimeout(existingTimer);
  }
  const timer = setTimeout(() => {
    fn();
    debounceTimers.delete(key);
  }, DEBOUNCE_DELAY);
  debounceTimers.set(key, timer);
}

export function subscribeToDailyArrangement(
  date: Date,
  callback: (data: DailyArrangement) => void
): Unsubscribe {
  const dateId = formatDateToId(date);
  const docRef = doc(db, "daily_arrangements", dateId);

  return onSnapshot(docRef, async (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as DailyArrangement);
    } else {
      const emptyData = createEmptyDailyArrangement();
      await setDoc(docRef, emptyData);
      callback(emptyData);
    }
  });
}

export function saveDailyArrangement(
  date: Date,
  data: DailyArrangement
): void {
  const dateId = formatDateToId(date);
  debounce(`daily_${dateId}`, async () => {
    const docRef = doc(db, "daily_arrangements", dateId);
    await setDoc(docRef, data, { merge: true });
    console.log("Daily arrangement saved:", dateId);
  });
}

export function subscribeToHolidayArrangement(
  date: Date,
  callback: (data: HolidayArrangement) => void
): Unsubscribe {
  const dateId = formatDateToId(date);
  const docRef = doc(db, "holiday_arrangements", dateId);

  return onSnapshot(docRef, async (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as HolidayArrangement);
    } else {
      const emptyData = createEmptyHolidayArrangement();
      await setDoc(docRef, emptyData);
      callback(emptyData);
    }
  });
}

export function saveHolidayArrangement(
  date: Date,
  data: HolidayArrangement
): void {
  const dateId = formatDateToId(date);
  debounce(`holiday_${dateId}`, async () => {
    const docRef = doc(db, "holiday_arrangements", dateId);
    await setDoc(docRef, data, { merge: true });
    console.log("Holiday arrangement saved:", dateId);
  });
}

export function subscribeToWeekendArrangement(
  departureDate: Date,
  arrivalDate: Date,
  callback: (data: WeekendArrangement) => void
): Unsubscribe {
  const weekendId = formatWeekendId(departureDate, arrivalDate);
  const docRef = doc(db, "weekend_arrangements", weekendId);

  return onSnapshot(docRef, async (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as WeekendArrangement);
    } else {
      const emptyData = createEmptyWeekendArrangement(
        formatDateToId(departureDate),
        formatDateToId(arrivalDate)
      );
      await setDoc(docRef, emptyData);
      callback(emptyData);
    }
  });
}

export function saveWeekendArrangement(
  departureDate: Date,
  arrivalDate: Date,
  data: WeekendArrangement
): void {
  const weekendId = formatWeekendId(departureDate, arrivalDate);
  debounce(`weekend_${weekendId}`, async () => {
    const docRef = doc(db, "weekend_arrangements", weekendId);
    await setDoc(docRef, data, { merge: true });
    console.log("Weekend arrangement saved:", weekendId);
  });
}
