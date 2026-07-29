import { useState, useEffect, useMemo, useRef } from "react";
import { BusColumn } from "./components/BusColumn.tsx";
import { FloatingPool } from "./components/FloatingPool";
import { PlusCircle, Zap, Home, Sun, PartyPopper, Share2, CloudUpload, CloudDownload, Calendar, Loader2, Lock, LogOut, Trash2, Copy, Users, Printer, KeyRound, UserCheck, Search, History, RotateCcw, X, Menu, Undo2, Eraser, Edit } from "lucide-react";
import { toPng } from 'html-to-image';
import { db } from "./lib/firebase";
import { doc, setDoc, getDoc, updateDoc, collection, getDocs, deleteDoc, addDoc, query, orderBy, limit, onSnapshot } from "firebase/firestore";

const WhatsAppIcon = ({ size = 20, color = "currentColor" }: { size?: number, color?: string }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill={color}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

const DateInput = ({ value, onChange, className, iconClassName }: { value: string, onChange: (val: string) => void, className?: string, iconClassName?: string }) => {
  const [textVal, setTextVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (value) {
      const [y, m, d] = value.split('-');
      setTextVal(`${d}/${m}/${y}`);
    }
  }, [value]);
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTextVal(val);
    const match = val.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
    if (match) {
      const d = match[1].padStart(2, '0');
      const m = match[2].padStart(2, '0');
      const y = match[3];
      onChange(`${y}-${m}-${d}`);
    }
  };
  const openPicker = () => {
    if (inputRef.current) {
        if ('showPicker' in inputRef.current) {
            (inputRef.current as any).showPicker();
        } else {
            inputRef.current.click();
        }
    }
  };
  return (
    <div className={`flex items-center gap-2 bg-white/90 px-3 py-1 rounded border transition-colors relative ${className}`}>
      <button onClick={openPicker} className="focus:outline-none" title="פתח יומן"><Calendar className={`w-5 h-5 ${iconClassName}`}/></button>
      <input type="text" value={textVal} onChange={handleTextChange} maxLength={10} className={`font-black text-xl bg-transparent focus:outline-none w-36 text-center ${iconClassName}`} placeholder="DD/MM/YYYY" dir="ltr" />
      <input ref={inputRef} type="date" value={value} onChange={(e) => onChange(e.target.value)} className="invisible absolute bottom-0 left-0 w-0 h-0" tabIndex={-1} />
    </div>
  );
};

const SignatureFooter = () => (
  <div className="mt-8 mb-4 flex justify-end px-4 opacity-90">
    <img src="/signature.png" alt="חתימה" className="h-10 w-auto object-contain drop-shadow-md" onError={(e) => e.currentTarget.style.display = 'none'} />
  </div>
);

type Assignments = Record<string, string>;
type Notes = Record<string, string>;
interface PoolGroup { names: string[]; type: 'big' | 'special' | 'small'; preferredVehicle?: string; }
interface HistoryState { assignments: Assignments; notes: Notes; scatterPoolList: string[]; collectionPoolList: string[]; weekendPoolList: string[]; vacationPoolList: string[]; statusColumns?: string[]; }

const INITIAL_USERS = [
  { id: "309451854", name: "בני ללישו", role: "admin", password: "309451854" },
  { id: "028639508", name: "אלון וולך", role: "editor", password: "028639508" },
  { id: "027704311", name: "אסף שהם", role: "editor", password: "027704311" },
  { id: "024940512", name: "שמואל גבאי", role: "editor", password: "024940512" },
  { id: "999999999", name: "עובד כללי", role: "viewer", password: "123" }
];

// מילון תאריכי חגים לאנימציה (לשנים 2026-2027)
const HOLIDAYS_ISRAEL: Record<string, string> = {
  "2026-03-03": "פורים", "2026-04-01": "ליל הסדר", "2026-04-02": "פסח", "2026-04-08": "שביעי של פסח",
  "2026-04-22": "יום העצמאות", "2026-05-22": "ערב שבועות", "2026-05-23": "חג שבועות", "2026-09-11": "ראש השנה",
  "2026-09-12": "ראש השנה", "2026-09-20": "ערב יום כיפור", "2026-09-21": "יום כיפור", "2026-09-25": "ערב סוכות",
  "2026-09-26": "סוכות", "2026-10-02": "ערב שמחת תורה", "2026-10-03": "שמחת תורה",
  "2027-03-23": "פורים", "2027-04-21": "ליל הסדר", "2027-04-22": "פסח", "2027-04-28": "שביעי של פסח",
  "2027-05-12": "יום העצמאות", "2027-06-11": "ערב שבועות", "2027-06-12": "חג שבועות", "2027-10-01": "ראש השנה",
  "2027-10-02": "ראש השנה", "2027-10-10": "ערב יום כיפור", "2027-10-11": "יום כיפור", "2027-10-15": "ערב סוכות",
  "2027-10-16": "סוכות", "2027-10-22": "ערב שמחת תורה", "2027-10-23": "שמחת תורה",
};

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(true);
  const [currentUser, setCurrentUser] = useState<{id: string, name: string, role: string} | null>(null);
  const [loginId, setLoginId] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [isWhatsappLoading, setIsWhatsappLoading] = useState(false);
  const [lastSavedInfo, setLastSavedInfo] = useState("");
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isUserManagerOpen, setIsUserManagerOpen] = useState(false);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [newUser, setNewUser] = useState({ id: "", name: "", password: "", role: "editor" });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingUserData, setEditingUserData] = useState({ id: "", name: "", password: "", role: "editor" });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [isHistoryMode, setIsHistoryMode] = useState(false);
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [itemToRestore, setItemToRestore] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [personalNotes, setPersonalNotes] = useState("");
  const [highlightedNames, setHighlightedNames] = useState<string[]>([]);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const APP_VERSION = "v1.1"; // ברגע שתרצה להקפיץ עדכון חדש בעתיד, פשוט תשנה את המספר כאן (למשל ל-v1.2)
  
  useEffect(() => {
    const savedVersion = localStorage.getItem("appVersion");
    if (savedVersion !== APP_VERSION) {
      setShowUpdateModal(true);
    }
  }, []);
  const [isVacationModalOpen, setIsVacationModalOpen] = useState(false);
  const [vacationRawText, setVacationRawText] = useState("");
  const [isVacationPoolOpen, setIsVacationPoolOpen] = useState(false);
  const [vacationPoolList, setVacationPoolList] = useState<string[]>([]);
  const [selectedVacationNames, setSelectedVacationNames] = useState<string[]>([]);
  const [vacationStatuses, setVacationStatuses] = useState<Record<string, string>>({}); 

  const [draggingColIdx, setDraggingColIdx] = useState<number | null>(null);
  const [dragOverColIdx, setDragOverColIdx] = useState<number | null>(null);

  const handlePersonalNoteKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === 'Enter') { e.preventDefault(); setPersonalNotes(prev => prev + '\n• '); } };
  const handlePersonalNoteFocus = () => { if (!personalNotes) setPersonalNotes("• "); };

  const [undoStack, setUndoStack] = useState<HistoryState[]>([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  const allEmployees = [
    "יוני", "אביתר", "שגיא", "יקיר", "חיים", "ישראל", "בתאל", "ששי", "מושיקו", "איציק", "גיא", "נגוסה",
    "ישעיהו", "עבודי", "אדם", "מעיין", "עידו", "שהם", "וואפי", "משען", "עידן07", "עידן", "מאיה", "אפיק", "דבוש",
    "יהודה", "ששון", "עדי", "גל", "אור", "רוני", "נעם", "שמעיה", "יניב", "נג'יב", "נתנאל", "גילי", "אילן",
    "בנימיני", "אלון", "אופיר", "בסט", "סויסה", "אביגדור", "שני", "סתיו", "קבילו", "מיכאל", "שלומית", "גבאי",
    "ספיר", "תומר", "סמרלי", "עמיהוד", "אושרת", "רותם", "אייל. ר", "קסלסי", "קנופ", "ברק", "זיד",
    "טופאן", "ענאן", "ספא", "דניאל", "אלפסה", "צמרת", "פיני", "מיכל", "אדי", "פיראס", "בני", "ליאור", "לירון",
    "נויה", "גיטהון", "איתי", "בן עמי", "חגי", "יעקב", "באדי", "סיון", "טארק", "טאפש", "שירן", "שי", "סהר", "בתאל07"
  ];
  const weekendShifts: Record<string, string[]> = {
    "1": ["אביתר", "בסט", "משען", "אייל. ר", "אילן", "איציק", "שהם", "קסלסי", "בתאל", "גילי", "זיד", "יקיר", "ישעיהו", "נגוסה", "עידן", "עמיהוד", "רוני", "רותם", "שגיא", "תומר"],
    "2": ["קנופ", "אדם", "טאפש", "אפיק", "ברק", "גיא", "גיטהון", "וואפי", "טארק", "טופאן", "יהודה", "יוני", "מיכל", "שמעיה", "נויה", "נעם", "סיון", "ספא", "עידו", "סמרלי"],
    "3": ["אביגדור", "אור", "קבילו", "אושרת", "בן עמי", "איתי", "בני", "גל", "מאיה", "מיכאל", "ספיר", "סתיו", "עדי", "ענאן", "פיני", "צמרת", "בנימיני", "דניאל", "שני"],
    "4": ["אדי", "אופיר", "אלון", "דבוש", "באדי", "חגי", "חיים", "יניב", "יעקב", "ישראל", "ליאור", "לירון", "מושיקו", "נג'יב", "נתנאל", "סהר", "פיראס", "שי", "שירן", "שלומית", "ששי"]
  };
  const nameAliases: Record<string, string> = { "עידן07": "עידן", "עידן": "עידן07", "בתאל07": "בתאל", "בתאל": "בתאל07" };
  const getBaseName = (name: string) => { if (name === "עידן07") return "עידן"; if (name === "בתאל07") return "בתאל"; return name; };

  const [currentView, setCurrentView] = useState<'home' | 'holiday' | 'weekend'>('home');
  const initialVehicles = ["003", "501", "703", "403", "603", "450", "628", "401", "502", "679", "717", "301", "601", "702"];
  const [scatterVehicles, setScatterVehicles] = useState([...initialVehicles]);
  const [collectionVehicles, setCollectionVehicles] = useState([...initialVehicles]);
  const [holidayVehicles, setHolidayVehicles] = useState(["", "", "", "", "", ""]);
  const [holidayDaysCount, setHolidayDaysCount] = useState(1);
  const [fridayVehicles, setFridayVehicles] = useState(["", "", "", "", "", ""]);
  const [saturdayVehicles, setSaturdayVehicles] = useState(["", "", "", "", "", ""]);
  const [statusColumns, setStatusColumns] = useState(["חופש", "חופש", "עצמאי", "עצמאי", "עצמאי", "מילואים", "קורס"]);
  const [holidayStatusCols, setHolidayStatusCols] = useState<string[]>([]);
  const [fridayStatusCols, setFridayStatusCols] = useState<string[]>([]);
  const [saturdayStatusCols, setSaturdayStatusCols] = useState<string[]>([]);
const [scatterDate, setScatterDate] = useState(new Date().toISOString().split('T')[0]);
  const [collectionDate, setCollectionDate] = useState("");
  
  // הנה ה-States המתוקנים - רק אלו שצריכים להופיע:
  const [collectionNote, setCollectionNote] = useState("");
  const [isVehicleSaved, setIsVehicleSaved] = useState(false);

const handleVehicleNoteChange = (val: string) => {
  // אנחנו מניחים שהמשתמש מקליד רק את המספר, אז ננקה מה שיש לנו
  // אם הוא מוחק הכל, נחזיר לערך הריק
  if (val === "" || val === "רכב כוננות ") {
    setCollectionNote("");
    return;
  }

  // ננקה את הטקסט מהמילה הקבועה כדי להוציא רק את המספרים
  const rawNumber = val.replace("רכב כוננות ", "");
  setCollectionNote(val);

  // אם יש 3 ספרות, שומרים
  if (rawNumber.length === 3) {
    updateFirebaseLive({ collectionNote: val });
    setIsVehicleSaved(true);
    setTimeout(() => setIsVehicleSaved(false), 500);
  }
};
  const [scatterGeneralNote, setScatterGeneralNote] = useState("");
  const [holidayDate, setHolidayDate] = useState(new Date().toISOString().split('T')[0]);
  const [fridayDate, setFridayDate] = useState(new Date().toISOString().split('T')[0]);

  const saturdayDate = useMemo(() => {
    const date = new Date(fridayDate); date.setDate(date.getDate() + 1); return date.toISOString().split('T')[0];
  }, [fridayDate]);

  const autoCollectionDate = useMemo(() => {
    if (!scatterDate) return "";
    const [year, month, day] = scatterDate.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const daysToAdd = date.getDay() === 4 ? 3 : 1;
    date.setDate(date.getDate() + daysToAdd);
    const nextY = date.getFullYear();
    const nextM = String(date.getMonth() + 1).padStart(2, '0');
    const nextD = String(date.getDate()).padStart(2, '0');
    return `${nextY}-${nextM}-${nextD}`;
  }, [scatterDate]);

  const displayCollectionDate = collectionDate || autoCollectionDate;

  const [assignments, setAssignments] = useState<Assignments>({});
  const [notes, setNotes] = useState<Notes>({});
  const [isScatterPoolOpen, setIsScatterPoolOpen] = useState(false);
  const [scatterPoolList, setScatterPoolList] = useState<string[]>([]);
  const [isCollectionPoolOpen, setIsCollectionPoolOpen] = useState(false);
  const [collectionPoolList, setCollectionPoolList] = useState<string[]>([]);
  const [isWeekendPoolOpen, setIsWeekendPoolOpen] = useState(false);
  const [weekendPoolList, setWeekendPoolList] = useState<string[]>([]);
  const [selectedWeekendNames, setSelectedWeekendNames] = useState<string[]>([]);
  const [isGlobalPoolOpen, setIsGlobalPoolOpen] = useState(false);
  const [selectedScatterNames, setSelectedScatterNames] = useState<string[]>([]);
  const [selectedCollectionNames, setSelectedCollectionNames] = useState<string[]>([]);
  const [selectedGlobalNames, setSelectedGlobalNames] = useState<string[]>([]);

  const initializeUsers = async () => {
    for (const user of INITIAL_USERS) {
      const docRef = doc(db, "users", user.id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) await setDoc(docRef, { name: user.name, password: user.password, role: user.role });
    }
  };

  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) { setIsLoggedIn(true); setCurrentUser(JSON.parse(savedUser)); setShowLoginModal(false); }
    initializeUsers();
}, [collectionNote]);

  useEffect(() => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    const todayStr = today.toISOString().split('T')[0];
    if (scatterDate && scatterDate < todayStr) {
      setScatterDate(todayStr); setCollectionDate(""); 
      if (isLoggedIn && currentUser?.role !== 'viewer') updateFirebaseLive({ scatterDate: todayStr, collectionDate: "" });
    }
  }, [scatterDate, isLoggedIn, currentUser]);

  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "schedules", "main_schedule"), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setAssignments(d.assignments || {}); setNotes(d.notes || {});
        if(d.highlightedNames) setHighlightedNames(d.highlightedNames);
        if(d.scatterVehicles) setScatterVehicles(d.scatterVehicles);
        if(d.collectionVehicles) setCollectionVehicles(d.collectionVehicles);
        if(d.holidayVehicles) setHolidayVehicles(d.holidayVehicles);
        if(d.fridayVehicles) setFridayVehicles(d.fridayVehicles);
        if(d.saturdayVehicles) setSaturdayVehicles(d.saturdayVehicles);
        if(d.statusColumns) setStatusColumns(d.statusColumns);
        if(d.holidayStatusCols) setHolidayStatusCols(d.holidayStatusCols);
        if(d.fridayStatusCols) setFridayStatusCols(d.fridayStatusCols);
        if(d.saturdayStatusCols) setSaturdayStatusCols(d.saturdayStatusCols);
        if (d.scatterDate) setScatterDate(d.scatterDate); 
        if (d.collectionDate) setCollectionDate(d.collectionDate);
        setHolidayDate(d.holidayDate || new Date().toISOString().split('T')[0]);
        setFridayDate(d.fridayDate || new Date().toISOString().split('T')[0]);
        if(d.collectionNote) setCollectionNote(d.collectionNote || "");
        if(d.scatterGeneralNote) setScatterGeneralNote(d.scatterGeneralNote || "");
        if(d.personalNotes) setPersonalNotes(d.personalNotes);
        if(d.holidayDaysCount) setHolidayDaysCount(d.holidayDaysCount);
        if(d.scatterPoolList) setScatterPoolList(d.scatterPoolList);
        if(d.collectionPoolList) setCollectionPoolList(d.collectionPoolList);
        if(d.weekendPoolList) setWeekendPoolList(d.weekendPoolList);
        if(d.vacationPoolList) setVacationPoolList(d.vacationPoolList || []); 
        if (d.lastSavedBy && d.lastSavedAt) setLastSavedInfo(`נשמר לאחרונה ע"י ${d.lastSavedBy} ב-${d.lastSavedAt}`);
      }
    }, (error) => console.error("Error connecting to live updates:", error));
    return () => unsubscribe();
  }, []); 

  const saveCheckpoint = () => {
    if (isHistoryMode) return;
    setUndoStack(prev => {
        const newState: HistoryState = {
            assignments: { ...assignments }, notes: { ...notes }, scatterPoolList: [...scatterPoolList],
            collectionPoolList: [...collectionPoolList], weekendPoolList: [...weekendPoolList], vacationPoolList: [...vacationPoolList],
            statusColumns: [...statusColumns]
        };
        const newStack = [...prev, newState];
        if (newStack.length > 15) return newStack.slice(1);
        return newStack;
    });
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const lastState = undoStack[undoStack.length - 1];
    setAssignments(lastState.assignments); setNotes(lastState.notes); setScatterPoolList(lastState.scatterPoolList);
    setCollectionPoolList(lastState.collectionPoolList); setWeekendPoolList(lastState.weekendPoolList || []);
    setVacationPoolList(lastState.vacationPoolList || []); 
    if(lastState.statusColumns) setStatusColumns(lastState.statusColumns);
    setUndoStack(prev => prev.slice(0, -1));
  };

  const checkAuth = (action: () => void) => {
    if(isLoggedIn) {
      if (currentUser?.role === 'viewer') { alert("למשתמש צפייה אין הרשאת עריכה"); return; }
      action();
    } else { alert("יש להתחבר למצב עריכה"); }
  };

