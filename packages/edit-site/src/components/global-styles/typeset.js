/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { useContext } from '@wordpress/element';
import {
	__experimentalHeading as Heading,
	__experimentalItemGroup as ItemGroup,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { mergeBaseAndUserConfigs } from './global-styles-provider';
import { unlock } from '../../lock-unlock';
import { getVariationsByProperty } from './utils';
import { NavigationButtonAsItem } from './navigation-button';

const { GlobalStylesContext } = unlock( blockEditorPrivateApis );

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

export default function Typeset() {
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
		<>
			<div className="edit-site-sidebar-navigation-screen-styles__group-header">
				<Heading level={ 3 }>{ __( 'Typeset' ) }</Heading>
			</div>
			<ItemGroup>
				<NavigationButtonAsItem
					path="/typography/typesets"
					aria-label={ __( 'Typesets' ) }
				>
					{ __( 'Typesets' ) }
				</NavigationButtonAsItem>
			</ItemGroup>
		</>
	);
}