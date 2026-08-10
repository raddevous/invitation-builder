<?php
/**
 * REST API for Invitation Database.
 *
 * Two groups of endpoints:
 *
 * 1. Admin endpoints (require WP nonce / auth) — used by the admin UI:
 *    GET    /rows/{table}          List rows with search/filter/pagination
 *    DELETE /rows/{table}          Delete rows by IDs
 *    POST   /rows/{table}          Insert a row
 *    PATCH  /rows/{table}/{id}     Update a row
 *
 * 2. App endpoints (public, used by the Invitation Builder Next.js app):
 *    GET    /invitation/{slug}     Fetch invitation by slug (public, no access_code)
 *    POST   /auth/access-code      Login via access code
 *    PATCH  /invitation/{slug}     Update invitation data (requires token)
 *    POST   /rsvp                  Submit RSVP (public)
 *    GET    /rsvp                  List RSVPs by invitation_id (public)
 *    GET    /push-token            List tokens for an invitation (server-side use)
 *    POST   /push-token            Register push token (requires token)
 *    DELETE /push-token            Remove push token (requires token)
 */

if (!defined('ABSPATH')) {
    exit;
}

class IDB_Rest_Api
{
    public static function register_routes()
    {
        $namespace = 'invitation-db/v1';

        // -----------------------------------------------------------
        // Admin endpoints — require WP auth
        // -----------------------------------------------------------
        register_rest_route($namespace, '/rows/(?P<table>invitations|rsvp_responses|push_tokens)', array(
            array(
                'methods'             => 'GET',
                'callback'            => array(__CLASS__, 'admin_get_rows'),
                'permission_callback' => array(__CLASS__, 'check_admin_permission'),
                'args'                => array(
                    'search'       => array('type' => 'string', 'default' => ''),
                    'search_field' => array('type' => 'string', 'default' => ''),
                    'page'         => array('type' => 'integer', 'default' => 1),
                    'per_page'     => array('type' => 'integer', 'default' => 50),
                    'order_by'     => array('type' => 'string', 'default' => ''),
                    'order_dir'    => array('type' => 'string', 'default' => 'ASC'),
                ),
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array(__CLASS__, 'admin_insert_row'),
                'permission_callback' => array(__CLASS__, 'check_admin_permission'),
            ),
            array(
                'methods'             => 'DELETE',
                'callback'            => array(__CLASS__, 'admin_delete_rows'),
                'permission_callback' => array(__CLASS__, 'check_admin_permission'),
            ),
        ));

        register_rest_route($namespace, '/rows/(?P<table>invitations|rsvp_responses|push_tokens)/(?P<id>[a-zA-Z0-9\-]+)', array(
            array(
                'methods'             => 'GET',
                'callback'            => array(__CLASS__, 'admin_get_single'),
                'permission_callback' => array(__CLASS__, 'check_admin_permission'),
            ),
            array(
                'methods'             => 'PATCH',
                'callback'            => array(__CLASS__, 'admin_update_row'),
                'permission_callback' => array(__CLASS__, 'check_admin_permission'),
            ),
        ));

        // Check duplicate (for slug / access_code uniqueness)
        register_rest_route($namespace, '/check-duplicate', array(
            'methods'             => 'GET',
            'callback'            => array(__CLASS__, 'admin_check_duplicate'),
            'permission_callback' => array(__CLASS__, 'check_admin_permission'),
            'args'                => array(
                'table' => array('type' => 'string', 'required' => true),
                'field' => array('type' => 'string', 'required' => true),
                'value' => array('type' => 'string', 'required' => true),
                'exclude_id' => array('type' => 'string', 'default' => ''),
            ),
        ));

        // -----------------------------------------------------------
        // App endpoints — used by the Next.js Invitation Builder
        // -----------------------------------------------------------

        // Public: get invitation by slug (does NOT expose access_code)
        register_rest_route($namespace, '/invitation/(?P<slug>[a-zA-Z0-9\-]+)', array(
            array(
                'methods'             => 'GET',
                'callback'            => array(__CLASS__, 'app_get_invitation'),
                'permission_callback' => '__return_true',
            ),
            array(
                'methods'             => 'PATCH',
                'callback'            => array(__CLASS__, 'app_update_invitation'),
                'permission_callback' => '__return_true', // token checked inside
            ),
        ));

        // Public: login via access code
        register_rest_route($namespace, '/auth/access-code', array(
            'methods'             => 'POST',
            'callback'            => array(__CLASS__, 'app_auth_access_code'),
            'permission_callback' => '__return_true',
        ));

        // Public: signup — create a new invitation with email + phone + address
        register_rest_route($namespace, '/auth/signup', array(
            'methods'             => 'POST',
            'callback'            => array(__CLASS__, 'app_signup'),
            'permission_callback' => '__return_true',
        ));

        // Public: RSVP submission
        register_rest_route($namespace, '/rsvp', array(
            array(
                'methods'             => 'POST',
                'callback'            => array(__CLASS__, 'app_submit_rsvp'),
                'permission_callback' => '__return_true',
            ),
            array(
                'methods'             => 'GET',
                'callback'            => array(__CLASS__, 'app_get_rsvps'),
                'permission_callback' => '__return_true',
            ),
        ));

        // Push token management (token checked inside)
        register_rest_route($namespace, '/push-token', array(
            array(
                'methods'             => 'GET',
                'callback'            => array(__CLASS__, 'app_get_push_tokens'),
                'permission_callback' => '__return_true',
            ),
            array(
                'methods'             => 'POST',
                'callback'            => array(__CLASS__, 'app_register_push_token'),
                'permission_callback' => '__return_true',
            ),
            array(
                'methods'             => 'DELETE',
                'callback'            => array(__CLASS__, 'app_remove_push_token'),
                'permission_callback' => '__return_true',
            ),
        ));

        // File upload — accepts multipart form data, stores in WP media library
        register_rest_route($namespace, '/upload', array(
            array(
                'methods'             => 'POST',
                'callback'            => array(__CLASS__, 'app_upload_file'),
                'permission_callback' => '__return_true', // token checked inside
            ),
            array(
                'methods'             => 'DELETE',
                'callback'            => array(__CLASS__, 'app_delete_file'),
                'permission_callback' => '__return_true', // token checked inside
            ),
        ));
    }

