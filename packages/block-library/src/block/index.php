<?php
/**
 * Server-side rendering of the `core/block` block.
 *
 * @package WordPress
 */

/**
 * Renders the `core/block` block on server.
 *
 * @param array $attributes The block attributes.
 *
 * @return string Rendered HTML of the referenced block.
 */
function render_block_core_block( $attributes ) {
	static $seen_refs = array();

	if ( empty( $attributes['ref'] ) ) {
		return '';
	}

	$reusable_block = get_post( $attributes['ref'] );
	if ( ! $reusable_block || 'wp_block' !== $reusable_block->post_type ) {
		return '';
	}

	if ( isset( $seen_refs[ $attributes['ref'] ] ) ) {
		// WP_DEBUG_DISPLAY must only be honored when WP_DEBUG. This precedent
		// is set in `wp_debug_mode()`.
		$is_debug = WP_DEBUG && WP_DEBUG_DISPLAY;

		return $is_debug ?
			// translators: Visible only in the front end, this warning takes the place of a faulty block.
			__( '[block rendering halted]' ) :
			'';
	}

	if ( 'publish' !== $reusable_block->post_status || ! empty( $reusable_block->post_password ) ) {
		return '';
	}

	$seen_refs[ $attributes['ref'] ] = true;

	$filter_block_context = static function( $context ) use ( $attributes ) {
		if ( isset( $attributes['dynamicContent'] ) && $attributes['dynamicContent'] ) {
			$context['dynamicContent'] = $attributes['dynamicContent'];
		}

		return $context;
	};

	$id = 0;
	$filter_recursive_auto_id = static function ( $parsed_block, $source_block, $parent_block ) use ( &$id ) {
		$set_auto_id = static function ( &$block ) use ( &$set_auto_id, &$id ) {
			if ( null === $block['blockName'] ) return;
			$id++;
			if ( ! _wp_array_get( $block, array( 'attrs', 'metadata', 'id'), false ) ) {
				$block['attrs']['metadata'] = array( 'id' => $id );
			}
			foreach ( $block['innerBlocks'] as &$inner_block ) {
				$set_auto_id( $inner_block );
			}
		};

		if ( null === $parent_block ) {
			$set_auto_id( $parsed_block );
		}

		return $parsed_block;
	};
	add_filter( 'render_block_data', $filter_recursive_auto_id, 10, 3 );

	/**
	 * We set the `dynamicContent` context through the `render_block_context`
	 * filter so that it is available when a pattern's inner blocks are
	 * rendering via do_blocks given it only receives the inner content.
	 */
	add_filter( 'render_block_context', $filter_block_context, 1 );

	// Handle embeds for reusable blocks.
	global $wp_embed;
	$content = $wp_embed->run_shortcode( $reusable_block->post_content );
	$content = $wp_embed->autoembed( $content );

	$content = do_blocks( $content );
	unset( $seen_refs[ $attributes['ref'] ] );

	remove_filter( 'render_block_data', $filter_recursive_auto_id, 10, 3 );
	remove_filter( 'render_block_context', $filter_block_context, 1 );

	return $content;
}

/**
 * Registers the `core/block` block.
 */
function register_block_core_block() {
	register_block_type_from_metadata(
		__DIR__ . '/block',
		array(
			'render_callback' => 'render_block_core_block',
		)
	);
}
add_action( 'init', 'register_block_core_block' );
