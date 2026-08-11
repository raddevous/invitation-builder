(function ($) {
    'use strict';

    // ---------------------------------------------------------------
    // State
    // ---------------------------------------------------------------
    var state = {
        activeTab: 'invitations',          // invitations | rsvp_responses | push_tokens
        search: '',
        searchField: '',                   // which column to search; '' = all
        page: 1,
        perPage: 50,
        orderBy: '',
        orderDir: 'ASC',
        selectedIds: [],                   // checked row IDs
        rows: [],
        total: 0,
        loading: false,
    };

    // ---------------------------------------------------------------
    // Column width persistence (per tab) — saved to localStorage
    // ---------------------------------------------------------------
    var COL_WIDTH_KEY = 'idb_col_widths';
    var DEFAULT_COL_WIDTH = 150;           // default column width in px

    function loadColWidths(tabKey, fields) {
        var all = {};
        try {
            all = JSON.parse(localStorage.getItem(COL_WIDTH_KEY) || '{}');
        } catch (e) {
            all = {};
        }
        var saved = all[tabKey] || {};
        return fields.map(function (f) {
            return saved[f.key] || DEFAULT_COL_WIDTH;
        });
    }

    function saveColWidths(tabKey, fields, widths) {
        var all = {};
        try {
            all = JSON.parse(localStorage.getItem(COL_WIDTH_KEY) || '{}');
        } catch (e) {
            all = {};
        }
        var obj = {};
        fields.forEach(function (f, i) {
            obj[f.key] = widths[i];
        });
        all[tabKey] = obj;
        try {
            localStorage.setItem(COL_WIDTH_KEY, JSON.stringify(all));
        } catch (e) {
            // ignore quota errors
        }
    }

    // Table field definitions — must match PHP IDB_Database::get_table_fields()
    // typeTag = Supabase-style type label shown as a badge next to the field name
    var TABLE_FIELDS = {
        invitations: [
            { key: 'id',          label: 'ID',           type: 'text',     typeTag: 'text' },
            { key: 'slug',        label: 'Slug',         type: 'text',     typeTag: 'text' },
            { key: 'access_code', label: 'Access Code',  type: 'text',     typeTag: 'text' },
            { key: 'account_type', label: 'Account Type', type: 'select', typeTag: 'enum', options: ['client', 'dev'], default: 'client' },
            { key: 'email',        label: 'Email',        type: 'text',     typeTag: 'text' },
            { key: 'phone_number', label: 'Phone Number', type: 'text',     typeTag: 'text' },
            { key: 'address',      label: 'Address',      type: 'text',     typeTag: 'text' },
            { key: 'template_id', label: 'Template',     type: 'text',     typeTag: 'text' },
            { key: 'event_type',  label: 'Event Type',   type: 'text',     typeTag: 'text' },
            { key: 'client_name', label: 'Client Name',  type: 'text',     typeTag: 'text' },
            { key: 'data',        label: 'Data (JSON)',  type: 'json',     typeTag: 'jsonb' },
            { key: 'created_at',  label: 'Created At',   type: 'datetime', typeTag: 'timestamptz' },
            { key: 'updated_at',  label: 'Updated At',   type: 'datetime', typeTag: 'timestamptz' },
            { key: 'expires_at',  label: 'Editing Expires', type: 'datetime', typeTag: 'timestamptz' },
        ],
        rsvp_responses: [
            { key: 'id',            label: 'ID',            type: 'uuid',     typeTag: 'uuid' },
            { key: 'invitation_id', label: 'Invitation ID', type: 'text',     typeTag: 'text' },
            { key: 'guest_name',    label: 'Guest Name',    type: 'text',     typeTag: 'text' },
            { key: 'attendance',    label: 'Attendance',    type: 'text',     typeTag: 'text' },
            { key: 'guest_count',   label: 'Guest Count',   type: 'int',      typeTag: 'int4' },
            { key: 'message',       label: 'Message',       type: 'text',     typeTag: 'text' },
            { key: 'submitted_at',  label: 'Submitted At',  type: 'datetime', typeTag: 'timestamptz' },
        ],
        push_tokens: [
            { key: 'id',            label: 'ID',            type: 'uuid',     typeTag: 'uuid' },
            { key: 'invitation_id', label: 'Invitation ID', type: 'text',     typeTag: 'text' },
            { key: 'token',         label: 'Token',         type: 'text',     typeTag: 'text' },
            { key: 'updated_at',    label: 'Updated At',    type: 'datetime', typeTag: 'timestamptz' },
        ],
    };

    var TAB_LABELS = {
        invitations: 'Invitations',
        rsvp_responses: 'RSVP Responses',
        push_tokens: 'Push Tokens',
    };

    // ---------------------------------------------------------------
    // API helpers
    // ---------------------------------------------------------------
    function apiGet(endpoint, params) {
        var url = idbData.restUrl + '/' + endpoint;
        if (params) {
            url += '?' + $.param(params);
        }
        return $.ajax({
            url: url,
            method: 'GET',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('X-WP-Nonce', idbData.nonce);
            },
        });
    }

    function apiPost(endpoint, body) {
        return $.ajax({
            url: idbData.restUrl + '/' + endpoint,
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(body || {}),
            beforeSend: function (xhr) {
                xhr.setRequestHeader('X-WP-Nonce', idbData.nonce);
            },
        });
    }

    function apiDelete(endpoint, body) {
        return $.ajax({
            url: idbData.restUrl + '/' + endpoint,
            method: 'DELETE',
            contentType: 'application/json',
            data: JSON.stringify(body || {}),
            beforeSend: function (xhr) {
                xhr.setRequestHeader('X-WP-Nonce', idbData.nonce);
            },
        });
    }

    // ---------------------------------------------------------------
    // Data loading
    // ---------------------------------------------------------------
    function loadRows() {
        state.loading = true;
        render();

        var params = {
            page: state.page,
            per_page: state.perPage,
        };
        if (state.search) {
            params.search = state.search;
        }
        if (state.searchField) {
            params.search_field = state.searchField;
        }
        if (state.orderBy) {
            params.order_by = state.orderBy;
            params.order_dir = state.orderDir;
        }

        apiGet('rows/' + state.activeTab, params)
            .done(function (resp) {
                state.rows = resp.rows || [];
                state.total = resp.total || 0;
                state.selectedIds = [];
                state.loading = false;
                render();
            })
            .fail(function (err) {
                state.rows = [];
                state.total = 0;
                state.loading = false;
                state.error = (err.responseJSON && err.responseJSON.message) || 'Failed to load data';
                render();
            });
    }

    // ---------------------------------------------------------------
    // Rendering
    // ---------------------------------------------------------------
    function render() {
        var $root = $('#idb-root');
        $root.empty();

        $root.append(renderTabs());
        $root.append(renderToolbar());
        $root.append(renderTable());   // single combined table (header + body)
        $root.append(renderPagination());
    }

    // Combined table: thead (field headers) + tbody (data rows)
    function renderTable() {
        var fields = TABLE_FIELDS[state.activeTab] || [];

        var $wrap = $('<div class="idb-table-wrap"></div>');
        var $table = $('<table class="idb-data-table idb-data-table-fixed"></table>');

        // --- colgroup: per-column widths (persisted to localStorage) ---
        var colWidths = loadColWidths(state.activeTab, fields);
        var $colgroup = $('<colgroup></colgroup>');
        // Checkbox column — fixed narrow width
        $colgroup.append($('<col class="idb-col-check" style="width: 40px;" />'));
        fields.forEach(function (f, i) {
            $colgroup.append($('<col data-col-index="' + i + '" style="width: ' + colWidths[i] + 'px;" />'));
        });
        $table.append($colgroup);

        // --- thead: field headers ---
        var $thead = $('<thead></thead>');
        var $headTr = $('<tr></tr>');

        // Checkbox column header (select all)
        $headTr.append($('<th class="idb-check-col"></th>').append(
            $('<input type="checkbox" />')
                .prop('checked', state.rows.length > 0 && state.selectedIds.length === state.rows.length)
                .on('change', function () {
                    if (this.checked) {
                        state.selectedIds = state.rows.map(function (r) { return r.id; });
                    } else {
                        state.selectedIds = [];
                    }
                    render();
                })
        ));

        // Field headers
        fields.forEach(function (f, i) {
            var $th = $('<th></th>');
            var $label = $('<span class="idb-field-label"></span>').text(f.label);
            var $typeTag = $('<span class="idb-type-tag idb-type-tag-' + f.type + '"></span>').text(f.typeTag || f.type);
            $th.append($label, $typeTag);
            $th.on('click', function () {
                if (state.orderBy === f.key) {
                    state.orderDir = state.orderDir === 'ASC' ? 'DESC' : 'ASC';
                } else {
                    state.orderBy = f.key;
                    state.orderDir = 'ASC';
                }
                loadRows();
            });
            if (state.orderBy === f.key) {
                $th.addClass('sorted ' + (state.orderDir === 'ASC' ? 'sorted-asc' : 'sorted-desc'));
                $th.append($('<span class="idb-sort-arrow"></span>').text(state.orderDir === 'ASC' ? ' \u25B2' : ' \u25BC'));
            }

            // Resize handle
            var $resize = $('<div class="idb-col-resizer"></div>');
            $resize.on('mousedown', function (e) {
                e.preventDefault();
                e.stopPropagation();
                var startX = e.pageX;
                var $col = $colgroup.find('col[data-col-index="' + i + '"]');
                var startWidth = $col.width() || colWidths[i];
                var tableWidth = $table.width();
                var minW = Math.max(40, startWidth * 0.5);
                var maxW = startWidth * 3;

                $(document).on('mousemove.idbresize', function (ev) {
                    var newWidth = startWidth + (ev.pageX - startX);
                    newWidth = Math.max(minW, Math.min(maxW, newWidth));
                    $col.css('width', newWidth + 'px');
                });
                $(document).on('mouseup.idbresize', function () {
                    $(document).off('mousemove.idbresize mouseup.idbresize');
                    var finalWidth = $col.width() || startWidth;
                    colWidths[i] = finalWidth;
                    saveColWidths(state.activeTab, fields, colWidths);
                });
            });
            $th.append($resize);

            $headTr.append($th);
        });

        $thead.append($headTr);
        $table.append($thead);

        // --- tbody: data rows ---
        var $tbody = $('<tbody></tbody>');

        if (state.loading) {
            $tbody.append($('<tr></tr>').append($('<td colspan="' + (fields.length + 1) + '" class="idb-loading-td"></td>').text('Loading...')));
        } else if (state.error) {
            $tbody.append($('<tr></tr>').append($('<td colspan="' + (fields.length + 1) + '" class="idb-error-td"></td>').text(state.error)));
        } else if (state.rows.length === 0) {
            $tbody.append($('<tr></tr>').append($('<td colspan="' + (fields.length + 1) + '" class="idb-empty-td"></td>').text('No records found.')));
        } else {
            state.rows.forEach(function (row) {
                var $tr = $('<tr></tr>');

                // Checkbox
                var checked = state.selectedIds.indexOf(row.id) !== -1;
                var $check = $('<input type="checkbox" />').prop('checked', checked).on('change', function () {
                    if (this.checked) {
                        if (state.selectedIds.indexOf(row.id) === -1) {
                            state.selectedIds.push(row.id);
                        }
                    } else {
                        state.selectedIds = state.selectedIds.filter(function (id) { return id !== row.id; });
                    }
                    render();
                });
                $tr.append($('<td class="idb-check-col"></td>').append($check));

                // Data columns
                fields.forEach(function (f) {
                    var val = row[f.key];
                    var $td = $('<td></td>');
                    $td.attr('data-field', f.key);

                    // Determine the string representation
                    var strVal;
                    if (val === null || val === undefined) {
                        strVal = '';
                    } else if (f.type === 'json') {
                        strVal = typeof val === 'string' ? val : JSON.stringify(val, null, 2);
                    } else {
                        strVal = String(val);
                    }

                    // Check if this field is editable
                    var isEditable = isFieldEditable(f.key);
                    if (isEditable) {
                        $td.addClass('idb-cell-editable');
                    }

                    // Render cell content
                    if (val === null || val === undefined) {
                        $td.html('<span class="idb-null">NULL</span>');
                    } else if (f.type === 'json' && strVal.length > 60) {
                        $td.append($('<span class="idb-json-preview"></span>').text(strVal.substring(0, 60) + '...'));
                        $td.attr('title', strVal.substring(0, 500) + '...');
                    } else if (strVal.length > 80) {
                        $td.text(strVal.substring(0, 80) + '...');
                        $td.attr('title', strVal.substring(0, 500) + '...');
                    } else {
                        $td.text(strVal);
                    }

                    // Double-click to edit
                    if (isEditable) {
                        $td.on('dblclick', function () {
                            openEditDialog(row, f, strVal);
                        });
                    }

                    $tr.append($td);
                });

                $tbody.append($tr);
            });
        }

        $table.append($tbody);
        $wrap.append($table);
        return $wrap;
    }

    // Row 1: Tabs
    function renderTabs() {
        var $row = $('<div class="idb-tabs-row"></div>');
        Object.keys(TAB_LABELS).forEach(function (key) {
            var $tab = $('<button type="button" class="idb-tab"></button>')
                .toggleClass('active', state.activeTab === key)
                .text(TAB_LABELS[key])
                .on('click', function () {
                    state.activeTab = key;
                    state.page = 1;
                    state.search = '';
                    state.searchField = '';
                    state.selectedIds = [];
                    state.orderBy = '';
                    loadRows();
                });
            $row.append($tab);
        });
        return $row;
    }

    // Row 2: Search (with field dropdown) + insert/delete
    function renderToolbar() {
        var $row = $('<div class="idb-toolbar-row"></div>');
        var hasSelection = state.selectedIds.length > 0;

        // --- Search box with icon + field dropdown ---
        var $searchWrap = $('<div class="idb-search-wrap"></div>');

        // Search icon (Material Symbols Outlined font)
        var $searchIcon = $('<span class="idb-search-icon">search</span>');

        // Search input
        var $search = $('<input type="text" class="idb-search-input" placeholder="Search..." />')
            .val(state.search)
            .on('input', function () {
                state.search = $(this).val();
            })
            .on('keydown', function (e) {
                if (e.key === 'Enter') {
                    state.page = 1;
                    loadRows();
                }
            })
            .on('focus', function () {
                $searchWrap.addClass('idb-search-focused');
                $fieldDropdown.addClass('open');
                // Hide insert, show nothing (search mode)
                $insertWrap.addClass('idb-hidden-slide');
            })
            .on('blur', function () {
                // Delay to allow clicking a field item
                setTimeout(function () {
                    $searchWrap.removeClass('idb-search-focused');
                    $fieldDropdown.removeClass('open');
                    // Restore insert if no selection
                    if (state.selectedIds.length === 0) {
                        $insertWrap.removeClass('idb-hidden-slide');
                    }
                }, 150);
            });

        $searchWrap.append($searchIcon, $search);

        // Field dropdown — shows below search when focused
        var $fieldDropdown = $('<div class="idb-search-field-dropdown"></div>');
        var fields = TABLE_FIELDS[state.activeTab] || [];

        // "All fields" option
        var $allFieldsItem = $('<button type="button" class="idb-search-field-item"></button>')
            .toggleClass('active', !state.searchField)
            .text('All fields')
            .on('mousedown', function (e) {
                e.preventDefault();
                state.searchField = '';
                $fieldDropdown.find('.idb-search-field-item').removeClass('active');
                $(this).addClass('active');
                $search.focus();
            });
        $fieldDropdown.append($allFieldsItem);

        fields.forEach(function (f) {
            var $item = $('<button type="button" class="idb-search-field-item"></button>')
                .toggleClass('active', state.searchField === f.key)
                .text(f.label)
                .on('mousedown', function (e) {
                    e.preventDefault();
                    state.searchField = f.key;
                    $fieldDropdown.find('.idb-search-field-item').removeClass('active');
                    $(this).addClass('active');
                    $search.focus();
                });
            $fieldDropdown.append($item);
        });

        $searchWrap.append($fieldDropdown);
        $row.append($searchWrap);

        // Spacer
        $row.append($('<span class="idb-toolbar-spacer"></span>'));

        // --- Right-aligned actions (always rendered, toggled via CSS) ---

        // Insert dropdown
        var $insertWrap = $('<div class="idb-insert-dropdown"></div>');
        var $insertBtn = $('<button type="button" class="idb-btn idb-btn-insert">Insert <span class="idb-insert-caret">&#9662;</span></button>')
            .on('click', function (e) {
                e.stopPropagation();
                $insertMenu.toggleClass('open');
            });
        var $insertMenu = $('<div class="idb-insert-menu"></div>');
        var $optInsertRow = $('<button type="button" class="idb-insert-menu-item">Insert Row</button>')
            .on('click', function () {
                $insertMenu.removeClass('open');
                openInsertDialog();
            });
        var $optImportData = $('<button type="button" class="idb-insert-menu-item">Import Data</button>')
            .on('click', function () {
                $insertMenu.removeClass('open');
                openImportDialog();
            });
        $insertMenu.append($optInsertRow, $optImportData);
        $insertWrap.append($insertBtn, $insertMenu);

        // Close insert dropdown when clicking outside
        $(document).on('click.idb-insert', function () {
            $insertMenu.removeClass('open');
        });

        // Hide insert if rows are selected
        if (hasSelection) {
            $insertWrap.addClass('idb-hidden-slide');
        }
        $row.append($insertWrap);

        // Delete button — always rendered, toggled via CSS
        var $deleteBtn = $('<button type="button" class="idb-btn idb-btn-danger idb-delete-btn"></button>')
            .text('Delete (' + state.selectedIds.length + ')')
            .on('click', handleDelete);
        if (!hasSelection) {
            $deleteBtn.addClass('idb-hidden-slide');
        }
        $row.append($deleteBtn);

        return $row;
    }

    // Pagination
    function renderPagination() {
        if (state.total === 0) return $('<div></div>');

        var totalPages = Math.ceil(state.total / state.perPage);
        var $div = $('<div class="idb-pagination"></div>');
        $div.append($('<span class="idb-pagination-info"></span>').text(
            state.total + ' record' + (state.total !== 1 ? 's' : '') + ' \u00B7 Page ' + state.page + ' of ' + totalPages
        ));

        var $prev = $('<button type="button" class="idb-btn idb-btn-small">Prev</button>')
            .prop('disabled', state.page <= 1)
            .on('click', function () { state.page--; loadRows(); });
        var $next = $('<button type="button" class="idb-btn idb-btn-small">Next</button>')
            .prop('disabled', state.page >= totalPages)
            .on('click', function () { state.page++; loadRows(); });

        $div.append($prev, $next);
        return $div;
    }

    // ---------------------------------------------------------------
    // Actions
    // ---------------------------------------------------------------
    function handleDelete() {
        if (state.selectedIds.length === 0) return;
        if (!confirm('Delete ' + state.selectedIds.length + ' record(s) from ' + TAB_LABELS[state.activeTab] + '?')) return;

        apiDelete('rows/' + state.activeTab, { ids: state.selectedIds })
            .done(function () {
                state.selectedIds = [];
                loadRows();
            })
            .fail(function (err) {
                alert('Delete failed: ' + ((err.responseJSON && err.responseJSON.message) || 'Unknown error'));
            });
    }

    // ---------------------------------------------------------------
    // Helper: which fields are editable via double-click
    // ---------------------------------------------------------------
    function isFieldEditable(fieldKey) {
        // id is not editable (it's the primary key)
        // created_at, updated_at, submitted_at are auto-managed
        var nonEditable = ['id', 'created_at', 'updated_at', 'submitted_at'];
        return nonEditable.indexOf(fieldKey) === -1;
    }

    // ---------------------------------------------------------------
    // Edit dialog — edit a single cell value
    // ---------------------------------------------------------------
    function openEditDialog(row, field, currentVal) {
        var isJson = field.type === 'json';
        var isDatetime = field.type === 'datetime';
        var isLarge = isJson && currentVal.length > 10240;

        // Build overlay
        var $overlay = $('<div class="idb-modal-overlay"></div>');
        var $dialog = $('<div class="idb-modal-dialog idb-edit-dialog"></div>');

        // Header
        var $header = $('<div class="idb-modal-header"></div>');
        var $title = $('<h3></h3>').text('Edit — ' + field.label);
        // Add type tag to title
        var $typeTag = $('<span class="idb-type-tag idb-type-tag-' + field.type + '"></span>').text(field.typeTag || field.type);
        $title.append($typeTag);
        $header.append($title);
        var $closeBtn = $('<button type="button" class="idb-modal-close">&times;</button>').on('click', function () {
            $overlay.remove();
        });
        $header.append($closeBtn);
        $dialog.append($header);

        // Body
        var $body = $('<div class="idb-modal-body"></div>');

        // Row info
        var $rowInfo = $('<div class="idb-edit-row-info"></div>').html(
            '<strong>Row ID:</strong> ' + escapeHtml(row.id) +
            (row.slug ? ' &nbsp; <strong>Slug:</strong> ' + escapeHtml(row.slug) : '')
        );
        $body.append($rowInfo);

        // Input element — datetime picker for datetime fields, textarea for everything else
        var $textarea;
        if (isDatetime) {
            // Convert MySQL datetime (YYYY-MM-DD HH:MM:SS) to datetime-local format (YYYY-MM-DDTHH:MM)
            var dtVal = '';
            if (currentVal && currentVal !== '—') {
                dtVal = String(currentVal).replace(' ', 'T').substring(0, 16);
            }
            $textarea = $('<input type="datetime-local" class="idb-edit-textarea idb-edit-datetime" />');
            $textarea.val(dtVal);
            $body.append($textarea);
            $dialog.append($body);

            // Footer
            var $footer = $('<div class="idb-modal-footer"></div>');
            var $cancelBtn = $('<button type="button" class="idb-btn">Cancel</button>').on('click', function () {
                $overlay.remove();
            });
            var $saveBtn = $('<button type="button" class="idb-btn idb-btn-primary">Save</button>').on('click', function () {
                handleEditSave($overlay, row, field, $textarea);
            });
            $footer.append($cancelBtn, $saveBtn);
            $dialog.append($footer);

            $overlay.append($dialog);
            $overlay.on('click', function (e) {
                if (e.target === $overlay[0]) $overlay.remove();
            });

            $('body').append($overlay);
            $textarea.focus();
            return;
        }

        // Select dropdown for select-type fields (e.g. account_type)
        if (field.type === 'select') {
            $textarea = $('<select class="idb-edit-textarea idb-edit-select"></select>');
            (field.options || []).forEach(function (opt) {
                var $opt = $('<option></option>').val(opt).text(opt);
                if (opt === currentVal) $opt.prop('selected', true);
                $textarea.append($opt);
            });
            $body.append($textarea);
            $dialog.append($body);

            // Footer
            var $footer = $('<div class="idb-modal-footer"></div>');
            var $cancelBtn = $('<button type="button" class="idb-btn">Cancel</button>').on('click', function () {
                $overlay.remove();
            });
            var $saveBtn = $('<button type="button" class="idb-btn idb-btn-primary">Save</button>').on('click', function () {
                handleEditSave($overlay, row, field, $textarea);
            });
            $footer.append($cancelBtn, $saveBtn);
            $dialog.append($footer);

            $overlay.append($dialog);
            $overlay.on('click', function (e) {
                if (e.target === $overlay[0]) $overlay.remove();
            });

            $('body').append($overlay);
            return;
        }

        $textarea = $('<textarea class="idb-edit-textarea"></textarea>');
        if (isJson) {
            $textarea.addClass('idb-edit-textarea-json');
        }

        if (isLarge) {
            // Show Supabase-style warning in the textarea, with Load Full Value button
            $textarea.val(
                'Value is larger than 10,240 characters.\n\n' +
                'You may try to render the entire value, but your browser may run into performance issues.'
            );
            $textarea.prop('disabled', true);
            $textarea.addClass('idb-edit-textarea-placeholder');

            var $loadBtn = $('<button type="button" class="idb-btn idb-btn-load-full">Load Full Value</button>').on('click', function () {
                $textarea.prop('disabled', false);
                $textarea.removeClass('idb-edit-textarea-placeholder');
                $textarea.val(currentVal);
                $loadBtn.remove();
                $textarea.focus();
            });
            $body.append($textarea, $loadBtn);
        } else {
            $textarea.val(currentVal);
            $body.append($textarea);
        }

        $dialog.append($body);

        // Footer
        var $footer = $('<div class="idb-modal-footer"></div>');
        var $cancelBtn = $('<button type="button" class="idb-btn">Cancel</button>').on('click', function () {
            $overlay.remove();
        });
        var $saveBtn = $('<button type="button" class="idb-btn idb-btn-primary">Save</button>').on('click', function () {
            handleEditSave($overlay, row, field, $textarea);
        });
        $footer.append($cancelBtn, $saveBtn);
        $dialog.append($footer);

        $overlay.append($dialog);
        $overlay.on('click', function (e) {
            if (e.target === $overlay[0]) $overlay.remove();
        });

        $('body').append($overlay);

        // Focus textarea if not in placeholder mode
        if (!isLarge) {
            $textarea.focus();
        }
    }

    function handleEditSave($overlay, row, field, $textarea) {
        var newVal = $textarea.val();

        // Skip if it's still showing the placeholder
        if ($textarea.hasClass('idb-edit-textarea-placeholder')) {
            alert('Please click "Load Full Value" first to load the content.');
            return;
        }

        // Convert datetime-local (YYYY-MM-DDTHH:MM) back to MySQL format (YYYY-MM-DD HH:MM:SS)
        if (field.type === 'datetime') {
            if (newVal) {
                newVal = newVal.replace('T', ' ') + ':00';
            } else {
                newVal = null;
            }
        }

        // Validate JSON if it's a json field
        if (field.type === 'json') {
            try {
                JSON.parse(newVal);
            } catch (e) {
                alert('Invalid JSON: ' + e.message);
                return;
            }
        }

        // Build update data
        var updateData = {};
        updateData[field.key] = newVal;

        // For access_code, uppercase it
        if (field.key === 'access_code') {
            updateData[field.key] = newVal.toUpperCase().trim();
        }

        // Check for duplicates if slug, access_code, or email
        if (state.activeTab === 'invitations' && (field.key === 'slug' || field.key === 'access_code' || field.key === 'email') && newVal) {
            apiGet('check-duplicate', {
                table: 'invitations',
                field: field.key,
                value: updateData[field.key],
                exclude_id: row.id,
            }).done(function (resp) {
                if (resp.duplicate) {
                    alert('A record with ' + field.label + ' "' + updateData[field.key] + '" already exists.');
                    return;
                }
                performEditSave($overlay, row, updateData);
            }).fail(function () {
                // If check fails, proceed anyway
                performEditSave($overlay, row, updateData);
            });
        } else {
            performEditSave($overlay, row, updateData);
        }
    }

    function performEditSave($overlay, row, updateData) {
        // Use the PATCH endpoint
        $.ajax({
            url: idbData.restUrl + '/rows/' + state.activeTab + '/' + encodeURIComponent(row.id),
            method: 'PATCH',
            contentType: 'application/json',
            data: JSON.stringify(updateData),
            beforeSend: function (xhr) {
                xhr.setRequestHeader('X-WP-Nonce', idbData.nonce);
            },
        }).done(function () {
            $overlay.remove();
            loadRows();
        }).fail(function (err) {
            alert('Save failed: ' + ((err.responseJSON && err.responseJSON.message) || 'Unknown error'));
        });
    }

    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    // ---------------------------------------------------------------
    // Insert dialog — add a new row to the active table
    // ---------------------------------------------------------------
    function openInsertDialog() {
        var fields = TABLE_FIELDS[state.activeTab] || [];
        var tabLabel = TAB_LABELS[state.activeTab];

        // Build overlay
        var $overlay = $('<div class="idb-modal-overlay"></div>');
        var $dialog = $('<div class="idb-modal-dialog"></div>');
        var $header = $('<div class="idb-modal-header"></div>');
        $header.append($('<h3></h3>').text('Insert Row — ' + tabLabel));
        var $closeBtn = $('<button type="button" class="idb-modal-close">&times;</button>').on('click', function () {
            $overlay.remove();
        });
        $header.append($closeBtn);
        $dialog.append($header);

        // Build form fields
        var $form = $('<div class="idb-modal-body"></div>');
        var formData = {};

        fields.forEach(function (f) {
            // Skip auto-managed fields
            var isAuto = false;
            if (f.key === 'id') isAuto = true; // auto-generated UUID
            if (f.key === 'created_at' || f.key === 'updated_at' || f.key === 'submitted_at') isAuto = true;

            var $fieldWrap = $('<div class="idb-form-field"></div>');
            $fieldWrap.addClass(isAuto ? 'idb-form-field-auto' : '');

            // Label with type tag
            var $label = $('<label class="idb-form-label"></label>');
            $label.append($('<span class="idb-form-label-text"></span>').text(f.label));
            $label.append($('<span class="idb-type-tag idb-type-tag-' + f.type + '"></span>').text(f.typeTag || f.type));
            if (isAuto) {
                $label.append($('<span class="idb-form-auto-hint"></span>').text(' (auto)'));
            }
            $fieldWrap.append($label);

            // Input
            var $input;
            if (f.type === 'json') {
                $input = $('<textarea class="idb-form-input idb-form-textarea" rows="6" placeholder="{}"></textarea>');
            } else if (f.key === 'attendance') {
                // Special: attendance dropdown
                $input = $('<select class="idb-form-input"></select>');
                $input.append('<option value="attending">attending</option>');
                $input.append('<option value="not-attending">not-attending</option>');
                $input.append('<option value="maybe">maybe</option>');
            } else if (f.type === 'select') {
                // Generic select dropdown (e.g. account_type)
                $input = $('<select class="idb-form-input"></select>');
                (f.options || []).forEach(function (opt) {
                    $input.append('<option value="' + opt + '">' + opt + '</option>');
                });
            } else if (f.type === 'int') {
                $input = $('<input type="number" class="idb-form-input" placeholder="0" />');
            } else if (f.type === 'datetime') {
                $input = $('<input type="datetime-local" class="idb-form-input" />');
            } else if (isAuto) {
                $input = $('<input type="text" class="idb-form-input idb-form-input-auto" disabled placeholder="Auto-generated" />');
            } else {
                $input = $('<input type="text" class="idb-form-input" />');
            }

            $input.on('input change', function () {
                var val = $(this).val();
                if (f.type === 'json') {
                    try {
                        formData[f.key] = JSON.parse(val);
                    } catch (e) {
                        // keep raw string, will validate on submit
                        formData[f.key] = val;
                    }
                } else if (f.type === 'int') {
                    formData[f.key] = val === '' ? null : parseInt(val, 10);
                } else if (f.type === 'datetime') {
                    // Convert datetime-local (YYYY-MM-DDTHH:MM) to MySQL format (YYYY-MM-DD HH:MM:SS)
                    formData[f.key] = val ? val.replace('T', ' ') + ':00' : null;
                } else {
                    formData[f.key] = val;
                }

                // Live duplicate check for slug, access_code, and email
                if (state.activeTab === 'invitations' && (f.key === 'slug' || f.key === 'access_code' || f.key === 'email') && val) {
                    var $statusEl = $fieldWrap.find('.idb-dup-status');
                    if ($statusEl.length === 0) {
                        $statusEl = $('<span class="idb-dup-status"></span>');
                        $fieldWrap.append($statusEl);
                    }
                    $statusEl.removeClass('dup-ok dup-bad').addClass('dup-checking').text('checking...');

                    // Debounce
                    clearTimeout($input.data('dupTimer'));
                    $input.data('dupTimer', setTimeout(function () {
                        apiGet('check-duplicate', {
                            table: 'invitations',
                            field: f.key,
                            value: val,
                        }).done(function (resp) {
                            if (resp.duplicate) {
                                $statusEl.removeClass('dup-checking dup-ok').addClass('dup-bad')
                                    .text('Already exists!');
                                $input.addClass('idb-input-error');
                            } else {
                                $statusEl.removeClass('dup-checking dup-bad').addClass('dup-ok')
                                    .text('Available');
                                $input.removeClass('idb-input-error');
                            }
                        }).fail(function () {
                            $statusEl.removeClass('dup-checking dup-ok dup-bad').text('');
                            $input.removeClass('idb-input-error');
                        });
                    }, 400));
                }
            });

            $fieldWrap.append($input);
            $form.append($fieldWrap);

            // Set default for select fields
            if (f.type === 'select' && f.default !== undefined) {
                formData[f.key] = f.default;
            }
        });

        $dialog.append($form);

        // Footer with buttons
        var $footer = $('<div class="idb-modal-footer"></div>');
        var $cancelBtn = $('<button type="button" class="idb-btn">Cancel</button>').on('click', function () {
            $overlay.remove();
        });
        var $submitBtn = $('<button type="button" class="idb-btn idb-btn-primary">Insert Row</button>').on('click', function () {
            handleInsert($overlay, formData, fields);
        });
        $footer.append($cancelBtn, $submitBtn);
        $dialog.append($footer);

        $overlay.append($dialog);
        $overlay.on('click', function (e) {
            if (e.target === $overlay[0]) $overlay.remove();
        });

        $('body').append($overlay);
    }

    function handleInsert($overlay, formData, fields) {
        // Validate required fields (skip auto fields)
        var errors = [];
        fields.forEach(function (f) {
            if (f.key === 'id' || f.key === 'created_at' || f.key === 'updated_at' || f.key === 'submitted_at') return;

            var val = formData[f.key];
            if (val === undefined || val === '' || val === null) {
                // For invitations, slug, access_code, and email are required
                if (state.activeTab === 'invitations' && (f.key === 'slug' || f.key === 'access_code' || f.key === 'email')) {
                    errors.push(f.label + ' is required');
                }
                // For rsvp_responses, invitation_id and guest_name are required
                if (state.activeTab === 'rsvp_responses' && (f.key === 'invitation_id' || f.key === 'guest_name' || f.key === 'attendance')) {
                    errors.push(f.label + ' is required');
                }
                // For push_tokens, invitation_id and token are required
                if (state.activeTab === 'push_tokens' && (f.key === 'invitation_id' || f.key === 'token')) {
                    errors.push(f.label + ' is required');
                }
            }

            // Validate JSON
            if (f.type === 'json' && val !== undefined && val !== '' && val !== null) {
                if (typeof val === 'string') {
                    try {
                        JSON.parse(val);
                    } catch (e) {
                        errors.push(f.label + ' is not valid JSON');
                    }
                }
            }
        });

        if (errors.length > 0) {
            alert('Please fix the following:\n\n' + errors.join('\n'));
            return;
        }

        // Remove auto fields from submission
        delete formData.id;
        delete formData.created_at;
        delete formData.updated_at;
        delete formData.submitted_at;

        // Default data to {} if empty
        if (formData.data === undefined || formData.data === '' || formData.data === null) {
            formData.data = '{}';
        } else if (typeof formData.data !== 'string') {
            formData.data = JSON.stringify(formData.data);
        }

        apiPost('rows/' + state.activeTab, formData)
            .done(function () {
                $overlay.remove();
                loadRows();
            })
            .fail(function (err) {
                alert('Insert failed: ' + ((err.responseJSON && err.responseJSON.message) || 'Unknown error'));
            });
    }

    // ---------------------------------------------------------------
    // Import dialog — import CSV data into the active table
    // ---------------------------------------------------------------
    function openImportDialog() {
        var fields = TABLE_FIELDS[state.activeTab] || [];
        var tabLabel = TAB_LABELS[state.activeTab];

        // Build list of importable fields (skip auto-managed)
        var importableFields = fields.filter(function (f) {
            return f.key !== 'id' && f.key !== 'created_at' && f.key !== 'updated_at' && f.key !== 'submitted_at';
        });

        var $overlay = $('<div class="idb-modal-overlay"></div>');
        var $dialog = $('<div class="idb-modal-dialog"></div>');

        // Header
        var $header = $('<div class="idb-modal-header"></div>');
        $header.append($('<h3></h3>').text('Import Data — ' + tabLabel));
        var $closeBtn = $('<button type="button" class="idb-modal-close">&times;</button>').on('click', function () {
            $overlay.remove();
        });
        $header.append($closeBtn);
        $dialog.append($header);

        // Body
        var $body = $('<div class="idb-modal-body"></div>');

        // Instructions
        $body.append($('<div class="idb-import-instructions"></div>').html(
            '<p>Upload a CSV file. The first row should be column headers matching the field names:</p>' +
            '<code>' + importableFields.map(function (f) { return f.key; }).join(', ') + '</code>' +
            '<p class="idb-import-hint">Fields <strong>id</strong>, <strong>created_at</strong>, <strong>updated_at</strong> are auto-generated and should not be in the CSV.</p>'
        ));

        // File input
        var $fileWrap = $('<div class="idb-form-field"></div>');
        var $fileLabel = $('<label class="idb-form-label">CSV File</label>');
        var $fileInput = $('<input type="file" accept=".csv,text/csv" class="idb-form-input" />');
        $fileWrap.append($fileLabel, $fileInput);
        $body.append($fileWrap);

        // Preview area
        var $previewWrap = $('<div class="idb-import-preview-wrap"></div>');
        $body.append($previewWrap);

        $dialog.append($body);

        // Footer
        var $footer = $('<div class="idb-modal-footer"></div>');
        var $cancelBtn = $('<button type="button" class="idb-btn">Cancel</button>').on('click', function () {
            $overlay.remove();
        });
        var $importBtn = $('<button type="button" class="idb-btn idb-btn-primary" disabled>Import</button>');
        $footer.append($cancelBtn, $importBtn);
        $dialog.append($footer);

        $overlay.append($dialog);
        $overlay.on('click', function (e) {
            if (e.target === $overlay[0]) $overlay.remove();
        });

        $('body').append($overlay);

        // Parsed data
        var parsedRows = [];

        // Handle file selection
        $fileInput.on('change', function () {
            var file = this.files[0];
            if (!file) {
                $importBtn.prop('disabled', true);
                $previewWrap.empty();
                parsedRows = [];
                return;
            }

            var reader = new FileReader();
            reader.onload = function (e) {
                var text = e.target.result;
                parsedRows = parseCSV(text);

                // Render preview
                $previewWrap.empty();
                if (parsedRows.length === 0) {
                    $previewWrap.append('<div class="idb-import-error">No valid rows found in CSV.</div>');
                    $importBtn.prop('disabled', true);
                    return;
                }

                $previewWrap.append('<div class="idb-import-preview-title">Preview (' + parsedRows.length + ' rows)</div>');
                var $table = $('<table class="idb-data-table idb-import-preview-table"></table>');
                var $thead = $('<thead></thead>');
                var $headTr = $('<tr></tr>');
                Object.keys(parsedRows[0]).forEach(function (col) {
                    $headTr.append($('<th></th>').text(col));
                });
                $thead.append($headTr);
                $table.append($thead);

                var $tbody = $('<tbody></tbody>');
                parsedRows.slice(0, 5).forEach(function (row) {
                    var $tr = $('<tr></tr>');
                    Object.keys(parsedRows[0]).forEach(function (col) {
                        $tr.append($('<td></td>').text(row[col] || ''));
                    });
                    $tbody.append($tr);
                });
                $table.append($tbody);
                $previewWrap.append($table);

                if (parsedRows.length > 5) {
                    $previewWrap.append('<div class="idb-import-preview-more">...and ' + (parsedRows.length - 5) + ' more rows</div>');
                }

                $importBtn.prop('disabled', false);
            };
            reader.readAsText(file);
        });

        // Handle import
        $importBtn.on('click', function () {
            if (parsedRows.length === 0) return;

            $importBtn.prop('disabled', true).text('Importing...');

            // Import rows sequentially
            var imported = 0;
            var failed = 0;
            var errors = [];

            function importNext(idx) {
                if (idx >= parsedRows.length) {
                    // Done
                    $overlay.remove();
                    if (failed > 0) {
                        alert('Import complete: ' + imported + ' succeeded, ' + failed + ' failed.\n\nErrors:\n' + errors.slice(0, 5).join('\n'));
                    } else {
                        alert('Import complete: ' + imported + ' row(s) imported.');
                    }
                    loadRows();
                    return;
                }

                var row = parsedRows[idx];
                // Ensure data field is valid JSON string
                if (row.data && typeof row.data !== 'string') {
                    row.data = JSON.stringify(row.data);
                }
                if (!row.data) row.data = '{}';

                apiPost('rows/' + state.activeTab, row)
                    .done(function () {
                        imported++;
                        importNext(idx + 1);
                    })
                    .fail(function (err) {
                        failed++;
                        errors.push('Row ' + (idx + 1) + ': ' + ((err.responseJSON && err.responseJSON.message) || 'Unknown error'));
                        importNext(idx + 1);
                    });
            }

            importNext(0);
        });
    }

    // Simple CSV parser — handles quoted fields and commas inside quotes
    function parseCSV(text) {
        var lines = [];
        var current = '';
        var inQuotes = false;
        var row = [];

        for (var i = 0; i < text.length; i++) {
            var ch = text[i];

            if (inQuotes) {
                if (ch === '"') {
                    if (text[i + 1] === '"') {
                        current += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ',') {
                    row.push(current);
                    current = '';
                } else if (ch === '\n') {
                    row.push(current);
                    lines.push(row);
                    row = [];
                    current = '';
                } else if (ch === '\r') {
                    // skip
                } else {
                    current += ch;
                }
            }
        }
        // Last row
        if (current !== '' || row.length > 0) {
            row.push(current);
            lines.push(row);
        }

        if (lines.length < 2) return [];

        var headers = lines[0].map(function (h) { return h.trim(); });
        var results = [];
        for (var j = 1; j < lines.length; j++) {
            if (lines[j].length === 1 && lines[j][0] === '') continue; // skip empty lines
            var obj = {};
            headers.forEach(function (h, idx) {
                obj[h] = lines[j][idx] ? lines[j][idx].trim() : '';
            });
            results.push(obj);
        }
        return results;
    }

    // ---------------------------------------------------------------
    // Init
    // ---------------------------------------------------------------
    $(function () {
        loadRows();
    });

})(jQuery);