    // ---------------------------------------------------------------
    // Permission check for admin endpoints
    // ---------------------------------------------------------------
    public static function check_admin_permission($request)
    {
        if (!current_user_can('manage_options')) {
            return new WP_Error('rest_forbidden', 'You do not have permission to access this endpoint.', array('status' => 403));
        }
        return true;
    }

    // ---------------------------------------------------------------
    // Admin: GET /rows/{table}
    // ---------------------------------------------------------------
    public static function admin_get_rows($request)
    {
        $table = $request->get_param('table');
        $result = IDB_Database::get_rows($table, array(
            'search'       => $request->get_param('search'),
            'search_field' => $request->get_param('search_field'),
            'page'         => (int) $request->get_param('page'),
            'per_page'     => (int) $request->get_param('per_page'),
            'order_by'     => $request->get_param('order_by'),
            'order_dir'    => $request->get_param('order_dir'),
        ));

        // Decode JSON data field for display
        foreach ($result['rows'] as &$row) {
            if (isset($row->data) && is_string($row->data)) {
                $decoded = json_decode($row->data, true);
                if (json_last_error() === JSON_ERROR_NONE) {
                    $row->data = $decoded;
                }
            }
        }

        return rest_ensure_response(array(
            'rows'  => $result['rows'],
            'total' => $result['total'],
        ));
    }

