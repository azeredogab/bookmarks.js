var Bookmark = (function($, Handlebars) {
    'use strict';

    var s = {
            element: "[bookmark]",
            storage: "bookmarks",
            activeAttr: "bookmark-active",
            sidebar: {
                template: 'views/sidebar.hbs',
                container: '[bookmark-sidebar]',
                open: '[bookmarks-open]',
                close: '[bookmarks-close]',
                remove: '[bookmark-remove]',
            }
        },

        _add = function(item, group, id) {

            var bookmarks = _getStorage(s.storage);
            bookmarks = !bookmarks ? {
                [group]: []
            } : bookmarks;

            if (!bookmarks[group])
                bookmarks[group] = [];

            if (_exists(bookmarks[group], id) === -1)
                bookmarks[group].push(id);

            _setStorage(s.storage, bookmarks);
            item.setAttribute(s.activeAttr, "true");

            return bookmarks;
        },

        _remove = function(item, group, id) {
            var bookmarks = _getStorage(s.storage);
            var index = _exists(bookmarks[group], id);

            if (index !== -1) {
                bookmarks[group].splice(index, 1);
                item.removeAttribute(s.activeAttr);
                _setStorage(s.storage, bookmarks);
            }

            return bookmarks;
        },

        _getStorage = function(storage) {
            var data = localStorage.getItem(storage);
            return data ? JSON.parse(data) : false;
        },

        _setStorage = function(storage, data) {
            var json = JSON.stringify(data);
            return data ? localStorage.setItem(storage, json) : false;
        },

        _exists = function(bookmarks, id) {
            if (Array.isArray(bookmarks) && id) {
                var index = bookmarks.indexOf(id);
                return index;
            }

            return -1;
        },

        _addClickListenerList = function(list, callback) {
            var bookmarks = _getStorage(s.storage);

            for (var i = 0; i < list.length; i++) {
                var item = list[i];

                /**
                 * @dica
                 * usando closure ("fechamento") para gerar uma função anonima 
                 * que cria uma nova referencia para item   
                 */

                (function(item) {
                    var id = item.getAttribute("data-id");
                    var group = item.getAttribute("data-group");

                    if (/^[0-9]+$/.test(id) && bookmarks[group] && _exists(bookmarks[group], id) !== -1)
                        item.setAttribute(s.activeAttr.replace(/^[\[.#]+|[\].#]+$/g, ""), "true");

                    item.addEventListener('click', function() { callback(item, group, id); });
                })(item);
            }
            return;
        },

        _getAsyncRequest = function(url, callback) {
            var xmlhttp = new XMLHttpRequest();

            var done = function() {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    if (typeof callback == "function")
                        callback(xmlhttp.responseText);
                }
            };

            xmlhttp.onreadystatechange = done;
            xmlhttp.open("GET", url, true);
            xmlhttp.send(null);
        },


        _filter = function(list) {
            list = list || undefined;
            var filtered = false;

            if (Array.isArray(list)) {
                var filtered = list.filter(function(item) {
                    return item.hasAttribute("data-group") && item.hasAttribute("data-id");
                });
            }
            return filtered;
        },


        _isActiveBookmark = function(item) {
            return (item.hasAttribute(s.activeAttr) ? true : false);
        },

        _loadSidebar = function(bookmarks) {
            _getAsyncRequest(s.sidebar.template, function(template) {

                if (!template)
                    console.log("Template não encontrado :(");

                var $el = document.querySelector(s.sidebar.container);
                $el.innerHTML = Handlebars.compile(template)(bookmarks);

                return;
            });
        },


        _init = function(options, afterLoad, itemClick) {
            // o unico motivo de usar jquery é a linha abaixo.
            s = $.extend({}, s, options);

            var elements = document.querySelectorAll(s.element),
                filtered;

            //fix to convert a nodeList to Array
            elements = Array.prototype.slice.call(elements);

            filtered = _filter(elements);

            //adiciona o listner de click para cada objeto reconhecido como favorito
            _addClickListenerList(filtered, function(item, group, id) {
                var bookmarks = _isActiveBookmark(item) ? _remove(item, group, id) : _add(item, group, id);
                itemClick(item, _isActiveBookmark(item), bookmarks);

                return;
            });

            var bookmarks = _getStorage(s.storage);

            if (s.sidebar)
                _loadSidebar(bookmarks);

            afterLoad(bookmarks);
        };


    return {
        init: _init
    }

})(jQuery, Handlebars);