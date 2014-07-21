/*
 *  This JavaScript file for Rich Text Editor
 *  this component works for GnimJS
 *  Version 0.1.0
 *  Write by Ming
 *  Date 2011.10.16
 */
(function(window,$,UNDEFINED){
    var autoid=0;
    var $picker=null;//color picker
    var ie=$.broswer.msie;
    var ie6=ie && $.broswer.version==6;
    var ID_PREFIX='richeditor_';
    var CLASS_RE='richeditor';
    var CLASS_RE_C=CLASS_RE+'-color';
    var CLASS_RE_CL=CLASS_RE_C+'-line';
    var CLASS_RE_CI=CLASS_RE_C+'-item';
    var CLASS_RE_B=CLASS_RE+'-toolbox';
    var CLASS_RE_BS=CLASS_RE_B+'-select';
    var CLASS_RE_BD=CLASS_RE_B+'-divider';
    var CLASS_RE_BI=CLASS_RE_B+'-item';
    var CLASS_RE_BIH=CLASS_RE_BI+'-hover';
    var CLASS_RE_T=CLASS_RE+'-textarea';
    var CLASS_RE_I=CLASS_RE+'-iframe';
    var CLASS_RE_M=CLASS_RE+'-mask';
    var DISPLAY_BLOCK={display:'block'};
    var DISPLAY_NONE={display:'none'};
    var I_TYPE=0;//index of type
    var I_NAME=1;//index of name
    var I_TITLE=2;//index of title
    var I_TIP=3;//index of tip
    var I_VALUE=4;//index of value
    var STYLE_PREIX_TEXT='\u7ea7\u6807\u9898';
    var DEFAULT_BLOCK=[['\u4e00'+STYLE_PREIX_TEXT,'<h1>'],['\u4e8c'+STYLE_PREIX_TEXT,'<h2>'],
        ['\u4e09'+STYLE_PREIX_TEXT,'<h3>'],['\u56db'+STYLE_PREIX_TEXT,'<h4>'],
        ['\u4e94'+STYLE_PREIX_TEXT,'<h5>'],['\u516d'+STYLE_PREIX_TEXT,'<h6>'],
        ['\u683c\u5f0f\u5316','<pre>'],['\u6bb5\u843d','<p>']];
    var DEFAULT_FONT=['Verdana','Arial','Georgia'];
    var DEFAULT_SIZE=[1,2,3,4,5,6,7];
    var SWC='styleWithCSS';
    //Tool Array with [type,name,value] / divid-line(0)
    // type:
    // 1 -- command function in toolbox,value:string(dialog input tip)/array(select)
    // 2 -- command function not in toolbox,value:string(dialog input tip)/array(select)
    // 3 -- iframe function in toolbox
    // 4 -- iframe function not in toolbox
    var TOOL_FUNC=[
        [1,'undo','\u64a4\u6d88'],
        [1,'redo','\u91cd\u505a'],
        0,
        [3,'print','\u6253\u5370'],
        0,
        [1,'justifyleft','\u5de6\u5bf9\u9f50'],
        [1,'justifycenter','\u5c45\u4e2d'],
        [1,'justifyright','\u53f3\u5bf9\u9f50'],
        [1,'justifyfull','\u4e24\u7aef\u5bf9\u9f50'],
        0,
        [1,'createlink','\u94fe\u63a5','\u8f93\u5165\u94fe\u63a5\u5730\u5740\uff1a'],
        [1,'unlink','\u53d6\u6d88\u94fe\u63a5'],
        [1,'insertimage','\u56fe\u7247','\u8f93\u5165\u56fe\u7247\u5730\u5740\uff1a'],
        [1,'inserthorizontalrule','\u5206\u5272\u7ebf'],
        0,
        [1,'insertunorderedlist','\u65e0\u5e8f\u5217\u8868'],
        [1,'insertorderedlist','\u6709\u5e8f\u5217\u8868'],
        0,
        [1,'indent','\u5de6\u7f29\u8fdb'],
        [1,'outdent','\u53f3\u7f29\u8fdb'],
        0,
        [1,'removeformat','\u5220\u9664\u6837\u5f0f'],
        false,
        [1,'formatblock','\u6807\u9898','\u6807\u9898:',DEFAULT_BLOCK],
        [1,'fontname','\u5b57\u4f53','\u5b57\u4f53:',DEFAULT_FONT],
        [1,'fontsize','\u5b57\u53f7','\u5b57\u53f7:',DEFAULT_SIZE],
        0,
        [1,'forecolor','\u5b57\u4f53\u989c\u8272','\u5b57\u4f53\u989c\u8272:','c'],
        [1,ie?'backcolor':'hilitecolor','\u5b57\u4f53\u80cc\u666f','\u80cc\u666f\u989c\u8272:','c'],
        0,
        [1,'bold','\u52a0\u7c97'],
        [1,'italic','\u659c\u4f53'],
        [1,'underline','\u4e0b\u5212\u7ebf'],
        [1,'strikethrough','\u5220\u9664\u7ebf'],
        0,
        [1,'subscript','\u4e0b\u6807'],
        [1,'superscript','\u4e0a\u6807'],
        [2,'selectall'],
        [2,SWC],
        [4,'focus']
    ];
    /**
     *  RichEditor{
     *      $d -- $dom
     *      $m -- $mask
     *      $i -- $iframe
     *      $t -- $textarea
     *      $b -- $toolbox
     *      i -- iframe(contentWindow in None-IE)
     *      d -- iframe document
     *  }
     *  options{
     *      html -- iframe html code(replace usage of charset/cssFile/content)
     *      charset -- iframe content charset
     *      cssFile -- iframe use css file url
     *      content -- iframe body html
     *      xhtml -- replace tags with xhtml mode
     *      styleWithCSS -- styleWithCSS command
     *  }
     */
    function RichEditor(selector,options){
        var self=this;
        var $textarea=$(selector);
        if($textarea.length!=1){
            $textarea.each(function(textarea){
                new RichEditor(textarea,options);
            });
            return;
        }
        var aid=self.autoid=++autoid;
        RichEditor[aid]=self;
        self.xhtml=options.xhtml!==false;
        self._mode=true;
        var $dom=self.$d=_$createTag('div',CLASS_RE).attr('autoid',aid).insertAfter($textarea);
        var $toolbox=self.$b=_$createTag('div',CLASS_RE_B).appendTo($dom);
        var icons=0;
        $(TOOL_FUNC).each(function(func){
            if(func){
                (function(f,index){
                    if(f[I_TYPE]==1||f[I_TYPE]==3){
                        var $icon;
                        if($.isArray(f[I_VALUE])){//select
                            _$createSelect(self,f[I_NAME],options[f[I_NAME]]||f[I_VALUE],f[I_TITLE]).appendTo($toolbox);
                        }else if(f[I_VALUE]==='c'){//color
                            $icon=_$createTag('button', CLASS_RE_BI).click(function(e){
                                _no(e);
                                var elm=e.srcElement||e.currentTarget;
                                _$createPicker(elm, function(c){
                                    self[f[I_NAME]](c);
                                });
                            }).appendTo($toolbox);
                        }else{
                            $icon=_$createTag('button', CLASS_RE_BI).click(function(e){
                                _no(e);
                                self[f[I_NAME]]();
                            }).appendTo($toolbox);
                        }
                        if($icon){
                            $icon.attr('title',f[I_TITLE]).css(_iconBackground(index)).hover(function(){
                                $icon.css(_iconBackground(index,1)).addClass(CLASS_RE_BIH);
                            },function(){
                                $icon.css(_iconBackground(index)).removeClass(CLASS_RE_BIH);
                            });
                            icons++;
                        }
                    }
                })(func,icons);
            }else if(func===0){
                $toolbox.append(_$createTag('span', CLASS_RE_BD));
            }else{
                $toolbox.append('<br />');
            }
        });
        self.$t=$textarea.css(DISPLAY_NONE).addClass(CLASS_RE_T).appendTo($dom);
        var iframeID=ID_PREFIX+aid;
        var $iframe=self.$i=_$createTag('iframe',CLASS_RE_I).attr('id',iframeID).appendTo($dom);
        self.$m=_$createTag('div',CLASS_RE_M).css(DISPLAY_NONE).css({opacity:0.1}).appendTo($dom);
        var doc=self.d=(self.i=$iframe[0].contentWindow||window.frames[iframeID]).document;
        doc.open();
        doc.write(options.html||_iframeHtml(options.charset,options.cssFile,options.content||$textarea[0].value));
        doc.close();
        doc.designMode='on';
        if(options[SWC]!==UNDEFINED){
            self[SWC](options[SWC]);
        }
        var update=function(){self._update();}
        $(doc).keyup(update).mouseup(update);
        var update2=function(){self._update(1);}
        $textarea.keyup(update2).mouseup(update2);
    }
    /* api functions */
    function mode(m){
        var self=this;
        if(m===UNDEFINED){
            return self._mode;
        }else{
            self._mode=!!m;
            self.$t.css(m?DISPLAY_NONE:DISPLAY_BLOCK);
            self.$i.css(m?DISPLAY_BLOCK:DISPLAY_NONE);
            self.$b.css(m?DISPLAY_BLOCK:DISPLAY_NONE);
        }
    }
    function html(htmlStr){
        var v=$(this.d).find('body').html(htmlStr);
        if(htmlStr===UNDEFINED && this.xhtml){
            v=v.replace(/<span class="apple-style-span">(.*)<\/span>/gi,'$1')
                .replace(/ class="apple-style-span"/gi,'')
                .replace(/<span style="">/gi,'')
                .replace(/<br>/gi,'<br />')
                .replace(/<br ?\/?>$/gi,'')
                .replace(/^<br ?\/?>/gi,'')
                .replace(/(<img [^>]+[^\/])>/gi,'$1 />')
                .replace(/<b\b[^>]*>(.*?)<\/b[^>]*>/gi,'<strong>$1</strong>')
                .replace(/<i\b[^>]*>(.*?)<\/i[^>]*>/gi,'<em>$1</em>')
                .replace(/<u\b[^>]*>(.*?)<\/u[^>]*>/gi,'<span style="text-decoration:underline">$1</span>')
                .replace(/<(b|strong|em|i|u) style="font-weight: normal;?">(.*)<\/(b|strong|em|i|u)>/gi,'$2')
                .replace(/<(b|strong|em|i|u) style="(.*)">(.*)<\/(b|strong|em|i|u)>/gi,'<span style="$2"><$4>$3</$4></span>')
                .replace(/<span style="font-weight: normal;?">(.*)<\/span>/gi,'$1')
                .replace(/<span style="font-weight: bold;?">(.*)<\/span>/gi,'<strong>$1</strong>')
                .replace(/<span style="font-style: italic;?">(.*)<\/span>/gi,'<em>$1</em>')
                .replace(/<span style="font-weight: bold;?">(.*)<\/span>|<b\b[^>]*>(.*?)<\/b[^>]*>/gi,'<strong>$1</strong>');
        }
        return v;
    }
    function enable(ro){
        this.$m.css(!ie6 && ro?DISPLAY_NONE:DISPLAY_BLOCK);
        if(!ie){
            this.d.designMode=ro?'on':'off';
        }
    }
    function _no(e){
        $.noBubble(e);
        $.noDefault(e);
    }
    function _cmd(cmd,val){
        this.focus().d.execCommand(cmd,false,val);
        return this._update();
    }
    function _update(back){
        var textarea=this.$t[0];
        if(back){
            this.html(textarea.value);
        }else{
            textarea.value=this.html();
        }
        return this;
    }
    var _prototype={
        mode:mode,
        html:html,
        enable:enable,
        _cmd:_cmd,
        _update:_update
    };
    $(TOOL_FUNC).each(function(f){
        if(f){
            if(f[I_TYPE]==1||f[I_TYPE]==2){
                var pFunc;
                if(f[I_TIP]===UNDEFINED){
                    pFunc=new Function('this._cmd(\''+f[I_NAME]+'\');');
                }else{
                    pFunc=new Function('v','if(typeof v=="undefined"){v=prompt("'+(f[I_TIP]||TEXT_NEED_VAL)+'","");}'
                        +'if(v){this._cmd(\''+f[I_NAME]+'\',v);}');
                }
                _prototype[f[I_NAME]]=pFunc;
            }
            if(f[I_TYPE]==3||f[I_TYPE]==4){
                _prototype[f[I_NAME]]=new Function('this.i.'+f[I_NAME]+'();return this;');
            }
        }
    });
    RichEditor.prototype=_prototype;
    /* static functions */
    function _$createTag(tag,cla){
        return $('<'+tag+'></'+tag+'>').addClass(cla);
    }
    function _$createSelect(re,cmd,arr,title){
        var $select=_$createTag('select', CLASS_RE_BS);
        $select[0].options.add(new Option(title));
        for(var i=0;i<arr.length;i++){
            var option=arr[i];
            $select[0].options.add($.isArray(option)?
                new Option(option[0],option[1]):
                new Option(option,option));
        }
        return $select.change(function(e){
            var elm=e.srcElement||e.currentTarget;
            if(elm.selectedIndex!=0){
                re[cmd](elm.value);
                elm.selectedIndex=0;
            }
        });
    }
    function _$createPicker(refNode,cb){
        if(!$picker){
            $picker=_$createTag('div', CLASS_RE_C).appendTo('body');
            for(var i=0;i<=3;i++){
                var $line=_$createTag('div', CLASS_RE_CL).appendTo($picker);
                var red=i*85;
                for(var j=0;j<=3;j++){
                    var green=j*85;
                    for(var k=0;k<=3;k++){
                        var blue=k*85;
                        var color='#'+$.toHex(((red*256)+green)*256+blue,6);
                        (function(c){
                            _$createTag('button', CLASS_RE_CI).css({backgroundColor:c})
                            .click(function(e){
                                _no(e);
                                if($picker.cb)$picker.cb(c);
                            }).appendTo($line);
                        })(color);
                    }
                }
            }
        }
        $picker.cb=cb;
        $picker.css(_pickerPos(refNode)).css(DISPLAY_BLOCK);
    }
    function _pickerPos(node){
        var x=0,y=node.offsetHeight;
        while(node.offsetParent){
            x+=node.offsetLeft;
            y+=node.offsetTop;
            node=node.offsetParent;
        }
        return {
            left:x+'px',
            top:y+'px'
        };
    }
    function _hidePicker(){
        if($picker){
            $picker.css(DISPLAY_NONE);
        }
    }
    function _iframeHtml(charset,cssFile,content) {
        var html = "";
        html += '<!DOCTYPE html>';
        html += '<html><head>';
        html += '<meta http-equiv="Content-Type" content="text/html; charset='+(charset||'UTF-8')+'" />';
        html += '<title>RichEditor</title>';
        html += '<style>::selection{background:#000;color:#fff;}'
            +'::-moz-selection{background:#000;color:#fff;}</style>';
        if(cssFile){
            html += '<link rel="stylesheet" type="text/css" href="'+cssFile+'">';
        }
        html += '</head><body>'+(content||'')+'</body></html>';
        return html;
    }
    function _iconBackground(index,hover){
        return {backgroundPosition:(hover?'-30px ':'0 ')+(-index*30)+'px'};
    }
    $('body').click(function(){
        _hidePicker();
    });
    /* set RichEditor to window */
    window.RichEditor=RichEditor;
})(window,Gnim);