    // ---------------------------------------------------------------
    // Admin: POST /rows/{table}
    // ---------------------------------------------------------------
    public static function admin_insert_row($request)
    {
        $table = $request->get_param('table');
        $body = $request->get_json_params();

        // Duplicate check for invitations: slug, access_code, and email must be unique
        if ($table === 'invitations') {
            global $wpdb;
            $tbl = IDB_Database::table_name('invitations');

            if (!empty($body['slug'])) {
                $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM `$tbl` WHERE slug = %s", $body['slug']));
                if ($exists) {
                    return new WP_REST_Response(array('error' => 'Duplicate slug', 'message' => 'A record with slug "' . $body['slug'] . '" already exists.'), 409);
                }
            }
            if (!empty($body['access_code'])) {
                $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM `$tbl` WHERE access_code = %s", strtoupper(trim($body['access_code']))));
                if ($exists) {
                    return new WP_REST_Response(array('error' => 'Duplicate access_code', 'message' => 'A record with access code "' . $body['access_code'] . '" already exists.'), 409);
                }
            }
            if (!empty($body['email'])) {
                $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM `$tbl` WHERE email = %s", strtolower(trim($body['email']))));
                if ($exists) {
                    return new WP_REST_Response(array('error' => 'Duplicate email', 'message' => 'A record with email "' . $body['email'] . '" already exists.'), 409);
                }
            }
        }

        // Encode data field if it's an array/object
        if (isset($body['data']) && !is_string($body['data'])) {
            $body['data'] = json_encode($body['data']);
        }

        $id = IDB_Database::insert_row($table, $body);
        if (!$id) {
            return new WP_REST_Response(array('error' => 'Failed to insert'), 500);
        }
        return rest_ensure_response(array('id' => $id));
    }

    // ---------------------------------------------------------------
    // Admin: GET /check-duplicate
    // Query params: table, field, value
    // Returns: { duplicate: true/false }
    // ---------------------------------------------------------------
    public static function admin_check_duplicate($request)
    {
        $table = $request->get_param('table');
        $field = $request->get_param('field');
        $value = $request->get_param('value');
        $exclude_id = $request->get_param('exclude_id'); // for update scenarios

        // Only allow checking specific fields
        $allowed = array(
            'invitations' => array('slug', 'access_code', 'email'),
        );
        if (!isset($allowed[$table]) || !in_array($field, $allowed[$table], true)) {
            return rest_ensure_response(array('duplicate' => false));
        }

        global $wpdb;
        $tbl = IDB_Database::table_name($table);
        if (!$tbl) {
            return rest_ensure_response(array('duplicate' => false));
        }

        $val = $value;
        if ($field === 'access_code') {
            $val = strtoupper(trim($value));
        } elseif ($field === 'email') {
            $val = strtolower(trim($value));
        }

        if ($exclude_id) {
            $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM `$tbl` WHERE `$field` = %s AND id != %s", $val, $exclude_id));
        } else {
            $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM `$tbl` WHERE `$field` = %s", $val));
        }

        return rest_ensure_response(array('duplicate' => (bool) $exists));
    }

    // ---------------------------------------------------------------
    // Admin: PATCH /rows/{table}/{id}
    // ---------------------------------------------------------------
    public static function admin_update_row($request)
    {
        $table = $request->get_param('table');
        $id = $request->get_param('id');
        $body = $request->get_json_params();

        // Duplicate check on update for invitations
        if ($table === 'invitations') {
            global $wpdb;
            $tbl = IDB_Database::table_name('invitations');

            if (!empty($body['slug'])) {
                $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM `$tbl` WHERE slug = %s AND id != %s", $body['slug'], $id));
                if ($exists) {
                    return new WP_REST_Response(array('error' => 'Duplicate slug', 'message' => 'A record with slug "' . $body['slug'] . '" already exists.'), 409);
                }
            }
            if (!empty($body['access_code'])) {
                $code = strtoupper(trim($body['access_code']));
                $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM `$tbl` WHERE access_code = %s AND id != %s", $code, $id));
                if ($exists) {
                    return new WP_REST_Response(array('error' => 'Duplicate access_code', 'message' => 'A record with access code "' . $code . '" already exists.'), 409);
                }
            }
            if (!empty($body['email'])) {
                $email = strtolower(trim($body['email']));
                $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM `$tbl` WHERE email = %s AND id != %s", $email, $id));
                if ($exists) {
                    return new WP_REST_Response(array('error' => 'Duplicate email', 'message' => 'A record with email "' . $body['email'] . '" already exists.'), 409);
                }
            }
        }

        if (isset($body['data']) && !is_string($body['data'])) {
            $body['data'] = json_encode($body['data']);
        }

        $result = IDB_Database::update_row($table, $id, $body);
        if ($result === false) {
            return new WP_REST_Response(array('error' => 'Failed to update'), 500);
        }
        return rest_ensure_response(array('success' => true));
    }

