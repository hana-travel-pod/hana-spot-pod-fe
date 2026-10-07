import { createContext, PropsWithChildren, useContext, useEffect, useReducer } from 'react';
import { initialTransferState, transferReducer } from './model';

function useTransferState() {
  const [state, dispatch] = useReducer(transferReducer, initialTransferState);
  useEffect(() => {
    if (state.request?.status !== 'all_approved') return;
    const id = state.request.id;
    const timer = setTimeout(() => dispatch({ type: 'complete', id, processedAt: new Date().toISOString() }), 1500);
    return () => clearTimeout(timer);
  }, [state.request]);
  return { state, dispatch };
}
const TransferContext = createContext<ReturnType<typeof useTransferState> | null>(null);
export function TransferProvider({ children }: PropsWithChildren) {
  const value = useTransferState();
  return <TransferContext.Provider value={value}>{children}</TransferContext.Provider>;
}
export function useTransfer() {
  const value = useContext(TransferContext);
  if (!value) throw new Error('TransferProvider is required');
  return value;
}
