<?php
/**
 * Plugin Name: Invitation Database
 * Description: Manages invitations, RSVP responses, and push tokens. Mirrors the Supabase schema so the Invitation Builder app can use WordPress as its backend.
 * Version: 1.0.0
 * Author: Radneyvous
 */

if (!defined('ABSPATH')) {
    exit;
}

define('IDB_VERSION', '1.3.0');
define('IDB_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('IDB_PLUGIN_URL', plugin_dir_url(__FILE__));

// Include component files
require_once IDB_PLUGIN_DIR . 'includes/class-idb-database.php';
require_once IDB_PLUGIN_DIR . 'includes/class-idb-rest-api.php';
require_once IDB_PLUGIN_DIR . 'includes/class-idb-admin.php';

// Activation: create database tables
register_activation_hook(__FILE__, function () {
    IDB_Database::create_tables();
});

// Deactivation: keep data
register_deactivation_hook(__FILE__, function () {
    // Data is preserved on deactivation. Use uninstall.php to remove tables.
});

// Initialize REST API
add_action('rest_api_init', function () {
    IDB_Rest_Api::register_routes();
});

// Allow file uploads via REST API for the invitation-db namespace.
// WordPress normally blocks file uploads from unauthenticated REST requests;
// this filter ensures $_FILES is populated for our /upload endpoint.
add_filter('rest_request_before_callbacks', function ($response, $handler, $request) {
    // No-op: just ensure the request body is parsed for multipart
    return $response;
}, 10, 3);

// CORS headers for REST API — allows the Next.js app (instavow.com) to
// upload files directly to WordPress, bypassing Vercel's 4.5MB body limit.
add_filter('rest_pre_serve_request', function ($value) {
    $origin = get_http_origin();
    // Allow requests from instavow.com and localhost (dev)
    $allowed_origins = array(
        'https://instavow.com',
        'https://www.instavow.com',
        'http://localhost:3000',
        'http://localhost:3001',
    );
    if ($origin && in_array($origin, $allowed_origins, true)) {
        header('Access-Control-Allow-Origin: ' . $origin);
        header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, X-Invitation-Id, X-Upload-Token');
        header('Access-Control-Allow-Credentials: true');
        header('Vary: Origin');
    }
    return $value;
});

// Handle CORS preflight requests
add_action('rest_api_init', function () {
    register_rest_route('invitation-db/v1', '/upload-options', array(
        'methods'  => 'OPTIONS',
        'callback' => function () {
            return new WP_REST_Response('', 204);
        },
        'permission_callback' => '__return_true',
    ));
}, 99);

// Increase upload size limit for REST API file uploads
add_filter('upload_size_limit', function ($size) {
    // 10MB — matches the app-side validation
    return 10 * 1024 * 1024;
});

// Initialize Admin
add_action('admin_menu', function () {
    IDB_Admin::init();
});

// Run migrations on admin init (handles upgrades without deactivate/reactivate)
add_action('admin_init', function () {
    if (get_option('idb_db_version') !== IDB_VERSION) {
        IDB_Database::migrate_tables();
        update_option('idb_db_version', IDB_VERSION);
    }
});

// Enqueue admin scripts and styles
add_action('admin_enqueue_scripts', function ($hook) {
    if (strpos($hook, 'invitation-database') === false) {
        return;
    }
    // Google Material Symbols for icons
    wp_enqueue_style(
        'idb-material-symbols',
        'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&icon_names=search',
        array(),
        null
    );
    wp_enqueue_style(
        'idb-admin-style',
        IDB_PLUGIN_URL . 'assets/admin.css',
        array(),
        IDB_VERSION
    );
    wp_enqueue_script(
        'idb-admin-script',
        IDB_PLUGIN_URL . 'assets/admin.js',
        array('jquery'),
        IDB_VERSION,
        true
    );
    // Pass REST URL and nonce to the admin script
    wp_localize_script('idb-admin-script', 'idbData', array(
        'restUrl' => esc_url_raw(rest_url('invitation-db/v1')),
        'nonce'   => wp_create_nonce('wp_rest'),
    ));
});
