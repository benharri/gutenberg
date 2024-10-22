/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../store';
import { unlock } from '../lock-unlock';
/**
 * A hook used to set the editor mode to zoomed out mode, invoking the hook sets the mode.
 *
 * @param {boolean} zoomOut If we should enter into zoomOut mode or not
 */
export function useZoomOut( zoomOut = true ) {
	const { __unstableSetEditorMode, setZoomLevel } = unlock(
		useDispatch( blockEditorStore )
	);
	const { __unstableGetEditorMode } = unlock( useSelect( blockEditorStore ) );

	const originalEditingModeRef = useRef( null );
	const mode = __unstableGetEditorMode();
	const isWideViewport = useViewportMatch( 'large' );

	useEffect( () => {
		// Only set this on mount so we know what to return to when we unmount.
		if ( ! originalEditingModeRef.current ) {
			originalEditingModeRef.current = mode;
		}

		return () => {
			// We need to use  __unstableGetEditorMode() here and not `mode`, as mode may not update on unmount
			if (
				__unstableGetEditorMode() === 'zoom-out' &&
				__unstableGetEditorMode() !== originalEditingModeRef.current
			) {
				__unstableSetEditorMode( originalEditingModeRef.current );
				setZoomLevel( 100 );
			}
		};
	}, [] );

	// The effect opens the zoom-out view if we want it open and it's not currently in zoom-out mode.
	useEffect( () => {
		if ( ! isWideViewport ) {
			setZoomLevel( 100 );
		} else if ( zoomOut && mode !== 'zoom-out' ) {
			__unstableSetEditorMode( 'zoom-out' );
			setZoomLevel( 50 );
		} else if (
			! zoomOut &&
			__unstableGetEditorMode() === 'zoom-out' &&
			originalEditingModeRef.current !== mode
		) {
			__unstableSetEditorMode( originalEditingModeRef.current );
			setZoomLevel( 100 );
		}
	}, [
		__unstableGetEditorMode,
		__unstableSetEditorMode,
		zoomOut,
		setZoomLevel,
		isWideViewport,
	] ); // Mode is deliberately excluded from the dependencies so that the effect does not run when mode changes.
}
