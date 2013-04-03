Ext.ux.form.HtmlEditor.UploadImage = Ext.extend(Ext.util.Observable, {
    text_title: 'Insert Image',
    text_error_msgbox_title: 'Error',
    text_error_file_type_not_permitted: 'This file type is not allowed.<br/>Please, select a file of the following extensions: {1}',
    text_note_upload_failed: 'Either a server internal error occurred or the service is unavailable.<br/>You may also check if the file size does not exceed {0} bytes.',
    text_note_upload_error: 'Upload error.<br/>Please check if the file size does not exceed {0} bytes.',
    text_note_uploading: 'Uploading...',
    url : 'index.php',
    method : 'Felamimail.uploadImage',
    base64: 'no',
    permitted_extensions: ['jpg', 'jpeg', 'png', 'bmp', 'gif'],
    form : null,

    init : function(cmp) {
        this.cmp = cmp;
        this.cmp.on('render', this.onRender, this);
        this.on('uploadsuccess', this.uploadsuccess || this.onUploadSuccess, this);
        this.on('uploaderror', this.uploaderror || this.onUploadError, this);
        this.on('uploadfailed', this.uploadfailed || this.onUploadFailed, this);

        var css = '.x-edit-image {background: url(ux/icons/picture.png) 0 0 no-repeat !important;}';
        Ext.util.CSS.createStyleSheet(css, 'editor-css');

        // Registering dialog events.
        this.addEvents({
            'uploadsuccess' : true,
            'uploaderror' : true,
            'uploadfailed' : true,
            'uploadstart' : true,
            'uploadcomplete' : true
        });
    },

    setBase64 : function(base64) {
        this.base64 = base64;
    },
    
    createForm : function()	{
        this.form = Ext.DomHelper.append(this.body, {
            tag: 'form',
            method: 'post',
            action: this.url,
            style: 'position: absolute; left: -100px; top: -100px; width: 100px; height: 100px'
        });
    },

    recreateForm : function() {
        if (this.form) {
            this.form.parentNode.removeChild(this.form);
        }
        this.createForm();
    },
        
    onRender : function(ct, position) {
        this.cmp.getToolbar().addButton([new Ext.Toolbar.Separator()]);

        this.btn = this.cmp.getToolbar().addButton(new Ext.ux.UploadImage.BrowseButton({
            input_name : 'upload',
            iconCls : 'x-edit-image',
            handler	: this.onFileSelected,
            scope : this,
            url: this.url, 
            tooltip : {title: _(this.text_title)},
            overflowText : _(this.text_title)
        }));

        this.body = Ext.getBody();
        this.createForm();
    },
    
    onFileSelected : function() {
        if (this.isPermittedFile()) {
            var input_file = this.btn.detachInputFile();

            input_file.appendTo(this.form);
            input_file.setStyle('width', '100px');
            input_file.dom.disabled = true;

            this.image_file = {
                filename: input_file.dom.value,
                input_element: input_file
            };

            input_file.dom.disabled = false;

            this.uploadFile(this.image_file);
            this.fireUploadStartEvent();
            this.image_file = null;
        }
    },

    uploadFile : function(record) {
        this.base_params = { method: 'Felamimail.uploadImage', base64: this.base64 };
        Ext.Ajax.request({
            url : this.url,
            params : this.base_params || this.baseParams || this.params,
            method : 'POST',
            form : this.form,
            isUpload : true,
            success : this.onAjaxSuccess,
            failure : this.onAjaxFailure,
            scope : this,
            record: record
        });
    },

    getFileExtension : function(filename) {
        var result = null;
        var parts = filename.split('.');
        if (parts.length > 1) {
            result = parts.pop();
        }
        return result;
    },

    isPermittedFileType : function(filename) {
        var result = true;
        if (this.permitted_extensions.length > 0) {
            result = this.permitted_extensions.indexOf(this.getFileExtension(filename)) != -1;
        }
        return result;
    },

    isPermittedFile : function() {
        var result = false;
        var filename = this.btn.getInputFile().dom.value;

        if (this.isPermittedFileType(filename.toLowerCase())) {
            result = true;
        }
        else {
            this.showMessage(_(this.text_error_msgbox_title),String.format(_(this.text_error_file_type_not_permitted),filename,this.permitted_extensions.join(', ')));
            result = false;
        }

        return result;
    },

    fireUploadStartEvent : function() {
        this.wait = Ext.MessageBox.wait(_(this.text_note_uploading), _('Please wait!'));
        this.fireEvent('uploadstart', this);
    },

    fireUploadSuccessEvent : function(data) {
        this.fireEvent('uploadsuccess', this, data.record.filename, data.response);
    },

    fireUploadErrorEvent : function(data) {
        this.fireEvent('uploaderror', this, data.record.filename, data.response);
    },

    fireUploadFailedEvent : function(data) {
        this.fireEvent('uploadfailed', this, data.record.filename, data.response);
    },

    fireUploadCompleteEvent : function() {
        if (this.wait) {
            this.wait.hide();
        }
        this.fireEvent('uploadcomplete', this);
    },

    onAjaxSuccess : function(response, options) {
        var json_response = {
            'success' : false,
            'error' : _(this.text_note_upload_failed)
        }
        try {
            var rt = response.responseText;
            var filter = rt.match(/^<pre>((?:.|\n)*)<\/pre>$/i);
            if (filter) {
                rt = filter[1];
            }
            json_response = Ext.util.JSON.decode(rt);
        }
        catch (e) {}

        var data = {
            record: options.record,
            response: json_response
        }

        this.recreateForm();
        if ('success' in json_response && json_response.success) {
            this.fireUploadSuccessEvent(data); 
        }
        else if ('method' in json_response && json_response.method) {
            this.fireUploadErrorEvent(data); 
        }
        else {
            this.fireUploadFailedEvent(data);
        }
        this.fireUploadCompleteEvent();
    },

    onAjaxFailure : function(response, options) {
        var data = {
            record : options.record,
            response : {
                'success' : false,
                'error' : _(this.text_note_upload_failed)
            }
        }

        this.recreateForm();
        this.fireUploadFailedEvent();
        this.fireUploadCompleteEvent();
    },

    onUploadSuccess : function(dialog, filename, resp_data, record) {
        var fileName = filename.replace(/[a-zA-Z]:[\\\/]fakepath[\\\/]/, '');
        var html = '<img alt="'+fileName+'" src="index.php?method=Felamimail.showTempImage&tempImageId='+resp_data.id+'"/>';
        if (!dialog.cmp.activated) {
            dialog.cmp.getEditorBody().focus();
            dialog.cmp.onFirstFocus();
        }
        dialog.cmp.insertAtCursor(html);
    },

    onUploadError : function(dialog, filename, resp_data, record) {
        var fileName = filename.replace(/[a-zA-Z]:[\\\/]fakepath[\\\/]/, '');
        this.showMessage(_(this.text_error_msgbox_title),String.format(_(this.text_note_upload_error),resp_data.maxsize));
    },

    onUploadFailed : function(dialog, filename, resp_data, record) {
        var fileName = filename.replace(/[a-zA-Z]:[\\\/]fakepath[\\\/]/, '');
        this.showMessage(_(this.text_error_msgbox_title),String.format(_(this.text_note_upload_failed),resp_data.maxsize));
    },
    
    showMessage : function(title, message) {
        this.wait = null;
        Ext.Msg.alert(title,message);
    }

});

