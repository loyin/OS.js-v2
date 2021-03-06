(function(CoreWM, Panel, PanelItem) {

  OSjs.CoreWM                   = OSjs.CoreWM             || {};
  OSjs.CoreWM.PanelItems        = OSjs.CoreWM.PanelItems  || {};

  /////////////////////////////////////////////////////////////////////////////
  // LOCALES
  /////////////////////////////////////////////////////////////////////////////

  var _Locales = {
    no_NO : {
      "Logging out user '{0}'.\nDo you want to save current session?" : "Logger ut bruker '{0}'.\nVil du lagre gjeldende sessjon?"
    },
    de_DE : {
      "Logging out user '{0}'.\nDo you want to save current session?" : "Benutzer wird abgemeldet '{0}'.\nWollen Sie die aktuelle Sitzung speichern?"
    }
  };

  function _() {
    var args = Array.prototype.slice.call(arguments, 0);
    args.unshift(_Locales);
    return OSjs.__.apply(this, args);
  }

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: Buttons
   */
  var PanelItemButtons = function() {
    PanelItem.apply(this, ['PanelItemButtons PanelItemFill']);

    this.$container = null;
  };

  PanelItemButtons.prototype = Object.create(PanelItem.prototype);
  PanelItemButtons.Name = 'Buttons'; // Static name
  PanelItemButtons.Description = 'Button Bar'; // Static description
  PanelItemButtons.Icon = 'actions/stock_about.png'; // Static icon

  PanelItemButtons.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);

    this.$container = document.createElement('ul');
    root.appendChild(this.$container);

    this.addButton(OSjs._('Applications'), 'categories/applications-other.png', function(ev) {
      ev.stopPropagation();
      var wm = OSjs.API.getWMInstance();
      if ( wm && wm.getSetting('menuCategories') ) {
        OSjs.CoreWM.BuildCategoryMenu(ev);
      } else {
        OSjs.CoreWM.BuildMenu(ev);
      }
      return false;
    });

    this.addButton(OSjs._('Settings'), 'categories/applications-system.png', function(ev) {
      var wm = OSjs.API.getWMInstance();
      if ( wm ) {
        wm.showSettings();
      }
      return false;
    });

    this.addButton(OSjs._('Log out (Exit)'), 'actions/exit.png', function(ev) {
      var user = OSjs.API.getHandlerInstance().getUserData() || {name: 'Unknown'};
      var wm = OSjs.API.getWMInstance();
      if ( wm ) {
        var conf = new OSjs.Dialogs.Confirm(_("Logging out user '{0}'.\nDo you want to save current session?", user.name), function(btn) {
          if ( btn == 'ok' ) {
            OSjs._shutdown(true, false);
          } else if ( btn == 'cancel' ) {
            OSjs._shutdown(false, false);
          }
        }, {title: OSjs._('Log out (Exit)'), buttonClose: true, buttonCloseLabel: OSjs._('Cancel'), buttonOkLabel: OSjs._('Yes'), buttonCancelLabel: OSjs._('No')});
        wm.addWindow(conf);
      }
    });

    return root;
  };

  PanelItemButtons.prototype.destroy = function() {
    PanelItem.prototype.destroy.apply(this, arguments);
  };

  PanelItemButtons.prototype.addButton = function(title, icon, callback) {
    icon = OSjs.API.getThemeResource(icon, 'icon');

    var sel = document.createElement('li');
    sel.className = 'Button';
    sel.title = title;
    sel.innerHTML = '<img alt="" src="' + icon + '" />';
    sel.onclick = callback;
    sel.oncontextmenu = function(ev) {
      ev.stopPropagation();
      return false;
    };

    this.$container.appendChild(sel);
  };

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: WindowList
   */
  var PanelItemWindowList = function() {
    PanelItem.apply(this, ['PanelItemWindowList PanelItemWide']);

    this.$element = null;
  };

  PanelItemWindowList.prototype = Object.create(PanelItem.prototype);
  PanelItemWindowList.Name = 'Window List'; // Static name
  PanelItemWindowList.Description = 'Toggle between open windows'; // Static description
  PanelItemWindowList.Icon = 'apps/xfwm4.png'; // Static icon

  PanelItemWindowList.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);

    this.$element = document.createElement('ul');
    root.appendChild(this.$element);

    var wm = OSjs.API.getWMInstance();
    if ( wm ) {
      var wins = wm.getWindows();
      for ( var i = 0; i < wins.length; i++ ) {
        if ( wins[i] ) {
          this.update('create', wins[i]);
        }
      }
    }

    return root;
  };

  PanelItemWindowList.prototype.destroy = function() {
    PanelItem.prototype.destroy.apply(this, arguments);
  };

  PanelItemWindowList.prototype.update = function(ev, win) {
    var self = this;
    if ( !this.$element || (win && win._properties.allow_windowlist === false) ) {
      return;
    }

    var cn = 'WindowList_Window_' + win._wid;
    var _change = function(cn, callback) {
      var els = self.$element.getElementsByClassName(cn);
      if ( els.length ) {
        for ( var i = 0, l = els.length; i < l; i++ ) {
          if ( els[i] && els[i].parentNode ) {
            callback(els[i]);
          }
        }
      }
    };

    if ( ev == 'create' ) {
      var className = className = 'Button WindowList_Window_' + win._wid;
      if ( this.$element.getElementsByClassName(className).length ) { return; }

      var el = document.createElement('li');
      el.innerHTML = '<img alt="" src="' + win._icon + '" /><span>' + win._title + '</span>';
      el.className = className;
      el.title = win._title;
      el.onclick = function() {
        win._restore(false, true);
      };
      el.oncontextmenu = function(ev) {
        ev.stopPropagation();
        return false;
      };

      if ( win._state.focused ) {
        el.className += ' Focused';
      }
      this.$element.appendChild(el);
    } else if ( ev == 'close' ) {
      _change(cn, function(el) {
        el.onclick = null;
        el.oncontextmenu = null;
        el.parentNode.removeChild(el);
      });
    } else if ( ev == 'focus' ) {
      _change(cn, function(el) {
        el.className += ' Focused';
      });
    } else if ( ev == 'blur' ) {
      _change(cn, function(el) {
        el.className = el.className.replace(/\s?Focused/, '');
      });
    } else if ( ev == 'title' ) {
      _change(cn, function(el) {
        el.getElementsByTagName('span')[0].innerHTML = win._title;
        el.title = win._title;
      });
    } else if ( ev == 'icon' ) {
      _change(cn, function(el) {
        el.getElementsByTagName('img')[0].src = win._icon;
      });
    } else if ( ev == 'attention_on' ) {
      _change(cn, function(el) {
        if ( !el.className.match(/Attention/) ) {
          el.className += ' Attention';
        }
      });
    } else if ( ev == 'attention_off' ) {
      _change(cn, function(el) {
        if ( !el.className.match(/Attention/) ) {
          el.className = el.className.replace(/\s?Attention/, '');
        }
      });
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // ITEM
  /////////////////////////////////////////////////////////////////////////////

  /**
   * PanelItem: Clock
   */
  var PanelItemClock = function() {
    PanelItem.apply(this, ['PanelItemClock PanelItemFill PanelItemRight']);
    this.clockInterval  = null;
  };

  PanelItemClock.prototype = Object.create(PanelItem.prototype);
  PanelItemClock.Name = 'Clock'; // Static name
  PanelItemClock.Description = 'View the time'; // Static description
  PanelItemClock.Icon = 'status/appointment-soon.png'; // Static icon

  PanelItemClock.prototype.init = function() {
    var root = PanelItem.prototype.init.apply(this, arguments);

    var clock = document.createElement('div');
    clock.innerHTML = '00:00';
    clock.oncontextmenu = function(ev) {
      ev.stopPropagation();
      return false;
    };
    var _updateClock = function() {
      var d = new Date();
      clock.innerHTML = d.toLocaleTimeString();
      clock.title     = d.toLocaleDateString();
    };
    this.clockInterval = setInterval(_updateClock, 1000);
    _updateClock();

    root.appendChild(clock);

    return root;
  };

  PanelItemClock.prototype.destroy = function() {
    if ( this.clockInterval ) {
      clearInterval(this.clockInterval);
      this.clockInterval = null;
    }

    PanelItem.prototype.destroy.apply(this, arguments);
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.CoreWM.PanelItems.Buttons    = PanelItemButtons;
  OSjs.CoreWM.PanelItems.WindowList = PanelItemWindowList;
  OSjs.CoreWM.PanelItems.Clock      = PanelItemClock;

})(OSjs.CoreWM, OSjs.CoreWM.Panel, OSjs.CoreWM.PanelItem);

