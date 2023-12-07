/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useMemo, useContext, useState } from '@wordpress/element';
import { ENTER } from '@wordpress/keycodes';
import {
	__experimentalGrid as Grid,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from './global-styles-provider';
import { unlock } from '../../lock-unlock';
import { getFamilyPreviewStyle } from './font-library-modal/utils/preview-styles';
import { getVariationsByProperty } from './utils';
import Subtitle from './subtitle';

const { GlobalStylesContext, areGlobalStyleConfigsEqual } = unlock(
	blockEditorPrivateApis
);

const getFontFamilies = ( themeJson ) => {
	const headingFontFamilyCSS =
		themeJson?.styles?.elements?.heading?.typography?.fontFamily;
	const headingFontFamilyVariable =
		headingFontFamilyCSS &&
		headingFontFamilyCSS.replace( 'var(', '' ).replace( ')', '' );
	const headingFontFamilySlug = headingFontFamilyVariable
		?.split( '--' )
		.slice( -1 )[ 0 ];

	const bodyFontFamilyVariable = themeJson?.styles?.typography?.fontFamily
		.replace( 'var(', '' )
		.replace( ')', '' );

	const bodyFontFamilySlug = bodyFontFamilyVariable
		?.split( '--' )
		.slice( -1 )[ 0 ];

	const fontFamilies = themeJson?.settings?.typography?.fontFamilies?.theme; // TODO this could not be under theme.

	const bodyFontFamily = fontFamilies.find(
		( fontFamily ) => fontFamily.slug === bodyFontFamilySlug
	);

	let headingFontFamily = fontFamilies.find(
		( fontFamily ) => fontFamily.slug === headingFontFamilySlug
	);

	if ( ! headingFontFamily ) {
		headingFontFamily = bodyFontFamily;
	}

	return [ bodyFontFamily, headingFontFamily ];
};
const getFontFamilyNames = ( themeJson ) => {
	const [ bodyFontFamily, headingFontFamily ] = getFontFamilies( themeJson );
	return [ bodyFontFamily?.name, headingFontFamily?.name ];
};

const normalizedHeight = 100;
const ratio = 1;

function TypographyVariation( { variation } ) {
	const [ isFocused, setIsFocused ] = useState( false );
	const { base, user, setUserConfig } = useContext( GlobalStylesContext );
	const context = useMemo( () => {
		return {
			user: {
				settings: variation.settings ?? {},
				styles: variation.styles ?? {},
			},
			base,
			merged: mergeBaseAndUserConfigs( base, variation ),
			setUserConfig: () => {},
		};
	}, [ variation, base ] );

	const selectVariation = () => {
		setUserConfig( () => {
			return {
				settings: variation.settings,
				styles: variation.styles,
			};
		} );
	};

	const selectOnEnter = ( event ) => {
		if ( event.keyCode === ENTER ) {
			event.preventDefault();
			selectVariation();
		}
	};

	const isActive = useMemo( () => {
		return areGlobalStyleConfigsEqual( user, variation );
	}, [ user, variation ] );

	let label = variation?.title;
	if ( variation?.description ) {
		label = sprintf(
			/* translators: %1$s: variation title. %2$s variation description. */
			__( '%1$s (%2$s)' ),
			variation?.title,
			variation?.description
		);
	}

	const [ bodyFontFamilies, headingFontFamilies ] = getFontFamilies(
		mergeBaseAndUserConfigs( base, variation )
	);

	const bodyPreviewStyle = getFamilyPreviewStyle( bodyFontFamilies );
	const headingPreviewStyle = {
		...getFamilyPreviewStyle( headingFontFamilies ),
		fontSize: '1.2rem',
	};

	return (
		<GlobalStylesContext.Provider value={ context }>
			<div
				className={ classnames(
					'edit-site-global-styles-variations_item',
					{
						'is-active': isActive,
					}
				) }
				role="button"
				onClick={ selectVariation }
				onKeyDown={ selectOnEnter }
				tabIndex="0"
				aria-label={ label }
				aria-current={ isActive }
				onFocus={ () => setIsFocused( true ) }
				onBlur={ () => setIsFocused( false ) }
			>
				<VStack
					className="edit-site-global-styles-variations_item-preview"
					isFocused={ isFocused }
					style={ {
						height: normalizedHeight * ratio,
						lineHeight: 1.2,
						textAlign: 'center',
					} }
				>
					<div style={ headingPreviewStyle }>
						{ headingFontFamilies.name }
					</div>
					<div style={ bodyPreviewStyle }>
						{ bodyFontFamilies.name }
					</div>
				</VStack>
			</div>
		</GlobalStylesContext.Provider>
	);
}

export default function TypographyVariations() {
	const variations = useSelect( ( select ) => {
		return select(
			coreStore
		).__experimentalGetCurrentThemeGlobalStylesVariations();
	}, [] );

	const { base, user } = useContext( GlobalStylesContext );

	const typographyVariations =
		variations && getVariationsByProperty( user, variations, 'typography' );

	const uniqueTypographyVariations = [];
	const uniqueTypographyNames = [];
	const isDup = ( x, y ) => {
		return uniqueTypographyNames.find( ( it ) => {
			return JSON.stringify( it ) === JSON.stringify( [ x, y ] );
		} );
	};

	typographyVariations?.forEach( ( variation ) => {
		const [ bodyFontFamilyName, headingFontFamilyName ] =
			getFontFamilyNames( mergeBaseAndUserConfigs( base, variation ) );
		if ( ! isDup( bodyFontFamilyName, headingFontFamilyName ) ) {
			uniqueTypographyVariations.push( variation );
			uniqueTypographyNames.push( [
				bodyFontFamilyName,
				headingFontFamilyName,
			] );
		}
	} );

	return (
		<VStack spacing={ 3 }>
			<Subtitle level={ 3 }>{ __( 'Presets' ) }</Subtitle>
			<Grid
				columns={ 2 }
				className="edit-site-global-styles-style-variations-container"
			>
				{ uniqueTypographyVariations &&
					uniqueTypographyVariations.map( ( variation, index ) => {
						return (
							<TypographyVariation
								key={ index }
								variation={ variation }
							/>
						);
					} ) }
			</Grid>
		</VStack>
	);
}