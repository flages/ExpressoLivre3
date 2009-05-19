/**
 * Tine 2.0
 * 
 * @package     Felamimail
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schuele <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2007-2009 Metaways Infosystems GmbH (http://www.metaways.de)
 * @version     $Id:GridPanel.js 7170 2009-03-05 10:58:55Z p.schuele@metaways.de $
 *
 * TODO         finish reply all implementation
 */
 
Ext.namespace('Tine.Felamimail');

/**
 * Message grid panel
 */
Tine.Felamimail.GridPanel = Ext.extend(Tine.Tinebase.widgets.app.GridPanel, {
    // model generics
    recordClass: Tine.Felamimail.Model.Message,
    evalGrants: false,
    
    // grid specific
    defaultSortInfo: {field: 'received', direction: 'DESC'},
    gridConfig: {
        loadMask: true,
        autoExpandColumn: 'subject',
        // drag n drop
        enableDragDrop: true,
        ddGroup: 'mailToTreeDDGroup'
    },
    
    /**
     * Return CSS class to apply to rows depending upon flags
     * - checks Flagged, Deleted and Seen
     * 
     * @param {} record
     * @param {} index
     * @return {String}
     */
    getViewRowClass: function(record, index) {
        var flags = record.get('flags');
        //console.log(flags);
        var className = '';
        if(flags !== null) {
            if (flags.match(/Flagged/)) {
                className += ' flag_flagged';
            }
            if (flags.match(/Deleted/)) {
                className += ' flag_deleted';
            }
        }
        if (flags === null || flags.match(/Seen/) === null) {
            className += ' flag_unread';
        }
        return className;
    },
    
    /**
     * init message grid
     */
    initComponent: function() {
        this.recordProxy = Tine.Felamimail.messageBackend;
        
        this.gridConfig.columns = this.getColumns();
        this.initFilterToolbar();
        this.initDetailsPanel();
        
        this.plugins = this.plugins || [];
        this.plugins.push(this.filterToolbar);         
        
        Tine.Felamimail.GridPanel.superclass.initComponent.call(this);
        
        this.grid.getSelectionModel().on('rowselect', this.onRowSelection, this);
    },
    
    /**
     * init actions with actionToolbar, contextMenu and actionUpdater
     * 
     * @private
     */
    initActions: function() {

        this.action_write = new Ext.Action({
            requiredGrant: 'addGrant',
            actionType: 'add',
            text: this.app.i18n._('Write'),
            handler: this.onEditInNewWindow,
            iconCls: this.app.appName + 'IconCls',
            scope: this
        });

        this.action_reply = new Ext.Action({
            requiredGrant: 'readGrant',
            actionType: 'reply',
            text: this.app.i18n._('Reply'),
            handler: this.onEditInNewWindow,
            iconCls: 'action_email_reply',
            scope: this,
            disabled: true
        });

        this.action_replyAll = new Ext.Action({
            requiredGrant: 'readGrant',
            actionType: 'replyAll',
            text: this.app.i18n._('Reply To All'),
            handler: this.onEditInNewWindow,
            iconCls: 'action_email_replyAll',
            scope: this,
            disabled: true
        });

        this.action_forward = new Ext.Action({
            requiredGrant: 'readGrant',
            actionType: 'forward',
            text: this.app.i18n._('Forward'),
            handler: this.onEditInNewWindow,
            iconCls: 'action_email_forward',
            scope: this,
            disabled: true
        });

        this.action_flag = new Ext.Action({
            requiredGrant: 'readGrant',
            text: this.app.i18n._('Toggle Flag'),
            handler: this.onToggleFlag,
            flag: 'Flagged',
            iconCls: 'action_email_flag',
            allowMultiple: true,
            scope: this,
            disabled: true
        });
        
        this.action_markUnread = new Ext.Action({
            requiredGrant: 'readGrant',
            text: this.app.i18n._('Mark Unread'),
            handler: this.onToggleFlag,
            flag: 'Seen',
            iconCls: 'action_mark_unread',
            allowMultiple: true,
            scope: this,
            disabled: true
        });
        
        this.action_deleteRecord = new Ext.Action({
            requiredGrant: 'deleteGrant',
            allowMultiple: true,
            singularText: this.app.i18n._('Delete'),
            pluralText: this.app.i18n._('Delete'),
            translationObject: this.i18nDeleteActionText ? this.app.i18n : Tine.Tinebase.tranlation,
            text: this.app.i18n._('Delete'),
            handler: this.onDeleteRecords,
            disabled: true,
            iconCls: 'action_delete',
            scope: this
        });
        
        this.actions = [
            this.action_write,
            this.action_reply,
            this.action_replyAll,
            this.action_forward,
            this.action_flag,
            this.action_markUnread,
            this.action_deleteRecord
        ];
        
        this.actionToolbar = new Ext.Toolbar({
            split: false,
            height: 26,
            items: this.actions
        });
        
        this.contextMenu = new Ext.menu.Menu({
            items: this.actions.concat(this.contextMenuItems)
        });
        
        // pool together all our actions, so that we can hand them over to our actionUpdater
        for (var all=this.actionToolbarItems.concat(this.contextMenuItems), i=0; i<all.length; i++) {
            if(this.actions.indexOf(all[i]) == -1) {
                this.actions.push(all[i]);
            }
        }
    },
    
    /**
     * initialises filter toolbar
     */
    initFilterToolbar: function() {
        this.filterToolbar = new Tine.widgets.grid.FilterToolbar({
            filterModels: [
                {label: this.app.i18n._('Subject'),     field: 'subject',       operators: ['contains']},
                {label: this.app.i18n._('From'),        field: 'from',          operators: ['contains']},
                {label: this.app.i18n._('To'),          field: 'to',            operators: ['contains']},
                {label: this.app.i18n._('Cc'),          field: 'cc',            operators: ['contains']},
                {label: this.app.i18n._('Bcc'),         field: 'bcc',           operators: ['contains']},
                {label: this.app.i18n._('Received'),    field: 'received',      valueType: 'date', pastOnly: true}
             ],
             defaultFilter: 'subject',
             filters: []
        });
    },    
    
    /**
     * the details panel (shows message content)
     * 
     */
    initDetailsPanel: function() {
        this.detailsPanel = new Tine.widgets.grid.DetailsPanel({
            defaultHeight: 300,
            gridpanel: this,
            currentId: null,
            
            updateDetails: function(record, body) {
                if (record.id !== this.currentId) {
                    this.currentId = record.id;
                    Tine.Felamimail.messageBackend.loadRecord(record, {
                        scope: this,
                        success: function(message) {
                            // TODO save more values?
                            record.data.body = message.data.body;                            
                            record.data.flags = message.data.flags;
                            
                            //console.log(message);
                            
                            this.tpl.overwrite(body, message.data);
                            this.getEl().down('div').down('div').scrollTo('top', 0, false);
                            this.getLoadMask().hide();
                        }
                    });
                    this.getLoadMask().show();
                } else {
                    this.tpl.overwrite(body, record.data);
                }
            },

            tpl: new Ext.XTemplate(
                '<div class="preview-panel-felamimail">',
                    //'<tpl for="Body">',
                            '<div class="preview-panel-felamimail-headers" ext:qtip="{[this.encode(values.headers)]}">',
                                '<b>' + _('Subject') + ':</b> {[this.encode(values.subject)]}<br/>',
                                '<b>' + _('From') + ':</b> {[this.encode(values.from)]}',
                            '</div>',
                            '<div class="preview-panel-felamimail-attachments">{[this.showAttachments(values.attachments)]}</div>',
                            '<div class="preview-panel-felamimail-body">{[this.encode(values.body)]}</div>',
                    // '</tpl>',
                '</div>',{
                
                encode: function(value, type, prefix) {
                    if (value) {
                        var encoded = Ext.util.Format.htmlEncode(value);
                        encoded = Ext.util.Format.nl2br(encoded);
                        // TODO it should be enough to replace only 2 or more spaces
                        encoded = encoded.replace(/ /g, '&nbsp;');
                        
                        return encoded;
                    } else {
                        return '';
                    }
                    return value;
                },
                
                // TODO add 'download all' button
                // TODO use popup or ajax request here?
                // TODO show better error message on fail
                showAttachments: function(value) {
                    var result = (value.length > 0) ? '<b>' + _('Attachments') + ':</b> ' : '';
                    var downloadLink = 'index.php?method=Felamimail.downloadAttachment&_messageId=';
                    for (var i=0; i < value.length; i++) {
                        
                        result += '<a href="' 
                            + downloadLink + value[i].messageId 
                            + '&_partId=' + value[i].partId  
                            + '" ext:qtip="' + Ext.util.Format.htmlEncode(value[i]['content-type']) + '"'
                            + ' target="_blank"'
                            + '>' + value[i].filename + '</a> (' + Ext.util.Format.fileSize(value[i].size) + ')';
                    }
                    
                    return result;
                }
            }),
            
            // use default Tpl for default and multi view
            defaultTpl: new Ext.XTemplate(
                '<div class="preview-panel-felamimail-body">',
                    '<div class="Mail-Body-Content"></div>',
                '</div>'
            )
        });
    },
    
    /**
     * returns cm
     * @private
     */
    getColumns: function(){
        return [{
            id: 'id',
            header: this.app.i18n._("Id"),
            width: 100,
            sortable: true,
            dataIndex: 'id',
            hidden: true
        }, {
            id: 'hasAttachment',
            width: 12,
            sortable: true,
            dataIndex: 'hasAttachment',
            renderer: this.attachmentRenderer
        }, {
            id: 'flags',
            width: 24,
            sortable: true,
            dataIndex: 'flags',
            renderer: this.flagRenderer
        },{
            id: 'subject',
            header: this.app.i18n._("Subject"),
            width: 300,
            sortable: true,
            dataIndex: 'subject'
        },{
            id: 'from',
            header: this.app.i18n._("From"),
            width: 150,
            sortable: true,
            dataIndex: 'from'
        },{
            id: 'to',
            header: this.app.i18n._("To"),
            width: 150,
            sortable: true,
            dataIndex: 'to',
            hidden: true
        },{
            id: 'sent',
            header: this.app.i18n._("Sent"),
            width: 150,
            sortable: true,
            dataIndex: 'sent',
            hidden: true,
            renderer: Tine.Tinebase.common.dateTimeRenderer
        },{
            id: 'received',
            header: this.app.i18n._("Received"),
            width: 150,
            sortable: true,
            dataIndex: 'received',
            renderer: Tine.Tinebase.common.dateTimeRenderer
        },{
            id: 'size',
            header: this.app.i18n._("Size"),
            width: 80,
            sortable: true,
            dataIndex: 'size',
            hidden: true,
            renderer: Ext.util.Format.fileSize
        }];
    },
    
    /**
     * attachment column renderer
     * @param {string} value
     * @return {string}
     */
    attachmentRenderer: function(value) {
        return (value == 1) ? '<img class="FelamimailFlagIcon" src="images/oxygen/16x16/actions/attach.png">' : '';
    },
    
    /**
     * get flag icon
     * 
     * @param {} flags
     * @return {}
     * 
     * TODO  use spacer if first flag(s) is not set?
     */
    flagRenderer: function(flags) {
        if (!flags) {
            return '';
        }
        
        var icons = [];
        if (flags.match(/Answered/)) {
            icons.push({src: 'images/oxygen/16x16/actions/mail-reply-sender.png', qtip: _('Answered')});
        }   
        if (flags.match(/Passed/)) {
            icons.push({src: 'images/oxygen/16x16/actions/mail-forward.png', qtip: _('Forwarded')});
        }   
        if (flags.match(/Recent/)) {
            icons.push({src: 'images/oxygen/16x16/actions/knewstuff.png', qtip: _('Recent')});
        }   
        
        var result = '';
        for (var i=0; i < icons.length; i++) {
            result = result + '<img class="FelamimailFlagIcon" src="' + icons[i].src + '" ext:qtip="' + icons[i].qtip + '">';
        }
        
        return result;
    },
    
    /********************************* event handler **************************************/
    
    /**
     * update class and unread count in tree on select
     * - mark mail as read
     * - check if it was unread -> update tree and remove \Seen flag
     * 
     * @param {} selModel
     * @param {} rowIndex
     * @param {} r
     * 
     */
    onRowSelection: function(selModel, rowIndex, record) {
        // toggle read/seen flag of mail (only if 1 selected row)
        if (selModel.getCount() == 1) {
            //console.log(record.data.flags);
            
            var regexp = new RegExp('[ \,]*\\\\Seen');
            if (record.data.flags === null || ! record.data.flags.match(regexp)) {
                //console.log('markasread');
                record.data.flags += ' \\Seen';
                this.app.getMainScreen().getTreePanel().updateUnreadCount(-1);
                Ext.get(this.grid.getView().getRow(rowIndex)).removeClass('flag_unread');
            }
        }
    },
    
    /**
     * generic edit in new window handler
     * - overwritten parent func
     * - action type edit: reply/replyAll/forward
     * 
     * @param {} button
     * @param {} event
     * 
     * TODO  add quoting to reply body text
     * TODO  add forwarding message
     */
    onEditInNewWindow: function(button, event) {
        var recordData = this.recordClass.getDefaultData();
        var recordId = 0;
        
        if (    button.actionType == 'reply'
            ||  button.actionType == 'replyAll'
            ||  button.actionType == 'forward'
        ) {
            var selectedRows = this.grid.getSelectionModel().getSelections();
            var selectedRecord = selectedRows[0];
            
            recordId = selectedRecord.id;
            
            switch (button.actionType) {
                case 'replyAll':
                case 'reply':
                    recordData.id = recordId;
                    recordData.to = selectedRecord.get('from');
                    recordData.body = Ext.util.Format.nl2br(selectedRecord.get('body'));
                    recordData.subject = _('Re: ') + selectedRecord.get('subject');
                    recordData.flags = '\\Answered';
                    break;
                case 'forward':
                    recordData.id = recordId;
                    recordData.body = Ext.util.Format.nl2br(selectedRecord.get('body'));
                    recordData.subject = _('Fwd: ') + selectedRecord.get('subject');
                    recordData.flags = 'Passed';
                    break;
            }
        }
        
        var record = new this.recordClass(recordData, recordId);
        
        var popupWindow = Tine[this.app.appName][this.recordClass.getMeta('modelName') + 'EditDialog'].openWindow({
            record: record,
            listeners: {
                scope: this,
                'update': function(record) {
                    this.store.load({});
                }
            }
        });
    },
    
    /**
     * toggle flagged status of mail(s)
     * - Flagged/Seen
     * 
     * @param {} button
     * @param {} event
     */
    onToggleFlag: function(button, event) {
        
        var messages = this.grid.getSelectionModel().getSelections();
        var regexp = new RegExp('[ \,]*\\\\' + button.flag);
        
        // check if set or clear flag and init some vars
        if (button.flag == 'Flagged') {
            var flagged = (messages[0].get('flags') !== null && messages[0].get('flags').match(/Flagged/) !== null);
            var method = (flagged) ? 'clearFlag' : 'setFlag';
            var flagClass = 'flag_flagged';
        } else if (button.flag == 'Seen') {
            var flagged = false;
            var method = 'clearFlag';
            var flagClass = 'flag_unread';
        }
        
        
        //console.log(flagged);
        //console.log(button.flag);
        
        // loop messages and update flags
        var toUpdateIds = [];
        var index = 0;
        for (var i = 0; i < messages.length; ++i) {
            index = this.store.indexOfId(messages[i].data.id);
            if (flagged) {
                Ext.get(this.grid.getView().getRow(index)).removeClass(flagClass);
                messages[i].data.flags = messages[i].data.flags.replace(regexp, '');
                // PUSH
                toUpdateIds.push(messages[i].data.id);
                
            } else {
                
                Ext.get(this.grid.getView().getRow(index)).addClass(flagClass);
                
                if (button.flag == 'Seen') {
                    // update tree panel and remove /Seen flag
                    if (messages[i].data.flags.match(regexp)) {
                        this.app.getMainScreen().getTreePanel().updateUnreadCount(1);
                        messages[i].data.flags = messages[i].data.flags.replace(regexp, '');
                        // PUSH
                        toUpdateIds.push(messages[i].data.id);
                    }
                } else {
                    // other flags
                    if (! messages[i].data.flags.match(regexp)) {
                        // add flag
                        messages[i].data.flags = messages[i].data.flags + ',\\' + button.flag;
                    }
                    // PUSH
                    toUpdateIds.push(messages[i].data.id);
                }
            }
        }
                
        if (toUpdateIds.length > 0) {
            //this.grid.loadMask.show();
            Ext.Ajax.request({
                params: {
                    method: 'Felamimail.' + method,
                    ids: Ext.util.JSON.encode(toUpdateIds),
                    flag: Ext.util.JSON.encode('\\' + button.flag)
                },
                success: function(_result, _request) {
                    //this.store.load();
                    //this.grid.loadMask.hide();
                },
                failure: function(result, request){
                    Ext.MessageBox.alert(
                        this.app.i18n._('Failed'), 
                        this.app.i18n._('Some error occured while trying to update the messages.')
                    );
                },
                scope: this
            });
        }
    }
});
