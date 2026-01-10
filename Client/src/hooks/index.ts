import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/index';
import { useDarkMode } from './useDarkMode';
import { useOutsideAlerter } from './useOutsideAlerter';

export const useAppDispatch: () => AppDispatch = useDispatch;

export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export { useDarkMode, useOutsideAlerter };
