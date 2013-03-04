/*
 * Tine 2.0
 * 
 * @package     Felamimail
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * @copyright   Copyright (c) 2010-2011 Metaways Infosystems GmbH (http://www.metaways.de)
 *
 */
 
Ext.namespace('Tine.Felamimail');

/**
 * @namespace   Tine.Felamimail
 * @class       Tine.Felamimail.ComposeEditor
 * @extends     Ext.form.HtmlEditor
 * 
 * <p>Compose HTML Editor</p>
 * 
 * @license     http://www.gnu.org/licenses/agpl.html AGPL Version 3
 * @author      Philipp Schüle <p.schuele@metaways.de>
 * 
 * @param       {Object} config
 * @constructor
 * Create a new Tine.Felamimail.ComposeEditor
 */
Tine.Felamimail.ComposeEditor = Ext.extend(Ext.form.HtmlEditor, {
    
    cls: 'felamimail-message-body-html',
    name: 'body',
    allowBlank: true,

    getDocMarkup: function(){
        var markup = '<html>'
            + '<head>'
            + '<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">'
            + '<title></title>'
            + '<style type="text/css">'
                // standard css reset
                + "html,body,div,dl,dt,dd,ul,ol,li,h1,h2,h3,h4,h5,h6,pre,form,fieldset,input,p,th,td{margin:0;padding:0;}img,body,html{border:0;}address,caption,cite,code,dfn,th,var{font-style:normal;font-weight:normal;}ol,ul {list-style:none;}caption,th {text-align:left;}h1,h2,h3,h4,h5,h6{font-size:100%;}q:before,q:after{content:'';}"
                // small forms
                + "html,body,div,dl,dt,dd,ul,ol,li,h1,h2,h3,h4,h5,h6,pre,form,fieldset,input,p,blockquote,th,td{font-size: 100%;}"
                // standard blockquotes
                + "blockquote{margin-top:0;margin-bottom:0;}"
                // lists
                + "ul {list-style:circle outside; margin-left: 20px;}"
                + "ol {list-style:decimal outside; margin-left: 20px;}"
                // fmail special
                + '.felamimail-body-blockquote {'
                    + 'margin: 5px 10px 0 3px;'
                    + 'padding-left: 10px;'
                    + 'border-left: 2px solid #000088;'
                + '} '
            + '.editor-body-panel { font-size: 100% !important; }'
            + '</style>'
            + '</head>'
            + '<body class="editor-body-panel" style="padding: 5px 0px 0px 5px; margin: 0px">'
            + '</body></html>';

        return markup;
    },
    
		getContainer: function() {
			return this.iframe;
		},

    /**
     * @private
     */
    initComponent: function() {
        
        this.plugins = [
            new Ext.ux.form.HtmlEditor.UploadImage(),  
            new Ext.ux.form.HtmlEditor.Table(),  
            new Ext.ux.form.HtmlEditor.IndentOutdent(),  
            new Ext.ux.form.HtmlEditor.RemoveFormat(),
//            new Ext.ux.form.HtmlEditor.EndBlockquote(),
	    new Ext.ux.form.HtmlEditor.SpellChecker(),
            new Ext.ux.form.HtmlEditor.SpecialKeys(),
            new Ext.ux.form.HtmlEditor.UndoRedo()
        ];
        
        Tine.Felamimail.ComposeEditor.superclass.initComponent.call(this);
    },
         
    // *Fix* Overridding the onRender method, in order to
	// unset the height and width property, so that the
	// layout manager won't consider this field to be of
	// fixed dimension, thus ignoring the flex option
    onRender: function () {
		Tine.Felamimail.ComposeEditor.superclass.onRender.apply(this, arguments);
		delete this.height;
		delete this.width;
	}

});

Ext.namespace('Ext.ux.form.HtmlEditor');