/**
 * Ext.ux.UploadImage namespace.
 */
Ext.namespace('Ext.ux.UploadImage');

/**
 * File upload browse button.
 *
 * @class Ext.ux.UploadImage.BrowseButton
 */
Ext.ux.UploadImage.BrowseButton = Ext.extend(Ext.Button, {
    input_name : 'file',
    input_file : null,
    original_handler : null,
    original_scope : null,
    hideParent : true,

    /**
     * @access private
     */
    initComponent : function() {
        Ext.ux.UploadImage.BrowseButton.superclass.initComponent.call(this);
        this.original_handler = this.handler || null;
        this.original_scope = this.scope || window;
        this.handler = null;
        this.scope = null;
    },

    /**
     * @access private
     */
    onRender : function(ct, position) {
        Ext.ux.UploadImage.BrowseButton.superclass.onRender.call(this, ct, position);
        this.createInputFile();
    },

    /**
     * @access private
     */
    onDestroy : function() {
    Ext.ux.UploadImage.BrowseButton.superclass.onDestroy.call(this);
    if(this.container) {
        this.container.remove();
        }
    },
  
    /**
     * @access private
     */
    createInputFile : function() {
        var button_container = this.el.child('tbody' /* JYJ '.x-btn-center'*/);
        button_container.position('relative');
        this.wrap = this.el.wrap({cls:'tbody'});

        this.input_file = this.wrap.createChild({
            tag: 'input',
            type: 'file',
            size: 1,
            name: this.input_name || Ext.id(this.el),
            style: "position: absolute; display: block; border: none; cursor: pointer"
        });
        this.input_file.setOpacity(0.0);

        var button_box = button_container.getBox();
        this.input_file.setStyle('font-size', (button_box.width * 0.5) + 'px');

        var input_box = this.input_file.getBox();

        this.input_file.setWidth(button_box.width + 3 + 'px');
        this.input_file.setTop('0px');
        this.input_file.setHeight(button_box.height + 3 + 'px');
        this.input_file.setOpacity(0.0);

        if (this.handleMouseEvents) {
            this.input_file.on('mouseover', this.onMouseOver, this);
            this.input_file.on('mousedown', this.onMouseDown, this);
        }

        if(this.tooltip){
            if(typeof this.tooltip == 'object'){
                Ext.QuickTips.register(Ext.apply({target: this.input_file}, this.tooltip));
            }
            else {
                this.input_file.dom[this.tooltipType] = this.tooltip;
            }
        }

        this.input_file.on('change', this.onInputFileChange, this);
        this.input_file.on('click', function(e) { e.stopPropagation(); });
    },
  
    /**
     * @access public
     */
    detachInputFile : function(no_create) {
        var result = this.input_file;

        no_create = no_create || false;

        if (typeof this.tooltip == 'object') {
            Ext.QuickTips.unregister(this.input_file);
        }
        else {
            this.input_file.dom[this.tooltipType] = null;
        }
        this.input_file.removeAllListeners();
        this.input_file = null;

        if (!no_create) {
            this.createInputFile();
        }
        return result;
    },

    /**
     * @access public
     */
    getInputFile : function() {
        return this.input_file;
    },
  
    /**
     * @access public
     */
    disable : function() {
        Ext.ux.UploadImage.BrowseButton.superclass.disable.call(this);
        this.input_file.dom.disabled = true;
    },

    /**
     * @access public
     */
    enable : function() {
        Ext.ux.UploadImage.BrowseButton.superclass.enable.call(this);
        this.input_file.dom.disabled = false;
    },
  
    /**
     * @access public
     */
    destroy : function() {
        var input_file = this.detachInputFile(true);
        input_file.remove();
        input_file = null;
        Ext.ux.UploadImage.BrowseButton.superclass.destroy.call(this);
    },
  
    /**
    * @access private
    */
    onInputFileChange : function() {
        if (this.original_handler) {
            this.original_handler.call(this.original_scope, this);
        }
    }
});