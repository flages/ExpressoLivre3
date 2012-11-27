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
            //this.record.data.backend
            //if (this.record.get('backend') === 'Sql') {
            //    alert('backend: ' + this.record.get('backend') + '\n\n' + this.record.toString());
            //}
        }
        /*
        else {
            var F = this.getForm();
            F.findField('backend').setDisabled(false);
            F.findField('ldapName').setDisabled(false);
            F.findField('ldapHost').setDisabled(false);
            F.findField('ldapDn').setDisabled(false);
            F.findField('ldapAccount').setDisabled(false);
            F.findField('ldapObjectClass').setDisabled(false);
            F.findField('ldapBranch').setDisabled(false);
            F.findField('ldapPassword').setDisabled(false);
            F.findField('ldapQuickSearch').setDisabled(false);
            F.findField('ldapMaxResults').setDisabled(false);
            F.findField('ldapRecursive').setDisabled(false);
            
        }
        */
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

        var F = this.getForm();
        this.record.set('backend', F.findField('backend').value);

        if (this.record.get('backend') === 'Ldap') {
            this.record.set('ldapName'       , F.findField('ldapName').value);
            this.record.set('ldapHost'       , F.findField('ldapHost').value);
            this.record.set('ldapDn'         , F.findField('ldapDn').value);
            this.record.set('ldapAccount'    , F.findField('ldapAccount').value);
            this.record.set('ldapObjectClass', F.findField('ldapObjectClass').value);
            this.record.set('ldapBranch'     , F.findField('ldapBranch').value);
            this.record.set('ldapPassword'   , F.findField('ldapPassword').value);
            this.record.set('ldapQuickSearch', F.findField('ldapQuickSearch').value);
            this.record.set('ldapMaxResults' , F.findField('ldapMaxResults').value);
            this.record.set('ldapRecursive'  , F.findField('ldapRecursive').value);
        }
        else {
            this.record.set('ldapName'       , '');
            this.record.set('ldapHost'       , '');
            this.record.set('ldapDn'         , '');
            this.record.set('ldapAccount'    , '');
            this.record.set('ldapObjectClass', '');
            this.record.set('ldapBranch'     , '');
            this.record.set('ldapPassword'   , '');
            this.record.set('ldapQuickSearch', '0');
            this.record.set('ldapMaxResults' , '0');
            this.record.set('ldapRecursive'  , '0');
        }
        //alert('backend: ' + this.record.get('backend') + '\n\n' + this.record.toString());
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
                   title: 'Config. Comuns',
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
              title: 'Backend',
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
                                            this.record.set('backend', record.data.field1);
                                            var F = this.getForm();
                                            F.findField('ldapName').setDisabled(record.data.field1 === 'Sql');
                                            F.findField('ldapHost').setDisabled(record.data.field1 === 'Sql');
                                            F.findField('ldapDn').setDisabled(record.data.field1 === 'Sql');
                                            F.findField('ldapAccount').setDisabled(record.data.field1 === 'Sql');
                                            F.findField('ldapObjectClass').setDisabled(record.data.field1 === 'Sql');
                                            F.findField('ldapBranch').setDisabled(record.data.field1 === 'Sql');
                                            F.findField('ldapPassword').setDisabled(record.data.field1 === 'Sql');
                                            F.findField('ldapQuickSearch').setDisabled(record.data.field1 === 'Sql');
                                            F.findField('ldapMaxResults').setDisabled(record.data.field1 === 'Sql');
                                            F.findField('ldapRecursive').setDisabled(record.data.field1 === 'Sql');
                                    }
                                },
                                anchor: '100%',
                                columnWidth: 0.2
                             }, {
                                xtype: 'textfield',
                                name: 'ldapName',
                                fieldLabel: this.app.i18n._('Name'), 
                                //disabled: true,
                                allowBlank: false,
                                value: 'ldapName',
                                //minLength: 3,
                                maxLength: 20,
                                columnWidth: 1                                
                             }, {
                                xtype: 'textfield',
                                name: 'ldapHost',
                                fieldLabel: this.app.i18n._('Host'), 
                                //disabled: true,
                                allowBlank: false,
                                value: 'ldapHost',
                                //maskRe: /[0-9.]/i,
                                //regex: /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
                                //regexText: this.app.i18n._('Invalid IP address'),
                                //minLength: 7,
                                maxLength: 15,
                                columnWidth: 1                                
                             }, {
                                xtype: 'textfield',
                                name: 'ldapDn',
                                fieldLabel: this.app.i18n._('Distinguished Name'), 
                                //disabled: true,
                                allowBlank: false,
                                value: 'ldapDn',
                                //minLength: 4,
                                maxLength: 256,
                                columnWidth: 1                                
                             }, {
                                xtype: 'textfield',
                                name: 'ldapAccount',
                                fieldLabel: this.app.i18n._('Account'), 
                                //disabled: true,
                                allowBlank: false,
                                value: 'ldapAccount',
                                //minLength: 4,
                                maxLength: 256,
                                columnWidth: 1
                             }, {
                                xtype: 'textfield',
                                name: 'ldapObjectClass',
                                fieldLabel: this.app.i18n._('Object Class'), 
                                //disabled: true,
                                allowBlank: false,
                                //minLength: 3,
                                value: 'ldapObjectClass',
                                maxLength: 32,
                                columnWidth: 1                                
                             }, {
                                xtype: 'textfield',
                                name: 'ldapBranch',
                                fieldLabel: this.app.i18n._('Branch'), 
                                //disabled: true,
                                allowBlank: false,
                                //minLength: 3,
                                value: 'ldapBranch',
                                maxLength: 32,
                                columnWidth: 0.6                                
                             }, {
                                xtype: 'textfield',
                                inputType: 'password',
                                name: 'ldapPassword',
                                fieldLabel: this.app.i18n._('Password'), 
                                //disabled: true,
                                allowBlank: false,
                                //minLength: 6,
                                value: '123456',
                                maxLength: 32,
                                columnWidth: 0.4                               
                             }, {
                                xtype: 'combo',
                                name: 'ldapQuickSearch',                                
                                fieldLabel: this.app.i18n._('Quick Search'), 
                                //disabled: true,
                                mode: 'local',
                                store: [[0, this.app.i18n._('false')], [1, this.app.i18n._('true')]],
                                value: 'false',
                                columnWidth: 0.4
                             }, {
                                xtype: 'numberfield',
                                name: 'ldapMaxResults',
                                //disabled: true,
                                value: 0,
                                fieldLabel: this.app.i18n._('Max.'), 
                                allowBlank: false,
                                style: 'text-align: right',
                                //minLength: 1,                             
                                maxLength: 4,
                                columnWidth: 0.2                                
                             }, {
                                xtype: 'combo',
                                name: 'ldapRecursive',                                
                                //disabled: true,
                                fieldLabel: this.app.i18n._('Recursive'), 
                                store: [[0, this.app.i18n._('false')], [1, this.app.i18n._('true')]],
                                mode: 'local',
                                value: 'false',
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