/**
 * @class Ext.ux.form.HtmlEditor.EndBlockquote
 * @extends Ext.util.Observable
 * 
 * plugin for htmleditor that ends blockquotes on ENTER
 * tested with chrome, sarari, FF4+
 * fallsback for old (non IE) browser which works for easy structures
 * does not work with IE yet
 * 
 * TODO move this to ux dir
 */
Ext.ux.form.HtmlEditor.EndBlockquote = Ext.extend(Ext.util.Observable , {

    // private
    init: function(cmp){
            this.cmp = cmp;
            this.cmp.on('initialize', this.onInit, this);
    },
    
    // private
    onInit: function() {
        if (Ext.isIE) {
            Ext.EventManager.on(this.cmp.getDoc(), {
                'keydown': this.endBlockquoteIE,
                scope: this
            });
        } else if (Ext.isFunction(this.cmp.win.getSelection().modify)) {
            Ext.EventManager.on(this.cmp.getDoc(), {
                'keyup': this.endBlockquoteHTML5,
                scope: this
            });
        } else {
            Ext.EventManager.on(this.cmp.getDoc(), {
                'keydown': this.endBlockquoteHTML4,
                scope: this
            });
        }
        
    },

    /**
     * on keyup 
     * 
     * @param {Event} e
     */
    endBlockquoteIE: function(e) {
        if (e.getKey() == e.ENTER) {
            
            e.stopEvent();
            e.preventDefault();
            
            var s = this.cmp.win.document.selection,
                r = s.createRange(),
                doc = this.cmp.getDoc(),
                anchor = r.parentElement(),
                level = this.getBlockquoteLevel(anchor),
                scrollTop = doc.body.scrollTop;
                
            if (level > 0) {
                r.moveStart('word', -1);
                r.moveEnd('textedit');
                var fragment = r.htmlText;
                r.execCommand('Delete');
                
                var newText = doc.createElement('p'),
                    newTextMark = '###newTextHere###' + Ext.id(),
                    fragmentMark = '###fragmentHere###' + Ext.id();
                newText.innerHTML = newTextMark + fragmentMark;
                doc.body.appendChild(newText);
                
                r.expand('textedit');
                r.findText(fragmentMark);
                r.select();
                r.pasteHTML(fragment);

                r.expand('textedit');
                r.findText(newTextMark);
                r.select();
                r.execCommand('Delete');
                
                // reset scroller
                doc.body.scrollTop = scrollTop;
                
                this.cmp.syncValue();
                this.cmp.deferFocus();
            }
            
        }
        
        return;
    },
    
    /**
     * on keyup 
     * 
     * @param {Event} e
     */
    endBlockquoteHTML5: function(e) {
        // Chrome, Safari, FF4+
        if (e.getKey() == e.ENTER) {
            var s = this.cmp.win.getSelection(),
                r = s.getRangeAt(0),
                doc = this.cmp.getDoc(),
                level = this.getBlockquoteLevel(s.anchorNode),
                scrollTop = doc.body.scrollTop;
                
            if (level > 0) {
                // cut from cursor to end of the document
                if (s.anchorNode.nodeName == '#text') {
                    r.setStartBefore(s.anchorNode.parentNode);
                }
                s.modify("move", "backward", "character");
                r.setEndAfter(doc.body.lastChild);
                var fragmet = r.extractContents();
                
                // insert paragraph for new text and move cursor in
                // NOTE: we need at least one character in the newText to move cursor in
                var newText = doc.createElement('p');
                newText.innerHTML = '&nbsp;';
                doc.body.appendChild(newText);
                s.modify("move", "forward", "character");
                
                // paste rest of document 
                doc.body.appendChild(fragmet);
                
                // reset scroller
                doc.body.scrollTop = scrollTop;
            }
        }
    },

    /**
     * on keydown 
     * 
     * @param {Event} e
     */
    endBlockquoteHTML4: function(e) {
        if (e.getKey() == e.ENTER) {
            var s = this.cmp.win.getSelection(),
                r = s.getRangeAt(0),
                doc = this.cmp.getDoc(),
                level = this.getBlockquoteLevel(s.anchorNode);
            
            if (level > 0) {
                e.stopEvent();
                e.preventDefault();
                
                this.cmp.win.focus();
                if (level == 1) {
                    this.cmp.insertAtCursor('<br /><blockquote class="felamimail-body-blockquote"><br />');
                    this.cmp.execCmd('outdent');
                    this.cmp.execCmd('outdent');
                } else if (level > 1) {
                    for (var i=0; i < level; i++) {
                        this.cmp.insertAtCursor('<br /><blockquote class="felamimail-body-blockquote">');
                        this.cmp.execCmd('outdent');
                        this.cmp.execCmd('outdent');
                    }
                    var br = doc.createElement('br');
                    r.insertNode(br);
                }
                this.cmp.deferFocus();
            }
        }
    },
    
    /**
     * get blockquote level helper
     * 
     * @param {DOMNode} node
     * @return {Integer}
     */
    getBlockquoteLevel: function(node) {
        var result = 0;
        
        while (node.nodeName == '#text' || node.tagName.toLowerCase() != 'body') {
            if (node.tagName && node.tagName.toLowerCase() == 'blockquote') {
                result++;
            }
            node = node.parentNode ? node.parentNode : node.parentElement;
        }
        
        return result;
    }
});

