
Ext.ns('Tine.widgets.editDialog');

Tine.widgets.dialog.MultipleEditDialogPlugin = function (config) {
    Ext.apply(this, config);
};

Tine.widgets.dialog.MultipleEditDialogPlugin.prototype = {
    
    app: null,
    
    editDialog: null,
    
    form: null,
    
    disabledFields: [],
    
    changes: null,
    
    init: function(editDialog) {
        
        this.disabledFields = {};
        
        this.editDialog = editDialog;
        this.app = Tine.Tinebase.appMgr.get(this.editDialog.app);
        this.form = this.editDialog.getForm();
        
        this.editDialog.on('load', this.disableFields, this);
        
        this.editDialog.onRecordUpdate = this.editDialog.onRecordUpdate.createInterceptor(this.onRecordUpdate, this);
        this.editDialog.onApplyChanges = function(button, event, closeWindow) { this.onRecordUpdate(); }       
    },
    
    onRecordUpdate: function() {
        this.changes = [];
        this.form.items.each(function(item){
            if(item.edited) {
                this.changes.push({ name: item.getName(),  value: item.getValue() });
            }
        },this);
        
        var filter = this.editDialog.sm.getSelectionFilter();
 
        Ext.MessageBox.confirm(_('Confirm'), String.format(_('Do you really want to change these {0} records?'), this.editDialog.sm.getCount()), function(_btn) {
            if (_btn == 'yes') {
                Ext.MessageBox.wait(_('Please wait'), _('Applying changes'));
          
                // here comes the backend call
                Ext.Ajax.request({
                    url : 'index.php',
                    params : { method : 'Tinebase.updateMultipleRecords', 
                               appName: this.editDialog.recordClass.getMeta('appName'), 
                               modelName: this.editDialog.recordClass.getMeta('modelName'), 
                               changes: this.changes, 
                               filter: filter 
                             },
                    success : function(_result, _request) {
                        Ext.MessageBox.hide();
                        this.editDialog.purgeListeners();
                        this.editDialog.fireEvent('save');
                        this.editDialog.window.close();                       
                    }, scope: this
                });
            }
        }, this);
        
        return false;
    },
    
    disableFields: function() {
        
        for(fieldName in this.editDialog.record.data) {
            if(typeof(this.editDialog.record.data[fieldName]) == 'object') continue;
            Ext.each(this.editDialog.sm.getSelections(), function(selection,index) {

                var field = this.form.findField(fieldName);
                if(field) {
                    field.originalValue = this.editDialog.record.data[fieldName];
                    
                    // set back??
//                    field.on('dblclick',function(){
//                        this.setValue(this.originalValue);
//                        this.edited = false;
//                        this.removeClass('applyToAll');
//                        if(this.multi) {
//                            this.addClass('notEdited');
//                        }
//                    });
                    
                if(selection.data[fieldName] != this.editDialog.record.data[fieldName]) {
              
                        
                        field.setReadOnly(true);
                        field.addClass('notEdited');
                        field.multi = true;
                        field.edited = false;
                        field.on('focus',function() {
                            this.setReadOnly(false);
                            this.on('blur',function() {
                                if(this.originalValue != this.getValue()) {
                                    this.removeClass('notEdited');
                                    this.addClass('applyToAll');
                                    this.edited = true;
                                }
                            });
                        });
                                       
                } else {
                  
                  field.on('blur',function() {
                                if(this.originalValue != this.getValue()) {
                                    this.addClass('applyToAll');
                                    this.edited = true;
                                } else {
                                    this.edited = false;
                                    this.removeClass('applyToAll');
                                    if(this.multi) {
                                        this.addClass('notEdited');
                                    }
                                }
                            });  
                }
                }
            },this);   
        } 
    }
}