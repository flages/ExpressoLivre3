/*
 * Tine 2.0
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2011 Metaways Infosystems GmbH (http://www.metaways.de)
 */
 
/*global Ext, Tine*/

Ext.ns('Tine.Admin.container');

/**
 * @namespace   Tine.Admin.container
 * @class       Tine.Admin.ContainerEditDialog
 * @extends     Tine.widgets.dialog.EditDialog
 * 
 * <p>Container Edit Dialog</p>
 * <p>
 * </p>
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * 
 * @param       {Object} config
 * @constructor
 * Create a new Tine.Admin.ContainerEditDialog
 * 
 * TODO add note for personal containers (note is sent to container owner)
 */
Tine.Admin.ContainerEditDialog = Ext.extend(Tine.widgets.dialog.EditDialog, {
    
    /**
     * @private
     */
    windowNamePrefix: 'containerEditWindow_',
    appName: 'Admin',
    recordClass: Tine.Admin.Model.Container,
    recordProxy: Tine.Admin.containerBackend,
    evalGrants: false,
    
    /**
     * executed after record got updated from proxy
     */
    onRecordLoad: function () {
        Tine.Admin.ContainerEditDialog.superclass.onRecordLoad.apply(this, arguments);
        // load grants store if editing record
        if (this.record && this.record.id) {
            this.grantsStore.loadData({
                results:    this.record.get('account_grants'),
                totalcount: this.record.get('account_grants').length
            });
        }
    },    
    
    /**
     * executed when record gets updated from form
     */
    onRecordUpdate: function () {
        Tine.Admin.ContainerEditDialog.superclass.onRecordUpdate.apply(this, arguments);
        
        // get grants from grants grid
        this.record.set('account_grants', '');
        var grants = [];
        this.grantsStore.each(function(grant){
            grants.push(grant.data);
        });
        this.record.set('account_grants', grants);
    },
    
    /**
     * create grants store + grid
     * 
     * @return {Tine.widgets.container.GrantsGrid}
     */
    initGrantsGrid: function () {
       this.grantsStore = new Ext.data.JsonStore({
            root: 'results',
            totalProperty: 'totalcount',
            id: 'account_id',
            fields: Tine.Tinebase.Model.Grant
       });
       
       this.grantsGrid = new Tine.widgets.container.GrantsGrid({
            border: false,
            height: 300,
            columnWidth: 1,
            flex: 1,
            store: this.grantsStore,
            grantContainer: this.record.data,
            alwaysShowAdminGrant: true
       });
        
       return this.grantsGrid;
    },
    
    /**
     * returns dialog
     */
    getFormItems: function () {
        this.appStore = new Ext.data.JsonStore({
            root: 'results',
            totalProperty: 'totalcount',
            fields: Tine.Admin.Model.Application
        });
        this.appStore.loadData({
            results:    Tine.Tinebase.registry.get('userApplications'),
            totalcount: Tine.Tinebase.registry.get('userApplications').length
        });
        
        return {
           xtype: 'tabpanel',
           id: 'editdialog-container-settings-panel',
           activeTab: 0,
           deferredRender: false,
           defaults: {autoscroll: true, padding: '10px'},
           items: [[{
                   title: this.app.i18n._('Common Configurations'),
                   layout: 'form',
                   layoutConfig: {type: 'fit', align: 'stretch', pack: 'start'},
                   items: [[{
                           xtype: 'columnform',
                           autoHeight: true,
                           border: false, 
                           items: [[{
                                       xtype: 'textfield',
                                       name: 'name',
                                       fieldLabel: this.app.i18n._('Name'),
                                       allowBlank: false,
                                       maxLength: 40,
                                       columnWidth: 0.3
                                    }, {
                                       xtype: 'combo',
                                       name: 'application_id',
                                       displayField: 'name',
                                       valueField: 'id',
                                       fieldLabel: this.app.i18n._('Application'),
                                       store: this.appStore,
                                       mode: 'local',
                                       readOnly: this.record.id != 0,
                                       allowBlank: false,
                                       forceSelection: true,
                                       anchor: '100%',
                                       columnWidth: 0.3
                                    }, {
                                       xtype: 'combo',
                                       name: 'type',
                                       fieldLabel: this.app.i18n._('Type'),
                                       store: [['personal', this.app.i18n._('personal')], ['shared', this.app.i18n._('shared')]],
                                       mode: 'local',
                                       allowBlank: false,
                                       forceSelection: true,
                                       listeners: {
                                          scope: this,
                                             select: function (combo, record) {
                                                        this.getForm().findField('note').setDisabled(record.data.field1 === 'shared');
                                             }
                                       },
                                       anchor: '100%',
                                       columnWidth: 0.2
                                    }, {
                                       xtype: 'colorfield',
                                       name: 'color',
                                       fieldLabel: this.app.i18n._('Color'),
                                       columnWidth: 0.2
                                    }], [
                                        this.initGrantsGrid(), {
                                             xtype: 'textarea',
                                             name: 'note',
                                             columnWidth: 1,
                                             height: 50,
                                             emptyText: this.app.i18n._('Note for Owner'),
                                             disabled: this.record.get('type') == 'shared'
                                        }
                                    ]    
                           ]
                   }]]
           }, {
              title: this.app.i18n._('Backend'),
              layout: 'form',
              items: [[{
                    xtype: 'columnform',
                    autoHeight: true,
                    border: false,
                    items: [[{
                            xtype: 'combo',
                            name: 'backend',
                            fieldLabel: this.app.i18n._('Backend'),
                            store: [['Sql', this.app.i18n._('Sql')], ['Ldap', this.app.i18n._('Ldap')]],
                            mode: 'local',
                            allowBlank: false,
                            forceSelection: true,
                            listeners: {
                                scope: this, 
                                select: function (combo, record) {
                                    var Form = this.getForm();
                                    Form.findField('ldapHost').setDisabled(record.data.field1 === 'Sql');
                                    Form.findField('ldapDn').setDisabled(record.data.field1 === 'Sql');
                                    Form.findField('ldapAccount').setDisabled(record.data.field1 === 'Sql');
                                    Form.findField('ldapObjectClass').setDisabled(record.data.field1 === 'Sql');
                                    Form.findField('ldapPassword').setDisabled(record.data.field1 === 'Sql');
                                    Form.findField('ldapQuickSearch').setDisabled(record.data.field1 === 'Sql');
                                    Form.findField('ldapMaxResults').setDisabled(record.data.field1 === 'Sql');
                                    Form.findField('ldapRecursive').setDisabled(record.data.field1 === 'Sql');
                                }
                            },
                            //anchor: '100%',
                            columnWidth: 1
                        }, {
                            xtype: 'textfield',
                            name: 'ldapHost',
                            fieldLabel: this.app.i18n._('Host'),
                            disabled: this.record.get('backend') == 'Sql',
                            allowBlank: false,
                            columnWidth: 0.6
                        }, {
                            xtype: 'textfield',
                            name: 'ldapPort',
                            fieldLabel: this.app.i18n._('Port'),
                            disabled: this.record.get('backend') == 'Sql',
                            maxLength: 5,
                            columnWidth: 0.4
                        },{
                            xtype: 'textfield',
                            name: 'ldapDn',
                            fieldLabel: this.app.i18n._('Distinguished Name'),
                            disabled: this.record.get('backend') == 'Sql',
                            allowBlank: false,
                            columnWidth: 1
                        }, {
                            xtype: 'textfield',
                            name: 'ldapObjectClass',
                            fieldLabel: this.app.i18n._('Search Filter'),
                            disabled: this.record.get('backend') == 'Sql',
                            allowBlank: false,
                            columnWidth: 1
                        }, {
                            xtype: 'textfield',
                            name: 'ldapAccount',
                            fieldLabel: this.app.i18n._('Account'),
                            disabled: this.record.get('backend') == 'Sql',
                            allowBlank: false,
                            columnWidth: 0.6
                        }, {
                            xtype: 'textfield',
                            inputType: 'password',
                            name: 'ldapPassword',
                            fieldLabel: this.app.i18n._('Password'),
                            disabled: this.record.get('backend') == 'Sql',
                            allowBlank: false,
                            columnWidth: 0.4
                        }, {
                            xtype: 'combo',
                            name: 'ldapQuickSearch',                                
                            fieldLabel: this.app.i18n._('Quick Search'),
                            disabled: this.record.get('backend') == 'Sql',
                            disabled: true,
                            mode: 'local',
                            store: [[0, this.app.i18n._('false')], [1, this.app.i18n._('true')]],
                            columnWidth: 0.4
                        }, {
                            xtype: 'numberfield',
                            name: 'ldapMaxResults',
                            fieldLabel: this.app.i18n._('Max Result'),
                            disabled: this.record.get('backend') == 'Sql',
                            allowBlank: false,
                            style: 'text-align: right',
                            maxLength: 4,
                            columnWidth: 0.2
                        }, {
                            xtype: 'combo',
                            name: 'ldapRecursive',        
                            fieldLabel: this.app.i18n._('Recursive'), 
                            disabled: this.record.get('backend') == 'Sql',
                            store: [[0, this.app.i18n._('false')], [1, this.app.i18n._('true')]],
                            allowBlank: false,
                            forceSelection: true,
                            mode: 'local',
                            columnWidth: 0.4
                        }
                    ]]
                }]]
            }]]
        };
    }
});

/**
 * Container Edit Popup
 * 
 * @param   {Object} config
 * @return  {Ext.ux.Window}
 */
Tine.Admin.ContainerEditDialog.openWindow = function (config) {
    var window = Tine.WindowFactory.getWindow({
        width: 800,
        height: 550,
        name: Tine.Admin.ContainerEditDialog.prototype.windowNamePrefix + Ext.id(),
        contentPanelConstructor: 'Tine.Admin.ContainerEditDialog',
        contentPanelConstructorConfig: config
    });
    return window;
};