/**
 * @class Ext.ux.form.HtmlEditor.SpecialKeys
 * @extends Ext.util.Observable
 * 
 * plugin for htmleditor that fires events for special keys (like CTRL-ENTER and SHIFT-TAB)
 * 
 * TODO move this to ux dir
 */
Ext.ux.form.HtmlEditor.SpecialKeys = Ext.extend(Ext.util.Observable , {
    // private
    init: function(cmp){
        this.cmp = cmp;
        this.cmp.on('initialize', this.onInit, this);
    },
    // private
    onInit: function(){
        Ext.EventManager.on(this.cmp.getDoc(), {
            'keydown': this.onKeydown,
            scope: this
        });
    },

    /**
     * on keydown 
     * 
     * @param {Event} e
     * 
     * TODO try to prevent TAB key event from inserting a TAB in the editor 
     */
    onKeydown: function(e) {
        if (e.getKey() == e.TAB && e.shiftKey || e.getKey() == e.ENTER && e.ctrlKey) {
            this.cmp.fireEvent('keydown', e);
        }
    }
});

/**
 * @class Ext.ux.form.HtmlEditor.UndoRedo
 * @extends Ext.util.Observable
 * 
 * plugin for htmleditor that fires events for undo/redo keys (CTRL-Z and CTRL-Y)
 * 
 * TODO move this to ux dir
 */