const updateFirebaseLive = async (newData: any) => {
    if (isHistoryMode) return;
    try {
      const saveTime = new Date().toLocaleString('he-IL');
      // משתמשים ב-merge כדי לא למחוק נתונים אחרים בטעות
     await updateDoc(doc(db, "schedules", "main_schedule"), { ...newData, lastSavedBy: currentUser?.name || "לא ידוע", lastSavedAt: saveTime }, { merge: true });
    } catch (e) { console.error("Live update error:", e); }
  };

  const handleScatterDateChange = (val: string) => {
    checkAuth(() => {
      setScatterDate(val);
      const [year, month, day] = val.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const daysToAdd = date.getDay() === 4 ? 3 : 1;
      date.setDate(date.getDate() + daysToAdd);
      const nextY = date.getFullYear();
      const nextM = String(date.getMonth() + 1).padStart(2, '0');
      const nextD = String(date.getDate()).padStart(2, '0');
      const nextDateStr = `${nextY}-${nextM}-${nextD}`;
      setCollectionDate(nextDateStr);
      updateFirebaseLive({ scatterDate: val, collectionDate: nextDateStr });
    });
  };

  const handleCollectionDateChange = (val: string) => { checkAuth(() => { setCollectionDate(val); updateFirebaseLive({ collectionDate: val }); }); };
