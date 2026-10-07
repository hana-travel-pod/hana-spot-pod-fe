import { createContext, PropsWithChildren, useContext, useEffect, useReducer, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, View } from 'react-native';
import { Copy, palette } from '../../components/MobileUI';
import { calendarReducer, initialCalendar, restoreSavedCalendar } from './model';
const KEY = 'hana-calendar-demo-v3';
function useCalendarState() {
  const [state, dispatch] = useReducer(calendarReducer, initialCalendar);
  const [ready, setReady] = useState(false); const [storageError, setStorageError] = useState('');
  const [migrationMessage, setMigrationMessage] = useState('');
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY).then(raw => raw ?? AsyncStorage.getItem('hana-calendar-demo-v2')).then(raw => {
      if (!active || !raw) return;
      const restored = restoreSavedCalendar(raw);
      setMigrationMessage(restored.message);
      dispatch({ type: 'hydrate', state: restored.state });
    }).catch(() => { if (active) setStorageError('저장된 상태를 불러오지 못했어요. 개발 시연 화면에서 초기화할 수 있어요.'); }).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  useEffect(() => {
    if (!ready || storageError) return;
    writes.current = writes.current.then(() => AsyncStorage.setItem(KEY, JSON.stringify({ version: 3, state }))).catch(() => setStorageError('기기에 상태를 저장하지 못했어요. 저장 재시도를 눌러 주세요.'));
  }, [state, ready, storageError]);
  const retryStorage = () => { setStorageError(''); };
  return { state, dispatch, ready, storageError, retryStorage, migrationMessage };
}
const Context = createContext<ReturnType<typeof useCalendarState> | null>(null);
export function CalendarProvider({ children }: PropsWithChildren) {
  const value = useCalendarState();
  if (!value.ready) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color={palette.green} /><Copy style={{ textAlign: 'center' }}>일정을 불러오고 있어요</Copy></View>;
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useCalendar() { const value = useContext(Context); if (!value) throw new Error('CalendarProvider required'); return value; }