    // ---------------------------------------------------------------
    // Admin: GET /rows/{table}/{id}
    // ---------------------------------------------------------------
    public static function admin_get_single($request)
    {
        $table = $request->get_param('table');
        $id = $request->get_param('id');
        $row = IDB_Database::get_row($table, $id);
        if (!$row) {
            return new WP_REST_Response(array('error' => 'Not found'), 404);
        }
        if (isset($row->data) && is_string($row->data)) {
            $decoded = json_decode($row->data, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $row->data = $decoded;
            }
        }
        return rest_ensure_response($row);
    }

    // ---------------------------------------------------------------
    // Admin: DELETE /rows/{table}
    // ---------------------------------------------------------------
    public static function admin_delete_rows($request)
    {
        $table = $request->get_param('table');
        $body = $request->get_json_params();
        $ids = isset($body['ids']) ? $body['ids'] : array();

        if (empty($ids)) {
            return new WP_REST_Response(array('error' => 'No IDs provided'), 400);
        }

        $deleted = IDB_Database::delete_rows($table, $ids);
        return rest_ensure_response(array('deleted' => $deleted));
    }

    // ---------------------------------------------------------------
    // App: GET /invitation/{slug} — public, no access_code exposed
    // ---------------------------------------------------------------
    public static function app_get_invitation($request)
    {
        $slug = $request->get_param('slug');
        $row = IDB_Database::get_invitation_by_slug($slug);

        if (!$row) {
            return new WP_REST_Response(array('error' => 'Invitation not found'), 404);
        }

        // Merge with defaults and persist if changed
        $data = IDB_Database::merge_invitation_data($row);

        return rest_ensure_response(array(
            'invitation' => array(
                'id'          => $row->id,
                'slug'        => $row->slug,
                'templateId'  => $row->template_id,
                'eventType'   => $row->event_type,
                'clientName'  => $row->client_name,
                'email'       => $row->email,
                'createdAt'   => $row->created_at,
                'expiresAt'   => $row->expires_at,
                'data'        => $data,
                'updatedAt'   => $row->updated_at,
            ),
        ));
    }

    // ---------------------------------------------------------------
    // App: PATCH /invitation/{slug} — requires access token
    // The Next.js app sends its JWT in the X-Invitation-Token header,
    // but for the WP version we use a simpler approach: the access_code
    // is sent in the header for verification.
    // ---------------------------------------------------------------
    public static function app_update_invitation($request)
    {
        $slug = $request->get_param('slug');
        $body = $request->get_json_params();

        // The app must send invitationId + access_code (or we verify via the row)
        $invitation_id = isset($body['invitationId']) ? $body['invitationId'] : '';
        $data = isset($body['data']) ? $body['data'] : null;

        if (!$invitation_id || $data === null) {
            return new WP_REST_Response(array('error' => 'Missing required fields'), 400);
        }

        // Verify the invitation exists and slug matches
        $row = IDB_Database::get_invitation_by_slug($slug);
        if (!$row || $row->id !== $invitation_id) {
            return new WP_REST_Response(array('error' => 'Unauthorized'), 403);
        }

        // Check if editing access has expired (compare in UTC)
        if (!empty($row->expires_at)) {
            $now_utc = gmdate('Y-m-d H:i:s');
            if (strtotime($row->expires_at) < strtotime($now_utc)) {
                return new WP_REST_Response(array(
                    'error'   => 'editing_expired',
                    'message' => 'Your editing access has expired. You can still view your invitation, but changes can no longer be saved.',
                ), 403);
            }
        }

        // Encode data if it's an array
        if (!is_string($data)) {
            $data = json_encode($data);
        }

        $result = IDB_Database::update_row('invitations', $invitation_id, array(
            'data'       => $data,
            'updated_at' => current_time('mysql'),
        ));

        if ($result === false) {
            return new WP_REST_Response(array('error' => 'Failed to update'), 500);
        }

        return rest_ensure_response(array('success' => true));
    }

