<?php
/**
 * Database management for Invitation Database.
 * Creates and manages 3 tables that mirror the Supabase schema:
 *   - invitations       (id TEXT, slug, access_code, template_id, event_type, client_name, data JSON, created_at, updated_at)
 *   - rsvp_responses    (id UUID, invitation_id, guest_name, attendance, guest_count, message, submitted_at)
 *   - push_tokens       (id UUID, invitation_id, token, updated_at)
 */

if (!defined('ABSPATH')) {
    exit;
}

class IDB_Database
{
    /**
     * Field definitions per table — used by the admin UI to know which columns to show.
     * Each field: key = column name, label = display label, type = data type hint.
     */
    public static function get_table_fields($table)
    {
        $fields = array(
            'invitations' => array(
                'id'           => array('label' => 'ID',           'type' => 'text'),
                'slug'         => array('label' => 'Slug',         'type' => 'text'),
                'access_code'  => array('label' => 'Access Code',  'type' => 'text'),
                'email'        => array('label' => 'Email',        'type' => 'text'),
                'phone_number' => array('label' => 'Phone Number', 'type' => 'text'),
                'address'      => array('label' => 'Address',      'type' => 'text'),
                'template_id'  => array('label' => 'Template',     'type' => 'text'),
                'event_type'   => array('label' => 'Event Type',   'type' => 'text'),
                'client_name'  => array('label' => 'Client Name',  'type' => 'text'),
                'data'         => array('label' => 'Data (JSON)',  'type' => 'json'),
                'created_at'   => array('label' => 'Created At',   'type' => 'datetime'),
                'updated_at'   => array('label' => 'Updated At',   'type' => 'datetime'),
                'expires_at'   => array('label' => 'Editing Expires', 'type' => 'datetime'),
            ),
            'rsvp_responses' => array(
                'id'            => array('label' => 'ID',            'type' => 'uuid'),
                'invitation_id' => array('label' => 'Invitation ID', 'type' => 'text'),
                'guest_name'    => array('label' => 'Guest Name',    'type' => 'text'),
                'attendance'    => array('label' => 'Attendance',    'type' => 'text'),
                'guest_count'   => array('label' => 'Guest Count',   'type' => 'int'),
                'message'       => array('label' => 'Message',       'type' => 'text'),
                'submitted_at'  => array('label' => 'Submitted At',  'type' => 'datetime'),
            ),
            'push_tokens' => array(
                'id'            => array('label' => 'ID',            'type' => 'uuid'),
                'invitation_id' => array('label' => 'Invitation ID', 'type' => 'text'),
                'token'         => array('label' => 'Token',         'type' => 'text'),
                'updated_at'    => array('label' => 'Updated At',    'type' => 'datetime'),
            ),
        );
        return $fields[$table] ?? array();
    }

    /**
     * Create the 3 custom database tables on plugin activation.
     * Mirrors the Supabase schema as closely as MySQL allows.
     */
    public static function create_tables()
    {
        global $wpdb;
        $charset_collate = $wpdb->get_charset_collate();

        $invitations_table   = $wpdb->prefix . 'idb_invitations';
        $rsvp_table          = $wpdb->prefix . 'idb_rsvp_responses';
        $push_tokens_table   = $wpdb->prefix . 'idb_push_tokens';

        // invitations — id TEXT PK, slug UNIQUE, access_code UNIQUE, email UNIQUE, phone, address, template, event_type, client_name, data JSON, created_at, updated_at, expires_at
        $sql_invitations = "CREATE TABLE $invitations_table (
            id VARCHAR(36) NOT NULL,
            slug VARCHAR(255) NOT NULL,
            access_code VARCHAR(255) NOT NULL,
            email VARCHAR(255) DEFAULT NULL,
            phone_number VARCHAR(50) DEFAULT NULL,
            address TEXT DEFAULT NULL,
            template_id VARCHAR(255) DEFAULT 'wedding-template-01',
            event_type VARCHAR(100) DEFAULT 'wedding',
            client_name VARCHAR(255) DEFAULT NULL,
            data LONGTEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            expires_at DATETIME DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY slug (slug),
            UNIQUE KEY access_code (access_code),
            UNIQUE KEY email (email)
        ) $charset_collate;";

