<?php
/**
 * Admin page for Invitation Database.
 * Renders a container div that the JavaScript tabbed table UI mounts into.
 */

if (!defined('ABSPATH')) {
    exit;
}

class IDB_Admin
{
    public static function init()
    {
        add_menu_page(
            'Invitation Database',
            'Invitation Database',
            'manage_options',
            'invitation-database',
            array(__CLASS__, 'render_page'),
            'dashicons-database',
            30
        );
    }

    public static function render_page()
    {
        ?>
        <div class="wrap idb-wrap">
            <div class="idb-header">
                <h1>Invitation Database</h1>
            </div>
            <div id="idb-root"></div>
        </div>
        <?php
    }
}
