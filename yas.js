(function (win) {

  "use strict";


  var string = (function () {

    var trim = function (str) {
      return str.replace(/^\s*|\s*$/g, '');
    };

    var removeDuplications = function (str, character) {
      var regexp = new RegExp(character + "{2,}", "g");
      return str.replace(regexp, character);
    };

    return {
      trim : trim,
      removeDuplications : removeDuplications
    };
  }());

  var array = (function () {
    var each = function (arr, fn) {
      if (arr.length === undefined || typeof arr === 'string') {
        throw 'Not array';
      }
      var i;
      for (i = 0; i < arr.length; i += 1) {
        if (fn.call(arr, arr[i], i) === false) {
          break;
        }
      }
    };

    var includes = function (s, arr) {
      var result = false;
      each(arr, function (el) {
        if (el === s) {
          result = true;
          return false;
        }
      });

      return result;
    };

    var unique = function (arr) {
      var r = [];

      each(arr, function (el) {
        if (!includes(el, r)) {
          r.push(el);
        }
      });

      return r;
    };

    return {
      includes : includes,
      unique : unique,
      each : each
    };
  }());

  var dom = (function () {

    var isNode = function (node) {
      return node.nodeType === 1 || node.nodeType === 9;
    };

    var sibling = function (node, direction) {
      var n = node;
      while (true) {
        n = n[direction + 'Sibling'];
        if (n === null) {
          return null;
        }

        if (isNode(n)) {
          return n;
        }
      }
    };

    var next = function (node) {
      return sibling(node, 'next');
    };

    var prev = function (node) {
      return sibling(node, 'previous');
    };

    var children = function (node) {
      var n = node.childNodes, r = [];

      array.each(n, function (el) {
        if (isNode(el)) {
          r.push(el);
        }
      });
      return r;
    };

    var isEmpty = function (node) {
      var n = node.childNodes, i;

      for(i = 0; i < n.length; i += 1) {
        if(isNode(n[i]) || n[i].nodeType === 3) {
          return false;
        }
      }

      return true;
    };

    var getAttribute = function (node, attr) {
      attr = { 'for': 'htmlFor', 'class': 'className' }[attr] || attr;
      return node[attr] || node.getAttribute(attr) || '';
    };

    return {
      next : next,
      prev : prev,
      children : children,
      isEmpty: isEmpty,
      attr : {
        get : getAttribute
      }
    };
  }());

  function selector(selectorString) {

    var parse = function (selectorString) {
      selectorString = string.trim(selectorString);
      selectorString = string.removeDuplications(selectorString, ' ');
      selectorString = selectorString.replace(/ ?([~>+]) ?/g, '$1');
      var regexp = /([a-zA-Z0-9_](?:[a-zA-Z0-9_\-]*[a-zA-Z0-9_])?)|\[|\]|\|=(?=['"])|=(?=['"])|!=(?=['"])|\-=(?=['"])|\*=(?=['"])|\^=(?=['"])|\$=(?=['"])|\+|~|>|\*| |\.|:|#/g;
      var results = [ ' ' ];
      var res;
      while ((res = regexp.exec(selectorString)) !== null) {
        results.push(res[0]);
      }
      win.console.log('Parsed selector:', results);
      return results;
    };

    var validateAttribute = function (attrValue, condition, searchValue) {
      win.console.log("Attr: ", attrValue, " Search: ", searchValue);
      var conditions = {
        '=': function (attrValue, searchValue) {
          return attrValue === searchValue;
        },
        '!=': function (attrValue, searchValue) {
          return attrValue !== searchValue;
        },
        '*=': function (attrValue, searchValue) {
          return attrValue.indexOf(searchValue) !== -1;
        },
        '^=': function (attrValue, searchValue) {
          return attrValue.indexOf(searchValue) === 0;
        },
        '$=': function (attrValue, searchValue) {
          return attrValue.length >= searchValue.length && attrValue.substr(attrValue.length - searchValue.length) === searchValue;
        },
        '|=': function (attrValue, searchValue) {
          return (attrValue === searchValue) || (attrValue.indexOf(searchValue + '-') === 0);
        },
        '-=': function (attrValue, searchValue) {
          if (attrValue.indexOf(searchValue + ' ') === 0) { // string + space
            return true;
          }
          if (attrValue.substr(attrValue.length - (' ' + searchValue).length) === ' ' + searchValue) { // space + string
            return true;
          }

          if (attrValue.indexOf(' ' + searchValue + ' ') !== -1) { // space + string + space
            return true;
          }

          return false;
        }
      };

      return conditions[condition](attrValue, searchValue);
    };

    var filters = function(filterName, context) {
      var f = {
        'first' : function(context) {
          return [context[0]];
        },
        'last' : function(context) {
          return context.slice(-1);
        },
        'even' : function(context) {
          var newContext = [], i;

          for(i = 0; i < context.length; i += 2) {
            newContext.push(context[i]);
          }

          return newContext;
        },
        'odd' : function(context) {
          var newContext = [], i;

          for (i = 1; i < context.length; i += 2) {
            newContext.push(context[i]);
          }

          return newContext;
        },
        'first-child' : function (context) {
          var newContext = [], parents = [];

          array.each(context, function(el) {
            var parent = el.parentNode;
            if(!array.includes(parent, parents)) {
              parents.push(parent);
              newContext.push(el);
            }
          });

          return newContext;
        },
        'last-child' : function (context) {
          var newContext = [], parents = [];

          array.each(context.reverse(), function(el) {
            var parent = el.parentNode;
            if (!array.includes(parent, parents)) {
              parents.push(parent);
              newContext.push(el);
            }
          });

          return newContext.reverse();
        },
        'only-child' : function (context) {
          var newContext = [], parents = [];

          array.each(context, function(el) {
            var parent = el.parentNode;
            if (!array.includes(parent, parents)) {
              parents.push(parent);
            }
          });

          array.each(parents, function(parent) {
            var children = dom.children(parent);
            if (children.length === 1) {
              newContext.push(children[0]);
            }
          });

          return newContext;
        },
        'empty' : function (context) {
          var newContext = [];

          array.each(context, function(el) {
            if(dom.isEmpty(el)) {
              newContext.push(el);
            }
          });

          return newContext;
        },
        'parent' : function (context) {
          var newContext = [];

          array.each(context, function(el) {
            if(!dom.isEmpty(el)) {
              newContext.push(el);
            }
          });

          return newContext;
        }
      };

      return f[filterName](context);
    };

    var currentPosition = 0;
    var selectorProcessors = (function () {
      var isTag = function (word) {
        return (/^[a-z][a-z0-9_\-]*|\*$/).test(word.toLowerCase());
      };

      var allowedTag = function (tag, tagName) {
        return (tagName && tag.tagName === tagName.toUpperCase()) || tagName === false || tagName === '*';
      };

      return {
        ' ' : function (context, selectors) {
          var tag = '*', newContext = [];
          if (isTag(selectors[currentPosition + 1])) {
            tag = selectors[currentPosition += 1];
          }

          array.each(context, function (el) {
            array.each(el.getElementsByTagName(tag), function (e) {
              newContext.push(e);
            });
          });

          return array.unique(newContext);
        },
        '>' : function (context, selectors) {
          var newContext = [], tagName = false;

          if (isTag(selectors[currentPosition + 1])) {
            tagName = selectors[currentPosition += 1];
          }

          array.each(context, function (el) {
            array.each(dom.children(el), function (e) {
              if (allowedTag(e, tagName)) {
                newContext.push(e);
              }
            });
          });

          return newContext;
        },
        '~' : function (context, selectors) {
          var newContext = [], tagName = false, sibling = null;

          if (isTag(selectors[currentPosition + 1])) {
            tagName = selectors[currentPosition += 1];
          }

          array.each(context, function (el) {
            sibling = el;
            while (true) {
              sibling = dom.next(sibling);
              if (sibling === null || sibling === undefined) {
                break;
              } else if (allowedTag(sibling, tagName)) {
                newContext.push(sibling);
              }
            }
          });

          return newContext;
        },
        '+' : function (context, selectors) {
          var newContext = [], tagName = false;

          if (isTag(selectors[currentPosition + 1])) {
            tagName = selectors[currentPosition += 1];
          }

          var e;
          array.each(context, function (el) {
            e = dom.next(el);
            if (allowedTag(e, tagName)) {
              newContext.push(e);
            }
          });

          return newContext;
        },

        '.' : function (context, selectors) {
          currentPosition += 1;

          var newContext = [], classNameRegExp = new RegExp("\\b" + selectors[currentPosition] + "\\b");

          array.each(context, function (el) {
            if (classNameRegExp.test(el.className)) {
              newContext.push(el);
            }
          });

          return newContext;
        },
        '#' : function (context, selectors) {
          currentPosition += 1;

          var newContext = [], id = selectors[currentPosition];

          array.each(context, function (el) {
            if (el.id === id) {
              newContext.push(el);
            }
          });

          return newContext;
        },
        '[' : function (context, selectors) {
          var newContext = [], elements = [], n = currentPosition + 1;
          while (true) {
            if (selectors[n] === ']') {
              break;
            }
            elements.push(selectors[n]);
            n += 1;
          }

          currentPosition = n;
          //win.console.log("Elements size = ", elements.length);
          win.console.log("Elements = ", elements);

          if (elements.length !== 1 && elements.length !== 3) {
            throw ("Wrong syntax!");
          }

          array.each(context, function (el) {
            var attr = dom.attr.get(el, elements[0]);
            win.console.log("Attr = ", attr);
            if (attr && (elements.length === 1 || (elements.length === 3 && validateAttribute(attr, elements[1], elements[2])))) {
              newContext.push(el);
            }
          });

          return newContext;
        },
        ':' : function (context, selectors) {
          currentPosition += 1;
          return filters(selectors[currentPosition], context);
        }
      };
    }());

    var findBySelector = function (selectors) {
      var context = [ win.document ];
      while (currentPosition < selectors.length) {
        win.console.log('Current selector:', selectors[currentPosition]);
        context = selectorProcessors[selectors[currentPosition]](context, selectors);

        currentPosition += 1;
      }

      return context;
    };

    return findBySelector(parse(selectorString));
  }

  win.yas = selector;
}(this));