Ext.ux.form.HtmlEditor.UndoRedo = Ext.extend(Ext.util.Observable , {
    volume: -1,
    history: new Array(),
    index: 0,
    placeholder: 0,
    count: 0,
    ignore: false,

    // private
    init: function(cmp){
        this.cmp = cmp;
        this.cmp.on('initialize', this.onInit, this);
        this.cmp.on('sync', this.onSync, this);
    },
    // private
    onInit: function(){
        Ext.EventManager.on(this.cmp.getDoc(), {
            'keydown': this.onKeydown,
            scope: this
        });
    },

    /**
     * on keydown 
     * 
     * @param {Event} e
     */
    onKeydown: function(e) {
        if (e.ctrlKey) {
            if (e.getKey() == e.Z) {
                this.undo();
                e.preventDefault();
            }
            if (e.getKey() == e.Y) {
                this.redo();
                e.preventDefault();
            }
        }
    },
    

    /**
     * Protected method that will not generally be called directly. Syncs the contents
     * of the editor iframe with the textarea.
     */
    onSync : function(){
        if(this.cmp.initialized){
            if (this.ignore) {
                this.ignore = false;
            }
            else {
                this.updateHistory();
            }
        }
    },
    
    updateHistory : function(){
        // get the current html content from the element
        var content = this.cmp.el.dom.value;

        // if no historic records exist yet or content has
        // changed since the last record then
        if (this.index == 0 || this.history[this.index].content != content) {

            // if size of rollbacks has been reached then drop
            // the oldest record from the array
            if (this.count == this.volume) {
                this.history.shift();
                this.placeholder--;
            }

            // else increment the index
            else {
                this.index++;
            }

            // record the changed content and cursor position
            if (!Ext.isIE) {
                var selection = this.cmp.getDoc().getSelection();
            }
            if (Ext.isGecko) {
                var range = selection.getRangeAt(0);
                this.history[this.index] = {
                    content: content,
                    bookmark: (Ext.isIE ? null : {startOffset:range.startOffset,endOffset:range.endOffset,startContainer:range.startContainer,endContainer:range.endContainer})
                };
            }
            else {
                this.history[this.index] = {
                    content: content,
                    bookmark: (Ext.isIE ? null : selection.getRangeAt(0))
                };
            }
            this.count = this.index;
        }
    },

    // perform the undo
    undo: function() {

        // ensure that there is data to undo
        if (this.index > 1) {

            // decrement the index
            this.index--;

            // if in source edit mode then update the element directly
            if (this.cmp.sourceEditMode) {
                this.resetElement();
            }

            // else update the editor body
            else {
                this.reset();

            // ignore next record request as syncValue is called
            // by Ext.form.HtmlEditor.updateToolBar and we don't
            // want our undo reversed again
            this.ignore = true;

            // update the editor toolbar and return focus
            this.cmp.updateToolbar();
            this.cmp.focus();
            }
        }
    },

    // perform the redo
    redo: function() {

        // ensure that there is data to redo
        if (this.index < this.count) {

            // increment the index
            this.index++;

            // if in source edit mode then update the element directly
            if (this.cmp.sourceEditMode) {
                this.resetElement();
            }

            // else update the editor body
            else {
                this.reset();

                // ignore next record request as syncValue is called
                // by Ext.form.HtmlEditor.updateToolBar and we don't
                // want our redo reversed again
                this.ignore = true;

                // update the editor toolbar and return focus
                this.cmp.updateToolbar();
                this.cmp.focus();
            }
        }
    },
    
    // updates the editor body
    reset : function() {
        var content = this.history[this.index].content;
        this.cmp.getEditorBody().innerHTML = content;
        if (content=='' && Ext.isGecko) {
            // FF does not let the content be empty and adds a BR tag
            var brs = this.cmp.getEditorBody().getElementsByTagName('br');
            try { this.cmp.getEditorBody().removeChild(brs[0]); } 
            catch (e) { }
        }
        this.resetBookmark();
    },

    // updates the element (when in source edit mode)
    resetElement : function() {
        this.cmp.el.dom.value = this.history[this.index].content;
        this.resetBookmark();
    },

    // reposition the cursor
    resetBookmark : function() {
        // checks if there is support for createRange method
        if (this.cmp.getDoc().createRange) {
            var node = this.cmp.getEditorBody().lastChild;
            var range = this.cmp.getDoc().createRange();
            if (node) {
                if (node.tagName=='BR' && node.previousSibling) {
                    // FF uses to add a BR tag at the end of the text
                    node = node.previousSibling;
                }
                var len = node.textContent.length;
                range.selectNodeContents(node);
                range.collapse(false);
            }
            var selection = this.cmp.getDoc().getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }    
    
});

/**
 * the Tinebase/js/extFixes code for fixKeys is not needed anymore
 */
Ext.apply(Ext.form.HtmlEditor.prototype, {
    fixKeys : function(){ // load time branching for fastest keydown performance
        // do nothing
    }
});

/**
 * the ExtJS/src/widgets/form/HtmlEditor code for relayCmd needs to return focus to editor
 */
Ext.apply(Ext.form.HtmlEditor.prototype, {
    relayCmd : function(cmd, value){
        (function(){
            this.focus();
            this.execCmd(cmd, value);
            this.updateToolbar();
            this.deferFocus();
        }).defer(10, this);
    }
});