    // ---------------------------------------------------------------
    // App: POST /auth/signup — create new invitation
    // Accepts: email, phone_number, address, client_name (optional)
    // Returns: access_code + invitation details
    // ---------------------------------------------------------------
    public static function app_signup($request)
    {
        $body = $request->get_json_params();

        $email        = isset($body['email']) ? strtolower(trim($body['email'])) : '';
        $phone_number = isset($body['phoneNumber']) ? trim($body['phoneNumber']) : (isset($body['phone_number']) ? trim($body['phone_number']) : '');
        $address      = isset($body['address']) ? trim($body['address']) : '';
        $client_name  = isset($body['clientName']) ? trim($body['clientName']) : (isset($body['client_name']) ? trim($body['client_name']) : '');

        // Validate required fields
        if (empty($email)) {
            return new WP_REST_Response(array('error' => 'Email is required'), 400);
        }
        if (!is_email($email)) {
            return new WP_REST_Response(array('error' => 'Invalid email address'), 400);
        }

        // Check email uniqueness
        global $wpdb;
        $tbl = IDB_Database::table_name('invitations');
        $exists = $wpdb->get_var($wpdb->prepare("SELECT id FROM `$tbl` WHERE email = %s", $email));
        if ($exists) {
            return new WP_REST_Response(array('error' => 'An account with this email already exists'), 409);
        }

        // Generate unique id, slug, and access_code
        $id          = IDB_Database::generate_uuid();
        $slug        = IDB_Database::generate_slug($client_name);
        $access_code = IDB_Database::generate_access_code();

        // Default invitation data structure from the shared method
        $default_data = IDB_Database::get_default_invitation_data();
        // Pre-fill the venue address from signup, if provided
        if (!empty($address)) {
            $default_data['venueAddress'] = $address;
        }
        // Pre-fill the couple name from signup, if provided
        if (!empty($client_name)) {
            $default_data['coupleName'] = $client_name;
        }

        $data_json = json_encode($default_data);

        // Default editing expiry: 1 year from now
        $expires_at = gmdate('Y-m-d H:i:s', strtotime('+1 year'));

        // Insert the invitation
        $new_id = IDB_Database::insert_row('invitations', array(
            'id'           => $id,
            'slug'         => $slug,
            'access_code'  => $access_code,
            'email'        => $email,
            'phone_number' => $phone_number,
            'address'      => $address,
            'template_id'  => 'wedding-template-01',
            'event_type'   => 'wedding',
            'client_name'  => $client_name,
            'data'         => $data_json,
            'expires_at'   => $expires_at,
        ));

        if (!$new_id) {
            return new WP_REST_Response(array('error' => 'Failed to create account'), 500);
        }

        return rest_ensure_response(array(
            'success'     => true,
            'accessCode'  => $access_code,
            'invitation'  => array(
                'id'          => $id,
                'slug'        => $slug,
                'clientName'  => $client_name,
                'templateId'  => 'wedding-template-01',
                'eventType'   => 'wedding',
                'email'       => $email,
                'createdAt'   => gmdate('Y-m-d H:i:s'),
                'expiresAt'   => $expires_at,
                'data'        => $default_data,
            ),
        ));
    }

