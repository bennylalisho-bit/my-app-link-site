export interface Vehicle {
  number: string;
  driver: string;
  passengers: string[];
  note?: string;
}

export interface StatusGroup {
  status: string;
  employees: string[];
}

export interface DailyArrangement {
  dropOffVehicles: Vehicle[];
  pickUpVehicles: Vehicle[];
  statusGroups: StatusGroup[];
}

export interface HolidayArrangement {
  vehicles: Vehicle[];
}

export interface WeekendArrangement {
  departure: Vehicle[];
  arrival: Vehicle[];
  departureDate: string;
  arrivalDate: string;
}

export const EMPLOYEES_LIST: string[] = [
  "יוני",
  "אביתר",
  "שגיא",
  "יקיר",
  "חיים",
  "ישראל",
  "בתאל07",
  "ששי",
  "מושיקו",
  "איציק",
  "גיא",
  "נגוסה",
  "ישעיהו",
  "עבודי",
  "אדם",
  "מעיין",
  "עידו",
  "שהם",
  "וואפי",
  "משען",
  "עידן07",
  "מאיה",
  "אפיק",
  "דבוש",
  "יהודה",
  "ששון",
  "עדי",
  "גל",
  "אור",
  "רוני",
  "נעם",
  "שמעיה",
  "יניב",
  "נג'יב",
  "נתנאל",
  "גילי",
  "אילן",
  "בנימיני",
  "אלון",
  "אופיר",
  "בסט",
  "סויסה",
  "אביגדור",
  "שני",
  "סתיו",
  "קבילו",
  "מיכאל",
  "שלומית",
  "גבאי",
  "ספיר07",
  "תומר",
  "סמרלי",
  "עמיהוד",
  "אושרת",
  "רותם",
  "אייל. ר",
  "קסלסי",
  "קנופ",
  "ברק",
  "זיד",
  "טופאן",
  "ענאן",
  "ספא",
  "דניאל",
  "אלפסה",
  "צמרת",
  "פיני",
  "מיכל",
  "אדי",
  "פיראס",
  "בני",
  "ליאור",
  "לירון",
  "נויה",
  "גיטהון",
  "איתי",
  "בן עמי",
  "חגי",
  "יעקב",
  "באדי",
  "סיון",
  "טארק",
  "טאפש",
  "שירן",
  "שי",
  "סהר",
  "עידן",
  "ספיר",
  "בתאל",
];

export const VEHICLES_LIST: string[] = [
  "003",
  "301",
  "401",
  "450",
  "501",
  "502",
  "601",
  "628",
  "679",
  "702",
  "703",
  "717",
  "603",
  "403",
];

export const STATUS_OPTIONS: string[] = [
  "חופש",
  "מילואים",
  "עצמאי",
  "תפקיד",
];

export function createEmptyVehicle(): Vehicle {
  return {
    number: "",
    driver: "",
    passengers: [""],
    note: "",
  };
}

export function createEmptyStatusGroup(): StatusGroup {
  return {
    status: "",
    employees: [""],
  };
}

export function createEmptyDailyArrangement(): DailyArrangement {
  return {
    dropOffVehicles: [createEmptyVehicle()],
    pickUpVehicles: [createEmptyVehicle()],
    statusGroups: [createEmptyStatusGroup()],
  };
}

export function createEmptyHolidayArrangement(): HolidayArrangement {
  return {
    vehicles: [createEmptyVehicle()],
  };
}

export function createEmptyWeekendArrangement(
  departureDate: string,
  arrivalDate: string
): WeekendArrangement {
  return {
    departure: [createEmptyVehicle()],
    arrival: [createEmptyVehicle()],
    departureDate,
    arrivalDate,
  };
}

export function formatDateToId(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function formatWeekendId(
  departureDate: Date,
  arrivalDate: Date
): string {
  return `${formatDateToId(departureDate)}_${formatDateToId(arrivalDate)}`;
}
