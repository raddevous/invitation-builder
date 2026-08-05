<?php
/**
 * Uninstall — removes all database tables when the plugin is deleted.
 */

if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

require_once plugin_dir_path(__FILE__) . 'includes/class-idb-database.php';
IDB_Database::drop_tables();