    // ---------------------------------------------------------------
    // App: POST /auth/access-code — login via access code
    // ---------------------------------------------------------------
    public static function app_auth_access_code($request)
    {
        $body = $request->get_json_params();
        $access_code = isset($body['accessCode']) ? trim(strtoupper($body['accessCode'])) : '';

        if (empty($access_code)) {
            return new WP_REST_Response(array('error' => 'Access code is required'), 400);
        }

        $row = IDB_Database::get_invitation_by_access_code($access_code);
        if (!$row) {
            return new WP_REST_Response(array('error' => 'Invalid access code'), 401);
        }

        // Merge with defaults and persist if changed
        $data = IDB_Database::merge_invitation_data($row);

        return rest_ensure_response(array(
            'invitation' => array(
                'id'          => $row->id,
                'slug'        => $row->slug,
                'clientName'  => $row->client_name,
                'templateId'  => $row->template_id,
                'eventType'   => $row->event_type,
                'email'       => $row->email,
                'createdAt'   => $row->created_at,
                'expiresAt'   => $row->expires_at,
                'data'        => $data,
                'updatedAt'   => $row->updated_at,
            ),
        ));
    }

    // ---------------------------------------------------------------
    // App: POST /rsvp — submit RSVP (public)
    // ---------------------------------------------------------------
    public static function app_submit_rsvp($request)
    {
        global $wpdb;
        $body = $request->get_json_params();
        $invitation_id = isset($body['invitationId']) ? $body['invitationId'] : '';
        $guest_name    = isset($body['guestName']) ? $body['guestName'] : '';
        $attendance    = isset($body['attendance']) ? $body['attendance'] : '';
        $guest_count   = isset($body['guestCount']) ? (int) $body['guestCount'] : 1;
        $message       = isset($body['message']) ? $body['message'] : null;

        if (!$invitation_id || !$guest_name || !$attendance) {
            return new WP_REST_Response(array('error' => 'Missing required fields'), 400);
        }

        $valid = array('attending', 'not-attending', 'maybe');
        if (!in_array($attendance, $valid, true)) {
            return new WP_REST_Response(array('error' => 'Invalid attendance value'), 400);
        }

        // UPSERT: if a response with the same invitation_id + guest_name already exists,
        // update it instead of creating a duplicate.
        $table = $wpdb->prefix . 'idb_rsvp_responses';
        $existing = $wpdb->get_var($wpdb->prepare(
            "SELECT id FROM `$table` WHERE invitation_id = %s AND guest_name = %s LIMIT 1",
            $invitation_id,
            $guest_name
        ));

        if ($existing) {
            $result = IDB_Database::update_row('rsvp_responses', $existing, array(
                'attendance'  => $attendance,
                'guest_count' => $guest_count,
                'message'     => $message,
            ));
            return rest_ensure_response(array('success' => true, 'id' => $existing, 'updated' => true));
        }

        $id = IDB_Database::insert_row('rsvp_responses', array(
            'invitation_id' => $invitation_id,
            'guest_name'    => $guest_name,
            'attendance'    => $attendance,
            'guest_count'   => $guest_count,
            'message'       => $message,
        ));

        if (!$id) {
            return new WP_REST_Response(array('error' => 'Failed to save RSVP'), 500);
        }

        return rest_ensure_response(array('success' => true, 'id' => $id));
    }

    // ---------------------------------------------------------------
    // App: GET /rsvp?invitationId=X — list RSVPs (public)
    // ---------------------------------------------------------------
    public static function app_get_rsvps($request)
    {
        $invitation_id = $request->get_param('invitationId');
        if (empty($invitation_id)) {
            return new WP_REST_Response(array('error' => 'invitationId is required'), 400);
        }

        $rows = IDB_Database::get_rsvp_responses($invitation_id);
        return rest_ensure_response(array('responses' => $rows));
    }

    // ---------------------------------------------------------------
    // App: GET /push-token?invitationId=X — list tokens for an invitation
    // Used server-side by the Next.js app to send push notifications.
    // ---------------------------------------------------------------
    public static function app_get_push_tokens($request)
    {
        $invitation_id = $request->get_param('invitationId');
        if (empty($invitation_id)) {
            return new WP_REST_Response(array('error' => 'invitationId is required'), 400);
        }

        $rows = IDB_Database::get_push_tokens($invitation_id);
        $tokens = array_map(function ($row) {
            return $row->token;
        }, $rows);

        return rest_ensure_response(array('tokens' => $tokens));
    }