const handleFridayDateChange = (val: string) => {
    checkAuth(() => {
      setFridayDate(val);
      updateFirebaseLive({ fridayDate: val });
    });
  };
 const handleHolidayDateChange = (val: string) => {
    checkAuth(() => {
      setHolidayDate(val);
      updateFirebaseLive({ holidayDate: val });
    });
  };

  const handleAddHolidayTable = () => {
    if (!isLoggedIn || currentUser?.role === 'viewer') return;
    saveCheckpoint();
    const newCount = holidayDaysCount + 1;
    setHolidayDaysCount(newCount);
    updateFirebaseLive({ holidayDaysCount: newCount });
  };
  const handleAssign = async (key: string, name: string) => {
    checkAuth(async () => {
      setAssignments(prev => { const newAssign = { ...prev, [key]: name }; updateFirebaseLive({ [`assignments.${key}`]: name }); return newAssign; });
      if (!isHistoryMode) saveCheckpoint();
    });
  };

  const handleNoteChange = async (key: string, value: string) => {
    checkAuth(async () => {
      setNotes(prev => { const newNotes = { ...prev, [key]: value }; updateFirebaseLive({ [`notes.${key}`]: value }); return newNotes; });
      if (!isHistoryMode) saveCheckpoint();
    });
  };

  const handleToggleHighlight = (name: string) => {
    if (!name || isReadOnly) return;
    const newHighlights = highlightedNames.includes(name) ? highlightedNames.filter(n => n !== name) : [...highlightedNames, name];
    setHighlightedNames(newHighlights); updateFirebaseLive({ highlightedNames: newHighlights });
  };

  const handleClearHighlights = () => { checkAuth(() => { setHighlightedNames([]); updateFirebaseLive({ highlightedNames: [] }); }); };

  const handleColumnDrop = (targetIdx: number) => {
    if (draggingColIdx === null || draggingColIdx === targetIdx) { setDraggingColIdx(null); setDragOverColIdx(null); return; }
    saveCheckpoint();
    
    const newCols = [...statusColumns];
    const [draggedCol] = newCols.splice(draggingColIdx, 1);
    newCols.splice(targetIdx, 0, draggedCol);

    const newAssign = { ...assignments };
    const newN = { ...notes };

    Object.keys(assignments).forEach(key => { if (key.startsWith("stat-")) delete newAssign[key]; });
    Object.keys(notes).forEach(key => { if (key.startsWith("stat-")) delete newN[key]; });

    const oldIndices = statusColumns.map((_, i) => i);
    const [draggedIdx] = oldIndices.splice(draggingColIdx, 1);
    oldIndices.splice(targetIdx, 0, draggedIdx);

    oldIndices.forEach((oldI, newI) => {
      const oldPrefix = `stat-${oldI}`;
      const newPrefix = `stat-${newI}`;
      if (notes[oldPrefix]) newN[newPrefix] = notes[oldPrefix];
      for(let r=1; r<=10; r++) {
        if(assignments[`${oldPrefix}-${r}`]) newAssign[`${newPrefix}-${r}`] = assignments[`${oldPrefix}-${r}`];
      }
    });

    setStatusColumns(newCols); setAssignments(newAssign); setNotes(newN);
    updateFirebaseLive({ statusColumns: newCols, assignments: newAssign, notes: newN });
    setDraggingColIdx(null); setDragOverColIdx(null);
  };

  const openTimetablePopup = () => {
    const width = 1000; const height = 700;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    window.open("https://main.timetable.co.il/Structure/mainpage.aspx", "TimetableWindow", `width=${width},height=${height},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no,scrollbars=yes`);
  };

  const sortColumnsWithData = (cols: string[], currentAssign: Assignments, currentNotes: Notes) => {
    const orderMap: Record<string, number> = { "חופש": 1, "מילואים": 2, "עצמאי": 3 };
    const mapped = cols.map((title, index) => ({ title, originalIndex: index }));
    mapped.sort((a, b) => {
      const orderA = orderMap[a.title] || 999;
      const orderB = orderMap[b.title] || 999;
      if (orderA !== orderB) return orderA - orderB;
      return a.title.localeCompare(b.title);
    });
    const newCols = mapped.map(m => m.title);
    const newAssign: Assignments = { ...currentAssign };
    const newN: Notes = { ...currentNotes };
    
    Object.keys(currentAssign).forEach(key => { if (key.startsWith("stat-")) delete newAssign[key]; });
    Object.keys(currentNotes).forEach(key => { if (key.startsWith("stat-")) delete newN[key]; });
    
    mapped.forEach((item, newIndex) => {
      const oldPrefix = `stat-${item.originalIndex}`;
      const newPrefix = `stat-${newIndex}`;
      if (currentNotes[oldPrefix]) newN[newPrefix] = currentNotes[oldPrefix];
      for (let r = 1; r <= 10; r++) {
        if (currentAssign[`${oldPrefix}-${r}`]) newAssign[`${newPrefix}-${r}`] = currentAssign[`${oldPrefix}-${r}`];
      }
    });
    return { newCols, newAssign, newN };
  };

  const handleParseVacations = () => {
    if (!vacationRawText.trim()) return;
    saveCheckpoint();
    const lines = vacationRawText.split('\n');
    const foundEmployees: string[] = [];
    const statuses: Record<string, string> = {};

    const fullNameToAppNames: Record<string, string> = {
      "אבי יפרח": "אביגדור", "אבי קנופ": "קנופ", "אדמונד ביטון": "אדי", "אדם סטנלי": "אדם", "אופיר כהן": "אופיר",
      "אורי בסט": "בסט", "אורי קבילו": "קבילו", "אור צמח": "אור", "אושרת כהן": "אושרת", "אייל בן עמי": "בן עמי",
      "אייל טאפש": "טאפש", "אייל משען": "משען", "אילן אחדות": "אילן", "איציק הררי": "איציק", "איתי זיתוני": "איתי",
      "אלון וולך": "אלון", "אסף דבוש": "דבוש", "אסף שהם": "שהם", "אפיק ראובן": "אפיק", "אריאל קסלסי": "קסלסי",
      "באדי אבו סאלח": "באדי", "בני ללישו": "בני", "ברק קרימסקי": "ברק", "בת אל חן": "בתאל", "גיא אלחדיף": "גיא",
      "גיטהון אברהם": "גיטהון", "גילייוניוב": "גילי", "גל לוי": "גל", "וואפי חמוד": "וואפי", "זיד חוראני": "זיד",
      "חגי סינואני": "חגי", "חיים כהן": "חיים", "טארק עזו": "טארק", "טופאן ספדי": "טופאן", "יהודה לוי": "יהודה",
      "יוני חמץ": "יוני", "יניב פלוס": "יניב", "יעקב איילה": "יעקב", "יקיר שיטרית": "יקיר", "ישעיהו אמבאיי": "ישעיהו",
      "ישראל מזרחי": "ישראל", "ליאור אשרף": "ליאור", "לירון קיבנשטיין": "לירון", "מאיה לביא": "מאיה",
      "מושיקו סעדון": "מושיקו", "מיכאל רסמן": "מיכאל", "מיכל סויסה": "מיכל", "מעין ביאזי": "מעיין",
      "משה שמעיה": "שמעיה", "נגוסה אמרה": "נגוסה", "נגיב אבו דרע": "נג'יב", "נויה דקל": "נויה",
      "נעם הראלי": "נעם", "נתנאל הלפגוט": "נתנאל", "סהר שוב": "סהר", "סיון פז": "סיון", "ספא דגש": "ספא",
      "ספיר ביטון": "ספיר", "סתיו רנדי": "סתיו", "עדי אלבז": "עדי", "עידו שני": "עידו", "עידן יהודה": "עידן",
      "עמיהוד רז": "עמיהוד", "ענאן קאזמל": "ענאן", "פיני חוג'ה": "פיני", "פיראס נג'ם": "פיראס", "צמרת ואזנה": "צמרת",
      "רוני יצחק": "רוני", "רונן בינימיני": "בנימיני", "רותם בנית": "רותם", "רפי סויסה": "סויסה", "שגיא שבני": "שגיא",
      "שירן אפללו": "שירן", "שי שוורץ": "שי", "שלומי סמרלי": "סמרלי", "שלומית גל": "שלומית", "שלמה עבודי": "עבודי",
      "שמואל אלפסה": "אלפסה", "שמואל גבאי": "גבאי", "שמואל דניאל": "דניאל", "שני אסייג": "שני", "ששון מנחם": "ששון",
      "ששי עייני": "ששי", "תומר מתתיה": "תומר", "אביתר כהן": "אביתר"
    };

    const escapeRegExp = (string: string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    lines.forEach(line => {
      let matchedEmp = "";
      for (const [fullName, appName] of Object.entries(fullNameToAppNames)) {
        if (line.includes(fullName)) { matchedEmp = appName; break; }
      }
      if (!matchedEmp) {
        for (const emp of allEmployees) {
          const escapedEmp = escapeRegExp(emp);
          const regex = new RegExp(`(^|\\s|[•\\-])` + escapedEmp + `(\\s|$|[\\(\\)])`);
          if (regex.test(line)) { matchedEmp = emp; break; }
        }
      }
      if (matchedEmp) {
         foundEmployees.push(matchedEmp);
         statuses[matchedEmp] = line.includes("מילואים") ? "מילואים" : "חופש";
      }
    });

    const uniqueFound = [...new Set(foundEmployees)];
    setVacationPoolList(uniqueFound); setVacationStatuses(statuses);
    updateFirebaseLive({ vacationPoolList: uniqueFound });
    setVacationRawText(""); setIsVacationModalOpen(false); setIsVacationPoolOpen(true); 
    
    if(uniqueFound.length > 0) alert(`זוהו בהצלחה ${uniqueFound.length} עובדים והועברו למאגר החופשות.`);
    else alert("לא זוהו עובדים מתוך הטקסט שהודבק.");
  };

  const handleAutoAssignVacations = () => {
    if (!isLoggedIn || currentUser?.role === 'viewer') return;
    if (vacationPoolList.length === 0) return;
    saveCheckpoint();

    let newAssignments = { ...assignments };
    let newStatusCols = [...statusColumns];
    let newNotes = { ...notes };
    let employeesToProcess = [...vacationPoolList];
    const targetTypes = ["חופש", "מילואים"];

    for (let i = 0; i < newStatusCols.length; i++) {
      if (targetTypes.includes(newStatusCols[i])) {
        for (let r = 1; r <= 10; r++) { delete newAssignments[`stat-${i}-${r}`]; }
      }
    }

    employeesToProcess.forEach(emp => {
      Object.keys(newAssignments).forEach(key => {
        if (newAssignments[key] === emp && (key.startsWith('col-') || key.startsWith('stat-'))) { delete newAssignments[key]; }
      });
    });

    const incomingHopesh = employeesToProcess.filter(emp => vacationStatuses[emp] !== "מילואים");
    const incomingMiluim = employeesToProcess.filter(emp => vacationStatuses[emp] === "מילואים");
    const hopeshColsNeeded = Math.max(1, Math.ceil(incomingHopesh.length / 10));
    const miluimColsNeeded = Math.max(1, Math.ceil(incomingMiluim.length / 10));

    const nonAbsenceIndices = newStatusCols.map((c, i) => !targetTypes.includes(c) ? i : -1).filter(i => i !== -1);
    const tempOtherAssign: Record<string, string> = {};
    const tempOtherNotes: Record<string, string> = {};
    const tempOtherTitles: string[] = [];

    nonAbsenceIndices.forEach(oldIdx => {
      tempOtherTitles.push(newStatusCols[oldIdx]);
      const oldPrefix = `stat-${oldIdx}`;
      if (newNotes[oldPrefix]) tempOtherNotes[oldPrefix] = newNotes[oldPrefix];
      for (let r = 1; r <= 10; r++) {
        if (newAssignments[`${oldPrefix}-${r}`]) tempOtherAssign[`${oldPrefix}-${r}`] = newAssignments[`${oldPrefix}-${r}`];
      }
    });

    Object.keys(newAssignments).forEach(key => { if (key.startsWith("stat-")) delete newAssignments[key]; });
    Object.keys(newNotes).forEach(key => { if (key.startsWith("stat-")) delete newNotes[key]; });

    const rebuiltAbsenceCols: string[] = [];
    for (let i = 0; i < hopeshColsNeeded; i++) rebuiltAbsenceCols.push("חופש");
    for (let i = 0; i < miluimColsNeeded; i++) rebuiltAbsenceCols.push("מילואים");

    const finalCols = [...rebuiltAbsenceCols, ...tempOtherTitles];

    let hPtr = 0;
    for (let i = 0; i < hopeshColsNeeded; i++) {
      for (let r = 1; r <= 10; r++) {
        if (hPtr < incomingHopesh.length) { newAssignments[`stat-${i}-${r}`] = incomingHopesh[hPtr]; hPtr++; }
      }
    }

    let mPtr = 0;
    for (let i = hopeshColsNeeded; i < hopeshColsNeeded + miluimColsNeeded; i++) {
      for (let r = 1; r <= 10; r++) {
        if (mPtr < incomingMiluim.length) { newAssignments[`stat-${i}-${r}`] = incomingMiluim[mPtr]; mPtr++; }
      }
    }

    const shiftOffset = rebuiltAbsenceCols.length;
    nonAbsenceIndices.forEach((oldIdx, idx) => {
      const newIdx = shiftOffset + idx;
      const oldPrefix = `stat-${oldIdx}`; const newPrefix = `stat-${newIdx}`;
      if (tempOtherNotes[oldPrefix]) newNotes[newPrefix] = tempOtherNotes[oldPrefix];
      for (let r = 1; r <= 10; r++) {
        if (tempOtherAssign[`${oldPrefix}-${r}`]) newAssignments[`${newPrefix}-${r}`] = tempOtherAssign[`${oldPrefix}-${r}`];
      }
    });

    setStatusColumns(finalCols); setAssignments(newAssignments); setNotes(newNotes);
    setVacationPoolList([]); setVacationStatuses({});

    updateFirebaseLive({ statusColumns: finalCols, assignments: newAssignments, notes: newNotes, vacationPoolList: [] });
    setIsVacationPoolOpen(false);
    setIsGlobalPoolOpen(true); 
    alert(`העובדים שובצו בהצלחה!\nעמודות החופש והמילואים מוקמו בימין.\nעובדים שחזרו נוקו מהחופשות והועברו ל'מי לא שובץ'.`);
  };

  const removeFromPool = (type: 'scatter' | 'collection' | 'weekend' | 'vacation', name: string) => checkAuth(() => {
     let newPool = [];
     if(type === 'scatter') { newPool = scatterPoolList.filter(n => n !== name); setScatterPoolList(newPool); updateFirebaseLive({ scatterPoolList: newPool }); }
     else if (type === 'collection') { newPool = collectionPoolList.filter(n => n !== name); setCollectionPoolList(newPool); updateFirebaseLive({ collectionPoolList: newPool }); }
     else if (type === 'weekend') { newPool = weekendPoolList.filter(n => n !== name); setWeekendPoolList(newPool); updateFirebaseLive({ weekendPoolList: newPool }); }
     else if (type === 'vacation') { newPool = vacationPoolList.filter(n => n !== name); setVacationPoolList(newPool); updateFirebaseLive({ vacationPoolList: newPool }); }
  });

  const clearPool = (type: 'scatter' | 'collection' | 'weekend' | 'vacation') => checkAuth(() => {
     if(type === 'scatter') { setScatterPoolList([]); updateFirebaseLive({ scatterPoolList: [] }); }
     else if (type === 'collection') { setCollectionPoolList([]); updateFirebaseLive({ collectionPoolList: [] }); }
     else if (type === 'weekend') { setWeekendPoolList([]); updateFirebaseLive({ weekendPoolList: [] }); }
     else if (type === 'vacation') { setVacationPoolList([]); updateFirebaseLive({ vacationPoolList: [] }); }
  });

  const handleAddManualName = (name: string, type: 'scatter' | 'collection' | 'weekend' | 'vacation') => {
    if (!name.trim()) return; saveCheckpoint();
    if (type === 'scatter') { const newPool = [...scatterPoolList, name]; setScatterPoolList(newPool); updateFirebaseLive({ scatterPoolList: newPool }); }
    else if (type === 'collection') { const newPool = [...collectionPoolList, name]; setCollectionPoolList(newPool); updateFirebaseLive({ collectionPoolList: newPool }); }
    else if (type === 'weekend') { const newPool = [...weekendPoolList, name]; setWeekendPoolList(newPool); updateFirebaseLive({ weekendPoolList: newPool }); }
    else if (type === 'vacation') { const newPool = [...vacationPoolList, name]; setVacationPoolList(newPool); updateFirebaseLive({ vacationPoolList: newPool }); }
  };

  const handleSmartRestore = (historyItem: any, type: 'full' | 'scatter' | 'collection' | 'holiday' | 'weekend') => {
      checkAuth(() => {
          saveCheckpoint();
          let newAssignments = { ...assignments }; let newNotes = { ...notes }; let updates: any = {};
          const clearKeys = (prefixes: string[]) => {
              Object.keys(newAssignments).forEach(key => { if (prefixes.some(p => key.startsWith(p))) delete newAssignments[key]; });
              Object.keys(newNotes).forEach(key => { if (prefixes.some(p => key.startsWith(p))) delete newNotes[key]; });
          };
          const copyKeys = (prefixes: string[], sourceAssign: any, sourceNotes: any) => {
               if(sourceAssign) { Object.entries(sourceAssign).forEach(([k, v]) => { if (prefixes.some(p => k.startsWith(p))) newAssignments[k] = v as string; }); }
               if(sourceNotes) { Object.entries(sourceNotes).forEach(([k, v]) => { if (prefixes.some(p => k.startsWith(p))) newNotes[k] = v as string; }); }
          };

          if (type === 'full') {
              newAssignments = historyItem.assignments || {}; newNotes = historyItem.notes || {};
              if(historyItem.scatterVehicles) { setScatterVehicles(historyItem.scatterVehicles); updates.scatterVehicles = historyItem.scatterVehicles; }
              if(historyItem.collectionVehicles) { setCollectionVehicles(historyItem.collectionVehicles); updates.collectionVehicles = historyItem.collectionVehicles; }
              if(historyItem.holidayVehicles) { setHolidayVehicles(historyItem.holidayVehicles); updates.holidayVehicles = historyItem.holidayVehicles; }
              if(historyItem.fridayVehicles) { setFridayVehicles(historyItem.fridayVehicles); updates.fridayVehicles = historyItem.fridayVehicles; }
              if(historyItem.saturdayVehicles) { setSaturdayVehicles(historyItem.saturdayVehicles); updates.saturdayVehicles = historyItem.saturdayVehicles; }
              if(historyItem.statusColumns) { setStatusColumns(historyItem.statusColumns); updates.statusColumns = historyItem.statusColumns; }
              if(historyItem.holidayStatusCols) { setHolidayStatusCols(historyItem.holidayStatusCols); updates.holidayStatusCols = historyItem.holidayStatusCols; }
              if(historyItem.fridayStatusCols) { setFridayStatusCols(historyItem.fridayStatusCols); updates.fridayStatusCols = historyItem.fridayStatusCols; }
              if(historyItem.saturdayStatusCols) { setSaturdayStatusCols(historyItem.saturdayStatusCols); updates.saturdayStatusCols = historyItem.saturdayStatusCols; }
              if(historyItem.scatterDate) { setScatterDate(historyItem.scatterDate); updates.scatterDate = historyItem.scatterDate; }
              if(historyItem.collectionDate) { setCollectionDate(historyItem.collectionDate); updates.collectionDate = historyItem.collectionDate; }
              if(historyItem.holidayDate) { setHolidayDate(historyItem.holidayDate); updates.holidayDate = historyItem.holidayDate; }
              if(historyItem.fridayDate) { setFridayDate(historyItem.fridayDate); updates.fridayDate = historyItem.fridayDate; }
              if(historyItem.scatterPoolList) { setScatterPoolList(historyItem.scatterPoolList); updates.scatterPoolList = historyItem.scatterPoolList; }
              if(historyItem.collectionPoolList) { setCollectionPoolList(historyItem.collectionPoolList); updates.collectionPoolList = historyItem.collectionPoolList; }
              if(historyItem.weekendPoolList) { setWeekendPoolList(historyItem.weekendPoolList); updates.weekendPoolList = historyItem.weekendPoolList; }
              if(historyItem.vacationPoolList) { setVacationPoolList(historyItem.vacationPoolList); updates.vacationPoolList = historyItem.vacationPoolList; }
          } else if (type === 'scatter') {
              clearKeys(['scat-']); copyKeys(['scat-'], historyItem.assignments, historyItem.notes);
              if(historyItem.scatterVehicles) { setScatterVehicles(historyItem.scatterVehicles); updates.scatterVehicles = historyItem.scatterVehicles; }
              if(historyItem.scatterDate) { setScatterDate(historyItem.scatterDate); updates.scatterDate = historyItem.scatterDate; }
              if(historyItem.scatterPoolList) { setScatterPoolList(historyItem.scatterPoolList); updates.scatterPoolList = historyItem.scatterPoolList; }
          } else if (type === 'collection') {
              clearKeys(['col-', 'stat-']); copyKeys(['col-', 'stat-'], historyItem.assignments, historyItem.notes);
              if(historyItem.collectionVehicles) { setCollectionVehicles(historyItem.collectionVehicles); updates.collectionVehicles = historyItem.collectionVehicles; }
              if(historyItem.statusColumns) { setStatusColumns(historyItem.statusColumns); updates.statusColumns = historyItem.statusColumns; }
              if(historyItem.collectionPoolList) { setCollectionPoolList(historyItem.collectionPoolList); updates.collectionPoolList = historyItem.collectionPoolList; }
          } else if (type === 'holiday') {
              clearKeys(['hol-']); copyKeys(['hol-'], historyItem.assignments, historyItem.notes);
              if(historyItem.holidayVehicles) { setHolidayVehicles(historyItem.holidayVehicles); updates.holidayVehicles = historyItem.holidayVehicles; }
              if(historyItem.holidayStatusCols) { setHolidayStatusCols(historyItem.holidayStatusCols); updates.holidayStatusCols = historyItem.holidayStatusCols; }
              if(historyItem.holidayDate) { setHolidayDate(historyItem.holidayDate); updates.holidayDate = historyItem.holidayDate; }
          } else if (type === 'weekend') {
              clearKeys(['fri-', 'sat-']); copyKeys(['fri-', 'sat-'], historyItem.assignments, historyItem.notes);
              if(historyItem.fridayVehicles) { setFridayVehicles(historyItem.fridayVehicles); updates.fridayVehicles = historyItem.fridayVehicles; }
              if(historyItem.saturdayVehicles) { setSaturdayVehicles(historyItem.saturdayVehicles); updates.saturdayVehicles = historyItem.saturdayVehicles; }
              if(historyItem.fridayStatusCols) { setFridayStatusCols(historyItem.fridayStatusCols); updates.fridayStatusCols = historyItem.fridayStatusCols; }
              if(historyItem.saturdayStatusCols) { setSaturdayStatusCols(historyItem.saturdayStatusCols); updates.saturdayStatusCols = historyItem.saturdayStatusCols; }
              if(historyItem.fridayDate) { setFridayDate(historyItem.fridayDate); updates.fridayDate = historyItem.fridayDate; }
              if(historyItem.weekendPoolList) { setWeekendPoolList(historyItem.weekendPoolList); updates.weekendPoolList = historyItem.weekendPoolList; }
          }

          setAssignments(newAssignments); setNotes(newNotes);
          updates.assignments = newAssignments; updates.notes = newNotes; updateFirebaseLive(updates);
          setIsRestoreModalOpen(false); setIsHistoryOpen(false); alert("שוכפל בהצלחה!");
      });
  };

  const handleLogin = async () => {
    if (loginPassword === "1011") {
      const tempAdmin = { id: "master", name: "מאסטר", role: "admin" };
      setIsLoggedIn(true); setCurrentUser(tempAdmin); localStorage.setItem("currentUser", JSON.stringify(tempAdmin)); setShowLoginModal(false); return;
    }
    if (!loginId || !loginPassword) { alert("נא להזין ת.ז וסיסמה"); return; }
    setIsLoginLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "users", loginId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.password === loginPassword) {
          const userRole = userData.role || 'viewer';
          const userObj = { id: loginId, name: userData.name, role: userRole };
          setIsLoggedIn(true); setCurrentUser(userObj); localStorage.setItem("currentUser", JSON.stringify(userObj)); setShowLoginModal(false);
        } else { alert("סיסמה שגויה"); }
      } else { alert("משתמש לא נמצא"); }
    } catch (e) { alert("שגיאת התחברות"); } finally { setIsLoginLoading(false); }
  };

  const handleLogout = () => {
    setIsLoggedIn(false); setCurrentUser(null); localStorage.removeItem("currentUser");
    setLoginId(""); setLoginPassword(""); setShowLoginModal(true);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 4) { alert("סיסמה קצרה מדי"); return; }
    if (!currentUser) return;
    try {
      if (currentUser.id === "master") { alert("לא ניתן לשנות למאסטר"); return; }
      await updateDoc(doc(db, "users", currentUser.id), { password: newPassword });
      alert("הסיסמה שונתה!"); setNewPassword(""); setIsChangePasswordOpen(false);
    } catch (e) { alert("שגיאה בשינוי סיסמה"); }
  };

  const fetchUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    const list: any[] = [];
    querySnapshot.forEach((doc) => list.push({ id: doc.id, ...doc.data() }));
    setUsersList(list);
  };

  const handleAddUser = async () => {
    if (!newUser.id || !newUser.name) return;
    try {
      await setDoc(doc(db, "users", newUser.id), { name: newUser.name, password: newUser.id, role: newUser.role });
      alert("משתמש נוסף!"); setNewUser({ id: "", name: "", password: "", role: "viewer" }); fetchUsers();
    } catch (e) { alert("שגיאה בהוספה"); }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("למחוק?")) return;
    try { await deleteDoc(doc(db, "users", userId)); fetchUsers(); } catch (e) { alert("שגיאה במחיקה"); }
  };

  const startEditUser = (user: any) => {
    setEditingUserId(user.id);
    setEditingUserData({ id: user.id, name: user.name, password: user.password || "", role: user.role || "editor" });
  };

  const saveEditUser = async (oldId: string) => {
    if (!editingUserData.id || !editingUserData.name) return;
    try {
      if (oldId !== editingUserData.id) {
        await deleteDoc(doc(db, "users", oldId));
        await setDoc(doc(db, "users", editingUserData.id), editingUserData);
      } else {
        await updateDoc(doc(db, "users", oldId), editingUserData);
      }
      alert("המשתמש עודכן בהצלחה!");
      setEditingUserId(null); fetchUsers();
    } catch (e) { alert("שגיאה בעדכון המשתמש"); }
  };

  const addStatusCol = (type: 'daily' | 'holiday' | 'friday' | 'saturday') => {
    if (type === 'daily') {
      const t = prompt("שם העמודה:");
      if (t) {
        saveCheckpoint();
        const lastIdx = statusColumns.lastIndexOf(t);
        let newCols = [...statusColumns];
        let insertIdx = newCols.length;
        if (lastIdx !== -1) { insertIdx = lastIdx + 1; newCols.splice(insertIdx, 0, t); } 
        else { newCols.push(t); }

        const newAssign = { ...assignments }; const newN = { ...notes };
        Object.keys(assignments).forEach(key => { if (key.startsWith("stat-")) delete newAssign[key]; });
        Object.keys(notes).forEach(key => { if (key.startsWith("stat-")) delete newN[key]; });

        const oldIndices = statusColumns.map((_, i) => i);
        if (lastIdx !== -1) { oldIndices.splice(insertIdx, 0, -1); } 
        else { oldIndices.push(-1); }

        oldIndices.forEach((oldIdx, newIndex) => {
          if (oldIdx === -1) return;
          const oldPrefix = `stat-${oldIdx}`; const newPrefix = `stat-${newIndex}`;
          if (notes[oldPrefix]) newN[newPrefix] = notes[oldPrefix];
          for (let r = 1; r <= 10; r++) {
            if (assignments[`${oldPrefix}-${r}`]) newAssign[`${newPrefix}-${r}`] = assignments[`${oldPrefix}-${r}`];
          }
        });

        setStatusColumns(newCols); setAssignments(newAssign); setNotes(newN);
        updateFirebaseLive({ statusColumns: newCols, assignments: newAssign, notes: newN });
      }
    } else {
      if (type === 'holiday') { const newList = [...holidayStatusCols, "עצמאי"]; setHolidayStatusCols(newList); updateFirebaseLive({ holidayStatusCols: newList }); }
      if (type === 'friday') { const newList = [...fridayStatusCols, "עצמאי"]; setFridayStatusCols(newList); updateFirebaseLive({ fridayStatusCols: newList }); }
      if (type === 'saturday') { const newList = [...saturdayStatusCols, "עצמאי"]; setSaturdayStatusCols(newList); updateFirebaseLive({ saturdayStatusCols: newList }); }
    }
  };

  const editStatusColName = (type: 'daily' | 'holiday' | 'friday' | 'saturday', index: number, newName: string) => {
    if (type === 'daily') { 
        saveCheckpoint();
        const tempCols = [...statusColumns]; tempCols[index] = newName; 
        setStatusColumns(tempCols);
        updateFirebaseLive({ statusColumns: tempCols });
    }
    else if (type === 'holiday') { const cols = [...holidayStatusCols]; cols[index] = newName; setHolidayStatusCols(cols); updateFirebaseLive({ holidayStatusCols: cols }); }
    else if (type === 'friday') { const cols = [...fridayStatusCols]; cols[index] = newName; setFridayStatusCols(cols); updateFirebaseLive({ fridayStatusCols: cols }); }
    else if (type === 'saturday') { const cols = [...saturdayStatusCols]; cols[index] = newName; setSaturdayStatusCols(cols); updateFirebaseLive({ saturdayStatusCols: cols }); }
  };

  const removeStatusCol = (type: 'daily' | 'holiday' | 'friday' | 'saturday', index: number) => {
    if (!isLoggedIn || currentUser?.role === 'viewer') return;
    if (!confirm("למחוק עמודה זו?")) return;
    saveCheckpoint();

    let prefixType = ''; let listLength = 0; let list = [];

    if (type === 'daily') { prefixType = 'stat'; list = statusColumns; }
    else if (type === 'holiday') { prefixType = 'hol-stat'; list = holidayStatusCols; }
    else if (type === 'friday') { prefixType = 'fri-stat'; list = fridayStatusCols; }
    else if (type === 'saturday') { prefixType = 'sat-stat'; list = saturdayStatusCols; }
    
    listLength = list.length;
    const newAssignments = { ...assignments }; const newNotes = { ...notes };

    const removedPrefix = `${prefixType}-${index}`;
    Object.keys(newAssignments).forEach(key => { if (key.startsWith(removedPrefix)) delete newAssignments[key]; });
    if (newNotes[removedPrefix]) delete newNotes[removedPrefix];

    for (let i = index + 1; i < listLength; i++) {
        const oldPrefix = `${prefixType}-${i}`; const newPrefix = `${prefixType}-${i - 1}`;
        if (newNotes[oldPrefix]) { newNotes[newPrefix] = newNotes[oldPrefix]; delete newNotes[oldPrefix]; }
        for (let seat = 1; seat <= 10; seat++) {
            const oldKey = `${oldPrefix}-${seat}`; const newKey = `${newPrefix}-${seat}`;
            if (newAssignments[oldKey]) { newAssignments[newKey] = newAssignments[oldKey]; delete newAssignments[oldKey]; }
        }
    }

    setAssignments(newAssignments); setNotes(newNotes);
    const newList = list.filter((_, i) => i !== index);

    if (type === 'daily') { setStatusColumns(newList); updateFirebaseLive({ statusColumns: newList, assignments: newAssignments, notes: newNotes }); }
    if (type === 'holiday') { setHolidayStatusCols(newList); updateFirebaseLive({ holidayStatusCols: newList, assignments: newAssignments, notes: newNotes }); }
    if (type === 'friday') { setFridayStatusCols(newList); updateFirebaseLive({ fridayStatusCols: newList, assignments: newAssignments, notes: newNotes }); }
    if (type === 'saturday') { setSaturdayStatusCols(newList); updateFirebaseLive({ saturdayStatusCols: newList, assignments: newAssignments, notes: newNotes }); }
  };

  const removeVehicle = (type: 'scatter' | 'collection' | 'holiday' | 'friday' | 'saturday', index: number) => {
    if (!isLoggedIn || currentUser?.role === 'viewer') return;
    if (!confirm("למחוק רכב זה?")) return;
    saveCheckpoint();

    let prefixType = ''; let vehicleList: string[] = [];

    if (type === 'scatter') { prefixType = 'scat'; vehicleList = scatterVehicles; }
    else if (type === 'collection') { prefixType = 'col'; vehicleList = collectionVehicles; }
    else if (type === 'holiday') { prefixType = 'hol'; vehicleList = holidayVehicles; }
    else if (type === 'friday') { prefixType = 'fri'; vehicleList = fridayVehicles; }
    else if (type === 'saturday') { prefixType = 'sat'; vehicleList = saturdayVehicles; }

    const newAssignments = { ...assignments }; const newNotes = { ...notes };

    const removedId = vehicleList[index];
    let removedPrefix = "";
    if (['holiday', 'friday', 'saturday'].includes(type)) {
        removedPrefix = `${prefixType}-${index}`;
    } else {
        removedPrefix = `${prefixType}-${removedId}-${index}`;
    }

    Object.keys(newAssignments).forEach(key => { if (key.startsWith(removedPrefix)) delete newAssignments[key]; });
    if (newNotes[removedPrefix]) delete newNotes[removedPrefix];

    for (let i = index + 1; i < vehicleList.length; i++) {
        const vId = vehicleList[i];
        let oldPrefix = ""; let newPrefix = "";

        if (['holiday', 'friday', 'saturday'].includes(type)) {
            oldPrefix = `${prefixType}-${i}`;
            newPrefix = `${prefixType}-${i - 1}`;
        } else {
            oldPrefix = `${prefixType}-${vId}-${i}`;
            newPrefix = `${prefixType}-${vId}-${i - 1}`;
        }

        if (newNotes[oldPrefix]) {
            newNotes[newPrefix] = newNotes[oldPrefix];
            delete newNotes[oldPrefix];
        }

        for (let seat = 1; seat <= 10; seat++) {
            const oldKey = `${oldPrefix}-${seat}`;
            const newKey = `${newPrefix}-${seat}`;
            if (newAssignments[oldKey]) {
                newAssignments[newKey] = newAssignments[oldKey];
                delete newAssignments[oldKey];
            }
        }
    }

    setAssignments(newAssignments);
    setNotes(newNotes);
    
    const newList = vehicleList.filter((_, i) => i !== index);

    if (type === 'scatter') { setScatterVehicles(newList); updateFirebaseLive({ scatterVehicles: newList, assignments: newAssignments, notes: newNotes }); }
    else if (type === 'collection') { setCollectionVehicles(newList); updateFirebaseLive({ collectionVehicles: newList, assignments: newAssignments, notes: newNotes }); }
    else if (type === 'holiday') { setHolidayVehicles(newList); updateFirebaseLive({ holidayVehicles: newList, assignments: newAssignments, notes: newNotes }); }
    else if (type === 'friday') { setFridayVehicles(newList); updateFirebaseLive({ fridayVehicles: newList, assignments: newAssignments, notes: newNotes }); }
    else if (type === 'saturday') { setSaturdayVehicles(newList); updateFirebaseLive({ saturdayVehicles: newList, assignments: newAssignments, notes: newNotes }); }
  };

  const editVehicleName = (type: 'scatter' | 'collection', index: number, newName: string) => {
    if (!isLoggedIn || currentUser?.role === 'viewer') return;
    const oldId = type === 'scatter' ? scatterVehicles[index] : collectionVehicles[index];
    const prefixType = type === 'scatter' ? 'scat' : 'col';
    const oldPrefix = `${prefixType}-${oldId}-${index}`;
    const newPrefix = `${prefixType}-${newName}-${index}`;
    
    const newAssignments = { ...assignments };
    const newNotes = { ...notes };
    
    for (let i = 1; i <= 10; i++) {
      if (newAssignments[`${oldPrefix}-${i}`]) {
        newAssignments[`${newPrefix}-${i}`] = newAssignments[`${oldPrefix}-${i}`];
        delete newAssignments[`${oldPrefix}-${i}`];
      }
    }
    if (newNotes[oldPrefix]) { newNotes[newPrefix] = newNotes[oldPrefix]; delete newNotes[oldPrefix]; }
    
    setAssignments(newAssignments);
    setNotes(newNotes);
    
    if (type === 'scatter') { 
        const v = [...scatterVehicles]; v[index] = newName; 
        setScatterVehicles(v); 
        updateFirebaseLive({ scatterVehicles: v, assignments: newAssignments, notes: newNotes });
    } else { 
        const v = [...collectionVehicles]; v[index] = newName; 
        setCollectionVehicles(v); 
        updateFirebaseLive({ collectionVehicles: v, assignments: newAssignments, notes: newNotes });
    }
  };

  const handleCopyFridayToSaturday = () => {
    if (!isLoggedIn || currentUser?.role === 'viewer') return;
    if (!confirm("להעתיק משישי לשבת?")) return;
    saveCheckpoint();
    const newAssignments = { ...assignments };
    const newNotes = { ...notes };
    Object.keys(newAssignments).forEach(key => { if (key.startsWith("sat-")) delete newAssignments[key]; });
    Object.keys(newNotes).forEach(key => { if (key.startsWith("sat-")) delete newNotes[key]; });
    fridayVehicles.forEach((vehId, idx) => {
      const friNote = notes[`fri-${idx}`];
      if (friNote) newNotes[`sat-${idx}`] = friNote;
      for (let i = 1; i <= 9; i++) {
        const name = assignments[`fri-${idx}-${i}`];
        if (name) newAssignments[`sat-${idx}-${i}`] = name;
      }
    });
    fridayStatusCols.forEach((colTitle, idx) => {
      const friPrefix = `fri-stat-${idx}`;
      const satPrefix = `sat-stat-${idx}`;
      const note = notes[friPrefix];
      if(note) newNotes[satPrefix] = note;
      for (let i = 1; i <= 10; i++) {
        const name = assignments[`${friPrefix}-${i}`];
        if (name) newAssignments[`${satPrefix}-${i}`] = name;
      }
    });
    setAssignments(newAssignments); 
    setNotes(newNotes); 
    updateFirebaseLive({ assignments: newAssignments, notes: newNotes });
    alert("הועתק!");
  };

  const runWeekendAutomat = () => {
    if (!isLoggedIn || currentUser?.role === 'viewer') return;
    const input = prompt("בחר משמרת להוספה למאגר (1, 2, 3, 4):");
    if (!input || !["1","2","3","4"].includes(input)) return;
    const shiftEmployees = weekendShifts[input];
    if (!shiftEmployees || shiftEmployees.length === 0) { alert("משמרת זו ריקה."); return; }
    
    saveCheckpoint();
    
    const newPool = [...new Set([...weekendPoolList, ...shiftEmployees])];
    setWeekendPoolList(newPool);
    setIsWeekendPoolOpen(true);
    updateFirebaseLive({ weekendPoolList: newPool });
    
    alert(`נוספו ${shiftEmployees.length} עובדים למאגר הזמני של הסופ"ש.`);
  };

  const unassignedEmployees = useMemo(() => {
    const assignedSet = new Set<string>();
    Object.entries(assignments).forEach(([key, name]) => {
      if ((key.startsWith('col-') || key.startsWith('stat-')) && name.trim() !== "") {
        assignedSet.add(name);
        if (nameAliases[name]) assignedSet.add(nameAliases[name]);
      }
    });
    return allEmployees.filter(emp => !assignedSet.has(emp));
  }, [assignments, allEmployees]);

  const handleToggleSelect = (name: string, context: 'scatter' | 'collection' | 'weekend' | 'global' | 'vacation') => {
    if (!isLoggedIn) return;
    if (context === 'scatter') setSelectedScatterNames(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    else if (context === 'collection') setSelectedCollectionNames(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    else if (context === 'weekend') setSelectedWeekendNames(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    else if (context === 'global') setSelectedGlobalNames(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
    else if (context === 'vacation') setSelectedVacationNames(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  };

  const handleMultiDrop = (targetPrefix: string, startIndex: number, context: 'scatter' | 'collection' | 'weekend' | 'vacation') => {
    if (!isLoggedIn || currentUser?.role === 'viewer') return;
    
    let selectedNames: string[] = [];
    if (context === 'scatter') {
      selectedNames = selectedScatterNames;
    } else if (context === 'collection') {
       if(selectedCollectionNames.length > 0) selectedNames = selectedCollectionNames;
       else selectedNames = selectedGlobalNames;
    } else if (context === 'weekend') {
       selectedNames = selectedWeekendNames;
    } else if (context === 'vacation') {
       selectedNames = selectedVacationNames;
    }

    if (selectedNames.length === 0) return;
    saveCheckpoint();
    const newAssignments = { ...assignments };
    let didChange = false;
    let prefixesToClean: string[] = [];
    
    if (targetPrefix.startsWith('scat-') || targetPrefix.startsWith('col-')) {
      prefixesToClean = context === 'scatter' ? ['scat-'] : ['col-', 'stat-'];
    } else if (targetPrefix.startsWith('hol-')) { prefixesToClean = ['hol-']; }
    else if (targetPrefix.startsWith('fri-')) { prefixesToClean = ['fri-']; }
    else if (targetPrefix.startsWith('sat-')) { prefixesToClean = ['sat-']; }
    else if (targetPrefix.startsWith('stat-')) { prefixesToClean = ['col-', 'stat-']; }

    Object.keys(newAssignments).forEach(key => {
      const isRelevantKey = prefixesToClean.some(p => key.startsWith(p));
      if (isRelevantKey && selectedNames.includes(newAssignments[key])) {
        delete newAssignments[key];
        didChange = true;
      }
    });
    
    let newScatterPool = [...scatterPoolList];
    let newCollectionPool = [...collectionPoolList];
    let newWeekendPool = [...weekendPoolList];
    let newVacationPool = [...vacationPoolList];

    if (context === 'scatter' && newScatterPool.some(n => selectedNames.includes(n))) {
      newScatterPool = newScatterPool.filter(n => !selectedNames.includes(n));
      setScatterPoolList(newScatterPool);
      didChange = true;
    }
    if (context === 'collection' && newCollectionPool.some(n => selectedNames.includes(n))) {
      newCollectionPool = newCollectionPool.filter(n => !selectedNames.includes(n));
      setCollectionPoolList(newCollectionPool);
      didChange = true;
    }
    if (context === 'weekend' && newWeekendPool.some(n => selectedNames.includes(n))) {
      newWeekendPool = newWeekendPool.filter(n => !selectedNames.includes(n));
      setWeekendPoolList(newWeekendPool);
      didChange = true;
    }
    if (context === 'vacation' && newVacationPool.some(n => selectedNames.includes(n))) {
      newVacationPool = newVacationPool.filter(n => !selectedNames.includes(n));
      setVacationPoolList(newVacationPool);
      didChange = true;
    }

    let currentIndex = startIndex;
    selectedNames.forEach(name => {
      while (newAssignments[`${targetPrefix}-${currentIndex}`]) currentIndex++;
      if (currentIndex <= 10) { newAssignments[`${targetPrefix}-${currentIndex}`] = name; didChange = true; }
    });
    
    if (didChange) {
       setAssignments(newAssignments);
       updateFirebaseLive({ 
           assignments: newAssignments, 
           scatterPoolList: newScatterPool,
           collectionPoolList: newCollectionPool,
           weekendPoolList: newWeekendPool,
           vacationPoolList: newVacationPool
       });
    }
    
    setSelectedScatterNames([]);
    setSelectedCollectionNames([]);
    setSelectedWeekendNames([]);
    setSelectedGlobalNames([]);
    setSelectedVacationNames([]);
  };

  const handleDropToPool = (type: 'scatter' | 'collection' | 'weekend' | 'vacation') => {
    if (!isLoggedIn || currentUser?.role === 'viewer') return;
    let selectedNames: string[] = [];
    if (type === 'scatter') selectedNames = selectedScatterNames;
    else if (type === 'collection') selectedNames = selectedCollectionNames;
    else if (type === 'weekend') selectedNames = selectedWeekendNames;
    else selectedNames = selectedVacationNames;

    if (selectedNames.length === 0) return;
    saveCheckpoint();
    const newAssignments = { ...assignments };
    let prefixToCheck: string | string[];
    
    if (type === 'scatter') prefixToCheck = 'scat-';
    else if (type === 'collection') prefixToCheck = 'col-';
    else if (type === 'weekend') prefixToCheck = ['fri-', 'sat-'];
    else prefixToCheck = ['col-', 'stat-']; 
    
    Object.keys(newAssignments).forEach(key => { 
        let match = false;
        if (Array.isArray(prefixToCheck)) {
            match = prefixToCheck.some(p => key.startsWith(p));
        } else {
            match = key.startsWith(prefixToCheck) || (type === 'collection' && key.startsWith('stat-'));
        }

        if (match && selectedNames.includes(newAssignments[key])) { 
            delete newAssignments[key]; 
        } 
    });
    
    setAssignments(newAssignments);
    
    if (type === 'scatter') { 
        const newPool = [...scatterPoolList, ...selectedNames];
        setScatterPoolList(newPool); 
        setSelectedScatterNames([]); 
        updateFirebaseLive({ assignments: newAssignments, scatterPoolList: newPool });
    } else if (type === 'collection') { 
        const newPool = [...collectionPoolList, ...selectedNames];
        setCollectionPoolList(newPool); 
        setSelectedCollectionNames([]); 
        updateFirebaseLive({ assignments: newAssignments, collectionPoolList: newPool });
    } else if (type === 'weekend') {
        const newPool = [...weekendPoolList, ...selectedNames];
        setWeekendPoolList(newPool);
        setSelectedWeekendNames([]);
        updateFirebaseLive({ assignments: newAssignments, weekendPoolList: newPool });
    } else if (type === 'vacation') {
        const newPool = [...vacationPoolList, ...selectedNames];
        setVacationPoolList(newPool);
        setSelectedVacationNames([]);
        updateFirebaseLive({ assignments: newAssignments, vacationPoolList: newPool });
    }
  };

  const handleShareOrPrint = async () => {
    if (window.innerWidth < 768 && navigator.share) {
      setIsShareLoading(true);
      const originalStyle = printRef.current?.getAttribute("style") || "";
      
      const targetWidth = printRef.current ? Math.max(1280, printRef.current.scrollWidth + 40) : 1280;

      if(printRef.current) {
          printRef.current.style.backgroundColor = "#f3f4f6"; 
          printRef.current.style.fontSize = "1.05em"; 
      }
      
      setIsGeneratingImage(true);
      setTimeout(async () => {
        try {
          if (printRef.current) {
            const dataUrl = await toPng(printRef.current, { 
                cacheBust: true, 
                backgroundColor: '#f3f4f6', 
                width: targetWidth, 
                style: { width: `${targetWidth}px`, height: 'auto', overflow: 'visible', backgroundColor: '#f3f4f6', fontSize: '18px' }, 
                filter: (node) => !node.classList?.contains('no-print') 
            });
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `sidur_${scatterDate}.png`, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], title: 'סידור הסעות' });
            else alert("המכשיר לא תומך בשיתוף קבצים ישיר.");
          }
        } catch (error) { console.error('Error sharing:', error); alert("שגיאה ביצירת השיתוף"); }
        finally { 
            setIsGeneratingImage(false); 
            setIsShareLoading(false);
            if(printRef.current) printRef.current.setAttribute("style", originalStyle); 
        }
      }, 100);
    } else {
      let title = "סידור";
      if (currentView === 'home') title += `_${scatterDate}`;
      else if (currentView === 'holiday') title += `_חג_${holidayDate}`;
      else if (currentView === 'weekend') title += `_סופש_${fridayDate}`;
      const originalTitle = document.title; document.title = title; window.print(); document.title = originalTitle;
    }
  };

  const handleShareWhatsApp = async () => {
    setIsWhatsappLoading(true);
    const originalStyle = printRef.current?.getAttribute("style") || "";
    
    const targetWidth = printRef.current ? Math.max(1280, printRef.current.scrollWidth + 40) : 1280;

    if(printRef.current) {
        printRef.current.style.backgroundColor = "#f3f4f6"; 
    }

    setIsGeneratingImage(true);

    setTimeout(async () => {
      try {
        if (printRef.current) {
          const dataUrl = await toPng(printRef.current, {
             cacheBust: true,
             width: targetWidth, 
             height: printRef.current.scrollHeight,
             style: {
               backgroundImage: 'url(/watermark.jpg)',
               backgroundSize: 'cover',
               backgroundPosition: 'center',
               backgroundColor: '#f3f4f6', 
               display: 'flex',
               flexDirection: 'column',
               alignItems: 'center',
               justifyContent: 'center',
               padding: '20px',
               fontSize: '18px',
               width: `${targetWidth}px` 
             },
             filter: (node) => !node.classList?.contains('no-print')
          });

          if (window.innerWidth < 768 && navigator.share) {
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], `sidur_${scatterDate}.png`, { type: 'image/png' });
            if (navigator.canShare && navigator.canShare({ files: [file] })) await navigator.share({ files: [file] });
          } else {
            const link = document.createElement('a'); link.download = `sidur_${scatterDate}.png`; link.href = dataUrl; link.click();
            setTimeout(() => { alert("התמונה ירדה למחשב. כעת ייפתח וואטסאפ - גרור את התמונה לשם."); window.open("https://web.whatsapp.com/", "_blank"); }, 1000);
          }
        }
      } catch (error) { console.error('WhatsApp Share Error:', error); alert("שגיאה בשיתוף לוואטסאפ"); }
      finally { 
        setIsGeneratingImage(false); 
        setIsWhatsappLoading(false);
        if(printRef.current) printRef.current.setAttribute("style", originalStyle); 
      }
    }, 100); 
  };

  const fetchHistory = async () => {
    try {
      const q = query(collection(db, "history"), orderBy("createdAt", "desc"), limit(100)); // עודכן ל-100!
      const snapshot = await getDocs(q);
      const list: any[] = [];
      snapshot.forEach(doc => { 
          const data = doc.data(); 
          list.push({ 
              id: doc.id, 
              displayDate: data.createdAt ? data.createdAt.toDate().toLocaleString('he-IL') : "תאריך לא ידוע", 
              savedBy: data.savedBy || "לא ידוע",
              ...data 
          }); 
      });
      setHistoryList(list); setIsHistoryOpen(true);
    } catch (error) { alert("שגיאה בטעינת היסטוריה"); }
  };

  const loadHistoryItem = (item: any) => {
    if (confirm(`לטעון את הסידור מ-${item.displayDate}? זהו מצב צפייה בלבד.`)) { 
        setAssignments(item.assignments || {}); 
        setNotes(item.notes || {});
        if(item.scatterDate) setScatterDate(item.scatterDate);
        if(item.collectionDate) setCollectionDate(item.collectionDate);
        if(item.holidayDate) setHolidayDate(item.holidayDate);
        if(item.fridayDate) setFridayDate(item.fridayDate);
        if(item.scatterPoolList) setScatterPoolList(item.scatterPoolList);
        if(item.collectionPoolList) setCollectionPoolList(item.collectionPoolList);
        if(item.weekendPoolList) setWeekendPoolList(item.weekendPoolList);
        if(item.highlightedNames) setHighlightedNames(item.highlightedNames);
        setIsHistoryMode(true); 
        setIsHistoryOpen(false); 
    }
  };
  
  const handleDeleteHistoryItem = async (e: React.MouseEvent, id: string) => {
      e.stopPropagation();
      if (!confirm("האם למחוק שמירה זו מההיסטוריה? לא ניתן לשחזר.")) return;
      try {
          await deleteDoc(doc(db, "history", id));
          setHistoryList(prev => prev.filter(item => item.id !== id));
      } catch (error) {
          alert("שגיאה במחיקת פריט היסטוריה");
      }
  };

  const exitHistoryMode = () => { setIsHistoryMode(false); handleLoadFromCloud(); };

  const getLearnedPreferences = async (context: 'scatter' | 'collection') => {
    try {
      const q = query(collection(db, "history"), orderBy("createdAt", "desc"), limit(50));
      const snapshot = await getDocs(q);
      const employeeVehicleCounts: Record<string, Record<string, number>> = {};
      const prefix = context === 'scatter' ? 'scat-' : 'col-';
      snapshot.docs.forEach(doc => {
        const assignments = doc.data().assignments || {};
        Object.keys(assignments).forEach(key => {
          if (key.startsWith(prefix)) {
            const vehicleId = key.split('-')[1];
            const employee = assignments[key];
            if (!employeeVehicleCounts[employee]) employeeVehicleCounts[employee] = {};
            if (!employeeVehicleCounts[employee][vehicleId]) employeeVehicleCounts[employee][vehicleId] = 0;
            employeeVehicleCounts[employee][vehicleId]++;
          }
        });
      });
      const preferences: Record<string, string> = {};
      Object.keys(employeeVehicleCounts).forEach(emp => {
        let maxCount = 0; let bestVehicle = "";
        Object.entries(employeeVehicleCounts[emp]).forEach(([veh, count]) => { if (count > maxCount) { maxCount = count; bestVehicle = veh; } });
        if (maxCount > 1) preferences[emp] = bestVehicle;
      });
      return preferences;
    } catch (e) { console.error("Error learning history:", e); return {}; }
  };

  const runScatterAutomat = async () => {
    if (!isLoggedIn || currentUser?.role === 'viewer') { alert("אין הרשאה"); return; }
    saveCheckpoint();
    const newAssignments = { ...assignments };
    const newNotes = { ...notes };
    Object.keys(newAssignments).forEach(key => { if (key.startsWith("scat-")) delete newAssignments[key]; });
    Object.keys(newNotes).forEach(key => { if (key.startsWith("scat-")) delete newNotes[key]; });
    
    const scatterMap: any[] = scatterVehicles.map((id, idx) => ({ id, idx, prefix: `scat-${id}-${idx}`, filled: 0, capacity: 9, isLocked: false }));
    const assignedEmployees = new Set<string>();
    
    collectionVehicles.forEach((vehId, colIdx) => {
      const colPrefix = `col-${vehId}-${colIdx}`;
      const note = notes[colPrefix];
      if (note && note.trim() !== "") {
        const targetVeh = scatterMap.find(v => v.id === vehId);
        if (targetVeh) {
          newNotes[targetVeh.prefix] = note;
          targetVeh.isLocked = true;
          for (let i = 1; i <= 9; i++) {
            const name = assignments[`${colPrefix}-${i}`];
            if (name && name.trim()) {
              newAssignments[`${targetVeh.prefix}-${i}`] = name;
              targetVeh.filled++;
              assignedEmployees.add(name);
              if(nameAliases[name]) assignedEmployees.add(nameAliases[name]);
            }
          }
        }
      }
    });

    let employeesToAssign: string[] = [];
    collectionVehicles.forEach((vehId, colIdx) => {
      const colPrefix = `col-${vehId}-${colIdx}`;
      for (let i = 1; i <= 9; i++) {
        const name = assignments[`${colPrefix}-${i}`];
        if (name && name.trim() && !assignedEmployees.has(name)) employeesToAssign.push(name);
      }
    });

    const poolRules: PoolGroup[] = [
      { names: ["גבאי", "דבוש", "יניב", "נג'יב", "שלומית", "נתנאל", "אדי", "פיראס"], type: 'special', preferredVehicle: "501" },
      { names: ["עמיהוד", "גילי", "יקיר", "אילן", "בנימיני"], type: 'big', preferredVehicle: "003" },
      { names: ["אביגדור", "שני", "עדי", "ששון", "שגיא", "סויסה"], type: 'big', preferredVehicle: "703" },
      { names: ["גל", "אור", "יהודה", "מאיה", "סתיו", "אפיק", "תומר"], type: 'big', preferredVehicle: "603" },
      { names: ["קבילו", "רוני", "שמעיה", "נעם", "מיכאל", "משען"], type: 'big', preferredVehicle: "403" }
    ];
    poolRules.forEach(rule => {
      const targetVeh = scatterMap.find(v => v.id === rule.preferredVehicle);
      if (targetVeh && !targetVeh.isLocked) {
        rule.names.forEach(employeeName => {
          const candidate = employeesToAssign.find(e => e === employeeName || getBaseName(e) === employeeName);
          if (candidate && !assignedEmployees.has(candidate) && targetVeh.filled < targetVeh.capacity) {
            targetVeh.filled++; newAssignments[`${targetVeh.prefix}-${targetVeh.filled}`] = candidate; assignedEmployees.add(candidate);
          }
        });
      }
    });

    const learnedPrefs = await getLearnedPreferences('scatter');
    employeesToAssign.forEach(employeeName => {
      if (assignedEmployees.has(employeeName)) return;
      const preferredVehId = learnedPrefs[employeeName];
      if (preferredVehId) {
        const targetVeh = scatterMap.find(v => v.id === preferredVehId);
        if (targetVeh && !targetVeh.isLocked && targetVeh.filled < targetVeh.capacity && !RESTRICTED_VEHICLES_FOR_LEFTOVERS.includes(targetVeh.id)) {
          targetVeh.filled++; newAssignments[`${targetVeh.prefix}-${targetVeh.filled}`] = employeeName; assignedEmployees.add(employeeName);
        }
      }
    });

    const leftOvers = employeesToAssign.filter(name => !assignedEmployees.has(name));
    const stillUnassigned: string[] = [];
    if (leftOvers.length > 0) {
      let availableVehicles = scatterMap.filter(v => !v.isLocked && !RESTRICTED_VEHICLES_FOR_LEFTOVERS.includes(v.id));
      leftOvers.forEach(workerName => {
        availableVehicles.sort((a, b) => a.filled - b.filled);
        let placed = false;
        for (const veh of availableVehicles) {
          if (veh.filled < veh.capacity) {
            for (let seat = 1; seat <= 9; seat++) {
              if (!newAssignments[`${veh.prefix}-${seat}`]) {
                newAssignments[`${veh.prefix}-${seat}`] = workerName; veh.filled++; placed = true; break;
              }
            }
          }
          if (placed) break;
        }
        if (!placed) stillUnassigned.push(workerName);
      });
    }
    
    const finalScatterPool = stillUnassigned.length > 0 ? 
       [...new Set([...scatterPoolList, ...stillUnassigned])] : scatterPoolList;

    setScatterPoolList(finalScatterPool);
    setNotes(newNotes); 
    setAssignments(newAssignments);
    
    updateFirebaseLive({ 
        assignments: newAssignments, 
        notes: newNotes,
        scatterPoolList: finalScatterPool
    });
    
    if (stillUnassigned.length > 0) setIsScatterPoolOpen(true);
  };

  const runCollectionAutomat = async () => {
    if (!isLoggedIn || currentUser?.role === 'viewer') return;
    saveCheckpoint();
    const newAssignments = { ...assignments };
    const assignedOrStatus = new Set<string>();
    Object.entries(assignments).forEach(([key, name]) => {
      if (key.startsWith("stat-") && name.trim()) { assignedOrStatus.add(name); if (nameAliases[name]) assignedOrStatus.add(nameAliases[name]); }
    });
    const collectionMap: any[] = collectionVehicles.map((id, idx) => ({ id, idx, prefix: `col-${id}-${idx}`, filled: 0, capacity: 9 }));
    collectionMap.forEach(veh => {
      for (let i = 1; i <= 9; i++) {
        const name = assignments[`${veh.prefix}-${i}`];
        if (name && name.trim()) { veh.filled++; assignedOrStatus.add(name); if (nameAliases[name]) assignedOrStatus.add(nameAliases[name]); }
      }
    });
    
    const learnedPrefs = await getLearnedPreferences('collection');
    const employeesToAssign = allEmployees.filter(name => !assignedOrStatus.has(name));
    const remainingAfterSmart = [];
    
    for (const workerName of employeesToAssign) {
      let placed = false;
      const preferredVehId = learnedPrefs[workerName];
      if (preferredVehId) {
        const targetVeh = collectionMap.find(v => v.id === preferredVehId);
        if (targetVeh && targetVeh.filled < targetVeh.capacity) {
             for (let seat = 1; seat <= 9; seat++) {
               if(!newAssignments[`${targetVeh.prefix}-${seat}`]) { newAssignments[`${targetVeh.prefix}-${seat}`] = workerName; targetVeh.filled++; placed=true; break; }
             }
        }
      }
      if (!placed) remainingAfterSmart.push(workerName);
    }

    const stillUnassigned: string[] = [];
    remainingAfterSmart.forEach(workerName => {
        collectionMap.sort((a, b) => a.filled - b.filled);
        let placed = false;
        for (const veh of collectionMap) {
            if (veh.filled < veh.capacity) {
                for (let seat = 1; seat <= 9; seat++) {
                    if(!newAssignments[`${veh.prefix}-${seat}`]) { newAssignments[`${veh.prefix}-${seat}`] = workerName; veh.filled++; placed=true; break; }
                }
            }
            if(placed) break;
        }
        if(!placed) stillUnassigned.push(workerName);
    });

    const finalCollectionPool = stillUnassigned.length > 0 ? 
       [...new Set([...collectionPoolList, ...stillUnassigned])] : collectionPoolList;
    
    setCollectionPoolList(finalCollectionPool);
    setAssignments(newAssignments);
    
    updateFirebaseLive({ 
        assignments: newAssignments, 
        collectionPoolList: finalCollectionPool
    });

    if (stillUnassigned.length > 0) setIsCollectionPoolOpen(true);
  };

  const copyCollectionToScatter = () => checkAuth(() => {
    if (!confirm("האם להעתיק את כל השיבוצים מאיסוף לפיזור? (הנתונים בפיזור יידרסו)")) return;
    saveCheckpoint(); 
    const newAssignments = { ...assignments };
    const newNotes = { ...notes };
    Object.keys(newAssignments).forEach(key => { if (key.startsWith('scat-')) delete newAssignments[key]; });
    collectionVehicles.forEach((vehId, colIndex) => {
        const scatterIndex = scatterVehicles.findIndex(v => v === vehId);
        if (scatterIndex !== -1) {
            const colNoteKey = `col-${vehId}-${colIndex}`;
            const scatNoteKey = `scat-${vehId}-${scatterIndex}`;
            if (notes[colNoteKey]) { newNotes[scatNoteKey] = notes[colNoteKey]; }
            for (let i = 1; i <= 20; i++) {
                 const colKey = `col-${vehId}-${colIndex}-${i}`;
                 const scatKey = `scat-${vehId}-${scatterIndex}-${i}`;
                 if (assignments[colKey]) { newAssignments[scatKey] = assignments[colKey]; }
            }
        }
    });
    setAssignments(newAssignments); 
    setNotes(newNotes); 
    updateFirebaseLive({ assignments: newAssignments, notes: newNotes });
    alert("הועתק בהצלחה!");
  });

  const pullFromTableToPool = (type: 'scatter' | 'collection') => checkAuth(() => {
    if(!confirm("לרוקן את כל העובדים מהלוח לזמני?")) return;
    saveCheckpoint();
    const prefix = type === 'scatter' ? 'scat-' : 'col-';
    const namesToMove: string[] = [];
    const newAssignments = { ...assignments };
    Object.keys(newAssignments).forEach(k => {
      if (k.startsWith(prefix) && newAssignments[k]) {
        namesToMove.push(newAssignments[k]);
        delete newAssignments[k];
      }
    });
    
    setAssignments(newAssignments);
    
    if(type === 'scatter') { 
        const newPool = [...scatterPoolList, ...namesToMove];
        setScatterPoolList(newPool); 
        setIsScatterPoolOpen(true); 
        updateFirebaseLive({ assignments: newAssignments, scatterPoolList: newPool });
    } else { 
        const newPool = [...collectionPoolList, ...namesToMove];
        setCollectionPoolList(newPool); 
        setIsCollectionPoolOpen(true); 
        updateFirebaseLive({ assignments: newAssignments, collectionPoolList: newPool });
    }
  });

  const clearTable = (prefix: string) => checkAuth(() => { if(confirm("למחוק?")) { 
    saveCheckpoint(); 
    const newAssignments = { ...assignments };
    const newNotes = { ...notes };
    Object.keys(newAssignments).forEach(k=> {if(k.startsWith(prefix)) delete newAssignments[k]});
    Object.keys(newNotes).forEach(k=> {if(k.startsWith(prefix)) delete newNotes[k]});
    
    setAssignments(newAssignments);
    setNotes(newNotes);
    updateFirebaseLive({ assignments: newAssignments, notes: newNotes });
  }});

  const clearVehicle = (prefix: string) => checkAuth(() => { if(confirm("לנקות?")) { 
    saveCheckpoint(); 
    const newAssignments = { ...assignments };
    const newNotes = { ...notes };
    Object.keys(newAssignments).forEach(k=> {if(k.startsWith(prefix)) delete newAssignments[k]});
    if(newNotes[prefix]) delete newNotes[prefix];

    setAssignments(newAssignments);
    setNotes(newNotes);
    updateFirebaseLive({ assignments: newAssignments, notes: newNotes });
  }});