        // rsvp_responses — mirrors Supabase: id UUID PK, invitation_id, guest_name, attendance, guest_count, message, submitted_at
        $sql_rsvp = "CREATE TABLE $rsvp_table (
            id CHAR(36) NOT NULL,
            invitation_id VARCHAR(36) NOT NULL,
            guest_name VARCHAR(255) NOT NULL,
            attendance VARCHAR(20) NOT NULL DEFAULT 'attending',
            guest_count INT DEFAULT 1,
            message TEXT DEFAULT NULL,
            submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY invitation_id (invitation_id)
        ) $charset_collate;";

        // push_tokens — mirrors Supabase: id UUID PK, invitation_id, token, updated_at, UNIQUE(invitation_id, token)
        $sql_push = "CREATE TABLE $push_tokens_table (
            id CHAR(36) NOT NULL,
            invitation_id VARCHAR(36) NOT NULL,
            token TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uniq_invitation_token (invitation_id, token(255))
        ) $charset_collate;";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql_invitations);
        dbDelta($sql_rsvp);
        dbDelta($sql_push);

        // Auto-migrate: add any missing columns to existing tables
        self::migrate_tables();

        // Store the table list in options for easy reference
        update_option('idb_tables', array(
            'invitations'     => $invitations_table,
            'rsvp_responses'  => $rsvp_table,
            'push_tokens'     => $push_tokens_table,
        ));
    }

    /**
     * Auto-migrate: add missing columns to existing tables.
     * This handles upgrades when new fields are added after initial activation.
     */
    public static function migrate_tables()
    {
        global $wpdb;
        $invitations_table = $wpdb->prefix . 'idb_invitations';

        // Check for columns that were added after initial release
        $new_columns = array(
            'email'        => "ADD COLUMN email VARCHAR(255) DEFAULT NULL",
            'phone_number' => "ADD COLUMN phone_number VARCHAR(50) DEFAULT NULL",
            'address'      => "ADD COLUMN address TEXT DEFAULT NULL",
            'expires_at'   => "ADD COLUMN expires_at DATETIME DEFAULT NULL",
        );

        foreach ($new_columns as $col => $definition) {
            $exists = $wpdb->get_results($wpdb->prepare("SHOW COLUMNS FROM `$invitations_table` LIKE %s", $col));
            if (empty($exists)) {
                $wpdb->query("ALTER TABLE `$invitations_table` $definition");
            }
        }

        // Add unique index on email if missing
        $indexes = $wpdb->get_results("SHOW INDEX FROM `$invitations_table` WHERE Key_name = 'email'");
        if (empty($indexes)) {
            $wpdb->query("ALTER TABLE `$invitations_table` ADD UNIQUE KEY email (email)");
        }

        // Add unique index on access_code if missing
        $indexes = $wpdb->get_results("SHOW INDEX FROM `$invitations_table` WHERE Key_name = 'access_code'");
        if (empty($indexes)) {
            $wpdb->query("ALTER TABLE `$invitations_table` ADD UNIQUE KEY access_code (access_code)");
        }
    }

    /**
     * Drop all tables (used in uninstall.php).
     */
    public static function drop_tables()
    {
        global $wpdb;
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}idb_push_tokens");
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}idb_rsvp_responses");
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}idb_invitations");
        delete_option('idb_tables');
    }

    /**
     * Get the full table name for a given logical table key.
     */
    public static function table_name($key)
    {
        global $wpdb;
        $map = array(
            'invitations'    => $wpdb->prefix . 'idb_invitations',
            'rsvp_responses' => $wpdb->prefix . 'idb_rsvp_responses',
            'push_tokens'    => $wpdb->prefix . 'idb_push_tokens',
        );
        return $map[$key] ?? null;
    }

    /**
     * Generate a UUID v4 string.
     */
    public static function generate_uuid()
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff), mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff), mt_rand(0, 0xffff), mt_rand(0, 0xffff)
        );
    }

    /**
     * Generate a unique slug from a name, or random if no name.
     * Format: firstname-lastname-xxxx (lowercase, hyphenated, 6-char suffix)
     */
    public static function generate_slug($name = '')
    {
        global $wpdb;
        $tbl = $wpdb->prefix . 'idb_invitations';

        $base = '';
        if ($name) {
            $base = sanitize_title($name);
        }
        if (!$base) {
            $base = 'inv';
        }

        // Try up to 10 times to find a unique slug
        for ($i = 0; $i < 10; $i++) {
            $suffix = substr(md5(uniqid(mt_rand(), true)), 0, 6);
            $slug = $base . '-' . $suffix;
            $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM `$tbl` WHERE slug = %s", $slug));
            if (!$exists) {
                return $slug;
            }
        }
        // Fallback: longer random
        return $base . '-' . substr(md5(uniqid(mt_rand(), true)), 0, 12);
    }

    /**
     * Generate a unique human-readable access code.
     * Format: XXXX-XXXX (8 uppercase alphanumeric chars, no ambiguous chars)
     */
    public static function generate_access_code()
    {
        global $wpdb;
        $tbl = $wpdb->prefix . 'idb_invitations';
        $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1

        for ($i = 0; $i < 10; $i++) {
            $code = '';
            for ($c = 0; $c < 8; $c++) {
                $code .= $chars[random_int(0, strlen($chars) - 1)];
            }
            $code = substr($code, 0, 4) . '-' . substr($code, 4, 4);
            $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM `$tbl` WHERE access_code = %s", $code));
            if (!$exists) {
                return $code;
            }
        }
        // Fallback
        return strtoupper(substr(md5(uniqid(mt_rand(), true)), 0, 4)) . '-' . strtoupper(substr(md5(uniqid(mt_rand(), true)), 4, 4));
    }

    // ----------------------------------------------------------------
    // Generic CRUD — works for all 3 tables
    // ----------------------------------------------------------------

    /**
     * Get rows from a table with optional search, filter, pagination.
     *
     * @param string $table_key  Logical table key (invitations, rsvp_responses, push_tokens)
     * @param array  $args       Optional: search, search_field, page, per_page, order_by, order_dir
     * @return array { rows, total }
     */
    public static function get_rows($table_key, $args = array())
    {
        global $wpdb;
        $table = self::table_name($table_key);
        if (!$table) {
            return array('rows' => array(), 'total' => 0);
        }

        $defaults = array(
            'search'      => '',
            'search_field' => '',   // which column to search in; empty = search all text columns
            'page'        => 1,
            'per_page'    => 50,
            'order_by'    => '',
            'order_dir'   => 'ASC',
        );
        $args = wp_parse_args($args, $defaults);

        $where = '1=1';
        $params = array();

        if (!empty($args['search'])) {
            $search = '%' . $wpdb->esc_like($args['search']) . '%';
            if (!empty($args['search_field'])) {
                $field = sanitize_key($args['search_field']);
                $where .= $wpdb->prepare(" AND `$field` LIKE %s", $search);
            } else {
                // Search all text-like columns
                $fields = self::get_table_fields($table_key);
                $or_parts = array();
                foreach ($fields as $col => $info) {
                    if (in_array($info['type'], array('text', 'json', 'uuid', 'datetime'))) {
                        $or_parts[] = $wpdb->prepare(" `$col` LIKE %s", $search);
                    }
                }
                if (!empty($or_parts)) {
                    $where .= ' AND (' . implode(' OR ', $or_parts) . ')';
                }
            }
        }

        // Validate order_by to prevent SQL injection
        $allowed_fields = array_keys(self::get_table_fields($table_key));
        $order_by = in_array($args['order_by'], $allowed_fields, true) ? $args['order_by'] : '';
        $order_dir = strtoupper($args['order_dir']) === 'DESC' ? 'DESC' : 'ASC';

        // Default ordering
        if (empty($order_by)) {
            if ($table_key === 'invitations') {
                $order_by = 'created_at';
                $order_dir = 'DESC';
            } elseif ($table_key === 'rsvp_responses') {
                $order_by = 'submitted_at';
                $order_dir = 'DESC';
            } else {
                $order_by = 'updated_at';
                $order_dir = 'DESC';
            }
        }

        $total = (int) $wpdb->get_var("SELECT COUNT(*) FROM `$table` WHERE $where");

        $offset = max(0, ($args['page'] - 1) * $args['per_page']);
        $per_page = max(1, intval($args['per_page']));

        $sql = "SELECT * FROM `$table` WHERE $where ORDER BY `$order_by` $order_dir LIMIT $per_page OFFSET $offset";
        $rows = $wpdb->get_results($sql);

        return array('rows' => $rows, 'total' => $total);
    }

    /**
     * Get a single row by ID.
     */
    public static function get_row($table_key, $id)
    {
        global $wpdb;
        $table = self::table_name($table_key);
        if (!$table) return null;
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM `$table` WHERE id = %s", $id));
    }

    /**
     * Delete rows by IDs.
     */
    public static function delete_rows($table_key, $ids)
    {
        global $wpdb;
        $table = self::table_name($table_key);
        if (!$table || empty($ids)) return 0;

        $ids = array_map('sanitize_text_field', $ids);
        $placeholders = implode(',', array_fill(0, count($ids), '%s'));
        $wpdb->query($wpdb->prepare("DELETE FROM `$table` WHERE id IN ($placeholders)", $ids));
        return $wpdb->rows_affected;
    }

    /**
     * Insert a row.
     */
    public static function insert_row($table_key, $data)
    {
        global $wpdb;
        $table = self::table_name($table_key);
        if (!$table) return false;

        // Generate UUID if not provided
        if (empty($data['id'])) {
            if ($table_key === 'invitations') {
                $data['id'] = self::generate_uuid();
            } else {
                $data['id'] = self::generate_uuid();
            }
        }

        // Set defaults
        if ($table_key === 'invitations') {
            if (!isset($data['data'])) $data['data'] = '{}';
            if (!isset($data['template_id'])) $data['template_id'] = 'wedding-template-01';
            if (!isset($data['event_type'])) $data['event_type'] = 'wedding';
        }

        $wpdb->insert($table, $data);
        return $data['id'];
    }

    /**
     * Update a row by ID.
     */
    public static function update_row($table_key, $id, $data)
    {
        global $wpdb;
        $table = self::table_name($table_key);
        if (!$table) return false;
        return $wpdb->update($table, $data, array('id' => $id));
    }

    // ----------------------------------------------------------------
    // Invitation-specific helpers (used by REST API)
    // ----------------------------------------------------------------

    public static function get_invitation_by_slug($slug)
    {
        global $wpdb;
        $table = self::table_name('invitations');
        return $wpdb->get_row($wpdb->prepare("SELECT * FROM `$table` WHERE slug = %s", $slug));
    }

    public static function get_invitation_by_access_code($access_code)
    {
        global $wpdb;
        $table = self::table_name('invitations');
        return $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM `$table` WHERE access_code = %s", strtoupper(trim($access_code)))
        );
    }

    public static function get_rsvp_responses($invitation_id)
    {
        global $wpdb;
        $table = self::table_name('rsvp_responses');
        return $wpdb->get_results(
            $wpdb->prepare("SELECT * FROM `$table` WHERE invitation_id = %s ORDER BY submitted_at DESC", $invitation_id)
        );
    }

    /**
     * Delete a single RSVP response by id.
     * @param string $id  The RSVP row id (UUID).
     * @return bool True on success, false on failure.
     */
    public static function delete_rsvp_response($id)
    {
        global $wpdb;
        $table = self::table_name('rsvp_responses');
        return $wpdb->delete($table, array('id' => $id), array('%s')) !== false;
    }

    public static function get_push_tokens($invitation_id)
    {
        global $wpdb;
        $table = self::table_name('push_tokens');
        return $wpdb->get_results(
            $wpdb->prepare("SELECT token FROM `$table` WHERE invitation_id = %s", $invitation_id)
        );
    }

    // ----------------------------------------------------------------
    // JSON merge-and-persist for invitation data
    // ----------------------------------------------------------------

    /**
     * The default invitation data structure.
     * Mirrors the real InvitationData shape used by the Next.js app
     * (see lib/types/invitation.ts and lib/demo/demo-data.ts), with
     * personal content (names, venue, date/time) left blank and all
     * structural fields (colors, fonts, arrays, section toggles, etc.)
     * populated so nothing crashes on the frontend.
     *
     * Update this when new fields are added to the template.
     * Existing invitations will auto-merge missing fields on next read.
     */
    public static function get_default_invitation_data()
    {
        return array(
            'date' => '',
            'time' => '',
            'andText' => '&',
            'herName' => '',
            'hisName' => '',
            'bodyFont' => 'Inter',
            'heroIcon' => '',
            'nameType' => 'couple',
            'sections' => array(
                'map' => true,
                'rsvp' => true,
                'footer' => true,
                'gallery' => true,
                'timeline' => true,
                'countdown' => true,
                'dresscode' => true,
                'entourage' => true,
                'giftguide' => true,
                'eventdetails' => true,
                'weddingdirectory' => true,
            ),
            'subtitle' => 'Together with their families',
            'timezone' => 'PST',
            'entourage' => array(
                'couple' => array(
                    'title' => 'Couple',
                    'brideName' => '',
                    'groomName' => '',
                    'brideTitle' => 'Bride',
                    'groomTitle' => 'Groom',
                ),
                'header' => 'The Wedding Party',
                'topText' => 'Together with their families',
                'bottomText' => 'We thank you for being part of our special day',
                'namesColor' => '#8a6252',
                'paperColor' => '#f5e3db',
                'titlesColor' => '#5c4a3a',
                'brideParents' => array(
                    'title' => 'Parents of the Bride',
                    'fatherName' => '',
                    'motherName' => '',
                    'fatherTitle' => 'Mr.',
                    'motherTitle' => 'Mrs.',
                ),
                'groomParents' => array(
                    'title' => 'Parents of the Groom',
                    'fatherName' => '',
                    'motherName' => '',
                    'fatherTitle' => 'Mr.',
                    'motherTitle' => 'Mrs.',
                ),
                'namesFontSize' => 125,
                'titlesFontSize' => 106,
                'namesTypography' => 'Inter',
                'paperBackground' => 'texture5',
                'visibleSections' => array(
                    'couple' => true,
                    'ushers' => false,
                    'bestMan' => false,
                    'chairman' => false,
                    'groomsmen' => false,
                    'witnesses' => false,
                    'ringBearer' => false,
                    'usherettes' => false,
                    'bibleBearer' => false,
                    'bridesmaids' => false,
                    'flowerGirls' => false,
                    'jrGroomsmen' => false,
                    'maidOfHonor' => false,
                    'brideParents' => true,
                    'groomParents' => true,
                    'jrBridesmaid' => false,
                    'directorOfFeast' => false,
                    'directorOfCeremony' => false,
                    'marriageTalkSpeaker' => false,
                    'officiatingMinister' => false,
                ),
                'titlesTypography' => 'Inter',
            ),
            'venueName' => '',
            'coupleName' => '',
            'mainColor1' => '#1B3B5F',
            'mainColor2' => '#6998EE',
            'mapHeading' => 'Location',
            'mapMessage' => 'Join us at this beautiful venue',
            'musicTrack' => '',
            'giftMessage' => 'Your presence is our greatest gift',
            'headingFont' => 'Inter',
            'heroMessage' => 'We invite you to celebrate with us',
            'musicVolume' => 50,
            'rsvpHeading' => 'RSVP',
            'venueImages' => array(),
            'venueLayout' => array(
                'doors' => array(),
                'tables' => array(),
                'cutouts' => array(),
                'baseShape' => 'rectangle',
                'gridColor' => '#e5e7eb',
                'chairColor' => '#9ca3af',
                'dimensions' => array('width' => 800, 'height' => 600),
                'floorColor' => '#f3f4f6',
                'tableColor' => '#ffffff',
                'tableScale' => 1,
                'gridDensity' => 20,
                'outlineColor' => '#6b7280',
                'doorColorMode' => 0,
                'tableTextColor' => '#374151',
            ),
            'baseFontSize' => 16,
            'heroIconSize' => 100,
            'heroIconType' => 'initial',
            'heroNameSize' => 62.5,
            'musicEnabled' => false,
            'rsvpDeadline' => '',
            'rsvpInvitees' => array(),
            'sectionOrder' => array(
                'hero', 'wedding-directory', 'countdown', 'event-details', 'entourage',
                'dresscode', 'gallery', 'map', 'timeline', 'rsvp', 'giftguide', 'footer',
            ),
            'venueAddress' => '',
            'dresscodeBody' => 'Formal attire requested',
            'footerDivider' => 'none',
            'galleryImages' => array(),
            'photosAndImages' => array(),
            'neutralColor1' => '#FFFFFF',
            'neutralColor2' => '#ebebeb',
            'galleryHeading' => 'Gallery',
            'galleryMessage' => 'A glimpse of our journey',
            'rsvpGuestField' => true,
            'rsvpPaperColor' => '#ffffff',
            'timelineEvents' => array(),
            'backgroundImage' => '',
            'backgroundMusic' => array(),
            'heroOthersColor' => '#ffffff',
            'imageTransforms' => array(),
            'mapHeadingColor' => '#5c4a3a',
            'mapMessageColor' => '#8a6252',
            'mapUseMainColor' => true,
            'welcomeElements' => array(),
            'welcomeEnvelope' => 'classic-envelope',
            'countdownHeading' => 'Countdown',
            'countdownMessage' => 'Until we say I do',
            'dresscodeHeading' => 'Dress Code',
            'entourageHeading' => 'Entourage',
            'flowerDecoration' => 'none',
            'giftguideHeading' => 'Gifts',
            'rsvpCrystalColor' => '#6998EE',
            'rsvpDeadlineText' => 'Please respond by',
            'rsvpGuestDetails' => array(),
            'rsvpMessageField' => true,
            'rsvpReservedText' => 'Reserved',
            'rsvpUseMainColor' => true,
            'universalDivider' => 'none',
            'countdownShowDate' => true,
            'galleryGridLayout' => 'grid-2',
            'heroAmpersandSize' => 100,
            'heroDateStructure' => 'default',
            'heroHostLineImage' => 'hostline-01',
            'heroIconColorTint' => '#6998EE',
            'heroIconTextColor' => '#ffffff',
            'heroOverlayColor1' => '#6998EE',
            'heroOverlayColor2' => '#8a6252',
            'mapBackgroundType' => 'color',
            'welcomeScreenType' => 'classic-envelope',
            'dresscodeBodyColor' => '#8a6252',
            'heroIconName2First' => false,
            'heroIconTypography' => 'Inter',
            'heroOthersTextSize' => 1,
            'heroVenueStructure' => 'default',
            'mapBackgroundColor' => '#fff8f3',
            'mapHeadingFontSize' => 100,
            'mapHeadingFontSizeMobile' => 100,
            'mapMessageFontSize' => 100,
            'mapMessageFontSizeMobile' => 100,
            'rsvpAttendanceText' => 'Number of guests',
            'rsvpBackgroundType' => 'color',
            'rsvpGuestNameStyle' => 0,
            'rsvpHeaderFontSize' => 100,
            'rsvpHeaderFontSizeMobile' => 100,
            'dressCodeCategories' => array(),
            'eventDetailsDivider' => 'none',
            'eventDetailsHeading' => 'Event Details',
            'eventDetailsMessage' => 'We would be delighted to have you join us',
            'galleryHeadingColor' => '#5c4a3a',
            'galleryMessageColor' => '#8a6252',
            'galleryUseMainColor' => true,
            'giftThankYouMessage' => 'Thank you for your generosity',
            'heroOverlayOpacity1' => 0.5,
            'heroOverlayOpacity2' => 0.5,
            'rsvpBackgroundColor' => '#fff8f3',
            'rsvpCardHeadingText' => 'Will you be attending?',
            'rsvpPaperBackground' => 'texture1',
            'rsvpTopTextFontSize' => 100,
            'rsvpTopTextFontSizeMobile' => 100,
            'heroAmpersandOpacity' => 100,
            'heroBackgroundImages' => array(),
            'heroClosingSentiment' => 'With love',
            'heroIconAddAmpersand' => true,
            'heroOthersTypography' => 'Inter',
            'mapHeadingTypography' => 'Inter',
            'mapMessageTypography' => 'Inter',
            'countdownCrystalColor' => '#6998EE',
            'countdownHeadingColor' => '#5c4a3a',
            'countdownMessageColor' => '#8a6252',
            'countdownUseMainColor' => true,
            'dresscodeBodyFontSize' => 100,
            'dresscodeBodyFontSizeMobile' => 100,
            'dresscodeHeadingColor' => '#5c4a3a',
            'dresscodeUseMainColor' => true,
            'entourageHeadingColor' => '#5c4a3a',
            'entourageTopTextColor' => '#8a6252',
            'entourageUseMainColor' => true,
            'galleryBackgroundType' => 'color',
            'heroAmpersandPosition' => 'default',
            'heroBackgroundOverlay' => 'solid',
            'heroDateStructureSize' => 100,
            'heroTextShadowOpacity' => 0.1,
            // Left empty by default (demo has a sample team member card here)
            'weddingDirectoryItems' => array(),
            'countdownDateStructure' => 'default',
            'galleryBackgroundColor' => '#fff8f3',
            'galleryHeadingFontSize' => 100,
            'galleryHeadingFontSizeMobile' => 100,
            'galleryMessageFontSize' => 100,
            'galleryMessageFontSizeMobile' => 100,
            'rsvpBottomTextFontSize' => 100,
            'rsvpBottomTextFontSizeMobile' => 100,
            'countdownBackgroundType' => 'color',
            'dresscodeBackgroundType' => 'color',
            'dresscodeTitlesFontSize' => 100,
            'dresscodeTitlesFontSizeMobile' => 100,
            'entourageBackgroundType' => 'color',
            'heroAmpersandTypography' => 'Inter',
            'rsvpEntourageHonorifics' => array(),
            'weddingDirectoryHeading' => 'Wedding Directory',
            'weddingDirectoryMessage' => 'Our wonderful team',
            'backgroundMusicFileNames' => array(),
            'countdownBackgroundColor' => '#fff8f3',
            'countdownHeadingFontSize' => 100,
            'countdownHeadingFontSizeMobile' => 100,
            'countdownMessageFontSize' => 100,
            'countdownMessageFontSizeMobile' => 100,
            'dresscodeBackgroundColor' => '#fff8f3',
            'entourageBackgroundColor' => '#fff8f3',
            'entourageBottomTextColor' => '#8a6252',
            'entourageHeadingFontSize' => 100,
            'entourageHeadingFontSizeMobile' => 100,
            'entourageTopTextFontSize' => 100,
            'entourageTopTextFontSizeMobile' => 100,
            'eventDetailsHeadingColor' => '#5c4a3a',
            'eventDetailsMessageColor' => '#6998EE',
            'eventDetailsUseMainColor' => false,
            'galleryHeadingTypography' => 'Inter',
            'galleryMessageTypography' => 'Inter',
            'heroBackgroundImagesCrop' => array(),
            'heroDateStructureSpacing' => 100,
            'heroHostLineImageOpacity' => 1,
            'heroIconColorTintOpacity' => 0.3,
            'heroIconMarginAdjustment' => 0,
            'heroClosingSentimentImage' => 'fsentiment-01',
            'heroDisplayNameTypography' => 'Inter',
            'rsvpAttendingThankYouText' => 'Thank you for celebrating with us!',
            'rsvpEntourageGuestDetails' => array(),
            'countdownHeadingTypography' => 'Inter',
            'countdownMessageTypography' => 'Inter',
            'entourageHeadingTypography' => 'Inter',
            'entourageTopTextTypography' => 'Inter',
            'eventDetailsBackgroundType' => 'color',
            'heroBackgroundImagesMobile' => array(),
            'entourageBottomTextFontSize' => 100,
            'entourageBottomTextFontSizeMobile' => 100,
            'eventDetailsBackgroundColor' => '#fff8f3',
            'eventDetailsHeadingFontSize' => 100,
            'eventDetailsHeadingFontSizeMobile' => 100,
            'eventDetailsMessageFontSize' => 100,
            'eventDetailsMessageFontSizeMobile' => 100,
            'rsvpNotAttendingThankYouText' => 'Thank you for letting us know.',
            'weddingDirectoryHeadingColor' => '#5c4a3a',
            'weddingDirectoryMessageColor' => '#8a6252',
            'weddingDirectoryUseMainColor' => true,
            'entourageBottomTextTypography' => 'Inter',
            'eventDetailsHeadingTypography' => 'Inter',
            'eventDetailsMessageTypography' => 'Inter',
            'heroIconAmpersandOnSecondLine' => false,
            'eventDetailsTimelineAccentMode' => 0,
            'heroBackgroundImagesMobileCrop' => array(),
            'weddingDirectoryBackgroundType' => 'color',
            'weddingDirectoryBackgroundColor' => '#fff8f3',
            'weddingDirectoryHeadingFontSize' => 100,
            'weddingDirectoryHeadingFontSizeMobile' => 100,
            'weddingDirectoryMessageFontSize' => 100,
            'weddingDirectoryMessageFontSizeMobile' => 100,
            'heroClosingSentimentImageOpacity' => 1,
            'weddingDirectoryHeadingTypography' => 'Inter',
            'weddingDirectoryMessageTypography' => 'Inter',
            'rsvpNotAttendingWithMessageThankYouText' => 'Thank you for your kind words.',
            'timelineHeadingFontSize' => 100,
            'timelineHeadingFontSizeMobile' => 100,
            'timelineMessageFontSize' => 100,
            'timelineMessageFontSizeMobile' => 100,
            'giftguideHeadingFontSize' => 100,
            'giftguideHeadingFontSizeMobile' => 100,
            'giftguideMessageFontSize' => 100,
            'giftguideMessageFontSizeMobile' => 100,
            'accentColor' => '#6998EE',
            'budgetData' => array(),
            'checklistData' => array(),
        );
    }

    /**
     * Recursively merge defaults into stored data.
     * - Adds missing keys from defaults
     * - Does NOT overwrite existing values
     * - Recurses into nested arrays
     * - Does NOT remove keys that exist in stored but not in defaults
     *
     * @param array $defaults  The default template structure
     * @param array $stored    The stored data from DB
     * @return array The merged data
     */
    public static function deep_merge_defaults($defaults, $stored)
    {
        $merged = $stored;

        foreach ($defaults as $key => $default_value) {
            if (!array_key_exists($key, $merged)) {
                // Key missing entirely — add from defaults
                $merged[$key] = $default_value;
            } elseif (is_array($default_value) && is_array($merged[$key])) {
                // Both are arrays — recurse
                $merged[$key] = self::deep_merge_defaults($default_value, $merged[$key]);
            }
            // If key exists and is not an array, keep the stored value (don't overwrite)
        }

        return $merged;
    }

    /**
     * Merge invitation data with defaults and persist if changed.
     * Called on every read of invitation data.
     *
     * @param object $row  The invitation row from DB (has ->data as JSON string, ->id)
     * @return array The merged data array
     */
    public static function merge_invitation_data($row)
    {
        if (!$row || !isset($row->data)) {
            return self::get_default_invitation_data();
        }

        // Decode stored data
        $stored = json_decode($row->data, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $stored = array();
        }

        // Merge with defaults
        $defaults = self::get_default_invitation_data();
        $merged = self::deep_merge_defaults($defaults, $stored);

        // Check if merge added anything
        $merged_json = json_encode($merged);
        $stored_json = json_encode($stored);

        if ($merged_json !== $stored_json) {
            // Something was missing — persist the merged version
            global $wpdb;
            $table = self::table_name('invitations');
            $wpdb->update(
                $table,
                array('data' => $merged_json),
                array('id' => $row->id)
            );
        }

        return $merged;
    }
}