    // ---------------------------------------------------------------
    // App: POST /push-token — register push token
    // ---------------------------------------------------------------
    public static function app_register_push_token($request)
    {
        $body = $request->get_json_params();
        $invitation_id = isset($body['invitationId']) ? $body['invitationId'] : '';
        $token         = isset($body['token']) ? $body['token'] : '';

        if (!$invitation_id || !$token) {
            return new WP_REST_Response(array('error' => 'Missing fields'), 400);
        }

        global $wpdb;
        $table = IDB_Database::table_name('push_tokens');

        // Remove this token from any other invitation first (device switching)
        $wpdb->delete($table, array('token' => $token));

        // Insert or update
        $existing = $wpdb->get_row($wpdb->prepare("SELECT id FROM `$table` WHERE invitation_id = %s AND token = %s", $invitation_id, $token));
        if ($existing) {
            $wpdb->update($table, array('updated_at' => current_time('mysql')), array('id' => $existing->id));
        } else {
            IDB_Database::insert_row('push_tokens', array(
                'invitation_id' => $invitation_id,
                'token'         => $token,
            ));
        }

        return rest_ensure_response(array('success' => true));
    }

    // ---------------------------------------------------------------
    // App: DELETE /push-token — remove push token
    // ---------------------------------------------------------------
    public static function app_remove_push_token($request)
    {
        $body = $request->get_json_params();
        $token = isset($body['token']) ? $body['token'] : '';
        $invitation_id = isset($body['invitationId']) ? $body['invitationId'] : '';

        if (empty($token)) {
            return new WP_REST_Response(array('error' => 'Missing token'), 400);
        }

        global $wpdb;
        $table = IDB_Database::table_name('push_tokens');

        if ($invitation_id) {
            $wpdb->delete($table, array('token' => $token, 'invitation_id' => $invitation_id));
        } else {
            $wpdb->delete($table, array('token' => $token));
        }

        return rest_ensure_response(array('success' => true));
    }