const getCount = (prefix: string) => Object.entries(assignments).filter(([key, value]) => {
    if (!key.startsWith(prefix) || value.trim() === "") return false;
    const seatNumber = parseInt(key.split('-').pop() || '0');
    if (seatNumber > 10) return false;
    return allEmployees.includes(value.trim()) || !!nameAliases[value.trim()];
  }).length;

  const isDuplicate = (name: string, context: 'scatter' | 'combined') => {
    if (!name || !name.trim()) return false;
    let count = 0;
    let prefixesToCheck: string[] = [];
    if (currentView === 'home') {
      if (context === 'scatter') prefixesToCheck = ['scat-'];
      else prefixesToCheck = ['col-', 'stat-'];
    } else if (currentView === 'holiday') prefixesToCheck = ['hol-'];
    else if (currentView === 'weekend') prefixesToCheck = ['fri-', 'sat-'];

    Object.entries(assignments).forEach(([key, value]) => {
      if (value === name && prefixesToCheck.some(p => key.startsWith(p))) count++;
    });
    if (currentView === 'weekend') return false;
    return count > 1;
  };

  const checkWeekendDuplicate = (name: string, type: 'fri' | 'sat') => {
    if (!name) return false;
    let count = 0;
    Object.entries(assignments).forEach(([key, value]) => {
      if (value === name && key.startsWith(type + '-')) count++;
    });
    return count > 1;
  };

  const checkHolidayDuplicate = (name: string, dayPrefix: string) => {
    if (!name) return false;
    let count = 0;
    Object.entries(assignments).forEach(([key, value]) => {
        if (value === name && key.startsWith(dayPrefix)) count++;
    });
    return count > 1;
  };

  const removeHolidayTable = (indexToRemove: number) => {
    if (indexToRemove <= 0) return; 
    if (!confirm(`האם למחוק את טבלת יום ${indexToRemove + 1}?`)) return;

    saveCheckpoint();

    const newAssignments = { ...assignments };
    const newNotes = { ...notes };
    const maxIndex = holidayDaysCount - 1;

    for (let i = indexToRemove; i < maxIndex; i++) {
        const currentPrefix = i === 0 ? 'hol-' : `hol${i+1}-`;
        const nextPrefix = `hol${i+2}-`;

        Object.keys(newAssignments).forEach(key => {
            if (key.startsWith(nextPrefix)) {
                const suffix = key.substring(nextPrefix.length);
                newAssignments[`${currentPrefix}${suffix}`] = newAssignments[key];
                delete newAssignments[key];
            }
        });
        
        Object.keys(newNotes).forEach(key => {
             if (key.startsWith(nextPrefix)) {
                const suffix = key.substring(nextPrefix.length);
                newNotes[`${currentPrefix}${suffix}`] = newNotes[key];
                delete newNotes[key];
            }
        });
        
        const nextDateKey = `date-${nextPrefix}`;
        const currentDateKey = `date-${currentPrefix}`;
        
        if (newNotes[nextDateKey]) {
             newNotes[currentDateKey] = newNotes[nextDateKey];
             delete newNotes[nextDateKey];
        } else {
             delete newNotes[currentDateKey];
        }
    }

    const lastPrefix = `hol${holidayDaysCount}-`;
    Object.keys(newAssignments).forEach(key => { if (key.startsWith(lastPrefix)) delete newAssignments[key]; });
    Object.keys(newNotes).forEach(key => { if (key.startsWith(lastPrefix)) delete newNotes[key]; });
    const lastDateKey = `date-${lastPrefix}`;
    if (newNotes[lastDateKey]) delete newNotes[lastDateKey];

    const newCount = holidayDaysCount - 1;
    setAssignments(newAssignments);
    setNotes(newNotes);
    setHolidayDaysCount(newCount);
    
    updateFirebaseLive({
      assignments: newAssignments,
      notes: newNotes,
      holidayDaysCount: newCount
    });
  };

  const addVehicle = (type: 'scatter' | 'collection' | 'holiday' | 'friday' | 'saturday') => checkAuth(() => {
    const t = prompt("רכב:");
    if(t) {
      if (type === 'scatter') { const v = [...scatterVehicles, t]; setScatterVehicles(v); updateFirebaseLive({ scatterVehicles: v }); }
      else if (type === 'collection') { const v = [...collectionVehicles, t]; setCollectionVehicles(v); updateFirebaseLive({ collectionVehicles: v }); }
      else if (type === 'holiday') { const v = [...holidayVehicles, t]; setHolidayVehicles(v); updateFirebaseLive({ holidayVehicles: v }); }
      else if (type === 'friday') { const v = [...fridayVehicles, t]; setFridayVehicles(v); updateFirebaseLive({ fridayVehicles: v }); }
      else if (type === 'saturday') { const v = [...saturdayVehicles, t]; setSaturdayVehicles(v); updateFirebaseLive({ saturdayVehicles: v }); }
    }
  });

  const editVehicle = (type: 'holiday' | 'friday' | 'saturday', index: number, newName: string) => {
    if (!isLoggedIn || currentUser?.role === 'viewer') return;
    if (type === 'holiday') { const v = [...holidayVehicles]; v[index] = newName; setHolidayVehicles(v); updateFirebaseLive({ holidayVehicles: v }); }
    else if (type === 'friday') { const v = [...fridayVehicles]; v[index] = newName; setFridayVehicles(v); updateFirebaseLive({ fridayVehicles: v }); }
    else if (type === 'saturday') { const v = [...saturdayVehicles]; v[index] = newName; setSaturdayVehicles(v); updateFirebaseLive({ saturdayVehicles: v }); }
  };

  const handleSaveToCloud = async () => checkAuth(async () => {
    try {
      const saveTime = new Date().toLocaleString('he-IL');
      const saverName = currentUser?.name || "לא ידוע";
      
      await setDoc(doc(db, "schedules", "main_schedule"), {
        assignments, notes, scatterVehicles, collectionVehicles, holidayVehicles, fridayVehicles, saturdayVehicles,
        statusColumns, holidayStatusCols, fridayStatusCols, saturdayStatusCols,
        scatterDate, collectionDate, holidayDate, fridayDate, collectionNote, scatterGeneralNote, personalNotes, holidayDaysCount,
        lastSavedBy: saverName,
        lastSavedAt: saveTime,
        scatterPoolList,
        collectionPoolList,
        weekendPoolList,
        vacationPoolList,
        highlightedNames
      });
      
      await addDoc(collection(db, "history"), { 
        createdAt: new Date(), 
        assignments, 
        scatterDate, 
        displayDate: new Date().toLocaleString('he-IL'),
        savedBy: saverName,
        collectionDate,
        holidayDate,
        fridayDate,
        scatterPoolList,
        collectionPoolList,
        weekendPoolList,
        vacationPoolList,
        notes,
        scatterVehicles,
        collectionVehicles,
        holidayVehicles,
        fridayVehicles,
        saturdayVehicles,
        statusColumns,
        holidayStatusCols,
        fridayStatusCols,
        saturdayStatusCols,
        highlightedNames
      });

      setLastSavedInfo(`נשמר לאחרונה ע"י ${saverName} ב-${saveTime}`);
      alert("נשמר בהצלחה!");
    } catch (e) { 
      console.error(e);
      alert("שגיאה בשמירה"); 
    }
  });

  const handleLoadFromCloud = async () => {
    if(!confirm("פעולה זו תרענן את הנתונים מהשרת. להמשיך?")) return;
    try {
      const snap = await getDoc(doc(db, "schedules", "main_schedule"));
      if(snap.exists()) {
        const d = snap.data();
        setAssignments(d.assignments || {}); setNotes(d.notes || {});
        if(d.highlightedNames) setHighlightedNames(d.highlightedNames);
        if(d.scatterVehicles) setScatterVehicles(d.scatterVehicles);
        if(d.collectionVehicles) setCollectionVehicles(d.collectionVehicles);
        if(d.holidayVehicles) setHolidayVehicles(d.holidayVehicles);
        if(d.fridayVehicles) setFridayVehicles(d.fridayVehicles);
        if(d.saturdayVehicles) setSaturdayVehicles(d.saturdayVehicles);
        if(d.statusColumns) setStatusColumns(d.statusColumns);
        if(d.holidayStatusCols) setHolidayStatusCols(d.holidayStatusCols);
        if(d.fridayStatusCols) setFridayStatusCols(d.fridayStatusCols);
        if(d.saturdayStatusCols) setSaturdayStatusCols(d.saturdayStatusCols);
        setScatterDate(d.scatterDate); setHolidayDate(d.holidayDate); setFridayDate(d.fridayDate);
        if(d.collectionNote) setCollectionNote(d.collectionNote);
        if(d.scatterGeneralNote) setScatterGeneralNote(d.scatterGeneralNote);
        if(d.personalNotes) setPersonalNotes(d.personalNotes);
        if(d.holidayDaysCount) setHolidayDaysCount(d.holidayDaysCount);
        if(d.scatterPoolList) setScatterPoolList(d.scatterPoolList);
        if(d.collectionPoolList) setCollectionPoolList(d.collectionPoolList);
        if(d.weekendPoolList) setWeekendPoolList(d.weekendPoolList);
        if(d.vacationPoolList) setVacationPoolList(d.vacationPoolList || []);
        if (d.lastSavedBy && d.lastSavedAt) { setLastSavedInfo(`נשמר לאחרונה ע"י ${d.lastSavedBy} ב-${d.lastSavedAt}`); }
      }
    } catch(e) { alert("שגיאה בטעינה"); }
  };

  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return "";
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const getDayName = (dateStr: string) => {
    if (!dateStr) return "";
    const days = ['יום ראשון', 'יום שני', 'יום שלישי', 'יום רביעי', 'יום חמישי', 'יום שישי', 'יום שבת'];
    const date = new Date(dateStr);
    return days[date.getDay()];
  };
  
  const isReadOnly = !isLoggedIn || currentUser?.role === 'viewer' || isHistoryMode;

  return (
    <div
      id="app-container"
      className={`min-h-screen bg-gray-100 pb-32 font-sans w-full ${isHistoryMode ? 'border-4 border-gray-500' : ''} ${isGeneratingImage ? 'w-fit min-w-[1280px] overflow-visible' : ''}`}
      dir="rtl"
    >
      <style>{`
        @media print {
          @page { size: landscape; margin: 0; }
          body { -webkit-print-color-adjust: exact; background-color: white !important; }
          #app-container { background: white !important; padding: 0 !important; }
          button, .react-draggable, .handle-bar, .no-print { display: none !important; }
          .print-hidden { display: none !important; }
          .print-only { display: block !important; color: white !important; font-weight: bold !important; font-size: 14px !important; }
          .overflow-x-auto { overflow: visible !important; }
          input { border: none !important; background: transparent !important; }
        }
        
        input::-webkit-calendar-picker-indicator {
          display: none !important;
        }
        input::-webkit-list-button {
          display: none !important;
        }

        /* עיצוב פס הגלילה */
        .custom-scrollbar::-webkit-scrollbar {
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1; 
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8; 
        }
      `}</style>
      
      {/* חלון מודאל - קליטת חופשות חכמה */}
      {isVacationModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/60 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-lg text-center space-y-4 animate-in fade-in zoom-in duration-200">
                <div className="flex justify-between items-center border-b pb-2">
                    <h3 className="font-black text-xl text-blue-900">קליטת חופשות</h3>
                    <button onClick={openTimetablePopup} className="bg-indigo-600 text-white px-3 py-1 rounded text-sm font-bold shadow hover:bg-indigo-700">לסידור עבודה</button>
                </div>
                
                <textarea 
                    value={vacationRawText}
                    onChange={(e) => setVacationRawText(e.target.value)}
                    className="w-full h-48 border-2 border-blue-200 rounded p-2 text-right focus:outline-none focus:border-blue-500 text-lg"
                    placeholder="הדבק כאן את הטקסט..."
                />
                
                <div className="flex gap-2">
                    <button onClick={handleParseVacations} className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 font-bold flex-1">זהה עובדים</button>
                    <button onClick={() => setIsVacationModalOpen(false)} className="bg-gray-200 text-gray-700 py-2 px-4 rounded hover:bg-gray-300 font-bold">ביטול</button>
                </div>
            </div>
        </div>
      )}

      {/* כפתורים צפים קבועים במסך - צד שמאל למטה */}
      <div className="fixed bottom-6 left-6 z-[100] flex flex-col gap-4 no-print">
        
        {/* כפתור נקה הכל - כתום */}
        {highlightedNames.length > 0 && !isReadOnly && (
          <button 
            onClick={handleClearHighlights} 
            title="נקה את כל הסימונים"
            className="p-4 rounded-full shadow-2xl bg-orange-500 text-white hover:bg-orange-600 transition-transform hover:scale-110 flex items-center justify-center"
          >
            <Eraser size={24} />
          </button>
        )}

        {undoStack.length > 0 && (
          <button 
            onClick={handleUndo} 
            title="בטל פעולה אחרונה"
            className="p-4 rounded-full shadow-2xl bg-gray-800 text-white hover:bg-gray-700 transition-transform hover:scale-110 flex items-center justify-center"
          >
            <Undo2 size={24} />
          </button>
        )}
        
        <button 
          onClick={handleShareOrPrint} 
          disabled={isShareLoading}
          title="שתף כ-PDF/תמונה"
          className="p-4 rounded-full shadow-2xl bg-purple-600 text-white hover:bg-purple-700 transition-transform hover:scale-110 flex items-center justify-center disabled:bg-gray-400"
        >
          {isShareLoading ? <Loader2 size={24} className="animate-spin"/> : <Share2 size={24} />}
        </button>

        <button 
          onClick={handleShareWhatsApp} 
          disabled={isWhatsappLoading}
          title="שתף בוואטסאפ"
          className="p-4 rounded-full shadow-2xl bg-green-500 text-white hover:bg-green-600 transition-transform hover:scale-110 flex items-center justify-center disabled:bg-gray-400"
        >
          {isWhatsappLoading ? <Loader2 size={24} className="animate-spin"/> : <WhatsAppIcon size={24} color="#ffffff" />}
        </button>
      </div>

      <div className="bg-white/80 min-h-screen inline-block min-w-full">
      <datalist id="employee-list">{allEmployees.map(name => <option key={name} value={name} />)}</datalist>
      
      {/* Restore Modal */}
      {isRestoreModalOpen && itemToRestore && (
         <div className="fixed inset-0 z-[250] bg-black/60 flex items-center justify-center p-4">
             <div className="bg-white rounded-xl shadow-2xl p-6 w-80 text-center space-y-4 animate-in fade-in zoom-in duration-200">
                 <h3 className="font-black text-xl text-blue-900 border-b pb-2">בחר מה לשכפל</h3>
                 <p className="text-sm text-gray-500">מתאריך: {formatDateDisplay(itemToRestore.scatterDate)}</p>
                 
                 <div className="flex flex-col gap-2">
                     <button onClick={() => handleSmartRestore(itemToRestore, 'full')} className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-bold shadow">שכפל הכל (דרוס הכל)</button>
                     <div className="grid grid-cols-2 gap-2">
                        <button onClick={() => handleSmartRestore(itemToRestore, 'scatter')} className="bg-blue-100 text-blue-800 py-2 rounded hover:bg-blue-200 font-bold border border-blue-200">רק פיזור</button>
                        <button onClick={() => handleSmartRestore(itemToRestore, 'collection')} className="bg-orange-100 text-orange-800 py-2 rounded hover:bg-orange-200 font-bold border border-orange-200">רק איסוף</button>
                        <button onClick={() => handleSmartRestore(itemToRestore, 'weekend')} className="bg-teal-100 text-teal-800 py-2 rounded hover:bg-teal-200 font-bold border border-teal-200">רק סופ"ש</button>
                        <button onClick={() => handleSmartRestore(itemToRestore, 'holiday')} className="bg-purple-100 text-purple-800 py-2 rounded hover:bg-purple-200 font-bold border border-purple-200">רק חג</button>
                     </div>
                 </div>

                 <button onClick={() => setIsRestoreModalOpen(false)} className="text-gray-400 text-sm hover:text-gray-600 underline mt-2">ביטול</button>
             </div>
         </div>
      )}

      {isHistoryOpen && (
        <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-96 max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50 rounded-t-lg">
              <h3 className="font-bold text-lg flex items-center gap-2"><History size={20}/> היסטוריית סידורים</h3>
              <button onClick={() => setIsHistoryOpen(false)}><X size={20}/></button>
            </div>
            <div className="overflow-y-auto p-2 flex-1">
              {historyList.length === 0 ? <p className="text-center text-gray-500 p-4">טוען היסטוריה...</p> : 
                historyList.map(item => (
                  <div key={item.id} className="w-full text-right p-3 border-b hover:bg-blue-50 flex justify-between items-center group">
                    <div className="flex-1">
                      <div className="font-bold text-gray-700">תאריך סידור: {formatDateDisplay(item.scatterDate)}</div>
                      <div className="text-xs text-gray-500">נוצר ב: {item.displayDate}</div>
                      <div className="text-xs text-blue-600 font-bold">נשמר ע"י: {item.savedBy || "לא ידוע"}</div>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                         onClick={() => loadHistoryItem(item)}
                         className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200"
                         title="הצג לקריאה בלבד"
                       >
                         <Search size={16}/>
                       </button>

                       {/* Restore Button */}
                       {currentUser?.role !== 'viewer' && (
                           <button 
                             onClick={() => { setItemToRestore(item); setIsRestoreModalOpen(true); }}
                             className="p-1.5 bg-green-100 text-green-600 rounded hover:bg-green-200"
                             title="שכפל נתונים לסידור החי"
                           >
                             <Copy size={16}/>
                           </button>
                       )}

                       {/* Delete Button */}
                       {currentUser?.role !== 'viewer' && (
                         <button 
                           onClick={(e) => handleDeleteHistoryItem(e, item.id)}
                           className="p-1.5 bg-red-100 text-red-600 rounded hover:bg-red-200"
                           title="מחק שמירה זו"
                         >
                           <Trash2 size={16} />
                         </button>
                       )}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </div>
      )}
      {isHistoryMode && (
        <div className="bg-gray-800 text-white text-center p-2 sticky top-0 z-50 flex justify-center items-center gap-4 shadow-md">
           <span className="font-bold animate-pulse"> ⚠️  מצב היסטוריה (קריאה בלבד)</span>
           <button onClick={exitHistoryMode} className="bg-white text-gray-800 px-3 py-1 rounded text-sm font-bold flex items-center gap-2 hover:bg-gray-200">
             <RotateCcw size={14}/> חזור לסידור החי
           </button>
        </div>
      )}
      {showUpdateModal && (
        <div className="fixed inset-0 z-[150] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center space-y-4 animate-in fade-in zoom-in duration-200">
            <div className="text-3xl mb-2">🚀</div>
            <h2 className="text-2xl font-black text-blue-900">עדכון מערכת חדש!</h2>
            <div className="text-right bg-blue-50 p-4 rounded-lg text-blue-900 text-sm space-y-2 border border-blue-100">
              <p className="font-bold border-b border-blue-200 pb-1 mb-2">מה חדש בעדכון הזה?</p>
              <ul className="list-disc list-inside space-y-1">
                <li>ספירת עובדים מדויקת (רק שמות עובדים נספרים בטבלאות).</li>
                <li>אפשרות להעתקה והדבקה מהירה של שעות בשורה האחרונה (מקש ימני).</li>
                <li>שיפורים כלליים ביציבות המערכת.</li>
              </ul>
            </div>
            <button 
              onClick={() => {
                localStorage.setItem("appVersion", APP_VERSION);
                setShowUpdateModal(false);
              }} 
              className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              הבנתי, תודה!
            </button>
          </div>
        </div>
      )}
      {showLoginModal && !isLoggedIn && (
        <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center space-y-4">
            <Lock size={48} className="mx-auto text-blue-900" />
            <h2 className="text-2xl font-black text-blue-900">התחברות למערכת</h2>
            <input type="text" value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="תעודת זהות" className="w-full text-center text-xl p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
            <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="סיסמה" className="w-full text-center text-xl p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"/>
            <button onClick={handleLogin} disabled={isLoginLoading} className="w-full bg-blue-600 text-white font-bold py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400">{isLoginLoading ? "מתחבר..." : "כניסה"}</button>
            <div className="border-t pt-4 mt-4">
              <button onClick={() => setShowLoginModal(false)} className="text-xs text-gray-400 underline">המשך לצפייה בלבד (זמני)</button>
            </div>
          </div>
        </div>
      )}
      {isChangePasswordOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-80 text-center space-y-3">
            <h3 className="font-bold text-lg text-gray-800">החלפת סיסמה</h3>
            <p className="text-sm text-gray-500">עבור משתמש: {currentUser?.name}</p>
            <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} placeholder="סיסמה חדשה" className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" />
            <div className="flex gap-2">
              <button onClick={handleChangePassword} className="bg-green-600 text-white flex-1 py-2 rounded hover:bg-green-700 font-bold">שמור</button>
              <button onClick={()=>setIsChangePasswordOpen(false)} className="bg-gray-200 text-gray-700 flex-1 py-2 rounded hover:bg-gray-300">ביטול</button>
            </div>
          </div>
        </div>
      )}
      {isUserManagerOpen && (
        <div className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl w-96 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">ניהול מנהלים</h3>
              <button onClick={()=>setIsUserManagerOpen(false)}><Lock size={16}/></button>
            </div>
            
            <div className="flex flex-col gap-2 mb-4 bg-gray-50 p-2 rounded border">
              <h4 className="text-xs font-bold text-gray-500">הוספת משתמש חדש:</h4>
              <div className="flex gap-2">
                <input value={newUser.id} onChange={(e)=>setNewUser({...newUser, id: e.target.value})} placeholder="ת.ז" className="border p-1 w-1/3 rounded text-sm"/>
                <input value={newUser.name} onChange={(e)=>setNewUser({...newUser, name: e.target.value})} placeholder="שם" className="border p-1 w-1/3 rounded text-sm"/>
                <select value={newUser.role} onChange={(e)=>setNewUser({...newUser, role: e.target.value})} className="border p-1 text-sm">
                  <option value="editor">עורך</option>
                  <option value="admin">מנהל</option>
                  <option value="viewer">צפייה בלבד</option>
                </select>
                <button onClick={handleAddUser} className="bg-blue-600 text-white p-1 rounded text-sm">הוסף</button>
              </div>
            </div>

            <div className="space-y-2">
              {usersList.map(u => (
                <div key={u.id} className="border-b pb-2">
                  {editingUserId === u.id ? (
                    <div className="flex flex-col gap-2 p-2 bg-blue-50 border border-blue-200 rounded">
                       <input value={editingUserData.id} onChange={(e) => setEditingUserData({...editingUserData, id: e.target.value})} placeholder="ת.ז (שם משתמש)" className="border p-1 text-sm rounded"/>
                       <input value={editingUserData.name} onChange={(e) => setEditingUserData({...editingUserData, name: e.target.value})} placeholder="שם" className="border p-1 text-sm rounded"/>
                       <input value={editingUserData.password} onChange={(e) => setEditingUserData({...editingUserData, password: e.target.value})} placeholder="סיסמה" type="text" className="border p-1 text-sm rounded"/>
                       <select value={editingUserData.role} onChange={(e) => setEditingUserData({...editingUserData, role: e.target.value})} className="border p-1 text-sm rounded">
                          <option value="editor">עורך</option>
                          <option value="admin">מנהל</option>
                          <option value="viewer">צפייה בלבד</option>
                       </select>
                       <div className="flex gap-2">
                          <button onClick={() => saveEditUser(u.id)} className="bg-green-600 text-white p-1 rounded text-sm flex-1 font-bold">שמור שינויים</button>
                          <button onClick={() => setEditingUserId(null)} className="bg-gray-400 text-white p-1 rounded text-sm flex-1">בטל</button>
                       </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center text-sm">
                      <span>{u.name} <span className="text-gray-400 text-xs">({u.role})</span></span>
                      
                      {u.id !== currentUser?.id && u.id !== "master" && (
                         <div className="flex gap-3">
                           <button onClick={() => startEditUser(u)} className="text-blue-500 hover:text-blue-700" title="ערוך משתמש"><Edit size={16}/></button>
                           <button onClick={()=>handleDeleteUser(u.id)} className="text-red-500 hover:text-red-700" title="מחק משתמש"><Trash2 size={16}/></button>
                         </div>
                      )}
                      {u.id === currentUser?.id && u.id !== "master" && (
                           <button onClick={() => startEditUser(u)} className="text-blue-500 hover:text-blue-700" title="ערוך את עצמך"><Edit size={16}/></button>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <header className="bg-blue-900 shadow-lg border-b border-blue-800 sticky top-0 z-40 text-white w-full">
        <div className="w-full mx-auto px-4 py-3 flex items-center justify-between md:justify-start">
          <div className="md:hidden flex items-center gap-4 w-full justify-between">
            <div className="flex items-center gap-2">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-white">
                <Menu size={28} />
              </button>
              <span className="font-black text-lg">סידור הסעות</span>
            </div>
            <img id="main-logo" src="/logo.png" alt="לוגו רשות המיסים" className="h-10 bg-white rounded px-2" />
          </div>

          <div className="hidden md:flex items-center gap-4">
             <img id="main-logo" src="/logo.png" alt="לוגו רשות המיסים" className="h-12 bg-white rounded px-2" />
             <h1 className="text-2xl font-black border-r pr-6 mr-4 border-blue-700 tracking-wide">סידור הסעות אלנבי</h1>
          </div>
          
          <div className="hidden md:flex items-center gap-3 bg-blue-800/50 p-1 rounded-full mr-8">
            <button onClick={() => setCurrentView('home')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${currentView === 'home' ? 
              'bg-white text-blue-900' : 'text-blue-200'}`}><Home size={18} /> יומי</button>
            <button onClick={() => setCurrentView('weekend')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${currentView === 'weekend' ? 
              'bg-white text-orange-700' : 'text-blue-200'}`}><Sun size={18} /> סופ"ש</button>
            <button onClick={() => setCurrentView('holiday')} className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${currentView === 'holiday' ? 
              'bg-white text-purple-700' : 'text-blue-200'}`}><PartyPopper size={18} /> חג</button>
          </div>
          
          <div className="hidden md:flex items-center gap-2 mr-auto">
             {isLoggedIn && currentUser ? (
               <>
                 <div className="flex flex-col items-end mr-2">
                    <span className="text-xs font-bold text-blue-200">שלום, {currentUser.name}</span>
                    {lastSavedInfo && <span className="text-[10px] text-amber-300 font-mono">{lastSavedInfo}</span>}
                 </div>

                 <div className="relative mr-4">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-500">
                      <Search size={14} />
                    </div>
                    <input 
                      type="text" 
                      placeholder="חיפוש עובד..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-32 py-1 pr-8 pl-2 text-xs border rounded-full text-white bg-blue-800 border-blue-700 placeholder:text-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                 </div>

                 {/* כפתורי ניהול רק למחשב */}
                 <button onClick={()=>setIsChangePasswordOpen(true)} className="flex items-center gap-1 text-[12px] font-bold bg-blue-800 px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors mr-2"><KeyRound size={14} /> סיסמה</button>
                 {currentUser.role === 'admin' && <button onClick={()=>{ fetchUsers(); setIsUserManagerOpen(true); }} className="flex items-center gap-1 text-[12px] font-bold bg-blue-800 px-3 py-1.5 rounded-full hover:bg-blue-700 transition-colors"><Users size={14} /> ניהול</button>}
                 
                 {currentUser.role !== 'viewer' && !isHistoryMode && <button onClick={handleSaveToCloud} className="flex items-center gap-2 bg-cyan-500 text-white px-3 py-2 rounded-full font-bold text-sm hover:bg-cyan-600 ml-2"><CloudUpload size={18} /> שמור</button>}
                 <button onClick={handleLoadFromCloud} className="flex items-center gap-2 bg-red-500 text-white px-3 py-2 rounded-full font-bold text-sm hover:bg-red-600"><CloudDownload size={18} /> טען</button>
                 <button onClick={fetchHistory} className="flex items-center gap-2 text-sm font-bold bg-blue-700 px-3 py-2 rounded-full hover:bg-blue-600 transition-colors ml-2"><History size={18} /> עבר</button>

                 {/* כפתור קליטת חופשות במקום האתר החיצוני */}
                 {currentUser.role !== 'viewer' && (
                    <button onClick={() => setIsVacationModalOpen(true)} className="flex items-center gap-2 text-sm font-bold bg-rose-600 text-white px-3 py-2 rounded-full hover:bg-rose-500 transition-colors ml-2 shadow-md">חופש</button>
                 )}

               </>
             ) : (
                <span className="text-xs bg-gray-700 px-2 py-1 rounded">מצב צפייה</span>
             )}

             {/* כפתורי שיתוף רק למחשב (במובייל יש את הצפים) */}
             <div className="hidden md:flex items-center gap-2">
                 <button onClick={handleShareWhatsApp} disabled={isWhatsappLoading} className="flex items-center gap-2 px-3 py-2 rounded-full font-bold text-sm text-white transition-colors bg-green-500 hover:bg-green-600" title="שתף בוואטסאפ">
                   {isWhatsappLoading ? <Loader2 size={18} className="animate-spin"/> : <WhatsAppIcon size={18} />}
                 </button>
                 <button onClick={handleShareOrPrint} disabled={isShareLoading} className="flex flex-col items-center gap-1 text-xs font-bold text-gray-600 active:text-purple-600">
                   <div className="bg-purple-100 p-2 rounded-full">
                     {isShareLoading ? <Loader2 size={20} className="animate-spin text-purple-600"/> : <Share2 size={20} className="text-purple-600"/>}
                   </div>
                 </button>
             </div>

             <div className="h-8 w-px bg-blue-800 mx-2"></div>
             {isLoggedIn ? (
                <button onClick={handleLogout} className="flex flex-col items-center gap-1 text-xs font-bold text-red-300 hover:text-white transition-colors" title="יציאה מהמערכת">
                   <LogOut size={20} />
                   יציאה
                </button>
             ) : (
                <button onClick={() => setShowLoginModal(true)} className="flex flex-col items-center gap-1 text-xs font-bold text-blue-300 hover:text-white transition-colors">
                   <Lock size={20} />
                   כניסה
                </button>
             )}
          </div>
        </div>
        
        {isMobileMenuOpen && (
          <div className="md:hidden bg-blue-900 border-t border-blue-800 p-4 space-y-4 animate-in slide-in-from-top-2">
            <div className="flex justify-center gap-2">
               <button onClick={() => { setCurrentView('home'); setIsMobileMenuOpen(false); }} className={`flex-1 text-center py-2 rounded ${currentView === 'home' ? 
              'bg-white text-blue-900' : 'text-blue-100 bg-blue-800'}`}>יומי</button>
               <button onClick={() => { setCurrentView('weekend'); setIsMobileMenuOpen(false); }} className={`flex-1 text-center py-2 rounded ${currentView === 'weekend' ? 
              'bg-white text-orange-700' : 'text-blue-100 bg-blue-800'}`}>סופ"ש</button>
               <button onClick={() => { setCurrentView('holiday'); setIsMobileMenuOpen(false); }} className={`flex-1 text-center py-2 rounded ${currentView === 'holiday' ? 
              'bg-white text-purple-700' : 'text-blue-100 bg-blue-800'}`}>חג</button>
            </div>
            <div className="relative">
               <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-gray-500">
                 <Search size={14} />
               </div>
               <input type="text" placeholder="חיפוש עובד..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full py-2 pr-8 pl-2 text-sm border rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-400" />
            </div>
            {isLoggedIn && (
               <div className="flex flex-col text-white text-sm border-t border-blue-800 pt-4 mt-4 space-y-4">
                  <div className="flex gap-2">
                      {currentUser?.role !== 'viewer' && !isHistoryMode && (
                        <button onClick={handleSaveToCloud} className="flex-1 bg-cyan-600 text-white py-2 rounded flex items-center justify-center gap-1"><CloudUpload size={16}/> שמור</button>
                      )}
                      <button onClick={handleLoadFromCloud} className="flex-1 bg-red-600 text-white py-2 rounded flex items-center justify-center gap-1"><CloudDownload size={16}/> טען</button>
                      <button onClick={fetchHistory} className="flex-1 bg-blue-700 text-white py-2 rounded flex items-center justify-center gap-1"><History size={16}/> עבר</button>
                  </div>
                  
                  {currentUser?.role !== 'viewer' && !isHistoryMode && (
                     <button onClick={() => setIsVacationModalOpen(true)} className="w-full bg-rose-600 text-white py-2 rounded flex items-center justify-center gap-1 mt-2 shadow-md">חופש</button>
                  )}
                  
                  <div className="flex justify-between items-center border-t border-blue-800 pt-4">
                      <span>שלום, {currentUser?.name}</span>
                      <div className="flex gap-4">
                         <button onClick={()=>setIsChangePasswordOpen(true)} className="text-blue-300">סיסמה</button>
                         <button onClick={handleLogout} className="text-red-300">יציאה</button>
                      </div>
                  </div>
               </div>
            )}
          </div>
        )}
      </header>

      <main 
        id="main-content-area" 
        className={`p-4 w-full mx-auto min-h-[calc(100vh-80px)] transition-all duration-300 flex flex-col items-center`} 
        ref={printRef}
      >
        {currentView === 'home' && (
          <div className="animate-in fade-in duration-300 w-full flex flex-col items-center">
             
             {/* פיזור */}
             <section className="mb-6 p-2 rounded-xl border border-blue-100 shadow-sm bg-white/90 w-full max-w-full">
               <div className="flex items-center justify-center gap-2 mb-2 border-b-2 border-blue-600 pb-1 w-fit mx-auto relative">
                 {isLoggedIn && !isReadOnly ? (
                    <div className="flex items-center gap-2">
                       <DateInput 
                         value={scatterDate} 
                         onChange={handleScatterDateChange} 
                         className="border-blue-200 hover:border-blue-400"
                         iconClassName="text-blue-900"
                       />
                       <span className="font-bold text-blue-900 text-lg">{getDayName(scatterDate)}</span>
                    </div>
                 ) : (
                    <span className="text-xl font-black text-blue-900 flex items-center gap-2 bg-white/80 px-4 py-1 rounded border border-blue-200">
                      <Calendar className="w-5 h-5"/> {formatDateDisplay(scatterDate)} <span className="mr-2">{getDayName(scatterDate)}</span>
                    </span>
                 )}

                 <h1 className="text-xl font-black text-blue-900 mr-2">פיזור <span className="text-gray-400 text-lg font-normal">({getCount('scat-')})</span></h1>
                 {isLoggedIn && !isReadOnly && (
                    <div className="flex items-center gap-2 mr-4 no-print">
                      <button onClick={() => addVehicle('scatter')}><PlusCircle size={20} className="text-blue-600" /></button>
                      <button onClick={() => setIsScatterPoolOpen(!isScatterPoolOpen)} className="text-blue-600 font-bold text-xs border border-blue-200 px-1 rounded">זמני</button>
                      <button onClick={() => pullFromTableToPool('scatter')} className="bg-blue-100 text-blue-700 font-bold text-xs px-1 rounded">רוקן</button>
                      <button onClick={() => clearTable('scat-')} className="bg-red-100 text-red-600 p-1 rounded font-bold text-xs mr-2">מחק הכל</button>
                      <button onClick={copyCollectionToScatter} className="flex items-center gap-1 bg-amber-500 text-white font-bold text-xs px-3 py-1 rounded shadow-md hover:bg-amber-600 transition-colors" title="העתק נתונים מטבלת איסוף"><Copy size={14} /> העתק מאיסוף</button>
                      <button onClick={runScatterAutomat} className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-xs px-3 py-1 rounded shadow-md hover:scale-105 transition-transform mr-4"><Zap size={14} fill="white" /> אוטומט</button>
                    </div>
                 )}
               </div>
               <div className="w-full overflow-x-auto custom-scrollbar pb-4">
                 <div className="flex flex-row-reverse flex-nowrap gap-2 min-h-[350px] w-max mx-auto px-2">
                   {scatterVehicles.map((id, idx) => {
                     const prefix = `scat-${id}-${idx}`;
                     return <BusColumn 
                              key={`scat-col-${idx}`}
                              id={id} 
                              uniquePrefix={prefix} 
                              assignments={assignments} 
                              notes={notes} 
                              onAssign={handleAssign} 
                              onNoteChange={(val) => handleNoteChange(prefix, val)}
                              onTitleChange={(val) => editVehicleName('scatter', idx, val)}
                              checkDuplicate={(name) => isDuplicate(name, 'scatter')} 
                              onClear={() => clearVehicle(prefix)}
                              onDeleteColumn={() => removeVehicle('scatter', idx)}
                              allEmployees={allEmployees}
                              selectedNames={selectedScatterNames}
                              onToggleSelect={(name) => handleToggleSelect(name, 'scatter')}
                              onDropNames={(p, i) => handleMultiDrop(p, i, 'scatter')}
                              isReadOnly={isReadOnly}
                              searchQuery={searchTerm}
                              highlightedNames={highlightedNames}
                              onToggleHighlight={handleToggleHighlight}
                              baseColor="bg-sky-50" 
                            />;
                   })}
                 </div>
               </div>
               <div className="mt-2 px-4 max-w-4xl mx-auto">
                 <input type="text" value={scatterGeneralNote} onChange={(e) => setScatterGeneralNote(e.target.value)} placeholder="הערות כלליות לפיזור..." className="w-full border-b border-blue-200 bg-transparent text-blue-900 placeholder:text-blue-300 focus:outline-none focus:border-blue-500 text-center font-bold" disabled={isReadOnly} />
               </div>
             </section>
             
             {/* איסוף */}
             <section className="mb-6 p-4 rounded-xl border-2 border-slate-400 shadow-md bg-slate-200/80 inline-block w-full max-w-full">
               <div className="flex items-center justify-center gap-2 mb-2 border-b-2 border-orange-500 pb-1 w-fit mx-auto">
                 {isLoggedIn && !isReadOnly ? (
                    <div className="flex items-center gap-2 ml-4">
                       <DateInput 
                         value={displayCollectionDate} 
                         onChange={handleCollectionDateChange} 
                         className="border-orange-300 hover:border-orange-500 bg-white"
                         iconClassName="text-orange-900"
                       />
                       <span className="font-bold text-orange-900 text-lg">{getDayName(displayCollectionDate)}</span>
                    </div>
                 ) : (
                    <span className="text-xl font-black text-orange-900 flex items-center gap-2 bg-white px-4 py-1 rounded border border-orange-300 ml-4">
                      <Calendar className="w-5 h-5"/> {formatDateDisplay(displayCollectionDate)} <span className="mr-2">{getDayName(displayCollectionDate)}</span>
                    </span>
                 )}
                 {isLoggedIn && !isReadOnly ? (
                  <input  
type="text" 
  placeholder="רכב כוננות 123" 
  value={collectionNote || "רכב כוננות "} 
  onChange={(e) => handleVehicleNoteChange(e.target.value)} 
  className={`border-4 font-black text-xl rounded px-4 py-2 mr-2 w-64 shadow-lg focus:outline-none focus:ring-4 transition-colors duration-300 ${isVehicleSaved ? 'bg-red-500 text-white border-red-800 ring-red-300' : 'border-red-600 bg-red-50 text-red-700 ring-red-300'}`} 
/>
                 ) : (<span className="font-bold text-red-600 text-xl border-2 border-red-500 bg-red-50 px-3 py-1 rounded ml-2 shadow-sm">{collectionNote}</span>)}
                 <h1 className="text-xl font-black text-blue-900">איסוף <span className="text-gray-500 text-lg font-normal">({getCount('col-')})</span></h1>
                 {isLoggedIn && !isReadOnly && (
                    <div className="flex items-center gap-2 mr-4 no-print">
                      <button onClick={() => addVehicle('collection')}><PlusCircle size={20} className="text-orange-600" /></button>
                      <button onClick={() => setIsCollectionPoolOpen(!isCollectionPoolOpen)} className="text-orange-600 font-bold text-xs border border-orange-300 px-1 rounded bg-white">זמני</button>
                      <button onClick={() => setIsGlobalPoolOpen(true)} className="text-white bg-blue-500 font-bold text-xs px-2 py-1 rounded flex items-center gap-1"><UserCheck size={12}/> מי לא שובץ?</button>
                      <button onClick={() => pullFromTableToPool('collection')} className="bg-orange-100 text-orange-700 font-bold text-xs px-1 rounded border border-orange-200">רוקן</button>
                      <button onClick={() => clearTable('col-')} className="bg-red-100 text-red-600 p-1 rounded font-bold text-xs mr-2 border border-red-200">מחק הכל</button>
                      <button onClick={runCollectionAutomat} className="flex items-center gap-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-xs px-3 py-1 rounded shadow-md hover:scale-105 transition-transform mr-4"><Zap size={14} fill="white" /> אוטומט</button>
                    </div>
                 )}
               </div>
               <div className="w-full overflow-x-auto custom-scrollbar pb-4">
                 <div className="flex flex-row-reverse flex-nowrap gap-2 min-h-[350px] w-max mx-auto px-2">
                   {collectionVehicles.map((id, idx) => {
                     const prefix = `col-${id}-${idx}`;
                     return <BusColumn 
                              key={`col-col-${idx}`}
                              id={id} 
                              uniquePrefix={prefix} 
                              assignments={assignments} 
                              notes={notes} 
                              onAssign={handleAssign} 
                              onNoteChange={(val) => handleNoteChange(prefix, val)}
                              onTitleChange={(val) => editVehicleName('collection', idx, val)}
                              checkDuplicate={(name) => isDuplicate(name, 'combined')} 
                              onClear={() => clearVehicle(prefix)}
                              onDeleteColumn={() => removeVehicle('collection', idx)}
                              allEmployees={allEmployees}
                              selectedNames={selectedCollectionNames}
                              onToggleSelect={(name) => handleToggleSelect(name, 'collection')}
                              onDropNames={(p, i) => handleMultiDrop(p, i, 'collection')}
                              isReadOnly={isReadOnly}
                              searchQuery={searchTerm}
                              highlightedNames={highlightedNames} 
                              onToggleHighlight={handleToggleHighlight}
                              baseColor="bg-gray-100" 
                            />;
                   })}
                 </div>
               </div>
             </section>
             
             {/* נוכחות וכללי (הטבלה השלישית) */}
             <section className="mb-12 p-2 rounded-xl border border-purple-100 shadow-sm bg-white/90 w-full max-w-full">
               <div className="flex items-center justify-center gap-4 mb-4 border-b-2 border-blue-600 pb-1 w-fit mx-auto">
                 <h1 className="text-xl font-black text-blue-900">נוכחות וכללי <span className="text-gray-400 text-lg font-normal">({getCount('stat-')})</span></h1>
                 {isLoggedIn && !isReadOnly && (
                    <div className="flex items-center gap-2 mr-4 no-print">
                      <button onClick={() => setIsGlobalPoolOpen(true)} className="bg-blue-600 text-white font-bold text-xs px-3 py-1.5 rounded-full flex items-center gap-1 shadow-md hover:bg-blue-500 transition-colors"><UserCheck size={14}/> מי לא שובץ?</button>
                      <button onClick={() => addStatusCol('daily')}><PlusCircle size={20} className="text-blue-600" /></button>
                      <button onClick={() => clearTable('stat-')} className="bg-red-100 text-red-600 p-1 rounded font-bold text-xs mr-2">מחק הכל</button>
                    </div>
                 )}
               </div>
               
               <div className="w-full overflow-x-auto custom-scrollbar pb-4">
                 <div className="flex flex-row flex-nowrap justify-center gap-4 min-h-[350px] w-max mx-auto px-2">
                   {isLoggedIn && !isReadOnly && (
                     <div className="min-w-[192px] w-48 p-2 border border-yellow-200 bg-yellow-50/80 rounded shadow-inner no-print flex flex-col shrink-0">
                        <h3 className="font-bold text-lg text-yellow-800 mb-1 border-b border-yellow-200 pb-1">פתקים אישיים</h3>
                        <textarea value={personalNotes} onFocus={handlePersonalNoteFocus} onKeyDown={handlePersonalNoteKeyDown} onChange={(e) => { setPersonalNotes(e.target.value); if (!isHistoryMode) saveCheckpoint(); }} className="w-full h-full bg-transparent resize-none text-lg focus:outline-none" placeholder="רשום כאן תזכורות..." />
                     </div>
                   )}
                   
                   {/* מנגנון גרירה ומיון - הפיצ'ר החדש */}
                   <div className="flex flex-row-reverse flex-nowrap gap-2 shrink-0">
                     {statusColumns.map((title, index) => {
                       const isDragging = draggingColIdx === index;
                       const isDragOver = dragOverColIdx === index;
                       const prefix = `stat-${index}`;
                       
                       const borderClass = isDragOver && draggingColIdx !== null 
                          ? (draggingColIdx < index ? 'border-r-4 border-r-blue-500 shadow-xl' : 'border-l-4 border-l-blue-500 shadow-xl') 
                          : '';

                       return (
                         <div
                           key={`stat-col-wrapper-${index}`}
                           draggable={!isReadOnly}
                           onDragStart={(e) => { if (isReadOnly) return; setDraggingColIdx(index); }}
                           onDragOver={(e) => { e.preventDefault(); if (dragOverColIdx !== index) setDragOverColIdx(index); }}
                           onDragEnd={() => { setDraggingColIdx(null); setDragOverColIdx(null); }}
                           onDrop={() => handleColumnDrop(index)}
                           className={`transition-all duration-200 cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-30 scale-95' : ''} ${borderClass}`}
                         >
                           <BusColumn 
                              id={title} 
                              uniquePrefix={prefix} 
                              assignments={assignments} 
                              notes={notes} 
                              onNoteChange={(val)=>handleNoteChange(prefix, val)} 
                              onTitleChange={(val)=>editStatusColName('daily', index, val)} 
                              onAssign={handleAssign} 
                              checkDuplicate={(name) => isDuplicate(name, 'combined')} 
                              onDeleteColumn={() => removeStatusCol('daily', index)} 
                              onClear={() => clearTable(prefix)} 
                              allEmployees={allEmployees} 
                              selectedNames={selectedCollectionNames} 
                              onToggleSelect={(name) => handleToggleSelect(name, 'collection')} 
                              onDropNames={(p, i) => handleMultiDrop(p, i, 'collection')} 
                              isReadOnly={isReadOnly} 
                              searchQuery={searchTerm} 
                              highlightedNames={highlightedNames} 
                              onToggleHighlight={handleToggleHighlight}
                              baseColor={isDragging ? "bg-amber-100" : (title === "חופש" ? "bg-rose-50" : (title === "מילואים" ? "bg-blue-50" : "bg-slate-50"))}
                           />
                         </div>
                       );
                     })}
                   </div>
                 </div>
               </div>
             </section>
             <SignatureFooter />
             <FloatingPool title="מאגר פיזור" isOpen={isScatterPoolOpen} onClose={() => setIsScatterPoolOpen(false)} names={scatterPoolList} onRemoveName={(name) => removeFromPool('scatter', name)} onClearAll={() => clearPool('scatter')} onDropToPool={() => handleDropToPool('scatter')} color="bg-blue-600" initialPosition={{ x: 50, y: window.innerHeight - 300 }} selectedNames={selectedScatterNames} onToggleSelect={(name) => handleToggleSelect(name, 'scatter')} isReadOnly={isReadOnly} onAddManualName={(name) => handleAddManualName(name, 'scatter')} onAutoDistribute={runScatterAutomat} />
             <FloatingPool title="מאגר איסוף" isOpen={isCollectionPoolOpen} onClose={() => setIsCollectionPoolOpen(false)} names={collectionPoolList} onRemoveName={(name) => removeFromPool('collection', name)} onClearAll={() => clearPool('collection')} onDropToPool={() => handleDropToPool('collection')} color="bg-orange-600" initialPosition={{ x: window.innerWidth - 300, y: window.innerHeight - 300 }} selectedNames={selectedCollectionNames} onToggleSelect={(name) => handleToggleSelect(name, 'collection')} isReadOnly={isReadOnly} onAddManualName={(name) => handleAddManualName(name, 'collection')} onAutoDistribute={runCollectionAutomat} />
             
             {/* מאגר החופשות */}
             <FloatingPool 
                title="מאגר חופשות" 
                isOpen={isVacationPoolOpen} 
                onClose={() => setIsVacationPoolOpen(false)} 
                names={vacationPoolList} 
                onRemoveName={(name) => removeFromPool('vacation', name)} 
                onClearAll={() => clearPool('vacation')} 
                onDropToPool={() => handleDropToPool('vacation')} 
                color="bg-rose-600" 
                initialPosition={{ x: window.innerWidth / 2, y: window.innerHeight - 300 }} 
                selectedNames={selectedVacationNames} 
                onToggleSelect={(name) => handleToggleSelect(name, 'vacation')} 
                isReadOnly={isReadOnly} 
                onAddManualName={(name) => handleAddManualName(name, 'vacation')} 
                onAutoDistribute={handleAutoAssignVacations} 
             />
          </div>
        )}

        {currentView === 'weekend' && (
          <div className="animate-in fade-in duration-300 space-y-8 w-full flex flex-col items-center">
            {/* סופ"ש שישי */}
            <section className="p-2 rounded-xl border border-teal-200 shadow-sm bg-white/90 w-full max-w-full">
               <div className="flex items-center justify-center gap-2 mb-2 border-b-2 border-teal-600 pb-1 w-fit mx-auto relative">
                 {isLoggedIn && !isReadOnly ? (
                    <div className="flex items-center gap-2">
                       <DateInput value={fridayDate} onChange={handleFridayDateChange} className="border-teal-200 hover:border-teal-400" iconClassName="text-teal-900" />
                       <span className="font-bold text-teal-900 text-lg">{getDayName(fridayDate)}</span>
                    </div>
                 ) : (
                    <span className="text-xl font-black text-teal-900 flex items-center gap-2 pointer-events-none bg-white/80 px-4 py-1 rounded border border-teal-200"><Calendar className="w-5 h-5"/> {formatDateDisplay(fridayDate)} <span className="mr-2">{getDayName(fridayDate)}</span></span>
                 )}
                 {isLoggedIn && !isReadOnly && (
                    <div className="flex items-center gap-2 mr-4 no-print">
                      <button onClick={() => addVehicle('friday')}><PlusCircle size={20} className="text-teal-600" /></button>
                      <button onClick={() => addStatusCol('friday')} className="text-xs bg-teal-100 text-teal-700 px-2 py-1 rounded">הוסף עצמאי</button>
                      <button onClick={() => setIsWeekendPoolOpen(!isWeekendPoolOpen)} className="text-teal-600 font-bold text-xs border border-teal-200 px-1 rounded">זמני</button>
                      <button onClick={() => clearTable('fri-')} className="bg-red-100 text-red-600 p-1 rounded font-bold text-xs mr-2">מחק הכל</button>
                      <button onClick={runWeekendAutomat} className="flex items-center gap-1 bg-green-500 text-white font-bold text-xs px-3 py-1 rounded shadow-md hover:scale-105 transition-transform mr-4"><Zap size={14} fill="white" /> אוטומט סופ"ש</button>
                    </div>
                 )}
               </div>
               <div className="w-full overflow-x-auto custom-scrollbar pb-4">
                 <div className="flex flex-row-reverse flex-nowrap gap-2 min-h-[350px] w-max mx-auto px-2">
                   {fridayStatusCols.map((title, idx) => (
                     <BusColumn key={`fri-stat-${idx}`} id={title} uniquePrefix={`fri-stat-${idx}`} assignments={assignments} notes={notes} onNoteChange={(val)=>handleNoteChange(`fri-stat-${idx}`, val)} onTitleChange={(val)=>editStatusColName('friday', idx, val)} onAssign={handleAssign} checkDuplicate={(name) => checkWeekendDuplicate(name, 'fri')} onDeleteColumn={() => removeStatusCol('friday', idx)} onClear={() => clearTable(`fri-stat-${idx}`)} allEmployees={allEmployees} selectedNames={[]} onToggleSelect={() => {}} onDropNames={() => {}} isReadOnly={isReadOnly} searchQuery={searchTerm} highlightedNames={highlightedNames} onToggleHighlight={handleToggleHighlight} baseColor="bg-emerald-50" />
                   ))}
                   {fridayVehicles.map((id, idx) => (
                     <div key={`fri-col-${idx}`} className="relative group">
                       <BusColumn id={id} uniquePrefix={`fri-${idx}`} assignments={assignments} notes={notes} onAssign={handleAssign} onNoteChange={(val) => handleNoteChange(`fri-${idx}`, val)} onTitleChange={(val) => editVehicle('friday', idx, val)} checkDuplicate={(name) => checkWeekendDuplicate(name, 'fri')} onClear={() => clearVehicle(`fri-${idx}`)} allEmployees={allEmployees} selectedNames={selectedScatterNames} onToggleSelect={(name) => handleToggleSelect(name, 'scatter')} onDropNames={(p, i) => handleMultiDrop(p, i, 'scatter')} isReadOnly={isReadOnly} searchQuery={searchTerm} onDeleteColumn={() => removeVehicle('friday', idx)} highlightedNames={highlightedNames} onToggleHighlight={handleToggleHighlight} baseColor="bg-emerald-50" />
                     </div>
                   ))}
                 </div>
               </div>
            </section>
            
            {/* סופ"ש שבת */}
            <section className="p-2 rounded-xl border border-indigo-200 shadow-sm bg-white/90 w-full max-w-full">
               <div className="flex items-center justify-center gap-2 mb-2 border-b-2 border-indigo-600 pb-1 w-fit mx-auto">
                 <span className="text-xl font-black text-indigo-900 flex items-center gap-2"><Calendar className="w-5 h-5"/> {formatDateDisplay(saturdayDate)} <span className="font-bold">{getDayName(saturdayDate)}</span></span>
                 {isLoggedIn && !isReadOnly && (
                    <div className="flex items-center gap-2 mr-4 no-print">
                      <button onClick={handleCopyFridayToSaturday} className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs border border-blue-200 hover:bg-blue-100"><Copy size={12} /> העתק משישי</button>
                      <button onClick={() => addVehicle('saturday')}><PlusCircle size={20} className="text-indigo-600" /></button>
                      <button onClick={() => addStatusCol('saturday')} className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">הוסף עצמאי</button>
                      <button onClick={() => clearTable('sat-')} className="bg-red-100 text-red-600 p-1 rounded font-bold text-xs mr-2">מחק הכל</button>
                    </div>
                 )}
               </div>
               <div className="w-full overflow-x-auto custom-scrollbar pb-4">
                 <div className="flex flex-row-reverse flex-nowrap gap-2 min-h-[350px] w-max mx-auto px-2">
                   {saturdayStatusCols.map((title, idx) => (
                     <BusColumn key={`sat-stat-${idx}`} id={title} uniquePrefix={`sat-stat-${idx}`} assignments={assignments} notes={notes} onNoteChange={(val)=>handleNoteChange(`sat-stat-${idx}`, val)} onTitleChange={(val)=>editStatusColName('saturday', idx, val)} onAssign={handleAssign} checkDuplicate={(name) => checkWeekendDuplicate(name, 'sat')} onDeleteColumn={() => removeStatusCol('saturday', idx)} onClear={() => clearTable(`sat-stat-${idx}`)} allEmployees={allEmployees} selectedNames={[]} onToggleSelect={() => {}} onDropNames={() => {}} isReadOnly={isReadOnly} searchQuery={searchTerm} highlightedNames={highlightedNames} onToggleHighlight={handleToggleHighlight} baseColor="bg-indigo-50" />
                   ))}
                   {saturdayVehicles.map((id, idx) => (
                     <div key={`sat-col-${idx}`} className="relative group">
                       <BusColumn id={id} uniquePrefix={`sat-${idx}`} assignments={assignments} notes={notes} onAssign={handleAssign} onNoteChange={(val) => handleNoteChange(`sat-${idx}`, val)} onTitleChange={(val) => editVehicle('saturday', idx, val)} checkDuplicate={(name) => checkWeekendDuplicate(name, 'sat')} onClear={() => clearVehicle(`sat-${idx}`)} allEmployees={allEmployees} selectedNames={selectedScatterNames} onToggleSelect={(name) => handleToggleSelect(name, 'scatter')} onDropNames={(p, i) => handleMultiDrop(p, i, 'scatter')} isReadOnly={isReadOnly} searchQuery={searchTerm} onDeleteColumn={() => removeVehicle('saturday', idx)} highlightedNames={highlightedNames} onToggleHighlight={handleToggleHighlight} baseColor="bg-indigo-50" />
                     </div>
                   ))}
                 </div>
               </div>
            </section>
            <SignatureFooter />
            <FloatingPool title="מאגר סופ״ש" isOpen={isWeekendPoolOpen} onClose={() => setIsWeekendPoolOpen(false)} names={weekendPoolList} onRemoveName={(name) => removeFromPool('weekend', name)} onClearAll={() => clearPool('weekend')} onDropToPool={() => handleDropToPool('weekend')} color="bg-teal-600" initialPosition={{ x: window.innerWidth / 2 - 128, y: window.innerHeight - 300 }} selectedNames={selectedWeekendNames} onToggleSelect={(name) => handleToggleSelect(name, 'weekend')} isReadOnly={isReadOnly} onAddManualName={(name) => handleAddManualName(name, 'weekend')} />
          </div>
        )}

      {currentView === 'holiday' && (
          <div className="animate-in fade-in duration-300 w-full flex flex-col items-center">
             <div className="text-center mb-4"><h2 className="text-4xl font-black text-purple-600 drop-shadow-md"> ✨  חג שמח  ✨ </h2></div>
             {Array.from({ length: holidayDaysCount }).map((_, dayIndex) => {
               const dayPrefix = dayIndex === 0 ? 'hol-' : `hol${dayIndex + 1}-`;
               const dateNoteKey = `date-${dayPrefix}`; 
               const tableDate = dayIndex === 0 ? holidayDate : (notes[dateNoteKey] || "");
               const holidayName = HOLIDAYS_ISRAEL[tableDate];

               // הנה התיקון הקריטי: מעבירים את ה-dayIndex לפונקציה כדי שתדע איזה תאריך לשמור
               const handleTableDateChange = (val: string) => {
                 if (dayIndex === 0) handleHolidayDateChange(val);
                 else handleNoteChange(dateNoteKey, val);
               };

               return (
                 <section key={dayIndex} className="mb-6 p-2 rounded-xl border border-purple-200 shadow-sm bg-white/90 w-full max-w-full">
                   <div className="flex items-center justify-center gap-2 mb-2 border-b-2 border-purple-600 pb-1 w-fit mx-auto relative">
                     {isLoggedIn && !isReadOnly ? (
                        <div className="flex items-center gap-2">
                          {dayIndex > 0 && ( <button onClick={() => removeHolidayTable(dayIndex)} className="text-red-500 hover:text-red-700 transition-colors p-1" title="מחק יום זה"><Trash2 size={20} /></button> )}
                          <DateInput value={tableDate} onChange={handleTableDateChange} className="border-purple-200 hover:border-purple-400" iconClassName="text-purple-900"/>
                          <span className="font-bold text-purple-900">{getDayName(tableDate)}</span>
                          {dayIndex > 0 && <span className="font-bold text-purple-800"> (יום {dayIndex + 1})</span>}
                        </div>
                     ) : (
                        <span className="text-xl font-black text-purple-900 flex items-center gap-2 pointer-events-none bg-white/80 px-4 py-1 rounded border border-purple-200"><Calendar className="w-5 h-5"/> {formatDateDisplay(tableDate)} <span className="mr-2">{getDayName(tableDate)}</span></span>
                     )}
                     <h1 className="text-xl font-black text-purple-900 mr-2 flex items-center gap-2">
                       סידור חג
                       {holidayName && <span className="bg-fuchsia-100 text-fuchsia-700 px-2 py-0.5 rounded text-sm animate-pulse border border-fuchsia-300 shadow-sm">✨ {holidayName} ✨</span>}
                     </h1>
                     {isLoggedIn && !isReadOnly && (
                        <div className="flex items-center gap-2 mr-4 no-print">
                          <button onClick={() => addVehicle('holiday')}><PlusCircle size={20} className="text-purple-600" /></button>
                          <button onClick={() => addStatusCol('holiday')} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">הוסף עצמאי</button>
                          {dayIndex === 0 && ( <button onClick={handleAddHolidayTable} className="text-xs bg-teal-500 text-white font-bold px-2 py-1 rounded shadow-md hover:bg-teal-600 flex items-center gap-1"><PlusCircle size={12} /> הוסף טבלה</button> )}
                          <button onClick={() => clearTable(dayPrefix)} className="bg-red-100 text-red-600 p-1 rounded font-bold text-xs mr-2">מחק הכל</button>
                        </div>
                     )}
                   </div>
                   <div className="w-full overflow-x-auto custom-scrollbar pb-4">
                     <div className="flex flex-row-reverse flex-nowrap gap-2 min-h-[350px] w-max mx-auto px-2">
                       {holidayStatusCols.map((title, idx) => (
                         <BusColumn key={`${dayPrefix}stat-${idx}`} id={title} uniquePrefix={`${dayPrefix}stat-${idx}`} assignments={assignments} notes={notes} onNoteChange={(val)=>handleNoteChange(`${dayPrefix}stat-${idx}`, val)} onTitleChange={(val)=>editStatusColName('holiday', idx, val)} onAssign={handleAssign} checkDuplicate={(name) => checkHolidayDuplicate(name, dayPrefix)} onDeleteColumn={() => removeStatusCol('holiday', idx)} onClear={() => clearTable(`${dayPrefix}stat-${idx}`)} allEmployees={allEmployees} selectedNames={[]} onToggleSelect={() => {}} onDropNames={() => {}} isReadOnly={isReadOnly} searchQuery={searchTerm} highlightedNames={highlightedNames} onToggleHighlight={handleToggleHighlight} baseColor="bg-fuchsia-50" />
                       ))}
                       {holidayVehicles.map((id, idx) => (
                         <div key={`${dayPrefix}col-${idx}`} className="relative group">
                           <BusColumn id={id} uniquePrefix={`${dayPrefix}${idx}`} assignments={assignments} notes={notes} onAssign={handleAssign} onNoteChange={(val) => handleNoteChange(`${dayPrefix}${idx}`, val)} onTitleChange={(val) => editVehicle('holiday', idx, val)} checkDuplicate={(name) => checkHolidayDuplicate(name, dayPrefix)} onClear={() => clearVehicle(`${dayPrefix}${idx}`)} allEmployees={allEmployees} selectedNames={selectedScatterNames} onToggleSelect={(name) => handleToggleSelect(name, 'scatter')} onDropNames={(p, i) => handleMultiDrop(p, i, 'scatter')} isReadOnly={isReadOnly} searchQuery={searchTerm} onDeleteColumn={() => removeVehicle('holiday', idx)} highlightedNames={highlightedNames} onToggleHighlight={handleToggleHighlight} baseColor="bg-fuchsia-50" />
                         </div>
                       ))}
                     </div>
                   </div>
                 </section>
               );
             })}
             <SignatureFooter />
          </div>
        )}

        <FloatingPool title="פול עובדים (לא שובצו)" isOpen={isGlobalPoolOpen} onClose={() => setIsGlobalPoolOpen(false)} names={unassignedEmployees} onRemoveName={() => {}} onClearAll={() => {}} onDropToPool={() => {}} color="bg-gray-800" initialPosition={{ x: window.innerWidth / 2 - 128, y: 150 }} selectedNames={selectedGlobalNames} onToggleSelect={(name) => handleToggleSelect(name, 'global')} isReadOnly={isReadOnly} onAddManualName={()=>{}} />
      </main>
      </div> 
    </div> 
  );
}

export default App;