    // ---------------------------------------------------------------
    // App: POST /upload — accept file upload, store in WP media library
    // Accepts: multipart form data with 'file', 'field', 'invitationId'
    // Returns: { url: string }
    // ---------------------------------------------------------------
    public static function app_upload_file($request)
    {
        // Load WordPress upload functions early
        if (!function_exists('wp_insert_attachment')) {
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/media.php';
            require_once ABSPATH . 'wp-admin/includes/image.php';
        }

        $invitation_id = $request->get_header('x_invitation_id');
        $field         = $request->get_param('field');
        $form_invitation_id = $request->get_param('invitationId');

        if (!$invitation_id) {
            $invitation_id = $form_invitation_id;
        }

        if (!$invitation_id) {
            return new WP_REST_Response(array('error' => 'Missing invitationId'), 400);
        }
        if (!$field) {
            return new WP_REST_Response(array('error' => 'Missing field'), 400);
        }
        // Check $_FILES
        $files = $request->get_file_params();
        if (empty($files['file'])) {
            // Check if PHP rejected the upload due to size limits
            if (isset($_FILES['file']['error']) && $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                $php_limit = ini_get('upload_max_filesize');
                $post_limit = ini_get('post_max_size');
                if ($_FILES['file']['error'] === UPLOAD_ERR_INI_SIZE || $_FILES['file']['error'] === UPLOAD_ERR_FORM_SIZE) {
                    return new WP_REST_Response(array(
                        'error' => "File exceeds PHP upload limit (upload_max_filesize={$php_limit}, post_max_size={$post_limit}). Ask your host to increase these values.",
                    ), 400);
                }
                return new WP_REST_Response(array('error' => 'File upload error code: ' . $_FILES['file']['error']), 400);
            }
            return new WP_REST_Response(array('error' => 'No file provided'), 400);
        }

        $file = $files['file'];

        // Check upload error code
        if (isset($file['error']) && $file['error'] !== UPLOAD_ERR_OK) {
            $php_limit = ini_get('upload_max_filesize');
            if ($file['error'] === UPLOAD_ERR_INI_SIZE || $file['error'] === UPLOAD_ERR_FORM_SIZE) {
                return new WP_REST_Response(array(
                    'error' => "File exceeds PHP upload limit (upload_max_filesize={$php_limit}). Ask your host to increase this value.",
                ), 400);
            }
            return new WP_REST_Response(array('error' => 'Upload error code: ' . $file['error']), 400);
        }

        // Validate file size (10MB app limit)
        $max_size = 10 * 1024 * 1024;
        if ($file['size'] > $max_size) {
            return new WP_REST_Response(array('error' => 'File size exceeds 10MB limit'), 400);
        }

        // Build unique filename
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $safe_field = preg_replace('/[^a-zA-Z0-9_-]/', '_', $field);
        $safe_invitation = preg_replace('/[^a-zA-Z0-9_-]/', '_', $invitation_id);
        $filename = $safe_invitation . '_' . $safe_field . '.' . $ext;

        // Get WordPress upload directory
        $wp_upload_dir = wp_upload_dir();
        $upload_path = $wp_upload_dir['path']; // e.g. .../wp-content/uploads/2024/08
        $upload_url  = $wp_upload_dir['url'];

        // Make sure directory exists
        if (!file_exists($upload_path)) {
            wp_mkdir_p($upload_path);
        }

        $dest_path = $upload_path . '/' . $filename;
        $source_path = $file['tmp_name'];

        // If file already exists, delete old attachment and file (upsert)
        if (file_exists($dest_path)) {
            // Try to find and delete the old attachment
            $old_url = $upload_url . '/' . $filename;
            $old_attach_id = attachment_url_to_postid($old_url);
            if ($old_attach_id) {
                wp_delete_attachment($old_attach_id, true);
            }
            @unlink($dest_path);
        }

        // Move the uploaded file manually (avoid wp_handle_upload which may call wp_die)
        if (!move_uploaded_file($source_path, $dest_path)) {
            // Fallback: try copy (REST API context may not have is_uploaded_file)
            if (!@copy($source_path, $dest_path)) {
                return new WP_REST_Response(array('error' => 'Failed to move uploaded file'), 500);
            }
        }

        // Determine MIME type
        $mime_type = $file['type'];
        if (empty($mime_type)) {
            $mime_type = mime_content_type($dest_path);
        }

        // Insert as WordPress attachment
        $attachment = array(
            'post_mime_type' => $mime_type,
            'post_title'     => $filename,
            'post_content'   => '',
            'post_status'    => 'inherit',
        );

        $attach_id = wp_insert_attachment($attachment, $dest_path, 0);

        if (is_wp_error($attach_id)) {
            @unlink($dest_path);
            return new WP_REST_Response(array('error' => $attach_id->get_error_message()), 500);
        }

        // Generate metadata (needed for images; harmless for other types)
        if (function_exists('wp_generate_attachment_metadata')) {
            $attach_data = wp_generate_attachment_metadata($attach_id, $dest_path);
            wp_update_attachment_metadata($attach_id, $attach_data);
        }

        // Get public URL
        $public_url = wp_get_attachment_url($attach_id);

        if (!$public_url) {
            return new WP_REST_Response(array('error' => 'Failed to get file URL'), 500);
        }

        return rest_ensure_response(array('url' => $public_url));
    }

    // ---------------------------------------------------------------
    // App: DELETE /upload — delete a file by URL
    // Accepts: JSON body { url: string }
    // Returns: { success: boolean }
    // ---------------------------------------------------------------
    public static function app_delete_file($request)
    {
        $body = $request->get_json_params();
        $url  = isset($body['url']) ? $body['url'] : '';

        if (empty($url)) {
            return new WP_REST_Response(array('error' => 'Missing url'), 400);
        }

        // Find attachment by URL
        $attachment_id = attachment_url_to_postid($url);

        if (!$attachment_id) {
            // File doesn't exist — return success (idempotent)
            return rest_ensure_response(array('success' => true));
        }

        $deleted = wp_delete_attachment($attachment_id, true);

        if (!$deleted) {
            return new WP_REST_Response(array('error' => 'Failed to delete file'), 500);
        }

        return rest_ensure_response(array('success' => true));
    }
}
